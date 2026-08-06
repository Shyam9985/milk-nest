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

// fetches an active state by id, used to validate the parent before saving a district
exports.getActiveStateByIdMdl = (state_id) => {
    const qry = 'select state_id, state_name from state_mstr_lst_t where is_active = 1 and state_id = ?';
    return dbutils.executeQuery(qry, [state_id], 'get active state by id model');
}

// counts active districts mapped to a state, used to block deleting a state that is in use
exports.countActiveDistrictsByStateMdl = (state_id) => {
    const qry = 'select count(*) as cnt from district_mstr_lst_t where is_active = 1 and state_id = ?';
    return dbutils.executeQuery(qry, [state_id], 'count active districts by state model');
}

// ===================== DISTRICT MASTER =====================

// fetches all active districts along with their parent state
exports.getDistrictsMdl = () => {
    const qry = `select d.district_id, d.district_name, d.district_code, d.state_id, s.state_name, d.is_active,
        DATE_FORMAT(d.created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(d.updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from district_mstr_lst_t d
        join state_mstr_lst_t s on s.state_id = d.state_id
        where d.is_active = 1 order by s.state_name asc, d.district_name asc`;
    return dbutils.executeQuery(qry, [], 'get districts model');
}

// finds districts clashing on name (within the same state) or code (across all states), optionally excluding one record
exports.getDuplicateDistrictsMdl = (district_name, district_code, state_id, excludeId = null) => {
    let qry = `select district_id, district_name, district_code, state_id, is_active from district_mstr_lst_t
        where ((state_id = ? and lower(district_name) = lower(?)) or lower(district_code) = lower(?))`;
    const params = [state_id, district_name, district_code];

    if (excludeId) {
        qry += ' and district_id <> ?';
        params.push(excludeId);
    }
    return dbutils.executeQuery(qry, params, 'get duplicate districts model');
}

// inserts a new district
exports.insertDistrictMdl = (data) => {
    const qry = 'insert into district_mstr_lst_t (district_name, district_code, state_id) values (?, ?, ?)';
    return dbutils.executeQuery(qry, [data.district_name, data.district_code, data.state_id], 'insert district model');
}

// updates an active district
exports.updateDistrictMdl = (district_id, data) => {
    const qry = 'update district_mstr_lst_t set district_name = ?, district_code = ?, state_id = ? where is_active = 1 and district_id = ?';
    return dbutils.executeQuery(qry, [data.district_name, data.district_code, data.state_id, district_id], 'update district model');
}

// brings back a soft deleted district with the latest details
exports.reactivateDistrictMdl = (district_id, data) => {
    const qry = 'update district_mstr_lst_t set district_name = ?, district_code = ?, state_id = ?, is_active = 1 where district_id = ?';
    return dbutils.executeQuery(qry, [data.district_name, data.district_code, data.state_id, district_id], 'reactivate district model');
}

// soft deletes a district
exports.softDeleteDistrictMdl = (district_id) => {
    const qry = 'update district_mstr_lst_t set is_active = 0 where is_active = 1 and district_id = ?';
    return dbutils.executeQuery(qry, [district_id], 'soft delete district model');
}

// fetches an active district by id, used to validate the parent before saving a mandal/village
exports.getActiveDistrictByIdMdl = (district_id) => {
    const qry = 'select district_id, district_name, state_id from district_mstr_lst_t where is_active = 1 and district_id = ?';
    return dbutils.executeQuery(qry, [district_id], 'get active district by id model');
}

// counts active mandals/ULBs mapped to a district, used to block deleting a district that is in use
exports.countActiveMandalsByDistrictMdl = (district_id) => {
    const qry = 'select count(*) as cnt from mandal_ulb_mstr_lst_t where is_active = 1 and district_id = ?';
    return dbutils.executeQuery(qry, [district_id], 'count active mandals by district model');
}

// counts active villages mapped to a district, used to block deleting a district that is in use
exports.countActiveVillagesByDistrictMdl = (district_id) => {
    const qry = 'select count(*) as cnt from village_sachivalayam_mst_lst_t where is_active = 1 and district_id = ?';
    return dbutils.executeQuery(qry, [district_id], 'count active villages by district model');
}

// ===================== MANDAL / ULB MASTER =====================

