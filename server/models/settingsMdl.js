const dbutils = require('../utils/db.utils');
const scopeutils = require('../utils/scope.utils');
const { log } = require('../utils/log.utils');

// fetches all active states
exports.getStatesMdl = () => {
    log('in getStatesMdl');
    const qry = `select state_id, state_name, state_code, is_active,
        DATE_FORMAT(created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from state_mstr_lst_t where is_active = 1 order by state_name asc`;
    return dbutils.executeQuery(qry, [], 'get states model');
}

// finds records matching the given name or code (active and inactive), optionally excluding one record
exports.getDuplicateStatesMdl = (state_name, state_code, excludeId = null) => {
    log('in getDuplicateStatesMdl');
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
    log('in insertStateMdl');
    const qry = 'insert into state_mstr_lst_t (state_name, state_code) values (?, ?)';
    return dbutils.executeQuery(qry, [data.state_name, data.state_code], 'insert state model');
}

// updates an active state
exports.updateStateMdl = (state_id, data) => {
    log('in updateStateMdl');
    const qry = 'update state_mstr_lst_t set state_name = ?, state_code = ? where is_active = 1 and state_id = ?';
    return dbutils.executeQuery(qry, [data.state_name, data.state_code, state_id], 'update state model');
}

// brings back a soft deleted state with the latest details
exports.reactivateStateMdl = (state_id, data) => {
    log('in reactivateStateMdl');
    const qry = 'update state_mstr_lst_t set state_name = ?, state_code = ?, is_active = 1 where state_id = ?';
    return dbutils.executeQuery(qry, [data.state_name, data.state_code, state_id], 'reactivate state model');
}

// soft deletes a state
exports.softDeleteStateMdl = (state_id) => {
    log('in softDeleteStateMdl');
    const qry = 'update state_mstr_lst_t set is_active = 0 where is_active = 1 and state_id = ?';
    return dbutils.executeQuery(qry, [state_id], 'soft delete state model');
}

// fetches an active state by id, used to validate the parent before saving a district
exports.getActiveStateByIdMdl = (state_id) => {
    log('in getActiveStateByIdMdl');
    const qry = 'select state_id, state_name from state_mstr_lst_t where is_active = 1 and state_id = ?';
    return dbutils.executeQuery(qry, [state_id], 'get active state by id model');
}

// counts active districts mapped to a state, used to block deleting a state that is in use
exports.countActiveDistrictsByStateMdl = (state_id) => {
    log('in countActiveDistrictsByStateMdl');
    const qry = 'select count(*) as cnt from district_mstr_lst_t where is_active = 1 and state_id = ?';
    return dbutils.executeQuery(qry, [state_id], 'count active districts by state model');
}

// ===================== DISTRICT MASTER =====================

// fetches active districts along with their parent state, optionally only those under one state
exports.getDistrictsMdl = (state_id = null) => {
    log('in getDistrictsMdl');
    let qry = `select d.district_id, d.district_name, d.district_code, d.state_id, s.state_name, d.is_active,
        DATE_FORMAT(d.created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(d.updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from district_mstr_lst_t d
        join state_mstr_lst_t s on s.state_id = d.state_id
        where d.is_active = 1`;
    const params = [];

    if (state_id) {
        qry += ' and d.state_id = ?';
        params.push(state_id);
    }

    qry += ' order by s.state_name asc, d.district_name asc';
    return dbutils.executeQuery(qry, params, 'get districts model');
}

// finds districts clashing on name (within the same state) or code (across all states), optionally excluding one record
exports.getDuplicateDistrictsMdl = (district_name, district_code, state_id, excludeId = null) => {
    log('in getDuplicateDistrictsMdl');
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
    log('in insertDistrictMdl');
    const qry = 'insert into district_mstr_lst_t (district_name, district_code, state_id) values (?, ?, ?)';
    return dbutils.executeQuery(qry, [data.district_name, data.district_code, data.state_id], 'insert district model');
}

// updates an active district
exports.updateDistrictMdl = (district_id, data) => {
    log('in updateDistrictMdl');
    const qry = 'update district_mstr_lst_t set district_name = ?, district_code = ?, state_id = ? where is_active = 1 and district_id = ?';
    return dbutils.executeQuery(qry, [data.district_name, data.district_code, data.state_id, district_id], 'update district model');
}

// brings back a soft deleted district with the latest details
exports.reactivateDistrictMdl = (district_id, data) => {
    log('in reactivateDistrictMdl');
    const qry = 'update district_mstr_lst_t set district_name = ?, district_code = ?, state_id = ?, is_active = 1 where district_id = ?';
    return dbutils.executeQuery(qry, [data.district_name, data.district_code, data.state_id, district_id], 'reactivate district model');
}

// soft deletes a district
exports.softDeleteDistrictMdl = (district_id) => {
    log('in softDeleteDistrictMdl');
    const qry = 'update district_mstr_lst_t set is_active = 0 where is_active = 1 and district_id = ?';
    return dbutils.executeQuery(qry, [district_id], 'soft delete district model');
}

// fetches an active district by id, used to validate the parent before saving a mandal/village
exports.getActiveDistrictByIdMdl = (district_id) => {
    log('in getActiveDistrictByIdMdl');
    const qry = 'select district_id, district_name, state_id from district_mstr_lst_t where is_active = 1 and district_id = ?';
    return dbutils.executeQuery(qry, [district_id], 'get active district by id model');
}

// counts active mandals/ULBs mapped to a district, used to block deleting a district that is in use
exports.countActiveMandalsByDistrictMdl = (district_id) => {
    log('in countActiveMandalsByDistrictMdl');
    const qry = 'select count(*) as cnt from mandal_ulb_mstr_lst_t where is_active = 1 and district_id = ?';
    return dbutils.executeQuery(qry, [district_id], 'count active mandals by district model');
}

// counts active villages mapped to a district, used to block deleting a district that is in use
exports.countActiveVillagesByDistrictMdl = (district_id) => {
    log('in countActiveVillagesByDistrictMdl');
    const qry = 'select count(*) as cnt from village_sachivalayam_mst_lst_t where is_active = 1 and district_id = ?';
    return dbutils.executeQuery(qry, [district_id], 'count active villages by district model');
}

// ===================== MANDAL / ULB MASTER =====================

// fetches active mandals/ULBs along with their parent district and state, optionally only those under one district
exports.getMandalsMdl = (district_id = null) => {
    log('in getMandalsMdl');
    let qry = `select m.mandal_ulb_id, m.mandal_ulb_nm, m.mandal_ulb_code, m.district_id, m.is_ulb, m.is_active,
        d.district_name, s.state_id, s.state_name,
        DATE_FORMAT(m.created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(m.updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from mandal_ulb_mstr_lst_t m
        join district_mstr_lst_t d on d.district_id = m.district_id
        join state_mstr_lst_t s on s.state_id = d.state_id
        where m.is_active = 1`;
    const params = [];

    if (district_id) {
        qry += ' and m.district_id = ?';
        params.push(district_id);
    }

    qry += ' order by d.district_name asc, m.mandal_ulb_nm asc';
    return dbutils.executeQuery(qry, params, 'get mandals model');
}

// finds mandals/ULBs clashing on name (within the same district) or code (across all districts), optionally excluding one record
exports.getDuplicateMandalsMdl = (mandal_ulb_nm, mandal_ulb_code, district_id, excludeId = null) => {
    log('in getDuplicateMandalsMdl');
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
    log('in insertMandalMdl');
    const qry = 'insert into mandal_ulb_mstr_lst_t (mandal_ulb_nm, mandal_ulb_code, district_id, is_ulb) values (?, ?, ?, ?)';
    return dbutils.executeQuery(qry, [data.mandal_ulb_nm, data.mandal_ulb_code, data.district_id, data.is_ulb], 'insert mandal model');
}

// updates an active mandal/ULB
exports.updateMandalMdl = (mandal_ulb_id, data) => {
    log('in updateMandalMdl');
    const qry = 'update mandal_ulb_mstr_lst_t set mandal_ulb_nm = ?, mandal_ulb_code = ?, district_id = ?, is_ulb = ? where is_active = 1 and mandal_ulb_id = ?';
    return dbutils.executeQuery(qry, [data.mandal_ulb_nm, data.mandal_ulb_code, data.district_id, data.is_ulb, mandal_ulb_id], 'update mandal model');
}

// brings back a soft deleted mandal/ULB with the latest details
exports.reactivateMandalMdl = (mandal_ulb_id, data) => {
    log('in reactivateMandalMdl');
    const qry = 'update mandal_ulb_mstr_lst_t set mandal_ulb_nm = ?, mandal_ulb_code = ?, district_id = ?, is_ulb = ?, is_active = 1 where mandal_ulb_id = ?';
    return dbutils.executeQuery(qry, [data.mandal_ulb_nm, data.mandal_ulb_code, data.district_id, data.is_ulb, mandal_ulb_id], 'reactivate mandal model');
}

