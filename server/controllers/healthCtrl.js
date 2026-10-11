const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const validutils = require("../utils/validate.utils");
const { CACHE_TYPES } = require("../utils/cache.utils");
const healthService = require("../services/healthService");
const { log } = require('../utils/log.utils');

/*
 * Health: treatment episodes and the checkups under them.
 *
 * The animal and the illness are only accepted on create. On update they are absent from the
 * schema entirely, because changing either turns the record into a different episode while its
 * checkups stay behind describing the old one.
 */

const TREATMENT_CREATE_SCHEMA = {
  cattle_id: { required: true, type: "number", min: 1, label: "Cattle" },
  illness_id: { required: true, type: "number", min: 1, label: "Illness" },
  start_date: { required: true, type: "string", maxLength: 10, label: "Start Date" },
  severity: { required: false, type: "string", maxLength: 10, label: "Severity" },
  attended_by: { required: false, type: "string", maxLength: 150, label: "Attended By" },
  milk_withdrawal_until: { required: false, type: "string", maxLength: 10, label: "Milk Withdrawal Until" },
  remarks: { required: false, type: "string", maxLength: 1000, label: "Remarks" },
};

// cattle_id and illness_id are still ACCEPTED because the form submits their locked values and
// strict validation would reject an unlisted field; the service ignores them
const TREATMENT_UPDATE_SCHEMA = {
  cattle_id: { required: false, type: "number", min: 1, label: "Cattle" },
  illness_id: { required: false, type: "number", min: 1, label: "Illness" },
  start_date: { required: true, type: "string", maxLength: 10, label: "Start Date" },
  severity: { required: false, type: "string", maxLength: 10, label: "Severity" },
  attended_by: { required: false, type: "string", maxLength: 150, label: "Attended By" },
  milk_withdrawal_until: { required: false, type: "string", maxLength: 10, label: "Milk Withdrawal Until" },
  remarks: { required: false, type: "string", maxLength: 1000, label: "Remarks" },
};

const CLOSE_PAYLOAD_SCHEMA = {
  cure_date: { required: false, type: "string", maxLength: 10, label: "Cure Date" },
};

const CHECKUP_PAYLOAD_SCHEMA = {
  checkup_date: { required: true, type: "string", maxLength: 10, label: "Checkup Date" },
  medicines: { required: false, type: "string", maxLength: 2000, label: "Medicines" },
  observation: { required: false, type: "string", maxLength: 2000, label: "Observation" },
  expense: { required: false, type: "number", min: 0, max: 10000000, label: "Expense" },
  attended_by: { required: false, type: "string", maxLength: 150, label: "Attended By" },
  next_checkup_date: { required: false, type: "string", maxLength: 10, label: "Next Checkup Date" },
  milk_withdrawal_until: { required: false, type: "string", maxLength: 10, label: "Milk Withdrawal Until" },
};

const sendHealthError = (req, res, error, fname) => {
  console.log("Error in " + fname + " : ", error);

  switch (error.name) {
    case "validationFailed":
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.VALIDATION_ERROR, { function: fname });

    case "invalidRecordId":
    case "invalidParent":
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.INVALID_DATA, { function: fname });

    case "duplicateRecord":
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.DUPLICATE_RECORD, { function: fname });

    case "recordNotFound":
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.NOT_FOUND, { function: fname });

    case "recordInUse":
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.INVALID_DATA, { function: fname });

    case "DatabaseError":
      if (error.code === "ER_DUP_ENTRY") {
        return resutils.sendErrorResponse(req, res,
          "That record already exists. Reload the screen and try again.",
          RESPONSE_STATUS.DUPLICATE_RECORD, { function: fname });
      }
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.DB_ERROR, { function: fname });

    default:
      return resutils.sendErrorResponse(req, res,
        "Unable to process request. Please try after some time.",
        RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: fname });
  }
};

const parseRecordId = (req, key = 'id') => {
  const id = Number(req.params[key]);
  if (!Number.isInteger(id) || id <= 0)
    resutils.createError("invalidRecordId", "Please provide a valid record id.");
  return id;
};

const parseOptionalQueryId = (req, key) => {
  if (req.query[key] === undefined || req.query[key] === "") return null;

  const id = Number(req.query[key]);
  if (!Number.isInteger(id) || id <= 0)
    resutils.createError("invalidRecordId", `Please provide a valid ${key}.`);
  return id;
};

const TREATMENT_STATUSES = ['open', 'cured'];

