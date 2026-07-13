const resutils = require("../../utils/response.utils")
const RESPONSE_STATUS = require("../../utils/standard.messages")


exports.getMenuItemsCtrl = async (req, res) => {
    try {

        // fetch menu items based on the logged in role and client
        const menus = [
            { menu_id: 1, menu_name: "Dashboard", icon: 'LayoutDashboard', menu_url: '/dashboard', is_main_item: 1, parent_item_id: 0, display_order: 1 },
            { menu_id: 2, menu_name: "Users", icon: 'Users', menu_url: '/users', is_main_item: 1, parent_item_id: 0, display_order: 2 },
            { menu_id: 3, menu_name: "Products", icon: 'Package', menu_url: '/package', is_main_item: 1, parent_item_id: 0, display_order: 3 },
            { menu_id: 4, menu_name: "Orders", icon: 'ShoppingCart', menu_url: '/orders', is_main_item: 1, parent_item_id: 0, display_order: 4 },
            { menu_id: 5, menu_name: "Settings", icon: 'Settings', menu_url: '/settings', is_main_item: 1, parent_item_id: 0, display_order: 5 },
            { menu_id: 6, menu_name: "About", icon: 'Info', menu_url: '/about', is_main_item: 1, parent_item_id: 0, display_order: 6 },
        ]
        return resutils.sendSuccessResponse(req, res, menus, RESPONSE_STATUS.SUCCESS, { function: 'get menu items' });

    } catch (error) {
        console.log(error);
        resutils.sendErrorResponse(req, res, 'Unable to fetch menu items', RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'get menu items' });
    }

}