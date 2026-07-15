const dbutils = require("../../utils/db.utils");


exports.getMenuItemsMdl = async (user) => {
    const qry = `select m.menu_item_id, m.menu_name, m.menu_url, m.icon , m.is_main_item , m.is_quick_menu, m.parent_item_id, rm.display_order from role_menu_map_t as rm 
        join menu_items_t m on rm.menu_item_id = m.menu_item_id and rm.is_active = 1
        where rm.is_active = 1 and rm.role_id = ?
        order by rm.display_order asc;`;
    return dbutils.executeQuery(qry, [user.role?.role_id]);
}