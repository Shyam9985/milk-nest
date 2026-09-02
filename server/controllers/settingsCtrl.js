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

// reads an optional positive-integer query param (e.g. ?state_id=2 for dependent dropdowns)
const parseOptionalQueryId = (req, key) => {
  if (req.query[key] === undefined || req.query[key] === "") return null;

  const id = Number(req.query[key]);
  if (!Number.isInteger(id) || id <= 0)
    resutils.createError("invalidRecordId", `Please provide a valid ${key}.`);
  return id;
};

exports.getDistrictsCtrl = async (req, res) => {
  try {
    const stateId = parseOptionalQueryId(req, "state_id");
    const records = await settingsService.getDistrictsSrvc(stateId);

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
    const districtId = parseOptionalQueryId(req, "district_id");
    const records = await settingsService.getMandalsSrvc(districtId);

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
    const districtId = parseOptionalQueryId(req, "district_id");
    const records = await settingsService.getVillagesSrvc(districtId);

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

// ===================== ROLE MASTER =====================

const ROLE_PAYLOAD_SCHEMA = {
  role_nm: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 150,
    label: "Role Name",
  },
  role_hndlr: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 50,
    label: "Role Handler",
  },
  description: {
    required: false,
    type: "string",
    maxLength: 500,
    label: "Description",
  },
  landing_url: {
    required: false,
    type: "string",
    maxLength: 200,
    label: "Landing URL",
  },
  hierarchy_id: {
    required: false,
    type: "number",
    min: 1,
    label: "Hierarchy",
  },
};

exports.getRolesCtrl = async (req, res) => {
  try {
    const records = await settingsService.getRolesSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get roles", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get roles controller");
  }
};

exports.getRoleHierarchiesCtrl = async (req, res) => {
  try {
    const records = await settingsService.getHierarchiesSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [] },
      RESPONSE_STATUS.SUCCESS,
      { function: "get role hierarchies", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get role hierarchies controller");
  }
};

exports.createRoleCtrl = async (req, res) => {
  try {
    const validation = await validutils.validatePayload(
      req.body,
      ROLE_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.createRoleSrvc(req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `Role '${result.role_nm}' ${result.reactivated ? "restored" : "added"} successfully.`,
      },
      { function: "create role" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "create role controller");
  }
};

exports.updateRoleCtrl = async (req, res) => {
  try {
    const roleId = parseRecordId(req);

    const validation = await validutils.validatePayload(
      req.body,
      ROLE_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.updateRoleSrvc(roleId, req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `Role '${result.role_nm}' updated successfully.`,
      },
      { function: "update role" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "update role controller");
  }
};

exports.deleteRoleCtrl = async (req, res) => {
  try {
    const roleId = parseRecordId(req);

    const result = await settingsService.deleteRoleSrvc(roleId);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.DELETED,
        message: `Role '${result.role_nm}' deleted successfully.`,
      },
      { function: "delete role" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete role controller");
  }
};

// ===================== GENDER MASTER =====================

const GENDER_PAYLOAD_SCHEMA = {
  gender_nm: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 50,
    label: "Gender Name",
  },
  gender_code: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 20,
    label: "Gender Code",
  },
};

exports.getGendersCtrl = async (req, res) => {
  try {
    const records = await settingsService.getGendersSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get genders", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get genders controller");
  }
};

exports.createGenderCtrl = async (req, res) => {
  try {
    const validation = await validutils.validatePayload(
      req.body,
      GENDER_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.createGenderSrvc(req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `Gender '${result.gender_nm}' ${result.reactivated ? "restored" : "added"} successfully.`,
      },
      { function: "create gender" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "create gender controller");
  }
};

exports.updateGenderCtrl = async (req, res) => {
  try {
    const genderId = parseRecordId(req);

    const validation = await validutils.validatePayload(
      req.body,
      GENDER_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.updateGenderSrvc(genderId, req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `Gender '${result.gender_nm}' updated successfully.`,
      },
      { function: "update gender" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "update gender controller");
  }
};

exports.deleteGenderCtrl = async (req, res) => {
  try {
    const genderId = parseRecordId(req);

    const result = await settingsService.deleteGenderSrvc(genderId);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.DELETED,
        message: `Gender '${result.gender_nm}' deleted successfully.`,
      },
      { function: "delete gender" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete gender controller");
  }
};

// ===================== HIERARCHY MASTER =====================

const HIERARCHY_PAYLOAD_SCHEMA = {
  hierarchy_nm: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 250,
    label: "Hierarchy Name",
  },
  level_type: {
    required: false,
    type: "string",
    maxLength: 50,
    label: "Level Type",
  },
  parent_hirrarchy_id: {
    required: false,
    type: "number",
    min: 1,
    label: "Parent Hierarchy",
  },
};

exports.getHierarchyListCtrl = async (req, res) => {
  try {
    const records = await settingsService.getHierarchyListSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get hierarchy list", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get hierarchy list controller");
  }
};

