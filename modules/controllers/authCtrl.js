const authMdl = require('../models/authMdl');
const resutils = require('../../utils/response.utils');
const validutils = require('../../utils/validate.utils');
const RESPONSE_STATUS = require('../../utils/standard.messages');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const emailutils = require('../../utils/email.utils');
const UAParser = require('ua-parser-js');
const dateFns = require('date-fns');

// handelr function to generate jwt token
exports.generateJWToken = async (user, session_id) => {

    const obj = {
        user_id: user?.user_id,
        user_nm: user?.user_nm,
        first_nm: user?.first_nm,
        last_nm: user?.last_nm,
        mobile_no: user?.mobile_no,
        email: user?.email,
        last_login: user?.last_login,
        role: {
            role_id: user?.role_id, role_nm: user?.role_nm, role_hndlr: user?.role_hndlr,
        },
        hierarchy: {
            hierarchy_id: user?.hierarchy_id,
            position_id: user?.position_id, position_nm: user?.position_nm,
            hierarchy_nm: user?.hierarchy_nm, parent_hirrarchy_id: user?.parent_hirrarchy_id
        }
    }
    const token = jwt.sign(obj, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: process.env.SESSION_EXPIRES });
    // console.log('Token : ', token);
    // console.log(jwt.decode(token, { complete: true }));
    return token
}

const destroySession = (req) => {
    // console.log("req.session", req.session);

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
exports.signUp = async (req, res, next) => {
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

        //encrypt password and get hash
        const saltKay = await bcrypt.genSalt(10);
        const pwdhsh = await bcrypt.hash(data.password, saltKay);
        const response = await authMdl.signUp({ ...data, passwordHash: pwdhsh, saltKey: saltKay }, {});

        if (response.code == 1062) resutils.createError('validationFailed', 'User already exists with the given email. please use different mail id');

        if (!response?.affectedRows) resutils.createError('noDatanserted', 'Unable to create user. please try again');

        return resutils.sendSuccessResponse(req, res, { id: response?.insertId }, RESPONSE_STATUS.CREATED, { function: 'signup-controller' });

    } catch (error) {
        console.log('Error occured at sign-up controller', error);
        if (error.name === 'validationFailed') return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.INVALID_DATA, { function: 'signup-controller' });
        if (error.name === 'noDatanserted') return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.INVALID_DATA, { function: 'signup-controller' });
        return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'signup-controller' });
    }
}

