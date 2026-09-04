const jwt = require('jsonwebtoken');
const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const authMdl = require('../models/authMdl');
const authService = require('../services/authService');
const { logBlock } = require('../utils/log.utils');

// authntication validation middleware
exports.isAuthenticated = async (req, res, next) => {
    let token = req.headers['access-token'];
    let user = null
    logBlock('[is authenticated] token:', token);

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
            // console.log('decodedToken',decodedToken);

            user = decodedToken;
            // console.log('JWT Token is still alive...', token);

        } catch (error) {
            if (error.name === 'TokenExpiredError') {

                const decoded = jwt.decode(token);
                logBlock('[is authenticated] token expired, checking session - decoded token:', decoded);
                const sessionId = decoded?.session_id;

                if (!sessionId) resutils.createError('sessionExpired', 'Your session has expired. Please log in again.');

                // check if session is still alive or not
                const isAlive = await authMdl.checkIfSessionAlive(sessionId);

                // expired throw error
                if (!isAlive || !isAlive?.length || isAlive?.[0]?.destroyed_at != null) resutils.createError('sessionExpired', 'Your session has expired. Please log in again.');

                if (isAlive && isAlive?.[0]?.is_expired) resutils.createError('sessionExpired', 'Your session has expired. Please log in again.');

                if (isAlive?.[0]?.is_locked) resutils.createError('TemporarilyLocked', `Your account is temporarily locked. Please try again after ${isAlive?.[0]?.locked_until}.`);

                // console.log('Session still alive but jwt token has expired.');

                const userData = await authMdl.getUserDetails({ email: decoded?.email });

                // alive - regenereate token and sent it to the client

                // fetch user data
                if (!userData?.length) resutils.createError('userNotFound', 'We could not find your account. Please log in again.');

                const userObj = userData?.[0];

                const newToken = await authService.generateJWToken(userObj, sessionId);

                // update the express session time 
                const updated = await authMdl.slideExpressSession(sessionId);
                // console.log('session successfully slided', updated);

                user = newToken.obj;
                res.setHeader('new-access-token', newToken.token);
            }
            else throw error;
        }

        // bind user data to the request 
        req.user = user;

        // deligate to the next middleware 
        next();

    } catch (error) {
        console.log('Error in auth middleware: ', error);
        switch (error.name) {
            case 'TokenExpiredError':
                resutils.sendErrorResponse(req, res, 'Your session token has expired. Please log in again.', RESPONSE_STATUS.TOKEN_EXPIRED, { function: 'is authenticated middleware' });
                break;

            case 'JsonWebTokenError':
                resutils.sendErrorResponse(req, res, 'Your session token is invalid. Please log in again.', RESPONSE_STATUS.INVALID_TOKEN, { function: 'is authenticated middleware' });
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
                resutils.sendErrorResponse(req, res, 'You are not signed in. Please log in to continue.', RESPONSE_STATUS.INVALID_TOKEN, { function: 'is authenticated middleware' });
                break;

            case 'DatabaseError':
                // session lookups can fail without the token being at fault - do not blame the user
                resutils.sendErrorResponse(req, res, 'We could not verify your session right now. Please try again in a moment.', RESPONSE_STATUS.SESSION_ERR, { function: 'is authenticated middleware' });
                break;

            default:
                resutils.sendErrorResponse(req, res, 'We could not verify your sign-in right now. Please log in and try again.', RESPONSE_STATUS.INVALID_TOKEN, { function: 'is authenticated middleware' });
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

            // bind permission flags to the request so controllers can send them to the client
            req.permissions = {
                can_insert: permissionList?.can_insert == 1,
                can_view: permissionList?.can_view == 1,
                can_update: permissionList?.can_update == 1,
                can_delete: permissionList?.can_delete == 1
            };

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
            let message = error?.message || 'Unable to process request right now. Please try again after some time.';

            switch (error.name) {
                case 'noPermissions': resStatus = RESPONSE_STATUS.UNAUTHORIZED; break;
                case 'noInsertPermission': resStatus = RESPONSE_STATUS.NO_INSERT_PERMISSION; break;
                case 'noSelectPermission': resStatus = RESPONSE_STATUS.NO_SELECT_PERMISSION; break;
                case 'noUpdatePermission': resStatus = RESPONSE_STATUS.NO_UPDATE_PERMISSION; break;
                case 'noDeletePermission': resStatus = RESPONSE_STATUS.NO_DELETE_PERMISSION; break;

                case 'DatabaseError':
                    // permission lookups can fail without the user being at fault
                    resStatus = RESPONSE_STATUS.DB_ERROR;
                    message = 'We could not verify your permissions right now. Please try again in a moment.';
                    break;

                default:
                    resStatus = RESPONSE_STATUS.UNABLE_TO_PROCESS;
                    message = 'We could not verify your permissions right now. Please try again in a moment.';
                    break;
            }
            return resutils.sendErrorResponse(req, res, message, resStatus, { function: 'authorization middleware' })
        }
    }
}