const dbutils = require('../../utilities/db.utils');

// sign up controller
exports.signUp = async (data, user) => {

    const qry = 'insert into users_lst_t (user_nm , first_nm , last_nm, mobile_no, email, password_txt, password_hash, password_salt)values(?,?,?,?,?,?,?,?)';

    return dbutils.executeQuery(qry, [data.email, data.fst_nm, data.lst_nm, data.mobile, data.email, data.password, data.passwordHash, data.saltKey], 'sign-up');
}

// retrieves the user data
exports.getUserDetails = async (data, user) => {

    const qry = `select user_nm , first_nm , last_nm, mobile_no, email, last_login, is_locked, login_attempts, password_hash, password_salt, DATE_FORMAT(locked_until, '%d-%m-%Y %h:%i %p') as locked_until
     from users_lst_t where is_active = 1 and user_nm = ?`;

    return dbutils.executeQuery(qry, [data.email], 'login');
}

// increases login attempts
exports.increaseLoginAttempts = (user) => {
    console.log('in incease login attempts model');

    const qry = `update users_lst_t set login_attempts = ifnull(login_attempts, 0) + 1, is_locked = case when login_attempts > 4 then 1 else 0 end,
    locked_until = case when login_attempts > 4 then date_add(current_timestamp(),INTERVAL 1 day) else null end  
    where user_nm = ?`;
    return dbutils.executeQuery(qry, [user.email], 'increaseLoginAttempts');

}

// reset login attempts
exports.unlockUser = (user) => {
    console.log('in unlockUser model');
    const qry = `update users_lst_t set login_attempts = 0, is_locked = 0, locked_until = null where user_nm = ?`;
    return dbutils.executeQuery(qry, [user.email], 'unlockUser');
}

// get user role permissions
exports.getRolePermissions = async (role_hndlr, permission_key) => {
    console.log(`checking '${permission_key}' object on '${role_hndlr}' role.`);

    const qry = `select p.role_id, r.role_nm, p.permission_key, p.can_insert, p.can_view, p.can_update, p.can_delete from role_permissions_t as p
    join roles_lst_t as r on r.role_id = p.role_id and r.is_active = 1
    where p.is_active = 1 and r.role_hndlr = ? and p.permission_key = ?;`
    return dbutils.executeQuery(qry, [role_hndlr, permission_key], 'permissions middleare');
}