exports.createHierarchyCtrl = async (req, res) => {
  try {
    const validation = await validutils.validatePayload(
      req.body,
      HIERARCHY_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.createHierarchySrvc(req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `Hierarchy '${result.hierarchy_nm}' ${result.reactivated ? "restored" : "added"} successfully.`,
      },
      { function: "create hierarchy" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "create hierarchy controller");
  }
};

exports.updateHierarchyCtrl = async (req, res) => {
  try {
    const hierarchyId = parseRecordId(req);

    const validation = await validutils.validatePayload(
      req.body,
      HIERARCHY_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.updateHierarchySrvc(
      hierarchyId,
      req.body,
    );

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `Hierarchy '${result.hierarchy_nm}' updated successfully.`,
      },
      { function: "update hierarchy" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "update hierarchy controller");
  }
};

exports.deleteHierarchyCtrl = async (req, res) => {
  try {
    const hierarchyId = parseRecordId(req);

    const result = await settingsService.deleteHierarchySrvc(hierarchyId);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.DELETED,
        message: `Hierarchy '${result.hierarchy_nm}' deleted successfully.`,
      },
      { function: "delete hierarchy" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete hierarchy controller");
  }
};

// ===================== POSITION MASTER =====================

const POSITION_PAYLOAD_SCHEMA = {
  position_nm: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 250,
    label: "Position Name",
  },
  role_id: {
    required: true,
    type: "number",
    min: 1,
    label: "Role",
  },
  hierarchy_id: {
    required: true,
    type: "number",
    min: 1,
    label: "Hierarchy",
  },
  user_id: {
    required: false,
    type: "number",
    min: 1,
    label: "Assigned User",
  },
  district_id: {
    required: false,
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
  village_sachivalayam_id: {
    required: false,
    type: "number",
    min: 1,
    label: "Village/Sachivalayam",
  },
  location_ref_id: {
    required: false,
    type: "number",
    min: 1,
    label: "Dairy Farm",
  },
  start_date: {
    required: false,
    type: "string",
    maxLength: 10,
    label: "Start Date",
  },
  end_date: {
    required: false,
    type: "string",
    maxLength: 10,
    label: "End Date",
  },
};

exports.getPositionsCtrl = async (req, res) => {
  try {
    const records = await settingsService.getPositionsSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get positions", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get positions controller");
  }
};

exports.getPositionRolesCtrl = async (req, res) => {
  try {
    const records = await settingsService.getPositionRolesSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [] },
      RESPONSE_STATUS.SUCCESS,
      { function: "get position roles", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get position roles controller");
  }
};

exports.getPositionHierarchiesCtrl = async (req, res) => {
  try {
    const records = await settingsService.getHierarchiesSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [] },
      RESPONSE_STATUS.SUCCESS,
      { function: "get position hierarchies", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get position hierarchies controller");
  }
};

exports.getPositionUsersCtrl = async (req, res) => {
  try {
    const records = await settingsService.getPositionUsersSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [] },
      RESPONSE_STATUS.SUCCESS,
      { function: "get position users", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get position users controller");
  }
};

exports.createPositionCtrl = async (req, res) => {
  try {
    const validation = await validutils.validatePayload(
      req.body,
      POSITION_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.createPositionSrvc(req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `Position '${result.position_nm}' ${result.reactivated ? "restored" : "added"} successfully.`,
      },
      { function: "create position" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "create position controller");
  }
};

exports.updatePositionCtrl = async (req, res) => {
  try {
    const positionId = parseRecordId(req);

    const validation = await validutils.validatePayload(
      req.body,
      POSITION_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.updatePositionSrvc(
      positionId,
      req.body,
    );

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `Position '${result.position_nm}' updated successfully.`,
      },
      { function: "update position" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "update position controller");
  }
};

exports.deletePositionCtrl = async (req, res) => {
  try {
    const positionId = parseRecordId(req);

    const result = await settingsService.deletePositionSrvc(positionId);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.DELETED,
        message: `Position '${result.position_nm}' deleted successfully.`,
      },
      { function: "delete position" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete position controller");
  }
};

// ===================== DAIRY FARM MASTER =====================

const DAIRY_FARM_PAYLOAD_SCHEMA = {
  dairy_farm_name: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 255,
    label: "Dairy Farm Name",
  },
  contact_number: {
    required: false,
    type: "mobile-no",
    label: "Contact Number",
  },
  email: {
    required: false,
    type: "email",
    label: "Email",
  },
  address: {
    required: false,
    type: "string",
    maxLength: 1000,
    label: "Address",
  },
  main_branch_name: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 255,
    label: "Main Branch Name",
  },
  state_id: { required: true, type: "number", min: 1, label: "State" },
  district_id: { required: true, type: "number", min: 1, label: "District" },
  mandal_ulb_id: { required: true, type: "number", min: 1, label: "Mandal/ULB" },
  village_sachivalayam_id: { required: true, type: "number", min: 1, label: "Village/Sachivalayam" },
};

