const resutils = require('../utils/response.utils');
const RESPONSE_STATUS = require('../utils/standard.messages');
const profilesService = require('../services/profilesService');
const { log } = require('../utils/log.utils');

// maps profile error names to standard responses, mirroring the other controllers
const sendProfilesError = (req, res, error, fname) => {
    console.log('Error in ' + fname + ' : ', error);

    switch (error.name) {
        case 'validationFailed':
            return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.VALIDATION_ERROR, { function: fname });
        case 'unknownProfileType':
        case 'recordNotFound':
            return resutils.sendErrorResponse(req, res, error.message, RESPONSE_STATUS.NOT_FOUND, { function: fname });
        case 'DatabaseError':
            return resutils.sendErrorResponse(req, res, 'Unable to load the profile right now. Please try again.', RESPONSE_STATUS.DB_ERROR, { function: fname });
        default:
            return resutils.sendErrorResponse(req, res, 'Unable to load the profile right now. Please try again.', RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: fname });
    }
};

// GET /profiles/:type/:id - one controller serves every profile type; the service's
// registry decides what each type returns. req.user carries the caller's data scope
exports.getProfileCtrl = async (req, res) => {
    log('in getProfileCtrl');
    try {
        const result = await profilesService.getProfileSrvc(req.user, req.params.type, req.params.id);

        return resutils.sendSuccessResponse(req, res, result, RESPONSE_STATUS.DATA_FOUND, { function: 'get profile' });
    } catch (error) {
        return sendProfilesError(req, res, error, 'get profile controller');
    }
}
