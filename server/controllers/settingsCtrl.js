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

const DISTRICT_PAYLOAD_SCHEMA = {
  district_name: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 200,
    label: "District Name",
  },
  district_code: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 20,
    label: "District Code",
  },
  state_id: {
    required: true,
    type: "number",
    min: 1,
    label: "State",
  },
};

const MANDAL_PAYLOAD_SCHEMA = {
  mandal_ulb_nm: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 250,
    label: "Mandal/ULB Name",
  },
  mandal_ulb_code: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 20,
    label: "Mandal/ULB Code",
  },
  district_id: {
    required: true,
    type: "number",
    min: 1,
    label: "District",
  },
  is_ulb: {
    required: false,
    type: "boolean",
    label: "Is ULB",
  },
};

const VILLAGE_PAYLOAD_SCHEMA = {
  village_sachivalayam_nm: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 250,
    label: "Village/Sachivalayam Name",
  },
  village_sachivalayam_code: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 20,
    label: "Village/Sachivalayam Code",
  },
  district_id: {
    required: true,
    type: "number",
    min: 1,
    label: "District",
  },
  mandal_ulb_id: {
    required: false,
    type: "number",
    min: 1,
    label: "Mandal/ULB",
  },
  is_sachivalayam: {
    required: false,
    type: "boolean",
    label: "Is Sachivalayam",
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

    case "invalidParent":
      return resutils.sendErrorResponse(
        req,
        res,
        error.message,
        RESPONSE_STATUS.INVALID_DATA,
        { function: fname },
      );

    case "recordInUse":
      return resutils.sendErrorResponse(
        req,
        res,
        error.message,
        RESPONSE_STATUS.RECORD_IN_USE,
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
      {
        ...RESPONSE_STATUS.CREATED,
        message: `State '${result.state_name}' ${result.reactivated ? "restored" : "added"} successfully.`,
      },
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
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `State '${result.state_name}' updated successfully.`,
      },
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
      {
        ...RESPONSE_STATUS.DELETED,
        message: `State '${result.state_name}' deleted successfully.`,
      },
      { function: "delete state" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete state controller");
  }
};

// ===================== DISTRICT MASTER =====================

exports.getDistrictsCtrl = async (req, res) => {
  try {
    const records = await settingsService.getDistrictsSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get districts", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get districts controller");
  }
};

exports.createDistrictCtrl = async (req, res) => {
  try {
    const validation = await validutils.validatePayload(
      req.body,
      DISTRICT_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.createDistrictSrvc(req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `District '${result.district_name}' ${result.reactivated ? "restored" : "added"} successfully.`,
      },
      { function: "create district" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "create district controller");
  }
};

exports.updateDistrictCtrl = async (req, res) => {
  try {
    const districtId = parseRecordId(req);

    const validation = await validutils.validatePayload(
      req.body,
      DISTRICT_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.updateDistrictSrvc(
      districtId,
      req.body,
    );

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `District '${result.district_name}' updated successfully.`,
      },
      { function: "update district" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "update district controller");
  }
};

exports.deleteDistrictCtrl = async (req, res) => {
  try {
    const districtId = parseRecordId(req);

    const result = await settingsService.deleteDistrictSrvc(districtId);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.DELETED,
        message: `District '${result.district_name}' deleted successfully.`,
      },
      { function: "delete district" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete district controller");
  }
};

// ===================== MANDAL / ULB MASTER =====================

exports.getMandalsCtrl = async (req, res) => {
  try {
    const records = await settingsService.getMandalsSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get mandals", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get mandals controller");
  }
};

exports.createMandalCtrl = async (req, res) => {
  try {
    const validation = await validutils.validatePayload(
      req.body,
      MANDAL_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.createMandalSrvc(req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `Mandal/ULB '${result.mandal_ulb_nm}' ${result.reactivated ? "restored" : "added"} successfully.`,
      },
      { function: "create mandal" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "create mandal controller");
  }
};

exports.updateMandalCtrl = async (req, res) => {
  try {
    const mandalId = parseRecordId(req);

    const validation = await validutils.validatePayload(
      req.body,
      MANDAL_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.updateMandalSrvc(mandalId, req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `Mandal/ULB '${result.mandal_ulb_nm}' updated successfully.`,
      },
      { function: "update mandal" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "update mandal controller");
  }
};

exports.deleteMandalCtrl = async (req, res) => {
  try {
    const mandalId = parseRecordId(req);

    const result = await settingsService.deleteMandalSrvc(mandalId);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.DELETED,
        message: `Mandal/ULB '${result.mandal_ulb_nm}' deleted successfully.`,
      },
      { function: "delete mandal" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete mandal controller");
  }
};

// ===================== VILLAGE / SACHIVALAYAM MASTER =====================

exports.getVillagesCtrl = async (req, res) => {
  try {
    const records = await settingsService.getVillagesSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get villages", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get villages controller");
  }
};

exports.createVillageCtrl = async (req, res) => {
  try {
    const validation = await validutils.validatePayload(
      req.body,
      VILLAGE_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.createVillageSrvc(req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `Village/Sachivalayam '${result.village_sachivalayam_nm}' ${result.reactivated ? "restored" : "added"} successfully.`,
      },
      { function: "create village" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "create village controller");
  }
};

exports.updateVillageCtrl = async (req, res) => {
  try {
    const villageId = parseRecordId(req);

    const validation = await validutils.validatePayload(
      req.body,
      VILLAGE_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.updateVillageSrvc(villageId, req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `Village/Sachivalayam '${result.village_sachivalayam_nm}' updated successfully.`,
      },
      { function: "update village" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "update village controller");
  }
};

exports.deleteVillageCtrl = async (req, res) => {
  try {
    const villageId = parseRecordId(req);

    const result = await settingsService.deleteVillageSrvc(villageId);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.DELETED,
        message: `Village/Sachivalayam '${result.village_sachivalayam_nm}' deleted successfully.`,
      },
      { function: "delete village" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete village controller");
  }
};
