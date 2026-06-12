const dbutils = require('../../utilities/db.utils');

exports.signUp = async (data, user) => {
    const qry = 'insert into users_lst_t (user_nm , first_nm , last_nm, mobile_no, email, password_txt, password_hash)values(?,?,?,?,?,?,?)';

    return dbutils.executeQuery('sign-up', qry, [data.usr_nm, data.fst_nm, data.lst_nm, data.mobile, data.email, data.password, 'mtvywmrtvuemtrem']);
}

exports.signIn = async (data, req) => {
    const qry = 'insert into users_lst_t (user_nm , first_nm , last_nm, mobile_no, email, password_txt)values(?,?,?,?,?,?)';

    return dbutils.executeQuery('sign-up', qry, [data.usr_nm, data.fst_nm, data.lst_nm, data.mobile, data.email, data, password]);
}