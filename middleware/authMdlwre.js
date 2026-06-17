const jwt = require('jsonwebtoken');
const resutils = require("../utilities/response.utils");
const RESPONSE_STATUS = require("../utilities/standard.messages");
const authMdl = require('../modules/models/authMdl');

// authntication validation middleware
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
        // console.log('decodedToken', decodedToken);

        // check user active
        const response = await authMdl.getUserDetails({ email: decodedToken.user_nm });
        const user = response[0];
        // console.log(user);

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

            if (!permissionList) {
                const error = new Error('You do not have permissions to perform this action.please contact your admin.');
                error.name = 'noPermissions';
                throw error;
            }

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

            if (!hasPermission) {
                const error = new Error(errorMessage);
                error.name = errorName;
                throw error;
            }

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