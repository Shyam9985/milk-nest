const RESPONSE_STATUS = require('./standard.messages');

const sendSuccessResponse = (req, res, data = null, status = RESPONSE_STATUS.SUCCESS, meta = {}) => {

    return res.status(status.code).json({
        success: true, code: status.code, message: status.message, data
    });
};

const sendErrorResponse = (req, res, error = null, status = RESPONSE_STATUS.INTERNAL_SERVER_ERROR, meta = {}) => {

    return res.status(status.code).json({ success: false, code: status.code, message: status.message, error });
};

module.exports = { sendSuccessResponse, sendErrorResponse };