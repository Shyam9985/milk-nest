const resutils = require('../utils/response.utils');
const validutils = require('../utils/validate.utils');
const RESPONSE_STATUS = require('../utils/standard.messages');
const authService = require('../services/authService');
const UAParser = require('ua-parser-js');

// extracts ip and device details from the request
const getRequestContext = (req) => {
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || req._remoteAddress || null;

    const parser = new UAParser(req.headers['user-agent']);
    const result = parser.getResult();
    const deviceInfo = [result?.ua, result.browser.name, result.browser.version, result.os.name].filter(Boolean).join(' | ');

    return { ipAddress, deviceInfo };
}

// destroys the express session bound to the request
const destroySession = (req) => {
    return new Promise((resolve, reject) => {
        req.session.destroy((err) => {
            if (err) {
                return reject(err);
            }
            resolve(true);
        });
    });
};

//Sing up controller
exports.signUp = async (req, res) => {
    const body = req.body;

    try {

        // validate payload
        const validation = await validutils.validatePayload(body,
            {
                email: { required: true, type: 'email', label: 'Email' },
                password: { required: true, type: 'password', label: 'Password' },
                mobile: { required: true, type: 'mobile-no', label: 'Mobile Number' },
                fst_nm: { required: true, type: 'alpha', minLength: 2, maxLength: 100, label: 'First Name' }
            });

        if (!validation?.validationStatus) resutils.createError('validationFailed', validation.errors[0]);

        const result = await authService.signUpSrvc(body);

        return resutils.sendSuccessResponse(req, res, { id: result.user_id }, RESPONSE_STATUS.CREATED, { function: 'signup-controller' });

    } catch (error) {
        console.log('Error occured at sign-up controller', error);

        switch (error.name) {
            case 'validationFailed':
            case 'noDataInserted':
                return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.INVALID_DATA, { function: 'signup-controller' });

            case 'duplicateUser':
                return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.DUPLICATE_RECORD, { function: 'signup-controller' });

            default:
                return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'signup-controller' });
        }
    }
}

// login controller
exports.logIn = async (req, res) => {
    const body = req.body;

    try {

        // validate payload
        const validation = await validutils.validatePayload(body,
            {
                email: { required: true, type: 'email', label: 'Email' },
                password: { required: true, type: 'password', label: 'Password' }
            });

        if (!validation?.validationStatus) resutils.createError('validationFailed', validation.errors[0]);

        const context = getRequestContext(req);

        // authenticate the user against the business rules
        const userRow = await authService.authenticateUserSrvc(body, context);

        // bind the user to the express session
        const sessionId = req.sessionID;
        req.session.user_id = userRow.user_id;

        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if (err) reject(err);
                else resolve();
            });
        });

        const maxAge = req.session.cookie?.originalMaxAge || 30 * 60 * 1000;
        const expiresAt = req.session.cookie?._expires || new Date(Date.now() + maxAge);

        // create session records and generate the jwt
        const sessionRes = await authService.establishSessionSrvc(userRow, sessionId, expiresAt, context);

        res.setHeader('access-token', sessionRes.token);
        return resutils.sendSuccessResponse(req, res, { user: sessionRes.user }, RESPONSE_STATUS.DATA_FOUND, { function: 'login-controller' });

    } catch (error) {
        console.log('Error occured at login controller', error);

        let loginError = null;
        switch (error.name) {
            case 'validationFailed': loginError = RESPONSE_STATUS.INVALID_DATA; break;
            case 'invalidCredentials': loginError = RESPONSE_STATUS.INVALID_CREDENTIALS; break;
            case 'temporarlyLocked': loginError = RESPONSE_STATUS.TEMPORARLY_LOCKED; break;
            case 'sessionError': loginError = RESPONSE_STATUS.INTERNAL_SERVER_ERROR; break;
            default: loginError = RESPONSE_STATUS.UNABLE_TO_PROCESS; break;
        }

        return resutils.sendErrorResponse(req, res, error?.message, loginError, { function: 'login-controller' });
    }
}

exports.logOut = async (req, res) => {
    try {

        // get session
        const sessionId = req.sessionID;

        if (!sessionId) resutils.createError('noSessionId', 'No session token available');

        try {
            // destroy session
            await destroySession(req);

            // expire session in the database
            await authService.logoutSrvc(sessionId);

            return resutils.sendSuccessResponse(req, res, [{ message: 'Logged out successfully.' }], RESPONSE_STATUS.SUCCESS, { function: 'log out' });
        } catch (error) {
            resutils.createError('destroyError', 'Unable to destroy the session');
        }
    } catch (error) {

        let errorName = null;
        switch (error.name) {
            case 'noSessionId': errorName = RESPONSE_STATUS.INVALID_TOKEN; break;
            case 'destroyError': errorName = RESPONSE_STATUS.INTERNAL_SERVER_ERROR; break;
            default: errorName = RESPONSE_STATUS.UNABLE_TO_PROCESS; break;
        }
        resutils.sendErrorResponse(req, res, error?.message, errorName, { function: 'log out' });
    }
}

