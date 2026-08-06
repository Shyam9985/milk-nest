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

// fetches active districts along with their parent state, optionally only those under one state
exports.getDistrictsMdl = (state_id = null) => {
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

// fetches active mandals/ULBs along with their parent district and state, optionally only those under one district
exports.getMandalsMdl = (district_id = null) => {
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
        d.state_id, d.district_name, m.mandal_ulb_nm,
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

// ===================== ROLE MASTER =====================

// fetches all active roles along with their hierarchy name
exports.getRolesMdl = () => {
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
    const qry = `select hirrarchy_id as hierarchy_id, hierarchy_nm, level_type
        from hierarchy_lst_t where is_active = 1 order by hierarchy_nm asc`;
    return dbutils.executeQuery(qry, [], 'get hierarchies model');
}

// fetches an active hierarchy by id, used to validate the parent before saving a role
exports.getActiveHierarchyByIdMdl = (hierarchy_id) => {
    const qry = 'select hirrarchy_id as hierarchy_id, hierarchy_nm from hierarchy_lst_t where is_active = 1 and hirrarchy_id = ?';
    return dbutils.executeQuery(qry, [hierarchy_id], 'get active hierarchy by id model');
}

// finds roles matching the given name or handler (active and inactive), optionally excluding one record
exports.getDuplicateRolesMdl = (role_nm, role_hndlr, excludeId = null) => {
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
    const qry = 'insert into roles_lst_t (role_nm, role_hndlr, description, landing_url, hierarchy_id) values (?, ?, ?, ?, ?)';
    return dbutils.executeQuery(qry, [data.role_nm, data.role_hndlr, data.description, data.landing_url, data.hierarchy_id], 'insert role model');
}

// updates an active role
exports.updateRoleMdl = (role_id, data) => {
    const qry = `update roles_lst_t set role_nm = ?, role_hndlr = ?, description = ?, landing_url = ?, hierarchy_id = ?
        where is_active = 1 and role_id = ?`;
    return dbutils.executeQuery(qry, [data.role_nm, data.role_hndlr, data.description, data.landing_url, data.hierarchy_id, role_id], 'update role model');
}

// brings back a soft deleted role with the latest details
exports.reactivateRoleMdl = (role_id, data) => {
    const qry = `update roles_lst_t set role_nm = ?, role_hndlr = ?, description = ?, landing_url = ?, hierarchy_id = ?, is_active = 1
        where role_id = ?`;
    return dbutils.executeQuery(qry, [data.role_nm, data.role_hndlr, data.description, data.landing_url, data.hierarchy_id, role_id], 'reactivate role model');
}

// fetches an active role by id
exports.getActiveRoleByIdMdl = (role_id) => {
    const qry = 'select role_id, role_nm, role_hndlr from roles_lst_t where is_active = 1 and role_id = ?';
    return dbutils.executeQuery(qry, [role_id], 'get active role by id model');
}

// counts active users mapped to a role, used to block deleting a role that is in use
exports.countActiveUsersByRoleMdl = (role_id) => {
    const qry = 'select count(*) as cnt from users_lst_t where is_active = 1 and role_id = ?';
    return dbutils.executeQuery(qry, [role_id], 'count active users by role model');
}

// soft deletes a role
exports.softDeleteRoleMdl = (role_id) => {
    const qry = 'update roles_lst_t set is_active = 0 where is_active = 1 and role_id = ?';
    return dbutils.executeQuery(qry, [role_id], 'soft delete role model');
}

// ===================== GENDER MASTER =====================

// fetches all active genders
exports.getGendersMdl = () => {
    const qry = `select gender_id, gender_nm, gender_code, is_active,
        DATE_FORMAT(created_at, '%d-%m-%Y %h:%i %p') as created_at,
        DATE_FORMAT(updated_at, '%d-%m-%Y %h:%i %p') as updated_at
        from gender_mstr_lst_t where is_active = 1 order by gender_nm asc`;
    return dbutils.executeQuery(qry, [], 'get genders model');
}

// finds genders matching the given name or code (active and inactive), optionally excluding one record
exports.getDuplicateGendersMdl = (gender_nm, gender_code, excludeId = null) => {
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
    const qry = 'insert into gender_mstr_lst_t (gender_nm, gender_code) values (?, ?)';
    return dbutils.executeQuery(qry, [data.gender_nm, data.gender_code], 'insert gender model');
}

// updates an active gender
exports.updateGenderMdl = (gender_id, data) => {
    const qry = 'update gender_mstr_lst_t set gender_nm = ?, gender_code = ? where is_active = 1 and gender_id = ?';
    return dbutils.executeQuery(qry, [data.gender_nm, data.gender_code, gender_id], 'update gender model');
}

// brings back a soft deleted gender with the latest details
exports.reactivateGenderMdl = (gender_id, data) => {
    const qry = 'update gender_mstr_lst_t set gender_nm = ?, gender_code = ?, is_active = 1 where gender_id = ?';
    return dbutils.executeQuery(qry, [data.gender_nm, data.gender_code, gender_id], 'reactivate gender model');
}

// fetches an active gender by id
exports.getActiveGenderByIdMdl = (gender_id) => {
    const qry = 'select gender_id, gender_nm from gender_mstr_lst_t where is_active = 1 and gender_id = ?';
    return dbutils.executeQuery(qry, [gender_id], 'get active gender by id model');
}

// soft deletes a gender
exports.softDeleteGenderMdl = (gender_id) => {
    const qry = 'update gender_mstr_lst_t set is_active = 0 where is_active = 1 and gender_id = ?';
    return dbutils.executeQuery(qry, [gender_id], 'soft delete gender model');
}

// ===================== HIERARCHY MASTER =====================

// fetches all active hierarchies along with their parent hierarchy name
exports.getHierarchyListMdl = () => {
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
    const qry = 'insert into hierarchy_lst_t (hierarchy_nm, level_type, parent_hirrarchy_id) values (?, ?, ?)';
    return dbutils.executeQuery(qry, [data.hierarchy_nm, data.level_type, data.parent_hirrarchy_id], 'insert hierarchy model');
}

// updates an active hierarchy
exports.updateHierarchyMdl = (hierarchy_id, data) => {
    const qry = 'update hierarchy_lst_t set hierarchy_nm = ?, level_type = ?, parent_hirrarchy_id = ? where is_active = 1 and hirrarchy_id = ?';
    return dbutils.executeQuery(qry, [data.hierarchy_nm, data.level_type, data.parent_hirrarchy_id, hierarchy_id], 'update hierarchy model');
}

// brings back a soft deleted hierarchy with the latest details
exports.reactivateHierarchyMdl = (hierarchy_id, data) => {
    const qry = 'update hierarchy_lst_t set hierarchy_nm = ?, level_type = ?, parent_hirrarchy_id = ?, is_active = 1 where hirrarchy_id = ?';
    return dbutils.executeQuery(qry, [data.hierarchy_nm, data.level_type, data.parent_hirrarchy_id, hierarchy_id], 'reactivate hierarchy model');
}

// fetches the parent pointer of a hierarchy, used to walk the chain for cycle detection
exports.getHierarchyParentMdl = (hierarchy_id) => {
    const qry = 'select hirrarchy_id as hierarchy_id, parent_hirrarchy_id from hierarchy_lst_t where hirrarchy_id = ?';
    return dbutils.executeQuery(qry, [hierarchy_id], 'get hierarchy parent model');
}

// counts active child hierarchies, used to block deleting a hierarchy that is a parent
exports.countActiveChildHierarchiesMdl = (hierarchy_id) => {
    const qry = 'select count(*) as cnt from hierarchy_lst_t where is_active = 1 and parent_hirrarchy_id = ?';
    return dbutils.executeQuery(qry, [hierarchy_id], 'count active child hierarchies model');
}

// counts active roles mapped to a hierarchy, used to block deleting a hierarchy that is in use
exports.countActiveRolesByHierarchyMdl = (hierarchy_id) => {
    const qry = 'select count(*) as cnt from roles_lst_t where is_active = 1 and hierarchy_id = ?';
    return dbutils.executeQuery(qry, [hierarchy_id], 'count active roles by hierarchy model');
}

// counts active positions mapped to a hierarchy, used to block deleting a hierarchy that is in use
exports.countActivePositionsByHierarchyMdl = (hierarchy_id) => {
    const qry = 'select count(*) as cnt from position_lst_t where is_active = 1 and hierarchy_id = ?';
    return dbutils.executeQuery(qry, [hierarchy_id], 'count active positions by hierarchy model');
}

// soft deletes a hierarchy
exports.softDeleteHierarchyMdl = (hierarchy_id) => {
    const qry = 'update hierarchy_lst_t set is_active = 0 where is_active = 1 and hirrarchy_id = ?';
    return dbutils.executeQuery(qry, [hierarchy_id], 'soft delete hierarchy model');
}