exports.getDairyFarmsCtrl = async (req, res) => {
  try {
    const records = await settingsService.getDairyFarmsSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get dairy farms", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get dairy farms controller");
  }
};

exports.createDairyFarmCtrl = async (req, res) => {
  try {
    const validation = await validutils.validatePayload(
      req.body,
      DAIRY_FARM_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    // dairy_farm_lst_t carries created_by/updated_by audit columns
    const result = await settingsService.createDairyFarmSrvc(
      req.body,
      req.user?.user_id,
    );

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `Dairy farm '${result.dairy_farm_name}' ${result.reactivated ? "restored" : "added"} successfully.`,
      },
      { function: "create dairy farm" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "create dairy farm controller");
  }
};

exports.updateDairyFarmCtrl = async (req, res) => {
  try {
    const dairyFarmId = parseRecordId(req);

    const validation = await validutils.validatePayload(
      req.body,
      DAIRY_FARM_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.updateDairyFarmSrvc(
      dairyFarmId,
      req.body,
      req.user?.user_id,
    );

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `Dairy farm '${result.dairy_farm_name}' updated successfully.`,
      },
      { function: "update dairy farm" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "update dairy farm controller");
  }
};

exports.deleteDairyFarmCtrl = async (req, res) => {
  try {
    const dairyFarmId = parseRecordId(req);

    const result = await settingsService.deleteDairyFarmSrvc(
      dairyFarmId,
      req.user?.user_id,
    );

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.DELETED,
        message: `Dairy farm '${result.dairy_farm_name}' deleted successfully.`,
      },
      { function: "delete dairy farm" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete dairy farm controller");
  }
};

// ===================== ROLE PERMISSIONS =====================

const ROLE_PERMISSION_PAYLOAD_SCHEMA = {
  role_id: { required: true, type: "number", min: 1, label: "Role" },
  permission_key: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 200,
    label: "Permission Key",
  },
  can_view: { required: false, type: "boolean", label: "Can View" },
  can_insert: { required: false, type: "boolean", label: "Can Insert" },
  can_update: { required: false, type: "boolean", label: "Can Update" },
  can_delete: { required: false, type: "boolean", label: "Can Delete" },
};

exports.getRolePermissionListCtrl = async (req, res) => {
  try {
    const records = await settingsService.getRolePermissionListSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get role permissions", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get role permissions controller");
  }
};

exports.getRolePermissionRolesCtrl = async (req, res) => {
  try {
    const records = await settingsService.getPositionRolesSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [] },
      RESPONSE_STATUS.SUCCESS,
      { function: "get role permission roles", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get role permission roles controller");
  }
};

exports.createRolePermissionCtrl = async (req, res) => {
  try {
    const validation = await validutils.validatePayload(
      req.body,
      ROLE_PERMISSION_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.createRolePermissionSrvc(req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `Permission '${result.permission_key}' ${result.reactivated ? "restored" : "added"} successfully.`,
      },
      { function: "create role permission" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "create role permission controller");
  }
};

exports.updateRolePermissionCtrl = async (req, res) => {
  try {
    const rolePermissionId = parseRecordId(req);

    const validation = await validutils.validatePayload(
      req.body,
      ROLE_PERMISSION_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.updateRolePermissionSrvc(
      rolePermissionId,
      req.body,
    );

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `Permission '${result.permission_key}' updated successfully.`,
      },
      { function: "update role permission" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "update role permission controller");
  }
};

exports.deleteRolePermissionCtrl = async (req, res) => {
  try {
    const rolePermissionId = parseRecordId(req);

    const result = await settingsService.deleteRolePermissionSrvc(rolePermissionId);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.DELETED,
        message: `Permission '${result.permission_key}' deleted successfully.`,
      },
      { function: "delete role permission" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete role permission controller");
  }
};

// ===================== MENU ITEMS =====================

const MENU_ITEM_PAYLOAD_SCHEMA = {
  menu_name: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 250,
    label: "Menu Name",
  },
  menu_url: { required: false, type: "string", maxLength: 1000, label: "Menu URL" },
  icon: { required: false, type: "string", maxLength: 200, label: "Icon" },
  is_main_item: { required: false, type: "boolean", label: "Is Main Item" },
  is_quick_menu: { required: false, type: "boolean", label: "Is Quick Menu" },
  parent_item_id: { required: false, type: "number", min: 1, label: "Parent Menu" },
  quick_menu_ctgry_id: { required: false, type: "number", min: 1, label: "Quick Menu Category" },
  menu_item_category: {
    required: true,
    type: "string",
    enum: ["mnu", "stp", "rpt"],
    label: "Menu Item Category",
  },
};