// soft deletes a mandal/ULB
exports.softDeleteMandalMdl = (mandal_ulb_id) => {
    log('in softDeleteMandalMdl');
    const qry = 'update mandal_ulb_mstr_lst_t set is_active = 0 where is_active = 1 and mandal_ulb_id = ?';
    return dbutils.executeQuery(qry, [mandal_ulb_id], 'soft delete mandal model');
}

// fetches an active mandal/ULB by id, used to validate the parent before saving a village
exports.getActiveMandalByIdMdl = (mandal_ulb_id) => {
    log('in getActiveMandalByIdMdl');
    const qry = 'select mandal_ulb_id, mandal_ulb_nm, district_id from mandal_ulb_mstr_lst_t where is_active = 1 and mandal_ulb_id = ?';
    return dbutils.executeQuery(qry, [mandal_ulb_id], 'get active mandal by id model');
}

// counts active villages mapped to a mandal/ULB, used to block deleting a mandal that is in use
exports.countActiveVillagesByMandalMdl = (mandal_ulb_id) => {
    log('in countActiveVillagesByMandalMdl');
    const qry = 'select count(*) as cnt from village_sachivalayam_mst_lst_t where is_active = 1 and mandal_ulb_id = ?';
    return dbutils.executeQuery(qry, [mandal_ulb_id], 'count active villages by mandal model');
}

// ===================== VILLAGE / SACHIVALAYAM MASTER =====================

// fetches active villages/sachivalayams along with their parent district and mandal, optionally only those under one district
exports.getVillagesMdl = (district_id = null) => {
    log('in getVillagesMdl');
    let qry = `select v.village_sachivalayam_id, v.village_sachivalayam_nm, v.village_sachivalayam_code,
        v.district_id, v.mandal_ulb_id, v.is_sachivalayam, v.is_active,
        d.state_id, d.district_name, m.mandal_ulb_nm,
        DATE_FORMAT(v.created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(v.updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from village_sachivalayam_mst_lst_t v
        join district_mstr_lst_t d on d.district_id = v.district_id
        left join mandal_ulb_mstr_lst_t m on m.mandal_ulb_id = v.mandal_ulb_id
        where v.is_active = 1`;
    const params = [];

    if (district_id) {
        qry += ' and v.district_id = ?';
        params.push(district_id);
    }

    qry += ' order by d.district_name asc, v.village_sachivalayam_nm asc';
    return dbutils.executeQuery(qry, params, 'get villages model');
}

// finds villages clashing on name (within the same district and mandal) or code (across all), optionally excluding one record
exports.getDuplicateVillagesMdl = (village_sachivalayam_nm, village_sachivalayam_code, district_id, mandal_ulb_id, excludeId = null) => {
    log('in getDuplicateVillagesMdl');
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
    log('in insertVillageMdl');
    const qry = 'insert into village_sachivalayam_mst_lst_t (village_sachivalayam_nm, village_sachivalayam_code, district_id, mandal_ulb_id, is_sachivalayam) values (?, ?, ?, ?, ?)';
    return dbutils.executeQuery(qry, [data.village_sachivalayam_nm, data.village_sachivalayam_code, data.district_id, data.mandal_ulb_id, data.is_sachivalayam], 'insert village model');
}

// updates an active village/sachivalayam
exports.updateVillageMdl = (village_sachivalayam_id, data) => {
    log('in updateVillageMdl');
    const qry = `update village_sachivalayam_mst_lst_t set village_sachivalayam_nm = ?, village_sachivalayam_code = ?,
        district_id = ?, mandal_ulb_id = ?, is_sachivalayam = ? where is_active = 1 and village_sachivalayam_id = ?`;
    return dbutils.executeQuery(qry, [data.village_sachivalayam_nm, data.village_sachivalayam_code, data.district_id, data.mandal_ulb_id, data.is_sachivalayam, village_sachivalayam_id], 'update village model');
}

// brings back a soft deleted village/sachivalayam with the latest details
exports.reactivateVillageMdl = (village_sachivalayam_id, data) => {
    log('in reactivateVillageMdl');
    const qry = `update village_sachivalayam_mst_lst_t set village_sachivalayam_nm = ?, village_sachivalayam_code = ?,
        district_id = ?, mandal_ulb_id = ?, is_sachivalayam = ?, is_active = 1 where village_sachivalayam_id = ?`;
    return dbutils.executeQuery(qry, [data.village_sachivalayam_nm, data.village_sachivalayam_code, data.district_id, data.mandal_ulb_id, data.is_sachivalayam, village_sachivalayam_id], 'reactivate village model');
}

// fetches an active village/sachivalayam by id along with its parents, used for validation before saving
exports.getActiveVillageByIdMdl = (village_sachivalayam_id) => {
    log('in getActiveVillageByIdMdl');
    const qry = 'select village_sachivalayam_id, village_sachivalayam_nm, district_id, mandal_ulb_id from village_sachivalayam_mst_lst_t where is_active = 1 and village_sachivalayam_id = ?';
    return dbutils.executeQuery(qry, [village_sachivalayam_id], 'get active village by id model');
}

// soft deletes a village/sachivalayam
exports.softDeleteVillageMdl = (village_sachivalayam_id) => {
    log('in softDeleteVillageMdl');
    const qry = 'update village_sachivalayam_mst_lst_t set is_active = 0 where is_active = 1 and village_sachivalayam_id = ?';
    return dbutils.executeQuery(qry, [village_sachivalayam_id], 'soft delete village model');
}

// ===================== ROLE MASTER =====================

// fetches all active roles along with their hierarchy name
exports.getRolesMdl = () => {
    log('in getRolesMdl');
    const qry = `select r.role_id, r.role_nm, r.role_hndlr, r.description, r.landing_url, r.hierarchy_id,
        h.hierarchy_nm, r.is_active,
        DATE_FORMAT(r.created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(r.updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from roles_lst_t r
        left join hierarchy_lst_t h on h.hirrarchy_id = r.hierarchy_id and h.is_active = 1
        where r.is_active = 1 order by r.role_nm asc`;
    return dbutils.executeQuery(qry, [], 'get roles model');
}

// fetches active hierarchies for the role form dropdown
exports.getHierarchiesMdl = () => {
    log('in getHierarchiesMdl');
    const qry = `select hirrarchy_id as hierarchy_id, hierarchy_nm, level_type
        from hierarchy_lst_t where is_active = 1 order by hierarchy_nm asc`;
    return dbutils.executeQuery(qry, [], 'get hierarchies model');
}

// fetches an active hierarchy by id, used to validate the parent before saving a role
exports.getActiveHierarchyByIdMdl = (hierarchy_id) => {
    log('in getActiveHierarchyByIdMdl');
    const qry = 'select hirrarchy_id as hierarchy_id, hierarchy_nm from hierarchy_lst_t where is_active = 1 and hirrarchy_id = ?';
    return dbutils.executeQuery(qry, [hierarchy_id], 'get active hierarchy by id model');
}

// finds roles matching the given name or handler (active and inactive), optionally excluding one record
exports.getDuplicateRolesMdl = (role_nm, role_hndlr, excludeId = null) => {
    log('in getDuplicateRolesMdl');
    let qry = `select role_id, role_nm, role_hndlr, is_active from roles_lst_t
        where (lower(role_nm) = lower(?) or lower(role_hndlr) = lower(?))`;
    const params = [role_nm, role_hndlr];

    if (excludeId) {
        qry += ' and role_id <> ?';
        params.push(excludeId);
    }
    return dbutils.executeQuery(qry, params, 'get duplicate roles model');
}

// inserts a new role
exports.insertRoleMdl = (data) => {
    log('in insertRoleMdl');
    const qry = 'insert into roles_lst_t (role_nm, role_hndlr, description, landing_url, hierarchy_id) values (?, ?, ?, ?, ?)';
    return dbutils.executeQuery(qry, [data.role_nm, data.role_hndlr, data.description, data.landing_url, data.hierarchy_id], 'insert role model');
}

// updates an active role
exports.updateRoleMdl = (role_id, data) => {
    log('in updateRoleMdl');
    const qry = `update roles_lst_t set role_nm = ?, role_hndlr = ?, description = ?, landing_url = ?, hierarchy_id = ?
        where is_active = 1 and role_id = ?`;
    return dbutils.executeQuery(qry, [data.role_nm, data.role_hndlr, data.description, data.landing_url, data.hierarchy_id, role_id], 'update role model');
}

