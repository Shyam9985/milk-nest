const jwt = require('jsonwebtoken');
const resutils = require("../utilities/response.utils");
const RESPONSE_STATUS = require("../utilities/standard.messages");
const { getUserDetails } = require('../modules/models/authMdl');


exports.isAuthenticated = async (req, res, next) => {
    try {
        // retrieve the access token form the headers 
        let token = req.headers['access-token'];
        if (!token || !token.startsWith('Bearer')) {
            throw Error('Please provide valid token to proceed.');
        }
        token = token.split(' ')[1];

        // check if token expires 
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET, {
            complet: true
        });

        // check user active
        const response = await getUserDetails({ userName: decodedToken.user_nm });
        const user = response[0];
        console.log(user);

        if (!user) {
            const error = new Error('Logged in user is not found. Please contact admin.');
            error.name = 'userNotFound';
            throw error;
        }

        if (user?.is_locked) {
            const error = new Error('Logged in user is temporarily locked. Please try after ' + user.locked_until);
            error.name = 'TemporarilyLocked';
            throw error;
        }

        // bind user data to the request 
        req.user = user;

        // deligate to the next middleware 
        next();

    } catch (error) {
        console.log('Error in auth middleware: ', error);
        switch (error.name) {
            case 'TokenExpiredError':
                console.log('Token expired');
                resutils.sendErrorResponse(req, res, 'Access token expired. please login again.', RESPONSE_STATUS.TOKEN_EXPIRED, { function: 'is authenticated middleware' });
                break;

            case 'JsonWebTokenError':
                console.log('Invalid token');
                resutils.sendErrorResponse(req, res, 'Invalid access token.Please try to login again.', RESPONSE_STATUS.INVALID_TOKEN, { function: 'is authenticated middleware' });
                break;

            case 'TemporarilyLocked':
                console.log('Invalid token');
                resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.TEMPORARLY_LOCKED, { function: 'is authenticated middleware' });
                break;

            case 'userNotFound':
                console.log('Invalid token');
                resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.INVALID_CREDENTIALS, { function: 'is authenticated middleware' });
                break;

            default:
                console.log('Token not active yet');
                resutils.sendErrorResponse(req, res, 'Please provide valid access token to proceed.', RESPONSE_STATUS.INVALID_TOKEN, { function: 'is authenticated middleware' });
                break;
        }
    }
}

