const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const validutils = require("../utils/validate.utils");
const milkEligibilityService = require("../services/milkEligibilityService");
const { log } = require('../utils/log.utils');

/*
 * The two manual overrides on can_produce_milk.
 *
 * Everything else that takes an animal off the milking sheet is derived from a fact recorded
 * somewhere else - a dry-off on a pregnancy, a treatment, a sale. These two exist for the one
 * case no rule can see: she has simply stopped giving milk.
 */

// the note is not persisted on the cattle row - it is carried into the audit trail, which is
// where "who took her off the sheet and why" actually belongs
const MANUAL_BLOCK_SCHEMA = {
    remarks: { required: false, type: "string", maxLength: 500, label: "Remarks" },
};

const sendEligibilityError = (req, res, error, fname) => {
    console.log("Error in " + fname + " : ", error);

    switch (error.name) {
        case "validationFailed":
            return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.VALIDATION_ERROR, { function: fname });

        case "invalidRecordId":
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

const parseRecordId = (req) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
        resutils.createError("invalidRecordId", "Please provide a valid cattle id.");
    return id;
};

// the incharge marks an animal dry with no pregnancy behind it
exports.setManualMilkBlockCtrl = async (req, res) => {
    log('in setManualMilkBlockCtrl');
    try {
        const cattleId = parseRecordId(req);

        const validation = await validutils.validatePayload(req.body || {}, MANUAL_BLOCK_SCHEMA);
        if (!validation?.validationStatus)
            resutils.createError("validationFailed", validation.errors[0]);

        const result = await milkEligibilityService.setManualMilkBlockSrvc(cattleId, req.body || {}, req.user?.user_id);

        return resutils.sendSuccessResponse(req, res, result,
            {
                ...RESPONSE_STATUS.UPDATED,
                message: `${result.cattle_unique_code} marked as dry and removed from the milking sheet.`
            },
            { function: "set manual milk block" });
    } catch (error) {
        return sendEligibilityError(req, res, error, "set manual milk block controller");
    }
};

// she is back in milk, or the mark was a mistake
exports.clearManualMilkBlockCtrl = async (req, res) => {
    log('in clearManualMilkBlockCtrl');
    try {
        const cattleId = parseRecordId(req);
        const result = await milkEligibilityService.clearManualMilkBlockSrvc(cattleId, req.user?.user_id);

        return resutils.sendSuccessResponse(req, res, result,
            {
                ...RESPONSE_STATUS.UPDATED,
                message: result.can_produce_milk
                    ? `${result.cattle_unique_code} is back on the milking sheet.`
                    : `Manual mark removed, but ${result.cattle_unique_code} is still off the sheet for another reason.`
            },
            { function: "clear manual milk block" });
    } catch (error) {
        return sendEligibilityError(req, res, error, "clear manual milk block controller");
    }
};
