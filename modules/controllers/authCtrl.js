const authMdl = require('../models/authMdl');
const resutils = require('../../utilities/response.utils');
const RESPONSE_STATUS = require('../../utilities/standard.messages');

exports.signUp = async (req, res, next) => {
    const data = req.body;

    try {
        const response = await authMdl.signUp(data, {});
        console.log(response);
        if (data?.affectedRows) return resutils.sendSuccessResponse(req, res, { id: response?.insertId }, RESPONSE_STATUS.CREATED, 'sign-up');
        else return resutils.sendSuccessResponse(req, res, response, RESPONSE_STATUS.DUPLICATE_RECORD, 'sign-up');
    } catch (error) {
        console.log('Error occured at sign-up controller', error);

        return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.UNABLE_TO_PROCESS, { message: 'Unable to process request' })
    }
}