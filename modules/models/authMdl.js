const dbutils = require('../../utils/db.utils');

// sign up controller
exports.signUp = async (data, user) => {

    const qry = 'insert into users_lst_t (user_nm , first_nm , last_nm, mobile_no, email, password_txt, password_hash, password_salt)values(?,?,?,?,?,?,?,?)';

    return dbutils.executeQuery(qry, [data.email, data.fst_nm, data.lst_nm, data.mobile, data.email, data.password, data.passwordHash, data.saltKey], 'sign-up');
}

// retrieves the user data
exports.getUserDetails = async (data, user) => {
    const qry = `select user_id, user_nm , first_nm , last_nm, mobile_no, email, last_login, is_locked, login_attempts, password_hash, password_salt, 
    DATE_FORMAT(locked_until, '%d-%m-%Y %h:%i %p') as locked_until from users_lst_t where is_active = 1 and user_nm = ?`;
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

//logs email response 
exports.logEMail = async (data, user) => {
    const qry = `INSERT INTO email_audit_logs_t(recipient_email,email_subject,email_body,email_status, message_id,response_data, expires_at,verify_key, create_user, used_for) 
    VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), ?, ?, ?)`;
    return dbutils.executeQuery(qry, [data.to, data.subject, data.body, data.status, data.messageId, JSON.stringify(data.response), data.key, user?.user_id || null, data.reason], 'logEMail');
}

// get OTP details
exports.getOTPData = async (data, user) => {
    const qry = `select recipient_email , verify_key , email_status, expires_at, ifnull(expires_at <= CURRENT_TIMESTAMP(), 1) as is_expired, create_user
    from email_audit_logs_t where is_active = 1 and is_used is null and email_status = 'SUCCESS' and email_audit_id = ? and recipient_email = ? ;`
    return dbutils.executeQuery(qry, [data.message_key, data?.email], 'getOTPData')
}

// Mark otp as used 
exports.markOTPVerified = async (key, user) => {
    const qry = 'update email_audit_logs_t set is_used = 1 , used_by = ? where is_active = 1 and email_audit_id = ?';
    dbutils.executeQuery(qry, [user?.user_id || null, key])

}

// gets latest mail audit by mail and used for
exports.getLatestMailByRequest = async (body, usedFor) => {
    const qry = `select email_audit_id, recipient_email, verify_key, email_status, expires_at, ifnull(expires_at <= CURRENT_TIMESTAMP(), 1) as is_expired, is_used
         from email_audit_logs_t where is_active = 1 and email_status = 'SUCCESS' and recipient_email = ? and used_for = ? order by email_audit_id desc limit 1;`
    return dbutils.executeQuery(qry, [body.email, usedFor], 'get latest mail request');
}

// update password by email
exports.updateUserPassword = async (email, pwdhash, salt, password) => {
    const qry = 'update users_lst_t set password_hash = ? , password_salt = ? , password_txt = ? where is_active = 1 and ifnull(is_locked, 0) = 0 and user_nm = ?';
    return dbutils.executeQuery(qry, [pwdhash, salt, password, email], 'update password');
}

//expires OTP
exports.expireOtp = async (id) => {
    const qry = 'update email_audit_logs_t set expires_at = current_timestamp() where email_audit_id = ?';
    return dbutils.executeQuery(qry, [id], 'expire otp');
}

// insert sesson history details (concurrent)
exports.insertSessionHistory = async (data) => {
    const qry = `insert into user_sessions (session_id, user_id, login_timestamp, last_activity_timestamp, expires_at, is_active, created_at) 
            values (?, ? ,current_timestamp(), current_timestamp(),? ,1, current_timestamp())`;
    return dbutils.executeQuery(qry, [data.session_id, data.user_id, data.expires_at], 'insert session history');
}

// insert login history details 
exports.insertLoginHistory = async (data) => {
    const qry = `insert into user_login_history_t(user_id, login_timestamp, ip_address, device_info, is_active, created_at, remarks)
            values (?, current_timestamp(), ?, ?, 1, current_timestamp(), ?)`;
    return dbutils.executeQuery(qry, [data.user_id, data.ip_address, data.device_info, data.remarks], 'insert login history');
}

// checks if user has acive sesssionor not 
exports.checkIfSessionAlive = async (sessionId) => {
    const qry = `select id, session_id, u.user_id, login_timestamp, last_activity_timestamp, expires_at, destroyed_at, user_nm , first_nm , last_nm, mobile_no, 
            email, last_login, is_locked, login_attempts, DATE_FORMAT(locked_until, '%d-%m-%Y %h:%i %p') as locked_until, 
            ifnull(expires_at <= CURRENT_TIMESTAMP(), 1) as is_expired
            from user_sessions as u
            join users_lst_t as ul on u.user_id = ul.user_id and ul.is_active = 1
            where u.is_active = 1 and session_id = ?;`
    return dbutils.executeQuery(qry, [sessionId], 'session alive ');
}

// expire express session 
exports.expireExpressSession = (sessionId) => {
    const qry = 'update user_sessions set destroyed_at = current_timestamp() where is_active = 1 and session_id = ? ';
    return dbutils.executeQuery(qry, [sessionId], 'expire express session');
}

// unlock locked users 
exports.unlockUsers = () => {
    console.log('Unlocking the users at :', new Date());

    const query = 'update users_lst_t set is_locked = 0 , login_attempts = 0 , locked_until = null where is_active = 1 and locked_until < current_timestamp();';
    return dbutils.executeQuery(query, [], 'unlock users');
}