exports.getMenuItemListCtrl = async (req, res) => {
  try {
    const records = await settingsService.getMenuItemListSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get menu items", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get menu items controller");
  }
};

exports.getMenuParentItemsCtrl = async (req, res) => {
  try {
    const records = await settingsService.getMenuParentItemsSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [] },
      RESPONSE_STATUS.SUCCESS,
      { function: "get menu parent items", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get menu parent items controller");
  }
};

exports.getMenuCategoryOptionsCtrl = async (req, res) => {
  try {
    const records = await settingsService.getMenuCategoryListSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [] },
      RESPONSE_STATUS.SUCCESS,
      { function: "get menu category options", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get menu category options controller");
  }
};

exports.createMenuItemCtrl = async (req, res) => {
  try {
    const validation = await validutils.validatePayload(
      req.body,
      MENU_ITEM_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.createMenuItemSrvc(req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `Menu item '${result.menu_name}' ${result.reactivated ? "restored" : "added"} successfully.`,
      },
      { function: "create menu item" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "create menu item controller");
  }
};

exports.updateMenuItemCtrl = async (req, res) => {
  try {
    const menuItemId = parseRecordId(req);

    const validation = await validutils.validatePayload(
      req.body,
      MENU_ITEM_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.updateMenuItemSrvc(menuItemId, req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `Menu item '${result.menu_name}' updated successfully.`,
      },
      { function: "update menu item" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "update menu item controller");
  }
};

exports.deleteMenuItemCtrl = async (req, res) => {
  try {
    const menuItemId = parseRecordId(req);

    const result = await settingsService.deleteMenuItemSrvc(menuItemId);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.DELETED,
        message: `Menu item '${result.menu_name}' deleted successfully.`,
      },
      { function: "delete menu item" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete menu item controller");
  }
};

// ===================== QUICK MENU CATEGORIES =====================

const MENU_CATEGORY_PAYLOAD_SCHEMA = {
  ctgry_nm: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 100,
    label: "Category Name",
  },
  ctgry_cd: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 50,
    label: "Category Code",
  },
  description: { required: false, type: "string", maxLength: 300, label: "Description" },
  display_order: { required: false, type: "number", min: 0, label: "Display Order" },
  icon: { required: false, type: "string", maxLength: 100, label: "Icon" },
};

exports.getMenuCategoryListCtrl = async (req, res) => {
  try {
    const records = await settingsService.getMenuCategoryListSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get menu categories", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get menu categories controller");
  }
};