exports.getAllusers = async (req, res) => {
    req.session.user = req.query?.id || '987';
    return resutils.sendSuccessResponse(req, res, [], RESPONSE_STATUS.DATA_FOUND, {});
}

exports.forgotPassword = async (req, res) => {
    const body = req.body;

    try {
        // verify req body
        if (!validutils.isValidEmail(body?.email)) resutils.createError('noEmail', 'Please provide email to proceed.');

        const result = await authService.sendForgotPasswordOtpSrvc(body.email, body?.full_name, req.user);

        return resutils.sendSuccessResponse(req, res, result, RESPONSE_STATUS.EMAIL_SENT, { function: 'forgotEmail' });

    } catch (error) {

        switch (error.name) {
            case 'noEmail':
                return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.INVALID_DATA_FORMAT, { function: 'forgot password' });

            case 'emailNotSent':
            case 'EmailError':
                return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.UNABLE_TO_SEND_EMAIL, { function: 'forgot password' });

            default:
                return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'forgot password' });
        }
    }
}

exports.updatePassword = async (req, res) => {
    const body = req.body;

    try {
        // validate req body
        const validation = await validutils.validatePayload(body, {
            email: { required: true, type: 'email', label: 'Email' },
            newPassword: { required: true, type: 'password', label: 'Password' },
            usedFor: { required: false, type: 'string', label: 'used for' },
            otpKey: { required: true, type: 'number', label: 'OTP validation key' }
        })

        if (!validation?.validationStatus) resutils.createError('validationFailed', validation.errors[0]);

        await authService.updatePasswordSrvc(body);

        return resutils.sendSuccessResponse(req, res, [{ message: 'Password updated successfully.' }], RESPONSE_STATUS.PASSWORD_UPDATED, { function: 'update password' });

    } catch (error) {

        let status = null;
        switch (error.name) {
            case 'invalidOtp':
            case 'otpExpired':
            case 'otpNotVerified':
                status = RESPONSE_STATUS.INVALID_OTP; break;

            case 'validationFailed': status = RESPONSE_STATUS.VALIDATION_ERROR; break;
            default: status = RESPONSE_STATUS.UNABLE_TO_PROCESS; break;
        }
        return resutils.sendErrorResponse(req, res, error.message, status, { function: 'update password' });
    }
}

exports.sendResetPasswordEmail = async (req, res) => {
    try {
        const user = req.user;

        // verify the logged in user has a valid email
        if (!validutils.isValidEmail(user?.email)) resutils.createError('noValidEmail', 'Please provide valid email to proceed.');

        const result = await authService.sendResetPasswordOtpSrvc(user);

        return resutils.sendSuccessResponse(req, res, result, RESPONSE_STATUS.EMAIL_SENT, { function: 'reset password' });

    } catch (error) {

        switch (error.name) {
            case 'noValidEmail':
                return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.INVALID_DATA_FORMAT, { function: 'reset password' });

            case 'emailNotSent':
            case 'EmailError':
                return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.UNABLE_TO_SEND_EMAIL, { function: 'reset password' });

            default:
                return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'reset password' });
        }
    }
}

exports.verifyEmailOtp = async (req, res) => {
    const body = req.body;

    try {

        // validate req body
        const validation = await validutils.validatePayload(body, {
            email: { required: true, type: 'email', label: 'Email' },
            otp: { required: true, type: 'number', label: 'OTP' },
            message_key: { required: true, type: 'number', label: 'OTP validation key' }
        });

        if (!validation?.validationStatus) resutils.createError('validationFailed', validation.errors[0]);

        const result = await authService.verifyEmailOtpSrvc(body, req.user);

        return resutils.sendSuccessResponse(req, res, [{ ...result, message: 'OTP verified successfully.' }], RESPONSE_STATUS.VALID_OTP, { function: 'verify-email otp' });

    } catch (error) {
        console.log(error);

        let status = null;
        switch (error.name) {
            case 'otpExpired':
            case 'otpMismatch':
            case 'noOtpRes':
                status = RESPONSE_STATUS.INVALID_OTP; break;

            case 'validationFailed': status = RESPONSE_STATUS.VALIDATION_ERROR; break;
            default: status = RESPONSE_STATUS.UNABLE_TO_PROCESS; break;
        }
        return resutils.sendErrorResponse(req, res, error.message, status, { function: 'verify-email otp' });
    }
}