// the register plus both dropdowns, in one response
exports.getHealthRegisterCtrl = async (req, res) => {
  log('in getHealthRegisterCtrl');
  try {
    const status = req.query.status;
    if (status && !TREATMENT_STATUSES.includes(status)) {
      resutils.createError("validationFailed", `Status must be one of: ${TREATMENT_STATUSES.join(', ')}.`);
    }

    const filters = {
      status: status || null,
      dairy_farm_id: parseOptionalQueryId(req, "dairy_farm_id"),
      branch_id: parseOptionalQueryId(req, "branch_id"),
      cattle_id: parseOptionalQueryId(req, "cattle_id")
    };

    const result = await healthService.getHealthRegisterSrvc(req.user, filters);

    return resutils.sendSuccessResponse(req, res,
      { ...result, permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get health register", cacheType: CACHE_TYPES.NO_STORE });
  } catch (error) {
    return sendHealthError(req, res, error, "get health register controller");
  }
};

// the visit history, fetched when the user opens an episode
exports.getCheckupListCtrl = async (req, res) => {
  log('in getCheckupListCtrl');
  try {
    const treatmentId = parseRecordId(req);
    const result = await healthService.getCheckupListSrvc(treatmentId);

    return resutils.sendSuccessResponse(req, res, result, RESPONSE_STATUS.SUCCESS,
      { function: "get checkup list", cacheType: CACHE_TYPES.NO_STORE });
  } catch (error) {
    return sendHealthError(req, res, error, "get checkup list controller");
  }
};

exports.createTreatmentCtrl = async (req, res) => {
  log('in createTreatmentCtrl');
  try {
    const validation = await validutils.validatePayload(req.body, TREATMENT_CREATE_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await healthService.createTreatmentSrvc(req.body, req.user?.user_id);

    return resutils.sendSuccessResponse(req, res, result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `Treatment recorded for ${result.cattle_unique_code}.`
          + (result.can_produce_milk ? '' : ' Her milk is on hold and she is off the milking sheet.')
      },
      { function: "create treatment" });
  } catch (error) {
    return sendHealthError(req, res, error, "create treatment controller");
  }
};

exports.updateTreatmentCtrl = async (req, res) => {
  log('in updateTreatmentCtrl');
  try {
    const treatmentId = parseRecordId(req);

    const validation = await validutils.validatePayload(req.body, TREATMENT_UPDATE_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await healthService.updateTreatmentSrvc(treatmentId, req.body, req.user?.user_id);

    return resutils.sendSuccessResponse(req, res, result,
      { ...RESPONSE_STATUS.UPDATED, message: `Treatment for ${result.cattle_unique_code} updated successfully.` },
      { function: "update treatment" });
  } catch (error) {
    return sendHealthError(req, res, error, "update treatment controller");
  }
};

exports.closeTreatmentCtrl = async (req, res) => {
  log('in closeTreatmentCtrl');
  try {
    const treatmentId = parseRecordId(req);

    const validation = await validutils.validatePayload(req.body || {}, CLOSE_PAYLOAD_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await healthService.closeTreatmentSrvc(treatmentId, req.body || {}, req.user?.user_id);

    // she stays off the sheet while the withdrawal runs, so the message has to say so or the
    // incharge will think the screen is broken
    const milkText = result.can_produce_milk
      ? ' She is back on the milking sheet.'
      : result.milk_withdrawal_until
        ? ` Her milk is still on hold until ${result.milk_withdrawal_until}.`
        : ' She is still off the milking sheet for another reason.';

    return resutils.sendSuccessResponse(req, res, result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `${result.cattle_unique_code} marked as cured on ${result.cure_date}.${milkText}`
      },
      { function: "close treatment" });
  } catch (error) {
    return sendHealthError(req, res, error, "close treatment controller");
  }
};

exports.reopenTreatmentCtrl = async (req, res) => {
  log('in reopenTreatmentCtrl');
  try {
    const treatmentId = parseRecordId(req);
    const result = await healthService.reopenTreatmentSrvc(treatmentId, req.user?.user_id);

    return resutils.sendSuccessResponse(req, res, result,
      { ...RESPONSE_STATUS.UPDATED, message: `Treatment for ${result.cattle_unique_code} reopened.` },
      { function: "reopen treatment" });
  } catch (error) {
    return sendHealthError(req, res, error, "reopen treatment controller");
  }
};

exports.deleteTreatmentCtrl = async (req, res) => {
  log('in deleteTreatmentCtrl');
  try {
    const treatmentId = parseRecordId(req);
    const result = await healthService.deleteTreatmentSrvc(treatmentId, req.user?.user_id);

    return resutils.sendSuccessResponse(req, res, result,
      { ...RESPONSE_STATUS.DELETED, message: `Treatment record for ${result.cattle_unique_code} removed.` },
      { function: "delete treatment" });
  } catch (error) {
    return sendHealthError(req, res, error, "delete treatment controller");
  }
};

exports.addCheckupCtrl = async (req, res) => {
  log('in addCheckupCtrl');
  try {
    const treatmentId = parseRecordId(req);

    const validation = await validutils.validatePayload(req.body, CHECKUP_PAYLOAD_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await healthService.addCheckupSrvc(treatmentId, req.body, req.user?.user_id);

    return resutils.sendSuccessResponse(req, res, result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `Checkup added for ${result.cattle_unique_code}.`
          + (result.can_produce_milk ? '' : ' Her milk remains on hold.')
      },
      { function: "add checkup" });
  } catch (error) {
    return sendHealthError(req, res, error, "add checkup controller");
  }
};

exports.deleteCheckupCtrl = async (req, res) => {
  log('in deleteCheckupCtrl');
  try {
    const historyId = parseRecordId(req);
    const result = await healthService.deleteCheckupSrvc(historyId, req.user?.user_id);

    return resutils.sendSuccessResponse(req, res, result,
      { ...RESPONSE_STATUS.DELETED, message: 'Checkup removed and the treatment total recalculated.' },
      { function: "delete checkup" });
  } catch (error) {
    return sendHealthError(req, res, error, "delete checkup controller");
  }
};