exports.createMenuCategoryCtrl = async (req, res) => {
  try {
    const validation = await validutils.validatePayload(
      req.body,
      MENU_CATEGORY_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.createMenuCategorySrvc(req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `Category '${result.ctgry_nm}' ${result.reactivated ? "restored" : "added"} successfully.`,
      },
      { function: "create menu category" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "create menu category controller");
  }
};

exports.updateMenuCategoryCtrl = async (req, res) => {
  try {
    const categoryId = parseRecordId(req);

    const validation = await validutils.validatePayload(
      req.body,
      MENU_CATEGORY_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.updateMenuCategorySrvc(categoryId, req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `Category '${result.ctgry_nm}' updated successfully.`,
      },
      { function: "update menu category" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "update menu category controller");
  }
};

exports.deleteMenuCategoryCtrl = async (req, res) => {
  try {
    const categoryId = parseRecordId(req);

    const result = await settingsService.deleteMenuCategorySrvc(categoryId);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.DELETED,
        message: `Category '${result.ctgry_nm}' deleted successfully.`,
      },
      { function: "delete menu category" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete menu category controller");
  }
};

// ===================== ROLE MENU MAPPING =====================

const ROLE_MENU_MAP_PAYLOAD_SCHEMA = {
  role_id: { required: true, type: "number", min: 1, label: "Role" },
  menu_item_id: { required: true, type: "number", min: 1, label: "Menu Item" },
  display_order: { required: false, type: "number", min: 0, label: "Display Order" },
};

exports.getRoleMenuMapListCtrl = async (req, res) => {
  try {
    const records = await settingsService.getRoleMenuMapListSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get role menu maps", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get role menu maps controller");
  }
};

exports.getRoleMenuMapRolesCtrl = async (req, res) => {
  try {
    const records = await settingsService.getPositionRolesSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [] },
      RESPONSE_STATUS.SUCCESS,
      { function: "get role menu map roles", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get role menu map roles controller");
  }
};

exports.getRoleMenuMapMenuItemsCtrl = async (req, res) => {
  try {
    const records = await settingsService.getRoleMenuMapMenuItemsSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [] },
      RESPONSE_STATUS.SUCCESS,
      { function: "get role menu map menu items", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get role menu map menu items controller");
  }
};

exports.createRoleMenuMapCtrl = async (req, res) => {
  try {
    const validation = await validutils.validatePayload(
      req.body,
      ROLE_MENU_MAP_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.createRoleMenuMapSrvc(req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `Mapping for '${result.menu_name}' ${result.reactivated ? "restored" : "added"} successfully.`,
      },
      { function: "create role menu map" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "create role menu map controller");
  }
};

exports.updateRoleMenuMapCtrl = async (req, res) => {
  try {
    const roleMenuId = parseRecordId(req);

    const validation = await validutils.validatePayload(
      req.body,
      ROLE_MENU_MAP_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.updateRoleMenuMapSrvc(roleMenuId, req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `Mapping for '${result.menu_name}' updated successfully.`,
      },
      { function: "update role menu map" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "update role menu map controller");
  }
};

exports.deleteRoleMenuMapCtrl = async (req, res) => {
  try {
    const roleMenuId = parseRecordId(req);

    const result = await settingsService.deleteRoleMenuMapSrvc(roleMenuId);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.DELETED,
        message: `Mapping for '${result.menu_name}' deleted successfully.`,
      },
      { function: "delete role menu map" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete role menu map controller");
  }
};

// ===================== USERS =====================

const USER_BASE_PAYLOAD_SCHEMA = {
  first_nm: { required: false, type: "string", maxLength: 200, label: "First Name" },
  last_nm: { required: false, type: "string", maxLength: 150, label: "Last Name" },
  email: { required: true, type: "email", label: "Email" },
  mobile_no: { required: false, type: "mobile-no", label: "Mobile Number" },
  role_id: { required: true, type: "number", min: 1, label: "Role" },
};

const USER_CREATE_PAYLOAD_SCHEMA = {
  ...USER_BASE_PAYLOAD_SCHEMA,
  password: { required: true, type: "password", label: "Password" },
};

exports.getUserListCtrl = async (req, res) => {
  try {
    const records = await settingsService.getUserListSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [], permissions: req.permissions },
      RESPONSE_STATUS.SUCCESS,
      { function: "get users", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get users controller");
  }
};

exports.getUserRolesCtrl = async (req, res) => {
  try {
    const records = await settingsService.getPositionRolesSrvc();

    return resutils.sendSuccessResponse(
      req,
      res,
      { records: records || [] },
      RESPONSE_STATUS.SUCCESS,
      { function: "get user roles", cacheType: CACHE_TYPES.NO_STORE },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "get user roles controller");
  }
};

exports.createUserCtrl = async (req, res) => {
  try {
    const validation = await validutils.validatePayload(
      req.body,
      USER_CREATE_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.createUserSrvc(req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.CREATED,
        message: `User '${result.user_nm}' ${result.reactivated ? "restored" : "added"} successfully.`,
      },
      { function: "create user" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "create user controller");
  }
};

exports.updateUserCtrl = async (req, res) => {
  try {
    const userId = parseRecordId(req);

    const validation = await validutils.validatePayload(
      req.body,
      USER_BASE_PAYLOAD_SCHEMA,
    );
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await settingsService.updateUserSrvc(userId, req.body);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.UPDATED,
        message: `User '${result.user_nm}' updated successfully.`,
      },
      { function: "update user" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "update user controller");
  }
};

exports.deleteUserCtrl = async (req, res) => {
  try {
    const userId = parseRecordId(req);

    const result = await settingsService.deleteUserSrvc(userId, req.user?.user_id);

    return resutils.sendSuccessResponse(
      req,
      res,
      result,
      {
        ...RESPONSE_STATUS.DELETED,
        message: `User '${result.user_nm}' deleted successfully.`,
      },
      { function: "delete user" },
    );
  } catch (error) {
    return sendSettingsError(req, res, error, "delete user controller");
  }
};
