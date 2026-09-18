const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const { CACHE_TYPES } = require("../utils/cache.utils");
const dashboardService = require("../services/dashboardService");
const { log } = require('../utils/log.utils');
const { DATE_ONLY_RE, isValidDateOnly, todayLocal, addDaysLocal, daysBetweenLocal } = require('../utils/date.utils');

// the longest custom range accepted. every trend array is zero-filled per day, so this
// bounds the response size and the group-by scan alike
const MAX_PERIOD_DAYS = 366;

const sendDashboardError = (req, res, error, fname) => {
  console.log("Error in " + fname + " : ", error);

  switch (error.name) {
    case "validationFailed":
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.VALIDATION_ERROR, { function: fname });

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

// reads an optional YYYY-MM-DD query param
const parseOptionalQueryDate = (req, key, label) => {
  const value = req.query[key];
  if (value === undefined || value === "") return null;
  if (!DATE_ONLY_RE.test(value) || !isValidDateOnly(value)) {
    resutils.createError("validationFailed", `Please provide a valid ${label} (YYYY-MM-DD).`);
  }
  return value;
};

// the period defaults to the last seven days ending today; a custom range is bounded
const parsePeriod = (req) => {
  const today = todayLocal();
  const toDate = parseOptionalQueryDate(req, "to_date", "to date") || today;
  const fromDate = parseOptionalQueryDate(req, "from_date", "from date") || addDaysLocal(toDate, -6);

  if (toDate < fromDate) {
    resutils.createError("validationFailed", "The to date cannot be earlier than the from date.");
  }
  if (daysBetweenLocal(fromDate, toDate) > MAX_PERIOD_DAYS) {
    resutils.createError("validationFailed", `Please choose a period of at most ${MAX_PERIOD_DAYS} days.`);
  }
  return { fromDate, toDate };
};

// dropdown feeds for the scope bar, already limited to the caller's jurisdiction
exports.getDashboardFiltersCtrl = async (req, res) => {
  log('in getDashboardFiltersCtrl');
  try {
    const result = await dashboardService.getDashboardFiltersSrvc(req.user);

    return resutils.sendSuccessResponse(
      req,
      res,
      { ...result, permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get dashboard filters", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendDashboardError(req, res, error, "get dashboard filters controller");
  }
};

// the whole dashboard in one round trip
exports.getDashboardCtrl = async (req, res) => {
  log('in getDashboardCtrl');
  try {
    const { fromDate, toDate } = parsePeriod(req);
    const filters = {
      dairy_farm_id: parseOptionalQueryId(req, "dairy_farm_id"),
      branch_id: parseOptionalQueryId(req, "branch_id")
    };

    const result = await dashboardService.getDashboardSrvc(req.user, fromDate, toDate, filters);

    return resutils.sendSuccessResponse(
      req,
      res,
      { ...result, permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get dashboard", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendDashboardError(req, res, error, "get dashboard controller");
  }
};
