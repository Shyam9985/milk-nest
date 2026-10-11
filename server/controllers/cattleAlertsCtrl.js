const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const { CACHE_TYPES } = require("../utils/cache.utils");
const cattleAlertsService = require("../services/cattleAlertsService");
const { log } = require('../utils/log.utils');

const sendAlertsError = (req, res, error, fname) => {
  console.log("Error in " + fname + " : ", error);

  switch (error.name) {
    case "invalidRecordId":
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.INVALID_DATA, { function: fname });

    case "DatabaseError":
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.DB_ERROR, { function: fname });

    default:
      return resutils.sendErrorResponse(req, res,
        "Unable to process request. Please try after some time.",
        RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: fname });
  }
};

// reads an optional positive-integer query param
const parseOptionalQueryId = (req, key) => {
  if (req.query[key] === undefined || req.query[key] === "") return null;

  const id = Number(req.query[key]);
  if (!Number.isInteger(id) || id <= 0)
    resutils.createError("invalidRecordId", `Please provide a valid ${key}.`);
  return id;
};

// every lifecycle alert for the caller's jurisdiction
exports.getCattleAlertsCtrl = async (req, res) => {
  log('in getCattleAlertsCtrl');
  try {
    const filters = {
      dairy_farm_id: parseOptionalQueryId(req, "dairy_farm_id"),
      branch_id: parseOptionalQueryId(req, "branch_id")
    };

    const result = await cattleAlertsService.getCattleAlertsSrvc(req.user, filters);

    return resutils.sendSuccessResponse(req, res,
      { ...result, permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get cattle alerts", cacheType: CACHE_TYPES.NO_STORE });
  } catch (error) {
    return sendAlertsError(req, res, error, "get cattle alerts controller");
  }
};
