const { CACHE_TYPES } = require("../utils/cache.utils");
const resutils = require("../utils/response.utils")
const RESPONSE_STATUS = require("../utils/standard.messages")
const admMdl = require("../models/adminMdl")
const _ = require('lodash')

const groupSetupMenusByCategory = (menuItems = []) => {
    const groupedMenus = _.groupBy(menuItems, (item) => item.ctgry_nm || 'General');

    return Object.entries(groupedMenus).map(([categoryName, items]) => ({
        categoryName,
        items: _.sortBy(items.map((item) => ({
            menu_item_id: item.menu_item_id,
            menu_name: item.menu_name,
            menu_url: item.menu_url,
            icon: item.icon,
            display_order: item.display_order
        })), ['display_order', 'menu_name'])
    }));
};

exports.getMenuItemsCtrl = async (req, res) => {
    try {
        const menuItems = await admMdl.getMenuItemsMdl(req.user);

        return resutils.sendSuccessResponse(req, res, menuItems || [], RESPONSE_STATUS.SUCCESS, { function: 'get menu items', cacheType: CACHE_TYPES.PRIVATE_1_MIN });

    } catch (error) {
        console.log(error);
        resutils.sendErrorResponse(req, res, 'Unable to fetch menu items', RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'get menu items' });
    }

}

exports.getSetupMenusCtrl = async (req, res) => {
    try {
        const menuItemCategory = req.query.category || 'stp';
        const setupMenus = await admMdl.getSetupMenusMdl(req.user, menuItemCategory);
        const groupedSetupMenus = groupSetupMenusByCategory(setupMenus || []);

        return resutils.sendSuccessResponse(req, res, groupedSetupMenus, RESPONSE_STATUS.SUCCESS, { function: 'get setup menus', cacheType: CACHE_TYPES.PRIVATE_1_MIN });

    } catch (error) {
        console.log(error);
        resutils.sendErrorResponse(req, res, 'Unable to fetch setup menus', RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'get setup menus' });
    }
}