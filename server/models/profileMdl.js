const dbutils = require('../utils/db.utils');

// fetches the profile details for a logged in user by id (no credential/lock columns)
exports.getUserProfileById = (user_id) => {
    const qry = `select u.user_id, u.user_nm , u.first_nm , u.last_nm, u.mobile_no, u.email, u.profile_photo_url, DATE_FORMAT(u.last_login, '%d-%m-%Y %h:%i %p') as last_login,
        r.role_id, r.role_nm, r.role_hndlr, r.hierarchy_id, h.hierarchy_nm , h.parent_hirrarchy_id,
        p.position_id, p.position_nm
        from users_lst_t u
        join roles_lst_t r on r.role_id = u.role_id and r.is_active = 1
        join hierarchy_lst_t h on h.hirrarchy_id = r.hierarchy_id and h.is_active = 1
        join position_lst_t p on p.user_id = u.user_id and p.is_active = 1 and p.end_date >= CURDATE()
        where u.is_active = 1 and u.user_id = ?`;
    return dbutils.executeQuery(qry, [user_id], 'get user profile model');
}
