const authMdl = require('../models/authMdl');
const resutils = require('../../utilities/response.utils');
const validutils = require('../../utilities/validate.utils');
const RESPONSE_STATUS = require('../../utilities/standard.messages');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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