const { CACHE_TYPES } = require("../utils/cache.utils");
const resutils = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");
const adminService = require("../services/adminService");

exports.getMenuItemsCtrl = async (req, res) => {
    try {
        const menuItems = await adminService.getMenuItemsSrvc(req.user);

        return resutils.sendSuccessResponse(req, res, menuItems || [], RESPONSE_STATUS.SUCCESS, { function: 'get menu items', cacheType: CACHE_TYPES.PRIVATE_1_MIN });

    } catch (error) {
        console.log(error);
        resutils.sendErrorResponse(req, res, 'Unable to fetch menu items', RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'get menu items' });
    }

}

exports.getSetupMenusCtrl = async (req, res) => {
    try {
        const menuItemCategory = req.query.category || 'stp';
        const groupedSetupMenus = await adminService.getSetupMenusSrvc(req.user, menuItemCategory);

        return resutils.sendSuccessResponse(req, res, groupedSetupMenus, RESPONSE_STATUS.SUCCESS, { function: 'get setup menus', cacheType: CACHE_TYPES.PRIVATE_1_MIN });

    } catch (error) {
        console.log(error);
        resutils.sendErrorResponse(req, res, 'Unable to fetch setup menus', RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'get setup menus' });
    }
}