// login controller 
exports.logIn = async (req, res) => {
    // Validate request body
    const body = req.body;

    try {

        // validate payload
        const validation = await validutils.validatePayload(body,
            {
                email: { required: true, type: 'email', label: 'Email' },
                password: { required: true, type: 'password', label: 'Password' }
            });

        if (!validation?.validationStatus) resutils.createError('validationFailed', validation.errors[0]);

        const userData = await authMdl.getUserDetails(body);

        // check if user existis 
        if (userData?.code || !userData?.length) resutils.createError('noDataFound', 'Invalid email/password.');

        const userObj = {
            user_id: userData?.[0]?.user_id,
            user_nm: userData?.[0]?.user_nm,
            first_nm: userData?.[0]?.first_nm,
            last_nm: userData?.[0]?.last_nm,
            mobile_no: userData?.[0]?.mobile_no,
            email: userData?.[0]?.email,
            last_login: userData?.[0]?.last_login,
            role: {
                role_id: userData?.[0]?.role_id, role_nm: userData?.[0]?.role_nm, role_hndlr: userData?.[0]?.role_hndlr,
            },
            hierarchy: {
                hierarchy_id: userData?.[0]?.hierarchy_id,
                position_id: userData?.[0]?.position_id, position_nm: userData?.[0]?.position_nm,
                hierarchy_nm: userData?.[0]?.hierarchy_nm, parent_hirrarchy_id: userData?.[0]?.parent_hirrarchy_id
            }
        };

        // chek if temporarly locked
        if (userData?.[0]?.is_locked) {
            resutils.createError('temporarlyLocked', `Your accunt is temporarly locked due to multiple failed attemps. please try after ${userData[0]?.locked_until}`);
        }

        // compare passwords
        const isPasswordMatched = await bcrypt.compare(body.password, userData?.[0]?.password_hash);

        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || req._remoteAddress || null;
        const parser = new UAParser(req.headers['user-agent']);
        const result = parser.getResult();

        const deviceInfo = [result?.ua, result.browser.name, result.browser.version, result.os.name].filter(Boolean).join(' | ');

        if (isPasswordMatched) {
            const sessionId = req.sessionID;

            // modify the session-id 
            req.session.user_id = userObj.user_id;

            await new Promise((resolve, reject) => {
                req.session.save(err => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            const maxAge = req.session.cookie?.originalMaxAge || 30 * 60 * 1000;
            const expiresAt = req.session.cookie?._expires || new Date(Date.now() + maxAge);
            // console.log('cookie expiresAt:', dateFns.format(expiresAt, 'dd-MM-yyyy HH:mm'));

            //generte jwt token
            const token = await this.generateJWToken(userData[0], sessionId);

            // store session details in database 
            const sessionHistory = await authMdl.insertSessionHistory({ session_id: sessionId, user_id: userObj?.user_id, expires_at: expiresAt });

            if (!sessionHistory?.affectedRows) resutils.createError('sessionError', 'unable to create/store session');

            // reset login attemts to 0
            await authMdl.unlockUser(userObj?.email);

            // store login history 
            const loginHistory = await authMdl.insertLoginHistory({ user_id: userObj?.user_id, ip_address: ipAddress, device_info: deviceInfo, remarks: 'logged in successfully.' });

            // update last login time 
            await authMdl.updateLastLoginTime(userObj?.email);
            // Send response to the client 
            res.setHeader('access-token', token);
            return resutils.sendSuccessResponse(req, res, { user: { ...userObj, landing_url: userData?.[0]?.landing_url }, token }, RESPONSE_STATUS.DATA_FOUND, { function: 'login-controller' });
        } else {
            // increase the login attempts
            await authMdl.increaseLoginAttempts(userObj?.email);

            // store login history 
            const loginHistory = await authMdl.insertLoginHistory({ user_id: userObj?.user_id, ip_address: ipAddress, device_info: deviceInfo, remarks: 'invalid credentials.' });

            // send response to the client
            return resutils.sendErrorResponse(req, res, 'Invalid email or password', RESPONSE_STATUS.INVALID_CREDENTIALS, { function: 'login-controller' });
        }

    } catch (error) {
        console.log('Error occured at sign-up controller', error);
        let loginError = null;
        switch (error.name) {
            case 'validationFailed': loginError = RESPONSE_STATUS.INVALID_DATA; break;
            case 'noDataFound': loginError = RESPONSE_STATUS.INVALID_CREDENTIALS; break;
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
        const session = req.sessionID;

        if (!session) resutils.createError('noSessionId', 'No session token available');
        try {
            // destroy session 
            await destroySession(req);

            // expire session in the database 
            const expRes = await authMdl.expireExpressSession(session);

            // if (!expRes?.affectedRows) resutils.createError('destroyError', 'Unable to destroy express session');

            resutils.sendSuccessResponse(req, res, [{ message: 'Loggged out successfully.' }], RESPONSE_STATUS.SUCCESS, { function: 'log out' });
        } catch (error) {
            // console.log(error);

            resutils.createError('destroyError', 'Unable to desctroy the session');
        }
    } catch (error) {
        // console.log(error);

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
        const otp = emailutils.get6DigitOtp();
        const data = {
            reason: 'forgot-password',
            email: body.email,
            key: otp,
            subject: 'Forgot Password OTP - MilkNest',
            body: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2c3e50;">Password update Request</h2>

                    <p>Hello ${body?.full_name || 'User'},</p>
                    <p>We received a request to update your MilkNest account password.</p>
                    <p>Your One-Time Password (OTP) is:</p>
                    <div style="
                        display: inline-block;
                        padding: 12px 24px;
                        font-size: 24px;
                        font-weight: bold;
                        letter-spacing: 4px;
                        color: #ffffff;
                        background-color: #007bff;
                        border-radius: 6px;
                        margin: 10px 0;
                    ">
                        ${otp}
                    </div>

                    <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
                    <p>If you did not request a password update, please ignore this email. No changes will be made to your account.</p>
                    <br>
                    <p>
                        Regards,<br>
                        <strong>Team MilkNest</strong>
                    </p>

                    <hr>

                    <small style="color: #777;">This is an automated email. Please do not reply to this message.</small>
                </div>`
        };
        // send email
        const mailRes = await emailutils.sendEmail([body.email], data, req.user);

        if (mailRes?.[0]?.success) return resutils.sendSuccessResponse(req, res,
            { email: mailRes?.[0]?.email, message_key: mailRes?.[0]?.messageKey, message_id: mailRes?.[0]?.messageId }, RESPONSE_STATUS.EMAIL_SENT, { function: 'forgotEmail' });

        resutils.sendErrorResponse(req, res, 'Unable to send email right now. please try again.', RESPONSE_STATUS.UNABLE_TO_SEND_EMAIL, { function: 'forgotEmail' });
    } catch (error) {
        // console.log(error);

        let errorName = null;
        switch (error.name) {
            case 'noEmail': errorName = RESPONSE_STATUS.INVALID_DATA_FORMAT; break;
            default: errorName = RESPONSE_STATUS.UNABLE_TO_PROCESS; break;
        }
        resutils.sendErrorResponse(req, res, error?.message, errorName, { function: 'forgot password' });
    }

}

exports.updatePassword = async (req, res) => {

    const body = req.body;
    try {
        // validate req body
        const validation = await validutils.validatePayload(body, {
            email: { required: true, type: 'email', label: 'Email' },
            newPassword: { required: true, type: 'password', label: 'Password' },
            otpKey: { required: true, type: 'number', label: 'OTP validation key' }
        })

        if (!validation?.validationStatus) resutils.createError('validationFailed', validation.errors[0]);

        // validate otp 
        const forgotMailRes = await authMdl.getLatestMailByRequest(body, 'forgot-password');
        const response = forgotMailRes?.[0];

        if (!response || (response.email_audit_id != body.otpKey)) {
            resutils.createError('invalidOtp', 'Invalid password reqest')
        }

        if (response?.is_expired) {
            resutils.createError('otpExpired', 'OTP expired. please try again.');
        }
        if (!response?.is_used) {
            resutils.createError('otpNotVerified', 'OTP not verifed. please verify and try again.');
        }

        //encrypt password and get hash
        const saltKay = await bcrypt.genSalt(10);
        const pwdhsh = await bcrypt.hash(body.newPassword, saltKay);

        // update password
        const updteres = await authMdl.updateUserPassword(body.email, pwdhsh, saltKay, body?.newPassword);
        // console.log(updteres);


        // expire otp 
        authMdl.expireOtp(body.otpKey);

        if (updteres.affectedRows) return resutils.sendSuccessResponse(req, res, [{ message: 'Password updated successfully.' }], RESPONSE_STATUS.PASSWORD_UPDATED);
        resutils.sendErrorResponse(req, res, 'Unable to update password', RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'update respnse' })

    } catch (error) {
        // console.log(error);

        let status = null;
        switch (error.name) {
            case 'noEmail': status = RESPONSE_STATUS.INVALID_OTP; break;
            case 'noPassword': status = RESPONSE_STATUS.INVALID_OTP; break;
            case 'noOtpkey': status = RESPONSE_STATUS.INVALID_OTP; break;
            case 'invalidOtp': status = RESPONSE_STATUS.INVALID_OTP; break;
            case 'otpExpired': status = RESPONSE_STATUS.INVALID_OTP; break;
            case 'otpNotVerified': status = RESPONSE_STATUS.INVALID_OTP; break;
            case 'validationFailed': status = RESPONSE_STATUS.VALIDATION_ERROR; break;
            default: 'Unable to validate OTP please try after some time.'; status = RESPONSE_STATUS.UNABLE_TO_PROCESS; break;
        }
        return resutils.sendErrorResponse(req, res, error.message, status, { function: 'verify-email otp' });
    }

}

exports.sendResetPasswordEmail = async (req, res) => {
    const user = req.user;

    const otp = emailutils.get6DigitOtp();

    let data = {
        reason: 'reset-password',
        email: user.email,
        key: otp,
        subject: 'Password Reset OTP - MilkNest',
        body: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2c3e50;">Password Reset Request</h2>

            <p>Hello ${user?.full_name || 'User'},</p>
            <p>We received a request to reset your MilkNest account password.</p>
            <p>Your One-Time Password (OTP) is:</p>
            <div style="
                display: inline-block;
                padding: 12px 24px;
                font-size: 24px;
                font-weight: bold;
                letter-spacing: 4px;
                color: #ffffff;
                background-color: #007bff;
                border-radius: 6px;
                margin: 10px 0;
            ">
                ${otp}
            </div>

            <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
            <p>If you did not request a password reset, please ignore this email. No changes will be made to your account.</p>
            <br>
            <p>
                Regards,<br>
                <strong>Team MilkNest</strong>
            </p>

            <hr>

            <small style="color: #777;">This is an automated email. Please do not reply to this message.</small>
        </div>
    `
    };

    try {
        let errorMessage = null;
        let errorName = null;

        // verify if user has email
        if (!validutils.isRequired(data?.email)) { errorMessage = 'Please provide email to proceed.'; errorName = 'noEmail'; }

        //verify user has valid email
        if (!validutils.isValidEmail(data.email)) { errorMessage = 'Please provide valid email to proceed.'; errorName = 'noValidEmail'; }


        // send email 
        const mailRes = await emailutils.sendEmail([data.email], data, user);

        if (mailRes?.[0]?.success) return resutils.sendSuccessResponse(req, res,
            { email: mailRes?.[0]?.email, message_key: mailRes?.[0]?.messageKey, message_id: mailRes?.[0]?.messageId }, RESPONSE_STATUS.EMAIL_SENT, { function: 'reset password' });

        resutils.sendErrorResponse(req, res, 'Unable to send email right now. please try again.', RESPONSE_STATUS.UNABLE_TO_SEND_EMAIL, { function: 'reset password' });

    } catch (error) {
        if (error?.name == 'EmailError') return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.UNABLE_TO_SEND_EMAIL, { function: 'reset password' });
        resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'reset password' });
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

        const otpRes = await authMdl.getOTPData(body, req.user);

        if (!otpRes || !otpRes?.length) resutils.createError('noOtpRes', 'OTP request not found.');

        const otpData = otpRes[0];

        // check if otp matches 
        if (String(otpData.verify_key) !== String(body.otp)) resutils.createError('otpMismatch', 'Invalid OTP entered');

        // check if otp expires
        if (otpData.is_expired == 1) resutils.createError('otpExpired', 'OTP has expired. Please generate new otp.');

        // mark otp asused 
        await authMdl.markOTPVerified(body.message_key, req.user);

        // send response to the client
        return resutils.sendSuccessResponse(req, res, [{ verified: true, message: 'OTP verified successfully.' }], RESPONSE_STATUS.VALID_OTP, { function: 'verify-email otp' })

    } catch (error) {
        console.log(error);

        let status = null;
        switch (error.name) {
            case 'otpExpired': status = RESPONSE_STATUS.INVALID_OTP; break;
            case 'validationFailed': status = RESPONSE_STATUS.VALIDATION_ERROR; break;
            case 'otpMismatch': status = RESPONSE_STATUS.INVALID_OTP; break;
            case 'noOtpRes': status = RESPONSE_STATUS.INVALID_OTP; break;
            case 'noMessagekey': status = RESPONSE_STATUS.INVALID_DATA_FORMAT; break;
            case 'noOTP': status = RESPONSE_STATUS.INVALID_DATA_FORMAT; break;
            default: 'Unable to validate OTP please try after some time.'; status = RESPONSE_STATUS.UNABLE_TO_PROCESS; break;
        }
        return resutils.sendErrorResponse(req, res, error.message, status, { function: 'verify-email otp' });
    }
}