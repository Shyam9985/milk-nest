const authMdl = require('../models/authMdl');
const resutils = require('../../utilities/response.utils');
const validutils = require('../../utilities/validate.utils');
const RESPONSE_STATUS = require('../../utilities/standard.messages');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const emailutils = require('../../utilities/email.utils');

// handelr function to generate jwt token
function generateJWToken(user) {
    const token = jwt.sign(user, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: process.env.SESSION_EXPIRES });
    // console.log('Token : ', token);
    console.log(jwt.decode(token, { complete: true }));
    return token
}

//Sing up controller 
exports.signUp = async (req, res, next) => {
    const data = req.body;

    console.log(data)
    try {

        // check if user email, password, mobile, first name
        if (!validutils.isValidEmail(data?.email)) return resutils.sendErrorResponse(req, res, 'Please provide valid emaill.', RESPONSE_STATUS.REQUIRED_FIELDS_MISSING, { function: 'signup-controller' });
        if (!validutils.isStrongPassword(data?.password)) return resutils.sendErrorResponse(req, res, 'Please provide valid password.', RESPONSE_STATUS.REQUIRED_FIELDS_MISSING, { function: 'signup-controller' });
        if (!validutils.isValidMobile(data?.mobile)) return resutils.sendErrorResponse(req, res, 'Please provide valid mobile no.', RESPONSE_STATUS.REQUIRED_FIELDS_MISSING, { function: 'signup-controller' });
        if (!validutils.isValidPersonName(data?.fst_nm)) return resutils.sendErrorResponse(req, res, 'Please provide valid first name.', RESPONSE_STATUS.REQUIRED_FIELDS_MISSING, { function: 'signup-controller' });

        //encrypt password and get hash
        const saltKay = await bcrypt.genSalt(10);
        const pwdhsh = await bcrypt.hash(data.password, saltKay);
        const response = await authMdl.signUp({ ...data, passwordHash: pwdhsh, saltKey: saltKay }, {});
        console.log(response);

        if (response?.affectedRows) return resutils.sendSuccessResponse(req, res, { id: response?.insertId }, RESPONSE_STATUS.CREATED, { function: 'signup-controller' });
        else {
            let resmessage = response?.message;

            if (response.code == 1062) {
                resmessage = 'User already exists with the given email. please use different mail id'
            }

            return resutils.sendErrorResponse(req, res, resmessage, RESPONSE_STATUS.INVALID_DATA, { function: 'signup-controller' });
        }
    } catch (error) {
        console.log('Error occured at sign-up controller', error);
        return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'signup-controller' });
    }
}
// generateJWToken({ userid: 1, name: 'shyam vara prasad', password: 'shyam@9985' });

// login controller 
exports.logIn = async (req, res) => {
    // Validate request body
    const body = req.body;
    console.log('body:', body);

    if (!validutils.isValidEmail(body?.email)) {
        return resutils.sendErrorResponse(req, res, `Email is ${body?.email ? 'Not valid' : 'required'}. please check and try again`, RESPONSE_STATUS.INVALID_CREDENTIALS, { function: 'login-controller' });
    }
    if (!validutils.isRequired(body?.password)) {
        return resutils.sendErrorResponse(req, res, `Password is ${body?.password ? 'Not valid' : 'required'}. please check and try again`, RESPONSE_STATUS.INVALID_CREDENTIALS, { function: 'login-controller' });
    }

    try {
        const userData = await authMdl.getUserDetails(body);
        console.log('user data: ', userData);

        // check if user existis 
        if (userData?.code) throw Error('Unable to retrieve the data for ' + body.email);

        // chek if temporarly locked
        if (userData[0]?.is_locked) {
            return resutils.sendErrorResponse(req, res, `Your accunt is temporarly locked due to multiple failed attemps. please try after ${userData[0]?.locked_until}`, RESPONSE_STATUS.TEMPORARLY_LOCKED, { function: 'login-controller' })
        }

        // compare passwords
        const isPasswordMatched = await bcrypt.compare(body.password, userData[0].password_hash);

        if (isPasswordMatched) {
            // generatae jwt token
            const tokenPayload = {
                user_nm: userData[0]?.user_nm,
                first_nm: userData[0]?.first_nm,
                last_nm: userData[0]?.last_nm,
                mobile_no: userData[0]?.mobile_no,
                email: userData[0]?.email,
                last_login: userData[0]?.last_login,
            }

            // reset login attemts to 0
            authMdl.unlockUser(userData[0]);

            //generte jwt token
            const token = generateJWToken(tokenPayload);

            // Send response to the client 
            return resutils.sendSuccessResponse(req, res, { user: tokenPayload, token }, RESPONSE_STATUS.DATA_FOUND, { function: 'login-controller' });
        } else {
            // increase the login attempts
            authMdl.increaseLoginAttempts(userData[0]);

            // send response to the client
            return resutils.sendErrorResponse(req, res, 'Invalid email or password', RESPONSE_STATUS.INVALID_CREDENTIALS, { function: 'login-controller' });
        }

    } catch (error) {
        console.log('Error occured at sign-up controller', error);
        return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'login-controller' });
    }
}

exports.getAllusers = async (req, res) => {
    console.log('In getAllusers: ', req.user);

    return resutils.sendSuccessResponse(req, res, [], RESPONSE_STATUS.DATA_FOUND, {});
}

exports.forgotPassword = async (req, res) => {

}

exports.sendResetPasswordEmail = async (req, res) => {
    const user = req.user;

    const otp = parseInt(Math.random(9) * 1000000);

    let data = {
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

        if (mailRes?.[0]?.success) resutils.sendSuccessResponse(req, res,
            { email: mailRes?.[0]?.email, message_key: mailRes?.[0]?.messageKey, message_id: mailRes?.[0]?.messageId }, RESPONSE_STATUS.EMAIL_SENT, { function: 'sendEmail' });

        resutils.sendErrorResponse(req, res, 'Unable to send email right now. please try again.', RESPONSE_STATUS.UNABLE_TO_SEND_EMAIL, { function: 'sendEmail' });

    } catch (error) {
        if (error?.name == 'EmailError') return resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.UNABLE_TO_SEND_EMAIL, { function: 'sendEmail' });
        resutils.sendErrorResponse(req, res, error?.message, RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'sendEmail' });
    }
}

exports.verifyEmailOtp = async (req, res) => {

    const body = req.body;
    try {

        //validate input data
        if (!validutils.isRequired(body?.otp)) resutils.createError('noOTP', 'Please provide OTP to verify.');
        if (!validutils.isRequired(body?.message_key)) resutils.createError('noMessagekey', 'Please provide message key to verify.');

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
        let errorMessage, status = null;

        switch (error.name) {
            case 'otpExpired': errorMessage = error.message; status = RESPONSE_STATUS.INVALID_OTP; break;
            case 'otpMismatch': errorMessage = error.message; status = RESPONSE_STATUS.INVALID_OTP; break;
            case 'noOtpRes': errorMessage = error.message; status = RESPONSE_STATUS.INVALID_OTP; break;
            case 'noMessagekey': errorMessage = error.message; status = RESPONSE_STATUS.INVALID_DATA_FORMAT; break;
            case 'noOTP': errorMessage = error.message; status = RESPONSE_STATUS.INVALID_DATA_FORMAT; break;
            default: errorMessage = 'Unable to validate OTP please try after some time.'; status = RESPONSE_STATUS.UNABLE_TO_PROCESS; break;
        }
        return resutils.sendErrorResponse(req, res, errorMessage, status, { function: 'verify-email otp' });
    }
}