// brings back a soft deleted role with the latest details
exports.reactivateRoleMdl = (role_id, data) => {
    log('in reactivateRoleMdl');
    const qry = `update roles_lst_t set role_nm = ?, role_hndlr = ?, description = ?, landing_url = ?, hierarchy_id = ?, is_active = 1
        where role_id = ?`;
    return dbutils.executeQuery(qry, [data.role_nm, data.role_hndlr, data.description, data.landing_url, data.hierarchy_id, role_id], 'reactivate role model');
}

// fetches an active role by id
exports.getActiveRoleByIdMdl = (role_id) => {
    log('in getActiveRoleByIdMdl');
    const qry = 'select role_id, role_nm, role_hndlr from roles_lst_t where is_active = 1 and role_id = ?';
    return dbutils.executeQuery(qry, [role_id], 'get active role by id model');
}

// counts active users mapped to a role, used to block deleting a role that is in use
exports.countActiveUsersByRoleMdl = (role_id) => {
    log('in countActiveUsersByRoleMdl');
    const qry = 'select count(*) as cnt from users_lst_t where is_active = 1 and role_id = ?';
    return dbutils.executeQuery(qry, [role_id], 'count active users by role model');
}

// soft deletes a role
exports.softDeleteRoleMdl = (role_id) => {
    log('in softDeleteRoleMdl');
    const qry = 'update roles_lst_t set is_active = 0 where is_active = 1 and role_id = ?';
    return dbutils.executeQuery(qry, [role_id], 'soft delete role model');
}

// ===================== GENDER MASTER =====================

// fetches all active genders
exports.getGendersMdl = () => {
    log('in getGendersMdl');
    const qry = `select gender_id, gender_nm, gender_code, is_active,
        DATE_FORMAT(created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from gender_mstr_lst_t where is_active = 1 order by gender_nm asc`;
    return dbutils.executeQuery(qry, [], 'get genders model');
}

// finds genders matching the given name or code (active and inactive), optionally excluding one record
exports.getDuplicateGendersMdl = (gender_nm, gender_code, excludeId = null) => {
    log('in getDuplicateGendersMdl');
    let qry = `select gender_id, gender_nm, gender_code, is_active from gender_mstr_lst_t
        where (lower(gender_nm) = lower(?) or lower(gender_code) = lower(?))`;
    const params = [gender_nm, gender_code];

    if (excludeId) {
        qry += ' and gender_id <> ?';
        params.push(excludeId);
    }
    return dbutils.executeQuery(qry, params, 'get duplicate genders model');
}

// inserts a new gender
exports.insertGenderMdl = (data) => {
    log('in insertGenderMdl');
    const qry = 'insert into gender_mstr_lst_t (gender_nm, gender_code) values (?, ?)';
    return dbutils.executeQuery(qry, [data.gender_nm, data.gender_code], 'insert gender model');
}

// updates an active gender
exports.updateGenderMdl = (gender_id, data) => {
    log('in updateGenderMdl');
    const qry = 'update gender_mstr_lst_t set gender_nm = ?, gender_code = ? where is_active = 1 and gender_id = ?';
    return dbutils.executeQuery(qry, [data.gender_nm, data.gender_code, gender_id], 'update gender model');
}

// brings back a soft deleted gender with the latest details
exports.reactivateGenderMdl = (gender_id, data) => {
    log('in reactivateGenderMdl');
    const qry = 'update gender_mstr_lst_t set gender_nm = ?, gender_code = ?, is_active = 1 where gender_id = ?';
    return dbutils.executeQuery(qry, [data.gender_nm, data.gender_code, gender_id], 'reactivate gender model');
}

// fetches an active gender by id
exports.getActiveGenderByIdMdl = (gender_id) => {
    log('in getActiveGenderByIdMdl');
    const qry = 'select gender_id, gender_nm from gender_mstr_lst_t where is_active = 1 and gender_id = ?';
    return dbutils.executeQuery(qry, [gender_id], 'get active gender by id model');
}

// soft deletes a gender
exports.softDeleteGenderMdl = (gender_id) => {
    log('in softDeleteGenderMdl');
    const qry = 'update gender_mstr_lst_t set is_active = 0 where is_active = 1 and gender_id = ?';
    return dbutils.executeQuery(qry, [gender_id], 'soft delete gender model');
}

// ===================== HIERARCHY MASTER =====================

// fetches all active hierarchies along with their parent hierarchy name
exports.getHierarchyListMdl = () => {
    log('in getHierarchyListMdl');
    const qry = `select h.hirrarchy_id as hierarchy_id, h.hierarchy_nm, h.level_type, h.parent_hirrarchy_id,
        p.hierarchy_nm as parent_hierarchy_nm, h.is_active,
        DATE_FORMAT(h.created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(h.updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from hierarchy_lst_t h
        left join hierarchy_lst_t p on p.hirrarchy_id = h.parent_hirrarchy_id
        where h.is_active = 1 order by h.hierarchy_nm asc`;
    return dbutils.executeQuery(qry, [], 'get hierarchy list model');
}

// finds hierarchies matching the given name (active and inactive), optionally excluding one record
exports.getDuplicateHierarchiesMdl = (hierarchy_nm, excludeId = null) => {
    log('in getDuplicateHierarchiesMdl');
    let qry = 'select hirrarchy_id as hierarchy_id, hierarchy_nm, is_active from hierarchy_lst_t where lower(hierarchy_nm) = lower(?)';
    const params = [hierarchy_nm];

    if (excludeId) {
        qry += ' and hirrarchy_id <> ?';
        params.push(excludeId);
    }
    return dbutils.executeQuery(qry, params, 'get duplicate hierarchies model');
}

// inserts a new hierarchy
exports.insertHierarchyMdl = (data) => {
    log('in insertHierarchyMdl');
    const qry = 'insert into hierarchy_lst_t (hierarchy_nm, level_type, parent_hirrarchy_id) values (?, ?, ?)';
    return dbutils.executeQuery(qry, [data.hierarchy_nm, data.level_type, data.parent_hirrarchy_id], 'insert hierarchy model');
}

// updates an active hierarchy
exports.updateHierarchyMdl = (hierarchy_id, data) => {
    log('in updateHierarchyMdl');
    const qry = 'update hierarchy_lst_t set hierarchy_nm = ?, level_type = ?, parent_hirrarchy_id = ? where is_active = 1 and hirrarchy_id = ?';
    return dbutils.executeQuery(qry, [data.hierarchy_nm, data.level_type, data.parent_hirrarchy_id, hierarchy_id], 'update hierarchy model');
}

// brings back a soft deleted hierarchy with the latest details
exports.reactivateHierarchyMdl = (hierarchy_id, data) => {
    log('in reactivateHierarchyMdl');
    const qry = 'update hierarchy_lst_t set hierarchy_nm = ?, level_type = ?, parent_hirrarchy_id = ?, is_active = 1 where hirrarchy_id = ?';
    return dbutils.executeQuery(qry, [data.hierarchy_nm, data.level_type, data.parent_hirrarchy_id, hierarchy_id], 'reactivate hierarchy model');
}

// fetches the parent pointer of a hierarchy, used to walk the chain for cycle detection
exports.getHierarchyParentMdl = (hierarchy_id) => {
    log('in getHierarchyParentMdl');
    const qry = 'select hirrarchy_id as hierarchy_id, parent_hirrarchy_id from hierarchy_lst_t where hirrarchy_id = ?';
    return dbutils.executeQuery(qry, [hierarchy_id], 'get hierarchy parent model');
}

// counts active child hierarchies, used to block deleting a hierarchy that is a parent
exports.countActiveChildHierarchiesMdl = (hierarchy_id) => {
    log('in countActiveChildHierarchiesMdl');
    const qry = 'select count(*) as cnt from hierarchy_lst_t where is_active = 1 and parent_hirrarchy_id = ?';
    return dbutils.executeQuery(qry, [hierarchy_id], 'count active child hierarchies model');
}

// counts active roles mapped to a hierarchy, used to block deleting a hierarchy that is in use
exports.countActiveRolesByHierarchyMdl = (hierarchy_id) => {
    log('in countActiveRolesByHierarchyMdl');
    const qry = 'select count(*) as cnt from roles_lst_t where is_active = 1 and hierarchy_id = ?';
    return dbutils.executeQuery(qry, [hierarchy_id], 'count active roles by hierarchy model');
}

// counts active positions mapped to a hierarchy, used to block deleting a hierarchy that is in use
exports.countActivePositionsByHierarchyMdl = (hierarchy_id) => {
    log('in countActivePositionsByHierarchyMdl');
    const qry = 'select count(*) as cnt from position_lst_t where is_active = 1 and hierarchy_id = ?';
    return dbutils.executeQuery(qry, [hierarchy_id], 'count active positions by hierarchy model');
}