// fetches all active mandals/ULBs along with their parent district and state
exports.getMandalsMdl = () => {
    const qry = `select m.mandal_ulb_id, m.mandal_ulb_nm, m.mandal_ulb_code, m.district_id, m.is_ulb, m.is_active,
        d.district_name, s.state_name,
        DATE_FORMAT(m.created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(m.updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from mandal_ulb_mstr_lst_t m
        join district_mstr_lst_t d on d.district_id = m.district_id
        join state_mstr_lst_t s on s.state_id = d.state_id
        where m.is_active = 1 order by d.district_name asc, m.mandal_ulb_nm asc`;
    return dbutils.executeQuery(qry, [], 'get mandals model');
}

// finds mandals/ULBs clashing on name (within the same district) or code (across all districts), optionally excluding one record
exports.getDuplicateMandalsMdl = (mandal_ulb_nm, mandal_ulb_code, district_id, excludeId = null) => {
    let qry = `select mandal_ulb_id, mandal_ulb_nm, mandal_ulb_code, district_id, is_active from mandal_ulb_mstr_lst_t
        where ((district_id = ? and lower(mandal_ulb_nm) = lower(?)) or lower(mandal_ulb_code) = lower(?))`;
    const params = [district_id, mandal_ulb_nm, mandal_ulb_code];

    if (excludeId) {
        qry += ' and mandal_ulb_id <> ?';
        params.push(excludeId);
    }
    return dbutils.executeQuery(qry, params, 'get duplicate mandals model');
}

// inserts a new mandal/ULB
exports.insertMandalMdl = (data) => {
    const qry = 'insert into mandal_ulb_mstr_lst_t (mandal_ulb_nm, mandal_ulb_code, district_id, is_ulb) values (?, ?, ?, ?)';
    return dbutils.executeQuery(qry, [data.mandal_ulb_nm, data.mandal_ulb_code, data.district_id, data.is_ulb], 'insert mandal model');
}

// updates an active mandal/ULB
exports.updateMandalMdl = (mandal_ulb_id, data) => {
    const qry = 'update mandal_ulb_mstr_lst_t set mandal_ulb_nm = ?, mandal_ulb_code = ?, district_id = ?, is_ulb = ? where is_active = 1 and mandal_ulb_id = ?';
    return dbutils.executeQuery(qry, [data.mandal_ulb_nm, data.mandal_ulb_code, data.district_id, data.is_ulb, mandal_ulb_id], 'update mandal model');
}

// brings back a soft deleted mandal/ULB with the latest details
exports.reactivateMandalMdl = (mandal_ulb_id, data) => {
    const qry = 'update mandal_ulb_mstr_lst_t set mandal_ulb_nm = ?, mandal_ulb_code = ?, district_id = ?, is_ulb = ?, is_active = 1 where mandal_ulb_id = ?';
    return dbutils.executeQuery(qry, [data.mandal_ulb_nm, data.mandal_ulb_code, data.district_id, data.is_ulb, mandal_ulb_id], 'reactivate mandal model');
}

// soft deletes a mandal/ULB
exports.softDeleteMandalMdl = (mandal_ulb_id) => {
    const qry = 'update mandal_ulb_mstr_lst_t set is_active = 0 where is_active = 1 and mandal_ulb_id = ?';
    return dbutils.executeQuery(qry, [mandal_ulb_id], 'soft delete mandal model');
}

// fetches an active mandal/ULB by id, used to validate the parent before saving a village
exports.getActiveMandalByIdMdl = (mandal_ulb_id) => {
    const qry = 'select mandal_ulb_id, mandal_ulb_nm, district_id from mandal_ulb_mstr_lst_t where is_active = 1 and mandal_ulb_id = ?';
    return dbutils.executeQuery(qry, [mandal_ulb_id], 'get active mandal by id model');
}

// counts active villages mapped to a mandal/ULB, used to block deleting a mandal that is in use
exports.countActiveVillagesByMandalMdl = (mandal_ulb_id) => {
    const qry = 'select count(*) as cnt from village_sachivalayam_mst_lst_t where is_active = 1 and mandal_ulb_id = ?';
    return dbutils.executeQuery(qry, [mandal_ulb_id], 'count active villages by mandal model');
}

// ===================== VILLAGE / SACHIVALAYAM MASTER =====================

