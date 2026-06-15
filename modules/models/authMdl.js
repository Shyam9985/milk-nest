const dbutils = require('../../utilities/db.utils');

exports.signUp = async (data, user) => {

    const qry = 'insert into users_lst_t (user_nm , first_nm , last_nm, mobile_no, email, password_txt, password_hash, password_salt)values(?,?,?,?,?,?,?,?)';

    return dbutils.executeQuery('sign-up', qry, [data.email, data.fst_nm, data.lst_nm, data.mobile, data.email, data.password, data.passwordHash, data.saltKey]);
}

exports.getUserDetails = async (data, user) => {

    const qry = `select user_nm , first_nm , last_nm, mobile_no, email, last_login, is_locked, login_attempts, password_hash, password_salt, DATE_FORMAT(locked_until, '%d-%m-%Y %h:%i %p') as locked_until
     from users_lst_t where is_active = 1 and user_nm = ?`;

    return dbutils.executeQuery('login', qry, [data.userName]);
}