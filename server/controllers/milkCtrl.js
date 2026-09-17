const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const validutils = require("../utils/validate.utils");
const { CACHE_TYPES } = require("../utils/cache.utils");
const milkService = require("../services/milkService");
const { log } = require('../utils/log.utils');
const { DATE_ONLY_RE } = require('../utils/date.utils');


const MILK_SHEET_PAYLOAD_SCHEMA = {
  branch_id: { required: true, type: "number", min: 1, label: "Branch" },
  production_date: { required: true, type: "string", maxLength: 10, label: "Production Date" },
  entries: {
    required: true, type: "array", minItems: 1, label: "Cattle Entries",
    // each entry must have a valid cattle_id and optional milk quantities, fat/snf percentages, and remarks
    itemSchema: {
      cattle_id: { required: true, type: "number", min: 1 },
      morning_quantity: { required: false, type: "number", min: 0, max: 999 },
      evening_quantity: { required: false, type: "number", min: 0, max: 999 },
      fat_percentage: { required: false, type: "number", min: 0, max: 99 },
      snf_percentage: { required: false, type: "number", min: 0, max: 99 },
      remarks: { required: false, type: "string", maxLength: 500 },
    }
  },
};

// maps known error names to standard error responses, mirroring the settings controller
const sendMilkError = (req, res, error, fname) => {
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

    case "DatabaseError":
      // a unique key violation here means the same animal and date came twice
      if (error.code === "ER_DUP_ENTRY") {
        return resutils.sendErrorResponse(req, res,
          "This animal already has an entry for that date. Reload the sheet and try again.",
          RESPONSE_STATUS.DUPLICATE_RECORD, { function: fname });
      }
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.DB_ERROR, { function: fname });

    default:
      return resutils.sendErrorResponse(req, res,
        "Unable to process request. Please try after some time.",
        RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: fname });
  }
};

// validates and returns the :id route param
const parseRecordId = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0)
    resutils.createError("invalidRecordId", "Please provide a valid record id.");
  return id;
};

// reads an optional positive-integer query param
const parseOptionalQueryId = (req, key) => {
  if (req.query[key] === undefined || req.query[key] === "") return null;

  const id = Number(req.query[key]);
  if (!Number.isInteger(id) || id <= 0)
    resutils.createError("invalidRecordId", `Please provide a valid ${key}.`);
  return id;
};

// reads a required YYYY-MM-DD query param
const parseRequiredQueryDate = (req, key, label) => {
  const value = req.query[key];
  if (!value || !DATE_ONLY_RE.test(value)) {
    resutils.createError("validationFailed", `Please provide a valid ${label} (YYYY-MM-DD).`);
  }
  return value;
};

// the day sheet: one row per active animal at the branch, pre-filled where recorded
exports.getMilkProductionSheetCtrl = async (req, res) => {
  log('in getMilkProductionSheetCtrl');
  try {
    const branchId = parseOptionalQueryId(req, "branch_id");
    if (!branchId) resutils.createError("validationFailed", "Please select a branch.");

    const productionDate = parseRequiredQueryDate(req, "production_date", "production date");

    const records = await milkService.getMilkProductionSheetSrvc(branchId, productionDate);

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get milk production sheet", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendMilkError(req, res, error, "get milk production sheet controller");
  }
};

// recorded entries plus daily totals for a date range
exports.getMilkProductionListCtrl = async (req, res) => {
  log('in getMilkProductionListCtrl');
  try {
    const fromDate = parseRequiredQueryDate(req, "from_date", "from date");
    const toDate = parseRequiredQueryDate(req, "to_date", "to date");
    if (toDate < fromDate) {
      resutils.createError("validationFailed", "The to date cannot be earlier than the from date.");
    }

    const branchId = parseOptionalQueryId(req, "branch_id");
    const result = await milkService.getMilkProductionListSrvc(req.user, fromDate, toDate, branchId);

    return resutils.sendSuccessResponse(
      req,
      res,
      { ...result, permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get milk production list", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendMilkError(req, res, error, "get milk production list controller");
  }
};

// saves a whole day sheet for one branch
exports.saveMilkProductionSheetCtrl = async (req, res) => {
  log('in saveMilkProductionSheetCtrl');
  try {
    const validation = await validutils.validatePayload(req.body, MILK_SHEET_PAYLOAD_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await milkService.saveMilkProductionSheetSrvc(req.body, req.user?.user_id);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.SUCCESS,
        message: `Milk production saved for ${result.production_date}: ${result.inserted} added, ${result.updated} updated, ${result.removed} cleared.`,
      },
      { function: "save milk production sheet" },
    );
  } catch (error) {
    return sendMilkError(req, res, error, "save milk production sheet controller");
  }
};

exports.deleteMilkProductionCtrl = async (req, res) => {
  log('in deleteMilkProductionCtrl');
  try {
    const milkProductionId = parseRecordId(req);

    const result = await milkService.deleteMilkProductionSrvc(milkProductionId, req.user?.user_id);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.DELETED,
        message: `Entry for '${result.cattle_unique_code}' on ${result.production_date} removed successfully.`,
      },
      { function: "delete milk production" },
    );
  } catch (error) {
    return sendMilkError(req, res, error, "delete milk production controller");
  }
};
