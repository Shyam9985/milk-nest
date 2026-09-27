const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const validutils = require("../utils/validate.utils");
const { CACHE_TYPES } = require("../utils/cache.utils");
const cattleService = require("../services/cattleService");
const { log } = require('../utils/log.utils');

/*
 * The cattle register. Cattle type and breed remain settings masters and stay in settingsCtrl;
 * an animal is operational data, so it has its own module.
 */

const CATTLE_PAYLOAD_SCHEMA = {
  branch_id: { required: true, type: "number", min: 1, label: "Branch" },
  cattle_type_id: { required: true, type: "number", min: 1, label: "Cattle Type" },
  breed_id: { required: true, type: "number", min: 1, label: "Breed" },
  gender_id: { required: false, type: "number", min: 1, label: "Gender" },
  date_of_birth: { required: false, type: "string", maxLength: 10, label: "Date of Birth" },
  purchase_date: { required: false, type: "string", maxLength: 10, label: "Purchase Date" },
  weight: { required: false, type: "number", min: 0, label: "Weight (kg)" },
  purchase_cost: { required: false, type: "number", min: 0, label: "Purchase Cost" },
  color: { required: false, type: "string", maxLength: 100, label: "Colour" },
  remarks: { required: false, type: "string", maxLength: 1000, label: "Remarks" },
  // the form sends the read-only generated tag back on edit; the server keeps its own value
  cattle_unique_code: { required: false, type: "string", maxLength: 100, label: "Cattle Code" },
};

const sendCattleError = (req, res, error, fname) => {
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
          "That cattle code already exists. Reload the screen and try again.",
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

// the register, with the caller's permissions so the grid shows only the actions they hold
exports.getCattleListCtrl = async (req, res) => {
  log('in getCattleListCtrl');
  try {
    const records = await cattleService.getCattleListSrvc(req.user);

    return resutils.sendSuccessResponse(req, res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get cattle", cacheType: CACHE_TYPES.NO_STORE });
  } catch (error) {
    return sendCattleError(req, res, error, "get cattle controller");
  }
};

// the static dropdown lists (dairy farms, cattle types, genders) in one call
exports.getCattleFormOptionsCtrl = async (req, res) => {
  log('in getCattleFormOptionsCtrl');
  try {
    const options = await cattleService.getCattleFormOptionsSrvc(req.user);

    return resutils.sendSuccessResponse(req, res, options, RESPONSE_STATUS.SUCCESS,
      { function: "get cattle form options", cacheType: CACHE_TYPES.NO_STORE });
  } catch (error) {
    return sendCattleError(req, res, error, "get cattle form options controller");
  }
};

// branches of one dairy farm, scope filtered
exports.getCattleBranchOptionsCtrl = async (req, res) => {
  log('in getCattleBranchOptionsCtrl');
  try {
    const dairyFarmId = parseOptionalQueryId(req, "dairy_farm_id");
    const records = await cattleService.getBranchOptionsSrvc(req.user, dairyFarmId);

    return resutils.sendSuccessResponse(req, res, { records: records || [] }, RESPONSE_STATUS.SUCCESS,
      { function: "get cattle branch options", cacheType: CACHE_TYPES.NO_STORE });
  } catch (error) {
    return sendCattleError(req, res, error, "get cattle branch options controller");
  }
};

// breeds of one cattle type
exports.getCattleBreedOptionsCtrl = async (req, res) => {
  log('in getCattleBreedOptionsCtrl');
  try {
    const cattleTypeId = parseOptionalQueryId(req, "cattle_type_id");
    const records = await cattleService.getBreedOptionsSrvc(cattleTypeId);

    return resutils.sendSuccessResponse(req, res, { records: records || [] }, RESPONSE_STATUS.SUCCESS,
      { function: "get cattle breed options", cacheType: CACHE_TYPES.NO_STORE });
  } catch (error) {
    return sendCattleError(req, res, error, "get cattle breed options controller");
  }
};

exports.createCattleCtrl = async (req, res) => {
  log('in createCattleCtrl');
  try {
    const validation = await validutils.validatePayload(req.body, CATTLE_PAYLOAD_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await cattleService.createCattleSrvc(req.body, req.user?.user_id);

    return resutils.sendSuccessResponse(req, res, result,
      { ...RESPONSE_STATUS.CREATED, message: `Cattle '${result.cattle_unique_code}' added successfully.` },
      { function: "create cattle" });
  } catch (error) {
    return sendCattleError(req, res, error, "create cattle controller");
  }
};

exports.updateCattleCtrl = async (req, res) => {
  log('in updateCattleCtrl');
  try {
    const cattleId = parseRecordId(req);

    const validation = await validutils.validatePayload(req.body, CATTLE_PAYLOAD_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await cattleService.updateCattleSrvc(cattleId, req.body, req.user?.user_id);

    return resutils.sendSuccessResponse(req, res, result,
      { ...RESPONSE_STATUS.UPDATED, message: `Cattle '${result.cattle_unique_code}' updated successfully.` },
      { function: "update cattle" });
  } catch (error) {
    return sendCattleError(req, res, error, "update cattle controller");
  }
};

exports.deleteCattleCtrl = async (req, res) => {
  log('in deleteCattleCtrl');
  try {
    const cattleId = parseRecordId(req);
    const result = await cattleService.deleteCattleSrvc(cattleId, req.user?.user_id);

    return resutils.sendSuccessResponse(req, res, result,
      { ...RESPONSE_STATUS.DELETED, message: `Cattle '${result.cattle_unique_code}' removed successfully.` },
      { function: "delete cattle" });
  } catch (error) {
    return sendCattleError(req, res, error, "delete cattle controller");
  }
};