// soft deletes a hierarchy
exports.softDeleteHierarchyMdl = (hierarchy_id) => {
    log('in softDeleteHierarchyMdl');
    const qry = 'update hierarchy_lst_t set is_active = 0 where is_active = 1 and hirrarchy_id = ?';
    return dbutils.executeQuery(qry, [hierarchy_id], 'soft delete hierarchy model');
}

// ===================== POSITION MASTER =====================

// fetches all active positions with their role, hierarchy, assigned user and location names.
// location_ref_id points at a BRANCH; the dairy farm is derived through it for display and edit.
// unset location ids (stored as 0) come back as null so the edit form treats them as empty;
// start/end dates come back as YYYY-MM-DD so the edit form's date inputs can load them
exports.getPositionsMdl = (user) => {
    log('in getPositionsMdl');
    const scope = scopeutils.getScopeFilter(user, 'p', scopeutils.POSITION_SCOPE_COLUMNS);

    const qry = `select p.position_id, p.position_nm, p.role_id, p.hierarchy_id, p.user_id, p.is_active,
        nullif(p.district_id, 0) as district_id, nullif(p.mandal_ulb_id, 0) as mandal_ulb_id,
        nullif(p.village_sachivalayam_id, 0) as village_sachivalayam_id, p.dairy_farm_id, p.location_ref_id,
        r.role_nm, h.hierarchy_nm,
        s.state_id, s.state_name, d.district_name, m.mandal_ulb_nm, v.village_sachivalayam_nm,
        br.branch_name, df.dairy_farm_name,
        ifnull(nullif(trim(concat(ifnull(u.first_nm, ''), ' ', ifnull(u.last_nm, ''))), ''), u.user_nm) as assigned_user,
        DATE_FORMAT(p.start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(p.end_date, '%Y-%m-%d') as end_date,
        DATE_FORMAT(p.created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(p.updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from position_lst_t p
        join roles_lst_t r on r.role_id = p.role_id
        join hierarchy_lst_t h on h.hirrarchy_id = p.hierarchy_id
        left join users_lst_t u on u.user_id = p.user_id
        left join district_mstr_lst_t d on d.district_id = p.district_id
        left join state_mstr_lst_t s on s.state_id = d.state_id
        left join mandal_ulb_mstr_lst_t m on m.mandal_ulb_id = p.mandal_ulb_id
        left join village_sachivalayam_mst_lst_t v on v.village_sachivalayam_id = p.village_sachivalayam_id
        left join branches_lst_t br on br.branch_id = p.location_ref_id
        left join dairy_farm_lst_t df on df.dairy_farm_id = p.dairy_farm_id
        where p.is_active = 1${scope.clause} order by p.position_nm asc`;
    return dbutils.executeQuery(qry, scope.params, 'get positions model');
}

