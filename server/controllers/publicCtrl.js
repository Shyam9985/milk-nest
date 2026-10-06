const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const validutils = require("../utils/validate.utils");
const publicService = require("../services/publicService");
const { getClientIp, getUserAgent } = require("../utils/request.utils");
const { log } = require('../utils/log.utils');

// digits with the usual separators: '+91 99854 53023', '(040) 2345-6789'
const PHONE_RE = /^[+()\-\s\d]{7,16}$/;
const isValidPhone = (value) => PHONE_RE.test(value.trim()) && value.replace(/\D/g, "").length >= 7;

const ENQUIRY_PAYLOAD_SCHEMA = {
  full_name: { required: true, type: "string", minLength: 2, maxLength: 100, label: "Name" },
  phone: {
    required: true, type: "string", maxLength: 16, label: "Phone number",
    validator: (value) => ({ status: isValidPhone(value), message: "Please enter a valid phone number." }),
  },
  email: { required: true, type: "email", label: "Email address" },
  farm_name: { required: false, type: "string", maxLength: 150, label: "Farm / business name" },
  message: { required: true, type: "string", minLength: 10, maxLength: 2000, label: "Message" },
};

// maps known error names to standard error responses, mirroring the other controllers. one
// difference: these routes are open to anyone, so a database failure never sends its own text
// to the client - the real message is kept for the metrics log through res.locals.error
const sendPublicError = (req, res, error, fname) => {
  console.log("Error in " + fname + " : ", error);

  switch (error.name) {
    case "validationFailed":
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.VALIDATION_ERROR, { function: fname });

    case "duplicateRecord":
      return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.DUPLICATE_RECORD, { function: fname });

    case "DatabaseError":
      res.locals.error = error.message;
      return resutils.sendErrorResponse(req, res,
        "Unable to process request. Please try after some time.",
        RESPONSE_STATUS.DB_ERROR, { function: fname });

    default:
      res.locals.error = error?.message || String(error);
      return resutils.sendErrorResponse(req, res,
        "Unable to process request. Please try after some time.",
        RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: fname });
  }
};

// platform-wide totals shown on the public website
exports.getPublicStatsCtrl = async (req, res) => {
  log('in getPublicStatsCtrl');
  try {
    const result = await publicService.getPublicStatsSrvc();

    return resutils.sendSuccessResponse(req, res, result, RESPONSE_STATUS.SUCCESS,
      { function: "get public stats" });
  } catch (error) {
    return sendPublicError(req, res, error, "get public stats controller");
  }
};

// contact form submission from the public website
exports.createEnquiryCtrl = async (req, res) => {
  log('in createEnquiryCtrl');
  try {
    const validation = await validutils.validatePayload(req.body, ENQUIRY_PAYLOAD_SCHEMA);
    if (!validation?.validationStatus)
      resutils.createError("validationFailed", validation.errors[0]);

    const result = await publicService.createEnquirySrvc(req.body,
      { ip_address: getClientIp(req), user_agent: getUserAgent(req) });

    // no enquiry id in the response: it is a running number, and on an open endpoint that
    // would tell anyone how many enquiries have come in
    return resutils.sendSuccessResponse(req, res, null,
      { ...RESPONSE_STATUS.CREATED,
        message: `Thank you, ${result.full_name}. We have received your enquiry and will get in touch with you shortly.` },
      { function: "create enquiry" });
  } catch (error) {
    return sendPublicError(req, res, error, "create enquiry controller");
  }
};
