const admMdl = require('../models/adminMdl');
const _ = require('lodash');

// groups quick menus by their category and orders the items
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

// fetches the role based main menu items
exports.getMenuItemsSrvc = async (user) => {
    return admMdl.getMenuItemsMdl(user);
}

// fetches the role based quick menus grouped by category
exports.getSetupMenusSrvc = async (user, menuItemCategory) => {
    const setupMenus = await admMdl.getSetupMenusMdl(user, menuItemCategory);
    return groupSetupMenusByCategory(setupMenus || []);
}