// fetches active branches (with their stored location) for the position form dropdown,
// optionally only those under one dairy farm, restricted to the logged in user's scope
exports.getPositionBranchesMdl = (user, dairy_farm_id = null) => {
    log('in getPositionBranchesMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    let qry = `select b.branch_id, b.branch_name, b.is_main_branch, b.dairy_farm_id,
        b.state_id, b.district_id, b.mandal_ulb_id, b.village_sachivalayam_id
        from branches_lst_t b where b.is_active = 1${scope.clause}`;
    const params = [...scope.params];

    if (dairy_farm_id) {
        qry += ' and b.dairy_farm_id = ?';
        params.push(dairy_farm_id);
    }

    qry += ' order by b.is_main_branch desc, b.branch_name asc';
    return dbutils.executeQuery(qry, params, 'get position branches model');
}

// fetches an active branch by id, used to validate the position's branch before saving
exports.getActiveBranchByIdMdl = (branch_id) => {
    log('in getActiveBranchByIdMdl');
    const qry = 'select branch_id, branch_name, dairy_farm_id from branches_lst_t where is_active = 1 and branch_id = ?';
    return dbutils.executeQuery(qry, [branch_id], 'get active branch by id model');
}

// fetches active roles for the position form dropdown
exports.getPositionRolesMdl = () => {
    log('in getPositionRolesMdl');
    const qry = 'select role_id, role_nm from roles_lst_t where is_active = 1 order by role_nm asc';
    return dbutils.executeQuery(qry, [], 'get position roles model');
}

// fetches active users who hold no active position, for the position form dropdown;
// when editing, the position's own assignee stays selectable via excludePositionId
exports.getPositionUsersMdl = (excludePositionId = null) => {
    log('in getPositionUsersMdl');
    let qry = `select u.user_id, u.user_nm, u.first_nm, u.last_nm from users_lst_t u
        where u.is_active = 1 and not exists (
            select 1 from position_lst_t p
            where p.is_active = 1 and p.user_id = u.user_id
            and (p.end_date is null or p.end_date >= curdate())`;
    const params = [];

    if (excludePositionId) {
        qry += ' and p.position_id <> ?';
        params.push(excludePositionId);
    }

    qry += ') order by u.first_nm asc, u.user_nm asc';
    return dbutils.executeQuery(qry, params, 'get position users model');
}

// stamps the assigned position's role onto the user row - login resolves permissions
// through users_lst_t.role_id, so the position assignment is what grants the role
exports.updateUserRoleMdl = (user_id, role_id) => {
    log('in updateUserRoleMdl');
    const qry = 'update users_lst_t set role_id = ? where is_active = 1 and user_id = ?';
    return dbutils.executeQuery(qry, [role_id, user_id], 'update user role model');
}

// fetches an active user by id, used to validate the assignment before saving a position
exports.getActiveUserByIdMdl = (user_id) => {
    log('in getActiveUserByIdMdl');
    const qry = 'select user_id, user_nm from users_lst_t where is_active = 1 and user_id = ?';
    return dbutils.executeQuery(qry, [user_id], 'get active user by id model');
}

// counts other active, unexpired positions held by a user - login expects at most one
exports.countActivePositionsByUserMdl = (user_id, excludePositionId = null) => {
    log('in countActivePositionsByUserMdl');
    let qry = `select count(*) as cnt from position_lst_t
        where is_active = 1 and user_id = ? and (end_date is null or end_date >= curdate())`;
    const params = [user_id];

    if (excludePositionId) {
        qry += ' and position_id <> ?';
        params.push(excludePositionId);
    }
    return dbutils.executeQuery(qry, params, 'count active positions by user model');
}

// finds positions clashing on name within the same role, hierarchy and location, optionally excluding one record
// unset district/mandal/village are stored as 0 and location_ref_id as null, so plain equality works after normalization
exports.getDuplicatePositionsMdl = (data, excludeId = null) => {
    log('in getDuplicatePositionsMdl');
    let qry = `select position_id, position_nm, is_active from position_lst_t
        where lower(position_nm) = lower(?) and role_id = ? and hierarchy_id = ?
        and district_id = ? and mandal_ulb_id = ? and village_sachivalayam_id = ?
        and ifnull(dairy_farm_id, 0) = ifnull(?, 0) and ifnull(location_ref_id, 0) = ifnull(?, 0)`;
    const params = [data.position_nm, data.role_id, data.hierarchy_id, data.district_id, data.mandal_ulb_id, data.village_sachivalayam_id, data.dairy_farm_id, data.location_ref_id];

    if (excludeId) {
        qry += ' and position_id <> ?';
        params.push(excludeId);
    }
    return dbutils.executeQuery(qry, params, 'get duplicate positions model');
}

// inserts a new position
exports.insertPositionMdl = (data) => {
    log('in insertPositionMdl');
    const qry = `insert into position_lst_t (position_nm, role_id, hierarchy_id, user_id, district_id, mandal_ulb_id, village_sachivalayam_id, dairy_farm_id, location_ref_id, start_date, end_date)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return dbutils.executeQuery(qry, [data.position_nm, data.role_id, data.hierarchy_id, data.user_id, data.district_id, data.mandal_ulb_id, data.village_sachivalayam_id, data.dairy_farm_id, data.location_ref_id, data.start_date, data.end_date], 'insert position model');
}

// updates an active position
exports.updatePositionMdl = (position_id, data) => {
    log('in updatePositionMdl');
    const qry = `update position_lst_t set position_nm = ?, role_id = ?, hierarchy_id = ?, user_id = ?,
        district_id = ?, mandal_ulb_id = ?, village_sachivalayam_id = ?, dairy_farm_id = ?, location_ref_id = ?, start_date = ?, end_date = ?
        where is_active = 1 and position_id = ?`;
    return dbutils.executeQuery(qry, [data.position_nm, data.role_id, data.hierarchy_id, data.user_id, data.district_id, data.mandal_ulb_id, data.village_sachivalayam_id, data.dairy_farm_id, data.location_ref_id, data.start_date, data.end_date, position_id], 'update position model');
}

// brings back a soft deleted position with the latest details
exports.reactivatePositionMdl = (position_id, data) => {
    log('in reactivatePositionMdl');
    const qry = `update position_lst_t set position_nm = ?, role_id = ?, hierarchy_id = ?, user_id = ?,
        district_id = ?, mandal_ulb_id = ?, village_sachivalayam_id = ?, dairy_farm_id = ?, location_ref_id = ?, start_date = ?, end_date = ?, is_active = 1
        where position_id = ?`;
    return dbutils.executeQuery(qry, [data.position_nm, data.role_id, data.hierarchy_id, data.user_id, data.district_id, data.mandal_ulb_id, data.village_sachivalayam_id, data.dairy_farm_id, data.location_ref_id, data.start_date, data.end_date, position_id], 'reactivate position model');
}

// fetches an active position by id
exports.getActivePositionByIdMdl = (position_id) => {
    log('in getActivePositionByIdMdl');
    const qry = 'select position_id, position_nm, user_id from position_lst_t where is_active = 1 and position_id = ?';
    return dbutils.executeQuery(qry, [position_id], 'get active position by id model');
}

// soft deletes a position
exports.softDeletePositionMdl = (position_id) => {
    log('in softDeletePositionMdl');
    const qry = 'update position_lst_t set is_active = 0 where is_active = 1 and position_id = ?';
    return dbutils.executeQuery(qry, [position_id], 'soft delete position model');
}

// ===================== DAIRY FARM MASTER =====================
// dairy_farm_lst_t uses created_time/updated_time columns; they are aliased to
// created_at/updated_at so the client renders every master the same way

// fetches active dairy farms along with their main branch and its location names,
// restricted to the logged in user's scope
exports.getDairyFarmsMdl = (user) => {
    log('in getDairyFarmsMdl');
    const scope = scopeutils.getScopeFilter(user, 'sb');

    let qry = `select df.dairy_farm_id, df.dairy_farm_name, df.dairy_farm_code, df.contact_number, df.email, df.address, df.is_active,
        b.branch_id as main_branch_id, b.branch_code as main_branch_code, b.branch_name as main_branch_name,
        b.state_id, b.district_id, b.mandal_ulb_id, b.village_sachivalayam_id,
        s.state_name, d.district_name, m.mandal_ulb_nm, v.village_sachivalayam_nm,
        DATE_FORMAT(df.created_time, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(df.updated_time, '%d-%m-%Y %h:%i %p') as updated_at
        from dairy_farm_lst_t df
        left join branches_lst_t b on b.dairy_farm_id = df.dairy_farm_id and b.is_main_branch = 1 and b.is_active = 1
        left join state_mstr_lst_t s on s.state_id = b.state_id
        left join district_mstr_lst_t d on d.district_id = b.district_id
        left join mandal_ulb_mstr_lst_t m on m.mandal_ulb_id = b.mandal_ulb_id
        left join village_sachivalayam_mst_lst_t v on v.village_sachivalayam_id = b.village_sachivalayam_id
        where df.is_active = 1`;

    // a farm is visible when ANY of its branches falls inside the user's scope
    if (scope.clause) {
        qry += ` and exists (select 1 from branches_lst_t sb
            where sb.is_active = 1 and sb.dairy_farm_id = df.dairy_farm_id${scope.clause})`;
    }

    qry += ' order by df.dairy_farm_name asc';
    return dbutils.executeQuery(qry, scope.params, 'get dairy farms model');
}

// finds records matching the given name (active and inactive), optionally excluding one record
// codes are generated server-side, so duplicates are detected by name alone
exports.getDuplicateDairyFarmsMdl = (dairy_farm_name, excludeId = null) => {
    log('in getDuplicateDairyFarmsMdl');
    let qry = `select dairy_farm_id, dairy_farm_name, dairy_farm_code, is_active from dairy_farm_lst_t
        where lower(dairy_farm_name) = lower(?)`;
    const params = [dairy_farm_name];

    if (excludeId) {
        qry += ' and dairy_farm_id <> ?';
        params.push(excludeId);
    }
    return dbutils.executeQuery(qry, params, 'get duplicate dairy farms model');
}

// checks whether a generated code is already taken (active or inactive - the column is unique)
exports.getDairyFarmByCodeMdl = (dairy_farm_code) => {
    log('in getDairyFarmByCodeMdl');
    const qry = 'select dairy_farm_id from dairy_farm_lst_t where dairy_farm_code = ?';
    return dbutils.executeQuery(qry, [dairy_farm_code], 'get dairy farm by code model');
}

// inserts a new dairy farm
exports.insertDairyFarmMdl = (data, user_id) => {
    log('in insertDairyFarmMdl');
    const qry = `insert into dairy_farm_lst_t (dairy_farm_name, dairy_farm_code, contact_number, email, address, created_by)
        values (?, ?, ?, ?, ?, ?)`;
    return dbutils.executeQuery(qry, [data.dairy_farm_name, data.dairy_farm_code, data.contact_number, data.email, data.address, user_id], 'insert dairy farm model');
}

// updates an active dairy farm; the generated code never changes once assigned
exports.updateDairyFarmMdl = (dairy_farm_id, data, user_id) => {
    log('in updateDairyFarmMdl');
    const qry = `update dairy_farm_lst_t set dairy_farm_name = ?, contact_number = ?, email = ?, address = ?, updated_by = ?
        where is_active = 1 and dairy_farm_id = ?`;
    return dbutils.executeQuery(qry, [data.dairy_farm_name, data.contact_number, data.email, data.address, user_id, dairy_farm_id], 'update dairy farm model');
}

// brings back a soft deleted dairy farm with the latest details, keeping its original code
exports.reactivateDairyFarmMdl = (dairy_farm_id, data, user_id) => {
    log('in reactivateDairyFarmMdl');
    const qry = `update dairy_farm_lst_t set dairy_farm_name = ?, contact_number = ?, email = ?, address = ?,
        updated_by = ?, deleted_by = null, deleted_time = null, is_active = 1 where dairy_farm_id = ?`;
    return dbutils.executeQuery(qry, [data.dairy_farm_name, data.contact_number, data.email, data.address, user_id, dairy_farm_id], 'reactivate dairy farm model');
}

// fetches an active dairy farm by id
exports.getActiveDairyFarmByIdMdl = (dairy_farm_id) => {
    log('in getActiveDairyFarmByIdMdl');
    const qry = 'select dairy_farm_id, dairy_farm_name, dairy_farm_code from dairy_farm_lst_t where is_active = 1 and dairy_farm_id = ?';
    return dbutils.executeQuery(qry, [dairy_farm_id], 'get active dairy farm by id model');
}

// counts active sub branches (main excluded) - only these block deleting a farm,
// because the main branch is deactivated together with the farm itself
exports.countActiveSubBranchesByDairyFarmMdl = (dairy_farm_id) => {
    log('in countActiveSubBranchesByDairyFarmMdl');
    const qry = 'select count(*) as cnt from branches_lst_t where is_active = 1 and is_main_branch = 0 and dairy_farm_id = ?';
    return dbutils.executeQuery(qry, [dairy_farm_id], 'count active sub branches by dairy farm model');
}

// checks whether a generated branch code is already taken (the column is unique)
exports.getBranchByCodeMdl = (branch_code) => {
    log('in getBranchByCodeMdl');
    const qry = 'select branch_id from branches_lst_t where branch_code = ?';
    return dbutils.executeQuery(qry, [branch_code], 'get branch by code model');
}

// fetches a farm's main branch regardless of active state, active row first -
// the caller decides whether to update, reactivate or create it
exports.getMainBranchByFarmMdl = (dairy_farm_id) => {
    log('in getMainBranchByFarmMdl');
    const qry = `select branch_id, branch_code, branch_name, is_active from branches_lst_t
        where is_main_branch = 1 and dairy_farm_id = ? order by is_active desc limit 1`;
    return dbutils.executeQuery(qry, [dairy_farm_id], 'get main branch by farm model');
}

// creates a dairy farm and its main branch atomically - a farm must never exist without one
exports.createDairyFarmWithMainBranchMdl = (farm, branch, user_id) => {
    log('in createDairyFarmWithMainBranchMdl');
    return dbutils.executeTransaction(async (connection) => {
        const [farmResult] = await connection.execute(
            `insert into dairy_farm_lst_t (dairy_farm_name, dairy_farm_code, contact_number, email, address, created_by)
                values (?, ?, ?, ?, ?, ?)`,
            [farm.dairy_farm_name, farm.dairy_farm_code, farm.contact_number, farm.email, farm.address, user_id]
        );

        // the main branch shares the farm's contact details
        await connection.execute(
            `insert into branches_lst_t (dairy_farm_id, branch_code, branch_name, is_main_branch,
                state_id, district_id, mandal_ulb_id, village_sachivalayam_id, contact_number, email, address, created_by)
                values (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [farmResult.insertId, branch.branch_code, branch.branch_name,
                branch.state_id, branch.district_id, branch.mandal_ulb_id, branch.village_sachivalayam_id,
                farm.contact_number, farm.email, farm.address, user_id]
        );

        return { insertId: farmResult.insertId };
    }, 'create dairy farm with main branch model');
}

// inserts a main branch for an existing farm (used when a legacy farm is edited or restored)
exports.insertMainBranchMdl = (dairy_farm_id, branch, farm, user_id) => {
    log('in insertMainBranchMdl');
    const qry = `insert into branches_lst_t (dairy_farm_id, branch_code, branch_name, is_main_branch,
        state_id, district_id, mandal_ulb_id, village_sachivalayam_id, contact_number, email, address, created_by)
        values (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return dbutils.executeQuery(qry, [dairy_farm_id, branch.branch_code, branch.branch_name,
        branch.state_id, branch.district_id, branch.mandal_ulb_id, branch.village_sachivalayam_id,
        farm.contact_number, farm.email, farm.address, user_id], 'insert main branch model');
}

// updates a farm's active main branch, keeping its contact details in sync with the farm
exports.updateMainBranchMdl = (branch_id, branch, farm, user_id) => {
    log('in updateMainBranchMdl');
    const qry = `update branches_lst_t set branch_name = ?, state_id = ?, district_id = ?, mandal_ulb_id = ?, village_sachivalayam_id = ?,
        contact_number = ?, email = ?, address = ?, updated_by = ?
        where is_active = 1 and branch_id = ?`;
    return dbutils.executeQuery(qry, [branch.branch_name, branch.state_id, branch.district_id, branch.mandal_ulb_id, branch.village_sachivalayam_id,
        farm.contact_number, farm.email, farm.address, user_id, branch_id], 'update main branch model');
}

// brings back a soft deleted main branch with fresh details
exports.reactivateMainBranchMdl = (branch_id, branch, farm, user_id) => {
    log('in reactivateMainBranchMdl');
    const qry = `update branches_lst_t set branch_name = ?, state_id = ?, district_id = ?, mandal_ulb_id = ?, village_sachivalayam_id = ?,
        contact_number = ?, email = ?, address = ?, updated_by = ?, deleted_by = null, deleted_time = null, is_active = 1
        where branch_id = ?`;
    return dbutils.executeQuery(qry, [branch.branch_name, branch.state_id, branch.district_id, branch.mandal_ulb_id, branch.village_sachivalayam_id,
        farm.contact_number, farm.email, farm.address, user_id, branch_id], 'reactivate main branch model');
}

// soft deletes a dairy farm together with its main branch, atomically
exports.softDeleteDairyFarmWithMainBranchMdl = (dairy_farm_id, user_id) => {
    log('in softDeleteDairyFarmWithMainBranchMdl');
    return dbutils.executeTransactionQueries([
        {
            query: `update branches_lst_t set is_active = 0, deleted_by = ?, deleted_time = current_timestamp
                where is_active = 1 and is_main_branch = 1 and dairy_farm_id = ?`,
            params: [user_id, dairy_farm_id]
        },
        {
            query: `update dairy_farm_lst_t set is_active = 0, deleted_by = ?, deleted_time = current_timestamp
                where is_active = 1 and dairy_farm_id = ?`,
            params: [user_id, dairy_farm_id]
        }
    ], 'soft delete dairy farm with main branch model');
}

// ===================== ROLE PERMISSIONS =====================

// fetches all active role permissions with their role names
exports.getRolePermissionListMdl = () => {
    log('in getRolePermissionListMdl');
    const qry = `select p.role_permission_id, p.role_id, p.permission_key,
        p.can_view, p.can_insert, p.can_update, p.can_delete, p.is_active,
        r.role_nm, r.role_hndlr,
        DATE_FORMAT(p.created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(p.updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from role_permissions_t p
        join roles_lst_t r on r.role_id = p.role_id
        where p.is_active = 1 order by r.role_nm asc, p.permission_key asc`;
    return dbutils.executeQuery(qry, [], 'get role permission list model');
}

// finds permission rows for the same role and key (active and inactive), optionally excluding one record
exports.getDuplicateRolePermissionsMdl = (role_id, permission_key, excludeId = null) => {
    log('in getDuplicateRolePermissionsMdl');
    let qry = `select role_permission_id, role_id, permission_key, is_active from role_permissions_t
        where role_id = ? and lower(permission_key) = lower(?)`;
    const params = [role_id, permission_key];

    if (excludeId) {
        qry += ' and role_permission_id <> ?';
        params.push(excludeId);
    }
    return dbutils.executeQuery(qry, params, 'get duplicate role permissions model');
}

// inserts a new role permission
exports.insertRolePermissionMdl = (data) => {
    log('in insertRolePermissionMdl');
    const qry = `insert into role_permissions_t (role_id, permission_key, can_view, can_insert, can_update, can_delete)
        values (?, ?, ?, ?, ?, ?)`;
    return dbutils.executeQuery(qry, [data.role_id, data.permission_key, data.can_view, data.can_insert, data.can_update, data.can_delete], 'insert role permission model');
}

// updates an active role permission
exports.updateRolePermissionMdl = (role_permission_id, data) => {
    log('in updateRolePermissionMdl');
    const qry = `update role_permissions_t set role_id = ?, permission_key = ?, can_view = ?, can_insert = ?, can_update = ?, can_delete = ?
        where is_active = 1 and role_permission_id = ?`;
    return dbutils.executeQuery(qry, [data.role_id, data.permission_key, data.can_view, data.can_insert, data.can_update, data.can_delete, role_permission_id], 'update role permission model');
}

// brings back a soft deleted role permission with the latest flags
exports.reactivateRolePermissionMdl = (role_permission_id, data) => {
    log('in reactivateRolePermissionMdl');
    const qry = `update role_permissions_t set role_id = ?, permission_key = ?, can_view = ?, can_insert = ?, can_update = ?, can_delete = ?, is_active = 1
        where role_permission_id = ?`;
    return dbutils.executeQuery(qry, [data.role_id, data.permission_key, data.can_view, data.can_insert, data.can_update, data.can_delete, role_permission_id], 'reactivate role permission model');
}

// fetches an active role permission by id along with its role handler for protection checks
exports.getActiveRolePermissionByIdMdl = (role_permission_id) => {
    log('in getActiveRolePermissionByIdMdl');
    const qry = `select p.role_permission_id, p.role_id, p.permission_key, r.role_hndlr
        from role_permissions_t p
        join roles_lst_t r on r.role_id = p.role_id
        where p.is_active = 1 and p.role_permission_id = ?`;
    return dbutils.executeQuery(qry, [role_permission_id], 'get active role permission by id model');
}

// soft deletes a role permission
exports.softDeleteRolePermissionMdl = (role_permission_id) => {
    log('in softDeleteRolePermissionMdl');
    const qry = 'update role_permissions_t set is_active = 0 where is_active = 1 and role_permission_id = ?';
    return dbutils.executeQuery(qry, [role_permission_id], 'soft delete role permission model');
}

// ===================== MENU ITEMS =====================

// fetches all active menu items with their parent and quick menu category names
exports.getMenuItemListMdl = () => {
    log('in getMenuItemListMdl');
    const qry = `select m.menu_item_id, m.menu_name, m.menu_url, m.icon, m.is_main_item, m.is_quick_menu,
        m.parent_item_id, m.quick_menu_ctgry_id, m.menu_item_category, m.is_active,
        pm.menu_name as parent_menu_name, c.ctgry_nm,
        DATE_FORMAT(m.created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(m.updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from menu_items_t m
        left join menu_items_t pm on pm.menu_item_id = m.parent_item_id
        left join quick_menu_category_lst_t c on c.quick_menu_ctgry_id = m.quick_menu_ctgry_id
        where m.is_active = 1 order by m.menu_name asc`;
    return dbutils.executeQuery(qry, [], 'get menu item list model');
}

// fetches active main menu items for the parent dropdown
exports.getMenuParentItemsMdl = () => {
    log('in getMenuParentItemsMdl');
    const qry = `select menu_item_id, menu_name from menu_items_t
        where is_active = 1 and is_main_item = 1 order by menu_name asc`;
    return dbutils.executeQuery(qry, [], 'get menu parent items model');
}

// finds menu items clashing on name within the same parent and quick menu flag, optionally excluding one record
exports.getDuplicateMenuItemsMdl = (menu_name, parent_item_id, is_quick_menu, excludeId = null) => {
    log('in getDuplicateMenuItemsMdl');
    let qry = `select menu_item_id, menu_name, is_active from menu_items_t
        where lower(menu_name) = lower(?) and ifnull(parent_item_id, 0) = ifnull(?, 0) and is_quick_menu = ?`;
    const params = [menu_name, parent_item_id, is_quick_menu];

    if (excludeId) {
        qry += ' and menu_item_id <> ?';
        params.push(excludeId);
    }
    return dbutils.executeQuery(qry, params, 'get duplicate menu items model');
}

// inserts a new menu item
exports.insertMenuItemMdl = (data) => {
    log('in insertMenuItemMdl');
    const qry = `insert into menu_items_t (menu_name, menu_url, icon, is_main_item, is_quick_menu, parent_item_id, quick_menu_ctgry_id, menu_item_category)
        values (?, ?, ?, ?, ?, ?, ?, ?)`;
    return dbutils.executeQuery(qry, [data.menu_name, data.menu_url, data.icon, data.is_main_item, data.is_quick_menu, data.parent_item_id, data.quick_menu_ctgry_id, data.menu_item_category], 'insert menu item model');
}

// updates an active menu item
exports.updateMenuItemMdl = (menu_item_id, data) => {
    log('in updateMenuItemMdl');
    const qry = `update menu_items_t set menu_name = ?, menu_url = ?, icon = ?, is_main_item = ?, is_quick_menu = ?,
        parent_item_id = ?, quick_menu_ctgry_id = ?, menu_item_category = ?
        where is_active = 1 and menu_item_id = ?`;
    return dbutils.executeQuery(qry, [data.menu_name, data.menu_url, data.icon, data.is_main_item, data.is_quick_menu, data.parent_item_id, data.quick_menu_ctgry_id, data.menu_item_category, menu_item_id], 'update menu item model');
}

// brings back a soft deleted menu item with the latest details
exports.reactivateMenuItemMdl = (menu_item_id, data) => {
    log('in reactivateMenuItemMdl');
    const qry = `update menu_items_t set menu_name = ?, menu_url = ?, icon = ?, is_main_item = ?, is_quick_menu = ?,
        parent_item_id = ?, quick_menu_ctgry_id = ?, menu_item_category = ?, is_active = 1
        where menu_item_id = ?`;
    return dbutils.executeQuery(qry, [data.menu_name, data.menu_url, data.icon, data.is_main_item, data.is_quick_menu, data.parent_item_id, data.quick_menu_ctgry_id, data.menu_item_category, menu_item_id], 'reactivate menu item model');
}

// fetches an active menu item by id
exports.getActiveMenuItemByIdMdl = (menu_item_id) => {
    log('in getActiveMenuItemByIdMdl');
    const qry = 'select menu_item_id, menu_name, is_main_item from menu_items_t where is_active = 1 and menu_item_id = ?';
    return dbutils.executeQuery(qry, [menu_item_id], 'get active menu item by id model');
}

// counts active child items under a menu item, used to block deleting a parent that is in use
exports.countActiveChildMenuItemsMdl = (menu_item_id) => {
    log('in countActiveChildMenuItemsMdl');
    const qry = 'select count(*) as cnt from menu_items_t where is_active = 1 and parent_item_id = ?';
    return dbutils.executeQuery(qry, [menu_item_id], 'count active child menu items model');
}

// counts active role mappings for a menu item, used to block deleting a mapped menu
exports.countActiveRoleMapsByMenuItemMdl = (menu_item_id) => {
    log('in countActiveRoleMapsByMenuItemMdl');
    const qry = 'select count(*) as cnt from role_menu_map_t where is_active = 1 and menu_item_id = ?';
    return dbutils.executeQuery(qry, [menu_item_id], 'count active role maps by menu item model');
}

// soft deletes a menu item
exports.softDeleteMenuItemMdl = (menu_item_id) => {
    log('in softDeleteMenuItemMdl');
    const qry = 'update menu_items_t set is_active = 0 where is_active = 1 and menu_item_id = ?';
    return dbutils.executeQuery(qry, [menu_item_id], 'soft delete menu item model');
}

// ===================== QUICK MENU CATEGORIES =====================

// fetches all active quick menu categories
exports.getMenuCategoryListMdl = () => {
    log('in getMenuCategoryListMdl');
    const qry = `select quick_menu_ctgry_id, ctgry_nm, ctgry_cd, description, display_order, icon, is_active,
        DATE_FORMAT(created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from quick_menu_category_lst_t where is_active = 1 order by display_order asc, ctgry_nm asc`;
    return dbutils.executeQuery(qry, [], 'get menu category list model');
}

// finds categories matching the given name or code (active and inactive), optionally excluding one record
exports.getDuplicateMenuCategoriesMdl = (ctgry_nm, ctgry_cd, excludeId = null) => {
    log('in getDuplicateMenuCategoriesMdl');
    let qry = `select quick_menu_ctgry_id, ctgry_nm, ctgry_cd, is_active from quick_menu_category_lst_t
        where (lower(ctgry_nm) = lower(?) or lower(ctgry_cd) = lower(?))`;
    const params = [ctgry_nm, ctgry_cd];

    if (excludeId) {
        qry += ' and quick_menu_ctgry_id <> ?';
        params.push(excludeId);
    }
    return dbutils.executeQuery(qry, params, 'get duplicate menu categories model');
}

// inserts a new quick menu category
exports.insertMenuCategoryMdl = (data) => {
    log('in insertMenuCategoryMdl');
    const qry = `insert into quick_menu_category_lst_t (ctgry_nm, ctgry_cd, description, display_order, icon)
        values (?, ?, ?, ?, ?)`;
    return dbutils.executeQuery(qry, [data.ctgry_nm, data.ctgry_cd, data.description, data.display_order, data.icon], 'insert menu category model');
}

// updates an active quick menu category
exports.updateMenuCategoryMdl = (quick_menu_ctgry_id, data) => {
    log('in updateMenuCategoryMdl');
    const qry = `update quick_menu_category_lst_t set ctgry_nm = ?, ctgry_cd = ?, description = ?, display_order = ?, icon = ?
        where is_active = 1 and quick_menu_ctgry_id = ?`;
    return dbutils.executeQuery(qry, [data.ctgry_nm, data.ctgry_cd, data.description, data.display_order, data.icon, quick_menu_ctgry_id], 'update menu category model');
}

// brings back a soft deleted quick menu category with the latest details
exports.reactivateMenuCategoryMdl = (quick_menu_ctgry_id, data) => {
    log('in reactivateMenuCategoryMdl');
    const qry = `update quick_menu_category_lst_t set ctgry_nm = ?, ctgry_cd = ?, description = ?, display_order = ?, icon = ?, is_active = 1
        where quick_menu_ctgry_id = ?`;
    return dbutils.executeQuery(qry, [data.ctgry_nm, data.ctgry_cd, data.description, data.display_order, data.icon, quick_menu_ctgry_id], 'reactivate menu category model');
}

// fetches an active quick menu category by id
exports.getActiveMenuCategoryByIdMdl = (quick_menu_ctgry_id) => {
    log('in getActiveMenuCategoryByIdMdl');
    const qry = 'select quick_menu_ctgry_id, ctgry_nm from quick_menu_category_lst_t where is_active = 1 and quick_menu_ctgry_id = ?';
    return dbutils.executeQuery(qry, [quick_menu_ctgry_id], 'get active menu category by id model');
}

// counts active menu items mapped to a category, used to block deleting a category that is in use
exports.countActiveMenuItemsByCategoryMdl = (quick_menu_ctgry_id) => {
    log('in countActiveMenuItemsByCategoryMdl');
    const qry = 'select count(*) as cnt from menu_items_t where is_active = 1 and quick_menu_ctgry_id = ?';
    return dbutils.executeQuery(qry, [quick_menu_ctgry_id], 'count active menu items by category model');
}

// soft deletes a quick menu category
exports.softDeleteMenuCategoryMdl = (quick_menu_ctgry_id) => {
    log('in softDeleteMenuCategoryMdl');
    const qry = 'update quick_menu_category_lst_t set is_active = 0 where is_active = 1 and quick_menu_ctgry_id = ?';
    return dbutils.executeQuery(qry, [quick_menu_ctgry_id], 'soft delete menu category model');
}

// ===================== ROLE MENU MAPPING =====================

// fetches all active role menu mappings with their role and menu names
exports.getRoleMenuMapListMdl = () => {
    log('in getRoleMenuMapListMdl');
    const qry = `select rm.role_menu_id, rm.role_id, rm.menu_item_id, rm.display_order, rm.is_active,
        r.role_nm, m.menu_name, m.menu_url, m.is_quick_menu,
        DATE_FORMAT(rm.created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(rm.updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from role_menu_map_t rm
        join roles_lst_t r on r.role_id = rm.role_id
        join menu_items_t m on m.menu_item_id = rm.menu_item_id
        where rm.is_active = 1 order by r.role_nm asc, rm.display_order asc`;
    return dbutils.executeQuery(qry, [], 'get role menu map list model');
}

// fetches active menu items for the mapping form dropdown
exports.getRoleMenuMapMenuItemsMdl = () => {
    log('in getRoleMenuMapMenuItemsMdl');
    const qry = `select menu_item_id, menu_name, menu_url, is_quick_menu from menu_items_t
        where is_active = 1 order by menu_name asc`;
    return dbutils.executeQuery(qry, [], 'get role menu map menu items model');
}

// finds mappings for the same role and menu (active and inactive), optionally excluding one record
// the table has a unique key on (role_id, menu_item_id), so soft deleted rows MUST be reactivated
exports.getDuplicateRoleMenuMapsMdl = (role_id, menu_item_id, excludeId = null) => {
    log('in getDuplicateRoleMenuMapsMdl');
    let qry = `select role_menu_id, role_id, menu_item_id, is_active from role_menu_map_t
        where role_id = ? and menu_item_id = ?`;
    const params = [role_id, menu_item_id];

    if (excludeId) {
        qry += ' and role_menu_id <> ?';
        params.push(excludeId);
    }
    return dbutils.executeQuery(qry, params, 'get duplicate role menu maps model');
}

// inserts a new role menu mapping
exports.insertRoleMenuMapMdl = (data) => {
    log('in insertRoleMenuMapMdl');
    const qry = 'insert into role_menu_map_t (role_id, menu_item_id, display_order) values (?, ?, ?)';
    return dbutils.executeQuery(qry, [data.role_id, data.menu_item_id, data.display_order], 'insert role menu map model');
}

// updates an active role menu mapping
exports.updateRoleMenuMapMdl = (role_menu_id, data) => {
    log('in updateRoleMenuMapMdl');
    const qry = `update role_menu_map_t set role_id = ?, menu_item_id = ?, display_order = ?
        where is_active = 1 and role_menu_id = ?`;
    return dbutils.executeQuery(qry, [data.role_id, data.menu_item_id, data.display_order, role_menu_id], 'update role menu map model');
}

// brings back a soft deleted role menu mapping with the latest display order
exports.reactivateRoleMenuMapMdl = (role_menu_id, data) => {
    log('in reactivateRoleMenuMapMdl');
    const qry = 'update role_menu_map_t set display_order = ?, is_active = 1 where role_menu_id = ?';
    return dbutils.executeQuery(qry, [data.display_order, role_menu_id], 'reactivate role menu map model');
}

// fetches an active role menu mapping by id
exports.getActiveRoleMenuMapByIdMdl = (role_menu_id) => {
    log('in getActiveRoleMenuMapByIdMdl');
    const qry = `select rm.role_menu_id, rm.role_id, rm.menu_item_id, r.role_nm, m.menu_name
        from role_menu_map_t rm
        join roles_lst_t r on r.role_id = rm.role_id
        join menu_items_t m on m.menu_item_id = rm.menu_item_id
        where rm.is_active = 1 and rm.role_menu_id = ?`;
    return dbutils.executeQuery(qry, [role_menu_id], 'get active role menu map by id model');
}

// soft deletes a role menu mapping
exports.softDeleteRoleMenuMapMdl = (role_menu_id) => {
    log('in softDeleteRoleMenuMapMdl');
    const qry = 'update role_menu_map_t set is_active = 0 where is_active = 1 and role_menu_id = ?';
    return dbutils.executeQuery(qry, [role_menu_id], 'soft delete role menu map model');
}

// ===================== USERS =====================

// fetches active users with their role and gender names (password columns are never selected),
// restricted to the logged in user's scope via each user's position
exports.getUserListMdl = (user) => {
    log('in getUserListMdl');
    const scope = scopeutils.getScopeFilter(user, 'sp', scopeutils.POSITION_SCOPE_COLUMNS);

    let qry = `select u.user_id, u.user_nm, u.first_nm, u.last_nm, u.mobile_no, u.email, u.role_id, u.gender_id, u.is_locked, u.is_active,
        r.role_nm, g.gender_nm,
        DATE_FORMAT(u.last_login, '%d-%m-%Y %h:%i %p') as last_login,
        DATE_FORMAT(u.created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(u.updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from users_lst_t u
        left join roles_lst_t r on r.role_id = u.role_id
        left join gender_mstr_lst_t g on g.gender_id = u.gender_id
        where u.is_active = 1`;

    if (scope.denied) {
        qry += ' and 1 = 0';
    } else if (!scope.unrestricted) {
        // visible = users holding a position inside the scope, plus users with no active
        // position at all (the unassigned pool a scoped admin hires from)
        qry += ` and (exists (select 1 from position_lst_t sp where sp.is_active = 1 and sp.user_id = u.user_id${scope.clause})
            or not exists (select 1 from position_lst_t ap where ap.is_active = 1 and ap.user_id = u.user_id))`;
    }

    qry += ' order by u.first_nm asc, u.user_nm asc';
    return dbutils.executeQuery(qry, scope.params, 'get user list model');
}

// finds users matching the given login name/email (active and inactive), optionally excluding one record
exports.getDuplicateUsersMdl = (user_nm, excludeId = null) => {
    log('in getDuplicateUsersMdl');
    let qry = `select user_id, user_nm, first_nm, last_nm, is_active from users_lst_t
        where lower(user_nm) = lower(?)`;
    const params = [user_nm];

    if (excludeId) {
        qry += ' and user_id <> ?';
        params.push(excludeId);
    }
    return dbutils.executeQuery(qry, params, 'get duplicate users model');
}

// inserts a new user; the role is NOT set here - it is stamped by the position assignment.
// password_txt mirrors the signup convention (login itself only uses the hash)
exports.insertUserMdl = (data) => {
    log('in insertUserMdl');
    const qry = `insert into users_lst_t (user_nm, first_nm, last_nm, mobile_no, email, gender_id, password_hash, password_salt, password_txt)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return dbutils.executeQuery(qry, [data.user_nm, data.first_nm, data.last_nm, data.mobile_no, data.email, data.gender_id, data.password_hash, data.password_salt, data.password_txt], 'insert user model');
}

// updates an active user's profile (the role comes from the position, the password from forgot password)
exports.updateUserMdl = (user_id, data) => {
    log('in updateUserMdl');
    const qry = `update users_lst_t set user_nm = ?, first_nm = ?, last_nm = ?, mobile_no = ?, email = ?, gender_id = ?
        where is_active = 1 and user_id = ?`;
    return dbutils.executeQuery(qry, [data.user_nm, data.first_nm, data.last_nm, data.mobile_no, data.email, data.gender_id, user_id], 'update user model');
}

// brings back a soft deleted user with fresh details, credentials and a clean lock state
exports.reactivateUserMdl = (user_id, data) => {
    log('in reactivateUserMdl');
    const qry = `update users_lst_t set user_nm = ?, first_nm = ?, last_nm = ?, mobile_no = ?, email = ?, gender_id = ?,
        password_hash = ?, password_salt = ?, password_txt = ?, is_locked = 0, locked_until = null, login_attempts = 0, is_active = 1
        where user_id = ?`;
    return dbutils.executeQuery(qry, [data.user_nm, data.first_nm, data.last_nm, data.mobile_no, data.email, data.gender_id, data.password_hash, data.password_salt, data.password_txt, user_id], 'reactivate user model');
}

// fetches an active user by id along with the role handler for protection checks
exports.getActiveUserForAdminByIdMdl = (user_id) => {
    log('in getActiveUserForAdminByIdMdl');
    const qry = `select u.user_id, u.user_nm, u.first_nm, u.last_nm, r.role_hndlr
        from users_lst_t u
        left join roles_lst_t r on r.role_id = u.role_id
        where u.is_active = 1 and u.user_id = ?`;
    return dbutils.executeQuery(qry, [user_id], 'get active user for admin by id model');
}

// soft deletes a user
exports.softDeleteUserMdl = (user_id) => {
    log('in softDeleteUserMdl');
    const qry = 'update users_lst_t set is_active = 0 where is_active = 1 and user_id = ?';
    return dbutils.executeQuery(qry, [user_id], 'soft delete user model');
}
