const { CACHE_TYPES } = require("../utils/cache.utils");
const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const adminService = require("../services/adminService");

// maps known admin error names to standard error responses, mirroring the settings controller.
// db errors get their own status so a database outage is distinguishable from a bad request
const sendAdminError = (req, res, error, fname, fallbackMessage) => {
    console.log('Error in ' + fname + ' : ', error);

    switch (error.name) {
        case 'Databno aseError':
            return resutils.sendErrorResponse(req, res, fallbackMessage, RESPONSE_STATUS.DB_ERROR, { function: fname });

        default:
            return resutils.sendErrorResponse(req, res, fallbackMessage, RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: fname });
    }
};

exports.getMenuItemsCtrl = async (req, res) => {
    try {
        const menuItems = await adminService.getMenuItemsSrvc(req.user);

        return resutils.sendSuccessResponse(req, res, menuItems || [], RESPONSE_STATUS.SUCCESS, { function: 'get menu items', cacheType: CACHE_TYPES.PRIVATE_1_MIN });

    } catch (error) {
        return sendAdminError(req, res, error, 'get menu items controller',
            'We could not load your menu right now. Please refresh the page or try again in a moment.');
    }

}

exports.getGendersCtrl = async (req, res) => {
    try {
        const records = await adminService.getGendersSrvc();

        return resutils.sendSuccessResponse(req, res, { records: records || [] }, RESPONSE_STATUS.SUCCESS, { function: 'get genders', cacheType: CACHE_TYPES.PRIVATE_1_MIN });

    } catch (error) {
        return sendAdminError(req, res, error, 'get genders controller',
            'We could not load the genders right now. Please try again in a moment.');
    }
}

exports.getSetupMenusCtrl = async (req, res) => {
    try {
        const menuItemCategory = req.query.category || 'stp';
        const groupedSetupMenus = await adminService.getSetupMenusSrvc(req.user, menuItemCategory);

        return resutils.sendSuccessResponse(req, res, groupedSetupMenus, RESPONSE_STATUS.SUCCESS, { function: 'get setup menus', cacheType: CACHE_TYPES.PRIVATE_1_MIN });

    } catch (error) {
        return sendAdminError(req, res, error, 'get setup menus controller',
            'We could not load the setup menus right now. Please refresh the page or try again in a moment.');
    }
}
