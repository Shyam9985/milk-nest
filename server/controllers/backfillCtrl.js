const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const validutils = require("../utils/validate.utils");
const { CACHE_TYPES } = require("../utils/cache.utils");
const backfillService = require("../services/backfillService");
const { log } = require('../utils/log.utils');

/*
 * Data backfill. Two endpoints on purpose: a preview that writes nothing, and a run that does.
 * The screen is expected to call the first before the second, so the number of rows about to be
 * created - or replaced - is on screen before anyone presses the button.
 */

const RANGE_SCHEMA = {
  dairy_farm_id: { required: true, type: "number", min: 1, label: "Dairy Farm" },
  branch_id: { required: false, type: "number", min: 1, label: "Branch" },
  from_date: { required: true, type: "string", maxLength: 10, label: "From Date" },
  to_date: { required: true, type: "string", maxLength: 10, label: "To Date" },
};

// overwrite is only accepted on the run, never on the preview: a preview has nothing to overwrite
const RUN_SCHEMA = {
  ...RANGE_SCHEMA,
  overwrite: { required: false, type: "boolean", label: "Overwrite existing entries" },
};

const sendBackfillError = (req, res, error, fname) => {
  console.log("Error in " + fname + " : ", error);

  switch (error.name) {
    case "validationFailed":
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.VALIDATION_ERROR, { function: fname });

    case "invalidRecordId":
    case "invalidParent":
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.INVALID_DATA, { function: fname });

    case "recordNotFound":
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.NOT_FOUND, { function: fname });

    case "DatabaseError":
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.DB_ERROR, { function: fname });

    default:
      return resutils.sendErrorResponse(req, res,
        "Unable to process request. Please try after some time.",
        RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: fname });
  }
};

const parseOptionalQueryId = (req, key) => {
  if (req.query[key] === undefined || req.query[key] === "") return null;

  const id = Number(req.query[key]);
  if (!Number.isInteger(id) || id <= 0)
    resutils.createError("invalidRecordId", `Please provide a valid ${key}.`);
  return id;
};

// what a run would do. writes nothing
exports.previewBackfillCtrl = async (req, res) => {
  log('in previewBackfillCtrl');
  try {
    const filters = {
      dairy_farm_id: parseOptionalQueryId(req, "dairy_farm_id"),
      branch_id: parseOptionalQueryId(req, "branch_id"),
      from_date: req.query.from_date,
      to_date: req.query.to_date
    };

    const validation = await validutils.validatePayload(filters, RANGE_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await backfillService.previewBackfillSrvc(req.user, filters);

    return resutils.sendSuccessResponse(req, res,
      { ...result, permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "preview backfill", cacheType: CACHE_TYPES.NO_STORE });
  } catch (error) {
    return sendBackfillError(req, res, error, "preview backfill controller");
  }
};

exports.runBackfillCtrl = async (req, res) => {
  log('in runBackfillCtrl');
  try {
    const validation = await validutils.validatePayload(req.body, RUN_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await backfillService.runBackfillSrvc(req.user, req.body, req.user?.user_id);

    const parts = [`${result.total_rows} row(s) written across ${result.filled_days + result.overwritten_days} day(s)`];
    if (result.overwritten_days) parts.push(`${result.overwritten_days} day(s) overwritten`);
    if (result.skipped_days) parts.push(`${result.skipped_days} skipped`);
    if (result.failed_days) parts.push(`${result.failed_days} failed`);

    return resutils.sendSuccessResponse(req, res, result,
      { ...RESPONSE_STATUS.CREATED, message: `Backfill finished: ${parts.join(', ')}.` },
      { function: "run backfill" });
  } catch (error) {
    return sendBackfillError(req, res, error, "run backfill controller");
  }
};
