const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const validutils = require("../utils/validate.utils");
const { CACHE_TYPES } = require("../utils/cache.utils");
const breedingService = require("../services/breedingService");
const { log } = require('../utils/log.utils');
const { DATE_ONLY_RE } = require('../utils/date.utils');

const PREGNANCY_PAYLOAD_SCHEMA = {
  cattle_id: { required: true, type: "number", min: 1, label: "Cattle" },
  conception_date: { required: true, type: "string", maxLength: 10, label: "Conception Date" },
  remarks: { required: false, type: "string", maxLength: 1000, label: "Remarks" },
};

// on update the animal is fixed - the server reads it from the pregnancy row. cattle_id is
// still ACCEPTED because the form submits its locked value, and strict validation would
// otherwise reject it as an unknown field; it is simply ignored.
const PREGNANCY_UPDATE_SCHEMA = {
  cattle_id: { required: false, type: "number", min: 1, label: "Cattle" },
  conception_date: { required: true, type: "string", maxLength: 10, label: "Conception Date" },
  remarks: { required: false, type: "string", maxLength: 1000, label: "Remarks" },
};

const DRY_OFF_PAYLOAD_SCHEMA = {
  actual_dry_off_date: { required: false, type: "string", maxLength: 10, label: "Dry-off Date" },
};

// calves is optional so a stillbirth can be recorded as a calving with none registered
const CALVING_PAYLOAD_SCHEMA = {
  actual_calving_date: { required: true, type: "string", maxLength: 10, label: "Calving Date" },
  remarks: { required: false, type: "string", maxLength: 1000, label: "Remarks" },
  calves: {
    required: false, type: "array", label: "Calves",
    itemSchema: {
      gender_id: { required: true, type: "number", min: 1 },
      weight: { required: false, type: "number", min: 0, max: 2000 },
      color: { required: false, type: "string", maxLength: 100 },
      remarks: { required: false, type: "string", maxLength: 1000 },
    }
  },
};

const ABORT_PAYLOAD_SCHEMA = {
  remarks: { required: false, type: "string", maxLength: 1000, label: "Remarks" },
};

const sendBreedingError = (req, res, error, fname) => {
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

const parseRecordId = (req) => {
  const id = Number(req.params.id);
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

const PREGNANCY_STATUSES = ['active', 'completed', 'aborted'];

// the breeding register plus the dropdown of animals still available to breed
exports.getPregnancyListCtrl = async (req, res) => {
  log('in getPregnancyListCtrl');
  try {
    const status = req.query.status;
    if (status && !PREGNANCY_STATUSES.includes(status)) {
      resutils.createError("validationFailed", `Status must be one of: ${PREGNANCY_STATUSES.join(', ')}.`);
    }

    const filters = {
      status: status || null,
      dairy_farm_id: parseOptionalQueryId(req, "dairy_farm_id"),
      branch_id: parseOptionalQueryId(req, "branch_id"),
      cattle_id: parseOptionalQueryId(req, "cattle_id")
    };

    const result = await breedingService.getPregnancyListSrvc(req.user, filters);

    return resutils.sendSuccessResponse(req, res,
      { ...result, permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get pregnancy list", cacheType: CACHE_TYPES.NO_STORE });
  } catch (error) {
    return sendBreedingError(req, res, error, "get pregnancy list controller");
  }
};

exports.createPregnancyCtrl = async (req, res) => {
  log('in createPregnancyCtrl');
  try {
    const validation = await validutils.validatePayload(req.body, PREGNANCY_PAYLOAD_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    if (!DATE_ONLY_RE.test(req.body.conception_date))
      resutils.createError("validationFailed", "Conception date must be in YYYY-MM-DD format.");

    const result = await breedingService.createPregnancySrvc(req.body, req.user?.user_id);

    return resutils.sendSuccessResponse(req, res, result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `Pregnancy recorded for ${result.cattle_unique_code}. Calving expected around ${result.expected_calving_date}.`
      },
      { function: "create pregnancy" });
  } catch (error) {
    return sendBreedingError(req, res, error, "create pregnancy controller");
  }
};

exports.updatePregnancyCtrl = async (req, res) => {
  log('in updatePregnancyCtrl');
  try {
    const pregnancyId = parseRecordId(req);

    const validation = await validutils.validatePayload(req.body, PREGNANCY_UPDATE_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await breedingService.updatePregnancySrvc(pregnancyId, req.body, req.user?.user_id);

    return resutils.sendSuccessResponse(req, res, result,
      { ...RESPONSE_STATUS.UPDATED, message: `Pregnancy for ${result.cattle_unique_code} updated successfully.` },
      { function: "update pregnancy" });
  } catch (error) {
    return sendBreedingError(req, res, error, "update pregnancy controller");
  }
};

// the incharge confirms she has stopped giving milk
exports.markDryOffCtrl = async (req, res) => {
  log('in markDryOffCtrl');
  try {
    const pregnancyId = parseRecordId(req);

    const validation = await validutils.validatePayload(req.body, DRY_OFF_PAYLOAD_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await breedingService.markDryOffSrvc(pregnancyId, req.body, req.user?.user_id);

    return resutils.sendSuccessResponse(req, res, result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `${result.cattle_unique_code} marked as dry from ${result.actual_dry_off_date}. She has been removed from the milking sheet.`
      },
      { function: "mark dry off" });
  } catch (error) {
    return sendBreedingError(req, res, error, "mark dry off controller");
  }
};

exports.recordCalvingCtrl = async (req, res) => {
  log('in recordCalvingCtrl');
  try {
    const pregnancyId = parseRecordId(req);

    const validation = await validutils.validatePayload(req.body, CALVING_PAYLOAD_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await breedingService.recordCalvingSrvc(pregnancyId, req.body, req.user?.user_id);

    const calfText = result.calves.length
      ? ` ${result.calves.length} calf record(s) created: ${result.calves.map((calf) => calf.cattle_unique_code).join(', ')}.`
      : ' No calf was registered.';

    return resutils.sendSuccessResponse(req, res, result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `Calving recorded for ${result.cattle_unique_code}.${calfText}`
          + (result.mother_can_produce_milk ? ' She is back on the milking sheet.' : '')
      },
      { function: "record calving" });
  } catch (error) {
    return sendBreedingError(req, res, error, "record calving controller");
  }
};

exports.markPregnancyAbortedCtrl = async (req, res) => {
  log('in markPregnancyAbortedCtrl');
  try {
    const pregnancyId = parseRecordId(req);

    const validation = await validutils.validatePayload(req.body, ABORT_PAYLOAD_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await breedingService.markPregnancyAbortedSrvc(pregnancyId, req.body, req.user?.user_id);

    return resutils.sendSuccessResponse(req, res, result,
      { ...RESPONSE_STATUS.UPDATED, message: `Pregnancy for ${result.cattle_unique_code} marked as aborted.` },
      { function: "mark pregnancy aborted" });
  } catch (error) {
    return sendBreedingError(req, res, error, "mark pregnancy aborted controller");
  }
};

exports.deletePregnancyCtrl = async (req, res) => {
  log('in deletePregnancyCtrl');
  try {
    const pregnancyId = parseRecordId(req);
    const result = await breedingService.deletePregnancySrvc(pregnancyId, req.user?.user_id);

    return resutils.sendSuccessResponse(req, res, result,
      { ...RESPONSE_STATUS.DELETED, message: `Pregnancy record for ${result.cattle_unique_code} removed.` },
      { function: "delete pregnancy" });
  } catch (error) {
    return sendBreedingError(req, res, error, "delete pregnancy controller");
  }
};
