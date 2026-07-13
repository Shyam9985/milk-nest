const dbutils = require("../../utils/db.utils");


exports.getMenuItemsMdl= async (user) => {
    const qry = `select * from mnu_itm_lst_t`;
    dbutils.executeQuery(qry, [user.role])
}