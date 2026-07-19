const dbutils = require("../../utils/db.utils");


exports.getMenuItemsMdl = async (user) => {
    const qry = `select m.menu_item_id, m.menu_name, m.menu_url, m.icon , m.is_main_item , m.is_quick_menu, m.parent_item_id, rm.display_order from role_menu_map_t as rm 
        join menu_items_t m on rm.menu_item_id = m.menu_item_id and rm.is_active = 1
        where rm.is_active = 1 and m.is_quick_menu <> 1 and rm.role_id = ?
        order by rm.display_order asc;`;
    return dbutils.executeQuery(qry, [user.role?.role_id], 'get menu items model');
}

exports.getSetupMenusMdl = async (user, menuItemCategory = 'SETUP') => {
    const qry = `SELECT c.ctgry_nm, m.menu_item_id, m.menu_name, m.menu_url, m.icon, rm.display_order
        FROM menu_items_t m
        JOIN quick_menu_category_lst_t c ON c.quick_menu_ctgry_id = m.quick_menu_ctgry_id AND c.is_active = 1
        JOIN role_menu_map_t rm ON rm.menu_item_id = m.menu_item_id AND rm.is_active = 1
        WHERE m.is_quick_menu = 1 AND m.is_active = 1 AND rm.role_id = ? AND m.menu_item_category = ?
        ORDER BY c.display_order, m.menu_name;`;
    return dbutils.executeQuery(qry, [user.role?.role_id, menuItemCategory]);
}