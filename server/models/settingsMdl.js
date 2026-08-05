const dbutils = require('../utils/db.utils');

// fetches all active states
exports.getStatesMdl = () => {
    const qry = `select state_id, state_name, state_code, is_active,
        DATE_FORMAT(created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from state_mstr_lst_t where is_active = 1 order by state_name asc`;
    return dbutils.executeQuery(qry, [], 'get states model');
}

// finds records matching the given name or code (active and inactive), optionally excluding one record
exports.getDuplicateStatesMdl = (state_name, state_code, excludeId = null) => {
    let qry = `select state_id, state_name, state_code, is_active from state_mstr_lst_t
        where (lower(state_name) = lower(?) or lower(state_code) = lower(?))`;
    const params = [state_name, state_code];

    if (excludeId) {
        qry += ' and state_id <> ?';
        params.push(excludeId);
    }
    return dbutils.executeQuery(qry, params, 'get duplicate states model');
}

// inserts a new state
exports.insertStateMdl = (data) => {
    const qry = 'insert into state_mstr_lst_t (state_name, state_code) values (?, ?)';
    return dbutils.executeQuery(qry, [data.state_name, data.state_code], 'insert state model');
}

// updates an active state
exports.updateStateMdl = (state_id, data) => {
    const qry = 'update state_mstr_lst_t set state_name = ?, state_code = ? where is_active = 1 and state_id = ?';
    return dbutils.executeQuery(qry, [data.state_name, data.state_code, state_id], 'update state model');
}

// brings back a soft deleted state with the latest details
exports.reactivateStateMdl = (state_id, data) => {
    const qry = 'update state_mstr_lst_t set state_name = ?, state_code = ?, is_active = 1 where state_id = ?';
    return dbutils.executeQuery(qry, [data.state_name, data.state_code, state_id], 'reactivate state model');
}

// soft deletes a state
exports.softDeleteStateMdl = (state_id) => {
    const qry = 'update state_mstr_lst_t set is_active = 0 where is_active = 1 and state_id = ?';
    return dbutils.executeQuery(qry, [state_id], 'soft delete state model');
}
