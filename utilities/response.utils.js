const RESPONSE_STATUS = require('./standard.messages');

// success response function
const sendSuccessResponse = (req, res, data = null, status = RESPONSE_STATUS.SUCCESS, meta = {}) => {

    return res.status(status.code).json({
        success: true, code: status.code, message: status.message, data
    });
};

// error respponse function
const sendErrorResponse = (req, res, error = null, status = RESPONSE_STATUS.INTERNAL_SERVER_ERROR, meta = {}) => {

    return res.status(status.code).json({ success: false, code: status.code, message: status.message, error });
};

// progress response
const sendProgressResponse = (req, res, progress = 0, completed = false, data = null, status = RESPONSE_STATUS.OK) => {

    const payload = { success: true, code: status.code, message: status.message, progress, completed };
    if (data) payload.data = data;
    res.write(JSON.stringify(payload) + '\n');
    if (completed) res.end();
};

module.exports = { sendSuccessResponse, sendErrorResponse, sendProgressResponse };