const jwt = require('jsonwebtoken');
const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const authMdl = require('../modules/models/authMdl');
const authCtrl = require('../modules/controllers/authctrl');

// authntication validation middleware
exports.isAuthenticated = async (req, res, next) => {
    let token = req.headers['access-token'];
    let user = null
    console.log(token);

    try {
        // retrieve the access token form the headers 
        if (!token || !token.startsWith('Bearer')) {
            resutils.createError('unauthorizedToken', 'Please provide valid token.');
        }
        token = token.split(' ')[1];

        let decodedToken = null;

        try {
            // check if token expires 
            decodedToken = jwt.verify(token, process.env.JWT_SECRET, {});
            user = decodedToken;
            console.log('JWT Token is still alive...', token);

        } catch (error) {
            if (error.name === 'TokenExpiredError') {

                const decoded = jwt.decode(token);
                console.log('Token expired checking session...', decoded);
                const sessionId = decoded?.session_id;

                if (!sessionId) resutils.createError('invalidToken', 'Invalid credentials');

                // check if session is still alive or not 
                const isAlive = await authMdl.checkIfSessionAlive(sessionId);

                // expired throw error 
                if (!isAlive || !isAlive?.length || isAlive?.[0]?.destroyed_at != null) resutils.createError('sessionExpired', 'Session expred.');

                if (isAlive && isAlive?.[0]?.is_expired) resutils.createError('sessionExpired', 'Session expred.');

                if (isAlive?.[0]?.is_locked) resutils.createError('TemporarilyLocked', 'Logged in user is temporarily locked. Please try after ' + isAlive?.[0]?.locked_until);

                console.log('Session still alive but jwt token has expired.');

                const userData = await authMdl.getUserDetails({ email: decoded?.email });

                // alive - regenereate token and sent it to the client

                // fetch user data 
                if (!userData?.length) resutils.createError('userNotFound', 'User details not found.');

                const userObj = userData?.[0];

                const newToken = authCtrl.generateJWToken(userObj, sessionId);

                // update the express session time 
                const updated = await authMdl.slideExpressSession(sessionId);
                console.log('session successfully slided', updated);

                decodedToken = tokenPayload;
                user = tokenPayload;
                res.setHeader('new-access-token', newToken);
            }
            else throw error;
        }

        // bind user data to the request 
        req.user = user;

        // deligate to the next middleware 
        next();

    } catch (error) {
        // console.log('Error in auth middleware: ', error);
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

            case 'unauthorizedToken':
                resutils.sendErrorResponse(req, res, 'Please provide valid access token to proceed.', RESPONSE_STATUS.INVALID_TOKEN, { function: 'is authenticated middleware' });
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
            // console.log('permissionsRes', permissionsRes);
            const permissionList = permissionsRes?.[0];

            if (!permissionList) {
                resutils.createError('noPermissions', `No permission settings are available for '${permission_key}'. Please contact your administrator.`);
            }

            let errorMessage, errorName = null;
            let hasPermission = false;

            switch (action) {
                case 'create':
                    hasPermission = permissionList?.can_insert == 1;
                    errorName = 'noInsertPermission';
                    errorMessage = `You don't have permission to create ${permission_key} records. Please contact your administrator.`;
                    break;

                case 'read':
                    hasPermission = permissionList?.can_view == 1;
                    errorName = 'noSelectPermission';
                    errorMessage = `You don't have permission to view ${permission_key} records. Please contact your administrator.`;
                    break;

                case 'update':
                    hasPermission = permissionList?.can_update == 1;
                    errorName = 'noUpdatePermission';
                    errorMessage = `You don't have permission to update ${permission_key} records. Please contact your administrator.`;
                    break;

                case 'delete':
                    hasPermission = permissionList?.can_delete == 1;
                    errorName = 'noDeletePermission';
                    errorMessage = `You don't have permission to delete ${permission_key} records. Please contact your administrator.`;
                    break;
                default:
                    errorName = 'invalidPermissionAction';
                    errorMessage = `The requested action is not supported for '${permission_key}'. Please contact your administrator.`;
                    break;
            }

            if (!hasPermission) resutils.createError(errorName, errorMessage);

            // deligate to the next middleware
            next();
        } catch (error) {
            // console.log('error in authorization middleware:', error);

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