// fetches all active villages/sachivalayams along with their parent district and mandal
exports.getVillagesMdl = () => {
    const qry = `select v.village_sachivalayam_id, v.village_sachivalayam_nm, v.village_sachivalayam_code,
        v.district_id, v.mandal_ulb_id, v.is_sachivalayam, v.is_active,
        d.district_name, m.mandal_ulb_nm,
        DATE_FORMAT(v.created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(v.updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from village_sachivalayam_mst_lst_t v
        join district_mstr_lst_t d on d.district_id = v.district_id
        left join mandal_ulb_mstr_lst_t m on m.mandal_ulb_id = v.mandal_ulb_id
        where v.is_active = 1 order by d.district_name asc, v.village_sachivalayam_nm asc`;
    return dbutils.executeQuery(qry, [], 'get villages model');
}

// finds villages clashing on name (within the same district and mandal) or code (across all), optionally excluding one record
exports.getDuplicateVillagesMdl = (village_sachivalayam_nm, village_sachivalayam_code, district_id, mandal_ulb_id, excludeId = null) => {
    let qry = `select village_sachivalayam_id, village_sachivalayam_nm, village_sachivalayam_code, district_id, mandal_ulb_id, is_active
        from village_sachivalayam_mst_lst_t
        where ((district_id = ? and ifnull(mandal_ulb_id, 0) = ifnull(?, 0) and lower(village_sachivalayam_nm) = lower(?))
            or lower(village_sachivalayam_code) = lower(?))`;
    const params = [district_id, mandal_ulb_id, village_sachivalayam_nm, village_sachivalayam_code];

    if (excludeId) {
        qry += ' and village_sachivalayam_id <> ?';
        params.push(excludeId);
    }
    return dbutils.executeQuery(qry, params, 'get duplicate villages model');
}

// inserts a new village/sachivalayam
exports.insertVillageMdl = (data) => {
    const qry = 'insert into village_sachivalayam_mst_lst_t (village_sachivalayam_nm, village_sachivalayam_code, district_id, mandal_ulb_id, is_sachivalayam) values (?, ?, ?, ?, ?)';
    return dbutils.executeQuery(qry, [data.village_sachivalayam_nm, data.village_sachivalayam_code, data.district_id, data.mandal_ulb_id, data.is_sachivalayam], 'insert village model');
}

// updates an active village/sachivalayam
exports.updateVillageMdl = (village_sachivalayam_id, data) => {
    const qry = `update village_sachivalayam_mst_lst_t set village_sachivalayam_nm = ?, village_sachivalayam_code = ?,
        district_id = ?, mandal_ulb_id = ?, is_sachivalayam = ? where is_active = 1 and village_sachivalayam_id = ?`;
    return dbutils.executeQuery(qry, [data.village_sachivalayam_nm, data.village_sachivalayam_code, data.district_id, data.mandal_ulb_id, data.is_sachivalayam, village_sachivalayam_id], 'update village model');
}

// brings back a soft deleted village/sachivalayam with the latest details
exports.reactivateVillageMdl = (village_sachivalayam_id, data) => {
    const qry = `update village_sachivalayam_mst_lst_t set village_sachivalayam_nm = ?, village_sachivalayam_code = ?,
        district_id = ?, mandal_ulb_id = ?, is_sachivalayam = ?, is_active = 1 where village_sachivalayam_id = ?`;
    return dbutils.executeQuery(qry, [data.village_sachivalayam_nm, data.village_sachivalayam_code, data.district_id, data.mandal_ulb_id, data.is_sachivalayam, village_sachivalayam_id], 'reactivate village model');
}

// fetches an active village/sachivalayam by id
exports.getActiveVillageByIdMdl = (village_sachivalayam_id) => {
    const qry = 'select village_sachivalayam_id, village_sachivalayam_nm from village_sachivalayam_mst_lst_t where is_active = 1 and village_sachivalayam_id = ?';
    return dbutils.executeQuery(qry, [village_sachivalayam_id], 'get active village by id model');
}

// soft deletes a village/sachivalayam
exports.softDeleteVillageMdl = (village_sachivalayam_id) => {
    const qry = 'update village_sachivalayam_mst_lst_t set is_active = 0 where is_active = 1 and village_sachivalayam_id = ?';
    return dbutils.executeQuery(qry, [village_sachivalayam_id], 'soft delete village model');
}
