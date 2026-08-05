const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const validutils = require("../utils/validate.utils");
const { CACHE_TYPES } = require("../utils/cache.utils");
const settingsService = require("../services/settingsService");

const STATE_PAYLOAD_SCHEMA = {
  state_name: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 200,
    label: "State Name",
  },
  state_code: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 20,
    label: "State Code",
  },
};

// maps known error names to standard error responses
const sendSettingsError = (req, res, error, fname) => {
  console.log("Error in " + fname + " : ", error);

  switch (error.name) {
    case "validationFailed":
      return resutils.sendErrorResponse(
        req,
        res,
        error.message,
        RESPONSE_STATUS.VALIDATION_ERROR,
        { function: fname },
      );

    case "invalidRecordId":
      return resutils.sendErrorResponse(
        req,
        res,
        error.message,
        RESPONSE_STATUS.INVALID_DATA,
        { function: fname },
      );

    case "duplicateRecord":
      return resutils.sendErrorResponse(
        req,
        res,
        error.message,
        RESPONSE_STATUS.DUPLICATE_RECORD,
        { function: fname },
      );

    case "recordNotFound":
      return resutils.sendErrorResponse(
        req,
        res,
        error.message,
        RESPONSE_STATUS.NOT_FOUND,
        { function: fname },
      );

    case "DatabaseError":
      // unique key violations surface as duplicates, anything else as a db failure
      if (error.code === "ER_DUP_ENTRY") {
        return resutils.sendErrorResponse(
          req,
          res,
          "Record already exists with the same details.",
          RESPONSE_STATUS.DUPLICATE_RECORD,
          { function: fname },
        );
      }
      return resutils.sendErrorResponse(
        req,
        res,
        error.message,
        RESPONSE_STATUS.DB_ERROR,
        { function: fname },
      );

    default:
      return resutils.sendErrorResponse(
        req,
        res,
        "Unable to process request. Please try after some time.",
        RESPONSE_STATUS.UNABLE_TO_PROCESS,
        { function: fname },
      );
  }
};

// validates and returns the :id route param
const parseRecordId = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0)
    resutils.createError(
      "invalidRecordId",
      "Please provide a valid record id.",
    );
  return id;
};

exports.getStatesCtrl = async (req, res) => {
  try {
    const records = await settingsService.getStatesSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get states", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get states controller");
  }
};

exports.createStateCtrl = async (req, res) => {
  try {
    const validation = await validutils.validatePayload(
      req.body,
      STATE_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.createStateSrvc(req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      RESPONSE_STATUS.CREATED,
      { function: "create state" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "create state controller");
  }
};

exports.updateStateCtrl = async (req, res) => {
  try {
    const stateId = parseRecordId(req);

    const validation = await validutils.validatePayload(
      req.body,
      STATE_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.updateStateSrvc(stateId, req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      RESPONSE_STATUS.UPDATED,
      { function: "update state" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "update state controller");
  }
};

exports.deleteStateCtrl = async (req, res) => {
  try {
    const stateId = parseRecordId(req);

    const result = await settingsService.deleteStateSrvc(stateId);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      RESPONSE_STATUS.DELETED,
      { function: "delete state" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete state controller");
  }
};
