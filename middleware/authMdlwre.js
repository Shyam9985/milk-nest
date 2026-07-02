const jwt = require('jsonwebtoken');
const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const authMdl = require('../modules/models/authMdl');
const authCtrl = require('../modules/controllers/authctrl');

// authntication validation middleware
exports.isAuthenticated = async (req, res, next) => {
    let token = req.headers['access-token'];

    try {
        // retrieve the access token form the headers 
        if (!token || !token.startsWith('Bearer')) {
            throw Error('Please provide valid token to proceed.');
        }
        token = token.split(' ')[1];

        let decodedToken = null;

        try {
            // check if token expires 
            decodedToken = jwt.verify(token, process.env.JWT_SECRET, {});
        } catch (error) {
            if (error.name === 'TokenExpiredError') {

                const decoded = jwt.decode(token);
                console.log('decoded', decoded);
                const sessionId = decoded?.session_id;

                if (!sessionId) resutils.createError('invalidToken', 'Invalid credentials');

                // check if session is still alive or not 
                const isAlive = await authMdl.checkIfSessionAlive(sessionId);

                // expired throw error 
                if (!isAlive || !isAlive?.length || isAlive[0]?.destroyed_at != null) resutils.createError('sessionExpired', 'Session expred.');

                console.log('Session still alive but jwt token has expired.');
                // alive - regenereate token and sent it to the client
                const tokenPayload = {
                    user_id: isAlive[0]?.user_id,
                    user_nm: isAlive[0]?.user_nm,
                    first_nm: isAlive[0]?.first_nm,
                    last_nm: isAlive[0]?.last_nm,
                    mobile_no: isAlive[0]?.mobile_no,
                    email: isAlive[0]?.email,
                    last_login: isAlive[0]?.last_login,
                }
                const newToken = authCtrl.generateJWToken(tokenPayload);
                res.setHeaders('access-token', { session_id: sessionId, ...newToken })
            }
            else throw error;
        }

        // check user active
        const response = await authMdl.getUserDetails({ email: decodedToken?.user_nm });
        const user = response[0];
        // console.log(user);

        if (!user) resutils.createError('userNotFound', 'Logged in user is not found. Please contact admin.');
        if (user?.is_locked) resutils.createError('TemporarilyLocked', 'Logged in user is temporarily locked. Please try after ' + user.locked_until);


        // bind user data to the request 
        req.user = user;

        // deligate to the next middleware 
        next();

    } catch (error) {
        console.log('Error in auth middleware: ', error);
        switch (error.name) {
            case 'TokenExpiredError':
                resutils.sendErrorResponse(req, res, 'Access token expired. please login again.', RESPONSE_STATUS.TOKEN_EXPIRED, { function: 'is authenticated middleware' });
                break;

            case 'JsonWebTokenError':
                resutils.sendErrorResponse(req, res, 'Invalid access token.Please try to login again.', RESPONSE_STATUS.INVALID_TOKEN, { function: 'is authenticated middleware' });
                break;

            case 'TemporarilyLocked':
                resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.TEMPORARLY_LOCKED, { function: 'is authenticated middleware' });
                break;

            case 'userNotFound':
                resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.INVALID_CREDENTIALS, { function: 'is authenticated middleware' });
                break;

            case 'invalidToken':
                resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.SESSION_ERR, { function: 'is authenticated middleware' });
                break;

            case 'sessionExpired':
                resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.SESSION_EXPIRED, { function: 'is authenticated middleware' });
                break;

            default:
                resutils.sendErrorResponse(req, res, 'Please provide valid access token to proceed.', RESPONSE_STATUS.INVALID_TOKEN, { function: 'is authenticated middleware' });
                break;
        }
    }
}

// autorization validation middleware, takes 
exports.isAuthorized = (permission_key, action) => {
    const accepts = ['create', 'read', 'update', 'delete'];
    action = accepts.includes(action?.toLowerCase()) ? action.toLowerCase() : 'read';

    return async (req, res, next) => {
        const user = req.user;
        try {
            //check if user has respective permission or not 
            const permissionsRes = await authMdl.getRolePermissions(user?.role?.role_hndlr || 'super_admin', permission_key);
            console.log('permissionsRes', permissionsRes);
            const permissionList = permissionsRes?.[0];

            if (!permissionList) resutils.createError('noPermissions', 'You do not have permissions to perform this action.please contact your admin.');

            let errorMessage, errorName = null;
            let hasPermission = false;

            switch (action) {
                case 'create':
                    hasPermission = permissionList?.can_insert == 1;
                    errorMessage = 'You do not have permission to insert ' + permission_key + ' data'; errorName = 'noInsertPermission';
                    break;
                case 'read':
                    hasPermission = permissionList?.can_view == 1;
                    errorMessage = 'You do not have permission to view ' + permission_key + ' data'; errorName = 'noSelectPermission';
                    break;
                case 'update':
                    hasPermission = permissionList?.can_update == 1;
                    errorMessage = 'You do not have permission to update ' + permission_key + ' data'; errorName = 'noUpdatePermission';
                    break;
                case 'delete':
                    hasPermission = permissionList?.can_delete == 1;
                    errorMessage = 'You do not have permission to delete ' + permission_key + ' data'; errorName = 'noDeletePermission';
                    break;
                default: errorMessage = 'You do not have permission perform this action'; errorName = 'noPermissions'; break;
            }

            if (!hasPermission) resutils.createError(errorName, errorMessage);

            // deligate to the next middleware
            next();
        } catch (error) {
            console.log('error in authorization middleware:', error);

            let resStatus = RESPONSE_STATUS.UNABLE_TO_PROCESS;
            let message = error?.message || 'Unable to process request right now. pleasetry after some time';

            switch (error.name) {
                case 'noPermissions': resStatus = RESPONSE_STATUS.UNAUTHORIZED; break;
                case 'noInsertPermission': resStatus = RESPONSE_STATUS.NO_INSERT_PERMISSION; break;
                case 'noSelectPermission': resStatus = RESPONSE_STATUS.NO_SELECT_PERMISSION; break;
                case 'noUpdatePermission': resStatus = RESPONSE_STATUS.NO_UPDATE_PERMISSION; break;
                case 'noDeletePermission': resStatus = RESPONSE_STATUS.NO_DELETE_PERMISSION; break;
                default: resStatus = RESPONSE_STATUS.UNABLE_TO_PROCESS; break;
            }
            return resutils.sendErrorResponse(req, res, message, resStatus, { function: 'authorization middleware' })
        }
    }
}