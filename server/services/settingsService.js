const bcrypt = require('bcrypt');
const settingsMdl = require('../models/settingsMdl');
const resutils = require('../utils/response.utils');

// normalizes names and codes before comparing and storing
// names are stored in title case, e.g. ' guntur  DISTRICT ' -> 'Guntur District'
const normalizeName = (value = '') => value.trim().replace(/\s+/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
const normalizeCode = (value = '') => value.trim().replace(/\s+/g, '').toUpperCase();

// fetches all active states
exports.getStatesSrvc = async () => {
    return settingsMdl.getStatesMdl();
}

// creates a state, reusing a soft deleted record when the same name/code comes back
exports.createStateSrvc = async (payload) => {
    const state_name = normalizeName(payload.state_name);
    const state_code = normalizeCode(payload.state_code);

    const duplicates = await settingsMdl.getDuplicateStatesMdl(state_name, state_code);

    const activeDuplicate = duplicates.find((record) => record.is_active == 1);
    if (activeDuplicate) {
        resutils.createError('duplicateRecord', `State already exists with the same name or code (${activeDuplicate.state_name} - ${activeDuplicate.state_code}).`);
    }

    // a soft deleted duplicate is reactivated instead of inserting a new row
    const inactiveDuplicate = duplicates[0];
    if (inactiveDuplicate) {
        await settingsMdl.reactivateStateMdl(inactiveDuplicate.state_id, { state_name, state_code });
        return { state_id: inactiveDuplicate.state_id, reactivated: true, state_name };
    }

    const result = await settingsMdl.insertStateMdl({ state_name, state_code });
    return { state_id: result.insertId, reactivated: false, state_name };
}

// updates a state after making sure the new name/code is not taken by another record
exports.updateStateSrvc = async (state_id, payload) => {
    const state_name = normalizeName(payload.state_name);
    const state_code = normalizeCode(payload.state_code);

    const duplicates = await settingsMdl.getDuplicateStatesMdl(state_name, state_code, state_id);
    if (duplicates.length) {
        resutils.createError('duplicateRecord', `Another state already exists with the same name or code (${duplicates[0].state_name} - ${duplicates[0].state_code}).`);
    }

    const result = await settingsMdl.updateStateMdl(state_id, { state_name, state_code });
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'State not found or already deleted.');
    }
    return { state_id: Number(state_id), state_name };
}

// soft deletes a state after making sure no active district depends on it
exports.deleteStateSrvc = async (state_id) => {
    // record is fetched first so the success message can carry its name
    const [record] = await settingsMdl.getActiveStateByIdMdl(state_id);
    if (!record) {
        resutils.createError('recordNotFound', 'State not found or already deleted.');
    }

    const [{ cnt: districtCount }] = await settingsMdl.countActiveDistrictsByStateMdl(state_id);
    if (districtCount) {
        resutils.createError('recordInUse', `State cannot be deleted. ${districtCount} active district(s) are mapped to it. Delete those districts first.`);
    }

    const result = await settingsMdl.softDeleteStateMdl(state_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'State not found or already deleted.');
    }
    return { state_id: Number(state_id), state_name: record.state_name };
}

// ===================== DISTRICT MASTER =====================

// fetches active districts, optionally filtered by parent state
exports.getDistrictsSrvc = async (state_id = null) => {
    return settingsMdl.getDistrictsMdl(state_id);
}

// makes sure the parent state exists and is active
const assertActiveState = async (state_id) => {
    const parentState = await settingsMdl.getActiveStateByIdMdl(state_id);
    if (!parentState.length) {
        resutils.createError('invalidParent', 'Selected state does not exist or is inactive.');
    }
}

// creates a district under a state, reusing a soft deleted record when the same name/code comes back
exports.createDistrictSrvc = async (payload) => {
    const district_name = normalizeName(payload.district_name);
    const district_code = normalizeCode(payload.district_code);
    const state_id = Number(payload.state_id);

    await assertActiveState(state_id);

    const duplicates = await settingsMdl.getDuplicateDistrictsMdl(district_name, district_code, state_id);

    const activeDuplicate = duplicates.find((record) => record.is_active == 1);
    if (activeDuplicate) {
        resutils.createError('duplicateRecord', `District already exists with the same name or code (${activeDuplicate.district_name} - ${activeDuplicate.district_code}).`);
    }

    const inactiveDuplicate = duplicates[0];
    if (inactiveDuplicate) {
        await settingsMdl.reactivateDistrictMdl(inactiveDuplicate.district_id, { district_name, district_code, state_id });
        return { district_id: inactiveDuplicate.district_id, reactivated: true, district_name };
    }

    const result = await settingsMdl.insertDistrictMdl({ district_name, district_code, state_id });
    return { district_id: result.insertId, reactivated: false, district_name };
}

// updates a district after re-validating the parent and duplicate rules
exports.updateDistrictSrvc = async (district_id, payload) => {
    const district_name = normalizeName(payload.district_name);
    const district_code = normalizeCode(payload.district_code);
    const state_id = Number(payload.state_id);

    await assertActiveState(state_id);

    const duplicates = await settingsMdl.getDuplicateDistrictsMdl(district_name, district_code, state_id, district_id);
    if (duplicates.length) {
        resutils.createError('duplicateRecord', `Another district already exists with the same name or code (${duplicates[0].district_name} - ${duplicates[0].district_code}).`);
    }

    const result = await settingsMdl.updateDistrictMdl(district_id, { district_name, district_code, state_id });
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'District not found or already deleted.');
    }
    return { district_id: Number(district_id), district_name };
}

// soft deletes a district after making sure no active mandal/village depends on it
exports.deleteDistrictSrvc = async (district_id) => {
    // record is fetched first so the success message can carry its name
    const [record] = await settingsMdl.getActiveDistrictByIdMdl(district_id);
    if (!record) {
        resutils.createError('recordNotFound', 'District not found or already deleted.');
    }

    const [{ cnt: mandalCount }] = await settingsMdl.countActiveMandalsByDistrictMdl(district_id);
    const [{ cnt: villageCount }] = await settingsMdl.countActiveVillagesByDistrictMdl(district_id);

    if (mandalCount || villageCount) {
        resutils.createError('recordInUse', `District cannot be deleted. ${mandalCount} active mandal/ULB(s) and ${villageCount} active village(s) are mapped to it. Delete those records first.`);
    }

    const result = await settingsMdl.softDeleteDistrictMdl(district_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'District not found or already deleted.');
    }
    return { district_id: Number(district_id), district_name: record.district_name };
}

// ===================== MANDAL / ULB MASTER =====================

// fetches active mandals/ULBs, optionally filtered by parent district
exports.getMandalsSrvc = async (district_id = null) => {
    return settingsMdl.getMandalsMdl(district_id);
}

// makes sure the parent district exists and is active, returns it for further checks
const assertActiveDistrict = async (district_id) => {
    const parentDistrict = await settingsMdl.getActiveDistrictByIdMdl(district_id);
    if (!parentDistrict.length) {
        resutils.createError('invalidParent', 'Selected district does not exist or is inactive.');
    }
    return parentDistrict[0];
}

// creates a mandal/ULB under a district, reusing a soft deleted record when the same name/code comes back
exports.createMandalSrvc = async (payload) => {
    const mandal_ulb_nm = normalizeName(payload.mandal_ulb_nm);
    const mandal_ulb_code = normalizeCode(payload.mandal_ulb_code);
    const district_id = Number(payload.district_id);
    const is_ulb = payload.is_ulb ? 1 : 0;

    await assertActiveDistrict(district_id);

    const duplicates = await settingsMdl.getDuplicateMandalsMdl(mandal_ulb_nm, mandal_ulb_code, district_id);

    const activeDuplicate = duplicates.find((record) => record.is_active == 1);
    if (activeDuplicate) {
        resutils.createError('duplicateRecord', `Mandal/ULB already exists with the same name or code (${activeDuplicate.mandal_ulb_nm} - ${activeDuplicate.mandal_ulb_code}).`);
    }

    const inactiveDuplicate = duplicates[0];
    if (inactiveDuplicate) {
        await settingsMdl.reactivateMandalMdl(inactiveDuplicate.mandal_ulb_id, { mandal_ulb_nm, mandal_ulb_code, district_id, is_ulb });
        return { mandal_ulb_id: inactiveDuplicate.mandal_ulb_id, reactivated: true, mandal_ulb_nm };
    }

    const result = await settingsMdl.insertMandalMdl({ mandal_ulb_nm, mandal_ulb_code, district_id, is_ulb });
    return { mandal_ulb_id: result.insertId, reactivated: false, mandal_ulb_nm };
}

// updates a mandal/ULB after re-validating the parent and duplicate rules
exports.updateMandalSrvc = async (mandal_ulb_id, payload) => {
    const mandal_ulb_nm = normalizeName(payload.mandal_ulb_nm);
    const mandal_ulb_code = normalizeCode(payload.mandal_ulb_code);
    const district_id = Number(payload.district_id);
    const is_ulb = payload.is_ulb ? 1 : 0;

    await assertActiveDistrict(district_id);

    const duplicates = await settingsMdl.getDuplicateMandalsMdl(mandal_ulb_nm, mandal_ulb_code, district_id, mandal_ulb_id);
    if (duplicates.length) {
        resutils.createError('duplicateRecord', `Another mandal/ULB already exists with the same name or code (${duplicates[0].mandal_ulb_nm} - ${duplicates[0].mandal_ulb_code}).`);
    }

    const result = await settingsMdl.updateMandalMdl(mandal_ulb_id, { mandal_ulb_nm, mandal_ulb_code, district_id, is_ulb });
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Mandal/ULB not found or already deleted.');
    }
    return { mandal_ulb_id: Number(mandal_ulb_id), mandal_ulb_nm };
}

// soft deletes a mandal/ULB after making sure no active village depends on it
exports.deleteMandalSrvc = async (mandal_ulb_id) => {
    // record is fetched first so the success message can carry its name
    const [record] = await settingsMdl.getActiveMandalByIdMdl(mandal_ulb_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Mandal/ULB not found or already deleted.');
    }

    const [{ cnt: villageCount }] = await settingsMdl.countActiveVillagesByMandalMdl(mandal_ulb_id);
    if (villageCount) {
        resutils.createError('recordInUse', `Mandal/ULB cannot be deleted. ${villageCount} active village(s) are mapped to it. Delete those villages first.`);
    }

    const result = await settingsMdl.softDeleteMandalMdl(mandal_ulb_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Mandal/ULB not found or already deleted.');
    }
    return { mandal_ulb_id: Number(mandal_ulb_id), mandal_ulb_nm: record.mandal_ulb_nm };
}

// ===================== VILLAGE / SACHIVALAYAM MASTER =====================

// fetches active villages/sachivalayams, optionally filtered by parent district
exports.getVillagesSrvc = async (district_id = null) => {
    return settingsMdl.getVillagesMdl(district_id);
}

// creates a village/sachivalayam, reusing a soft deleted record when the same name/code comes back
exports.createVillageSrvc = async (payload) => {
    const village_sachivalayam_nm = normalizeName(payload.village_sachivalayam_nm);
    const village_sachivalayam_code = normalizeCode(payload.village_sachivalayam_code);
    const district_id = Number(payload.district_id);
    const mandal_ulb_id = payload.mandal_ulb_id ? Number(payload.mandal_ulb_id) : null;
    const is_sachivalayam = payload.is_sachivalayam ? 1 : 0;

    await assertActiveVillageParents(district_id, mandal_ulb_id);

    const duplicates = await settingsMdl.getDuplicateVillagesMdl(village_sachivalayam_nm, village_sachivalayam_code, district_id, mandal_ulb_id);

    const activeDuplicate = duplicates.find((record) => record.is_active == 1);
    if (activeDuplicate) {
        resutils.createError('duplicateRecord', `Village/Sachivalayam already exists with the same name or code (${activeDuplicate.village_sachivalayam_nm} - ${activeDuplicate.village_sachivalayam_code}).`);
    }

    const inactiveDuplicate = duplicates[0];
    if (inactiveDuplicate) {
        await settingsMdl.reactivateVillageMdl(inactiveDuplicate.village_sachivalayam_id, { village_sachivalayam_nm, village_sachivalayam_code, district_id, mandal_ulb_id, is_sachivalayam });
        return { village_sachivalayam_id: inactiveDuplicate.village_sachivalayam_id, reactivated: true, village_sachivalayam_nm };
    }

    const result = await settingsMdl.insertVillageMdl({ village_sachivalayam_nm, village_sachivalayam_code, district_id, mandal_ulb_id, is_sachivalayam });
    return { village_sachivalayam_id: result.insertId, reactivated: false, village_sachivalayam_nm };
}

// updates a village/sachivalayam after re-validating parents and duplicate rules
exports.updateVillageSrvc = async (village_sachivalayam_id, payload) => {
    const village_sachivalayam_nm = normalizeName(payload.village_sachivalayam_nm);
    const village_sachivalayam_code = normalizeCode(payload.village_sachivalayam_code);
    const district_id = Number(payload.district_id);
    const mandal_ulb_id = payload.mandal_ulb_id ? Number(payload.mandal_ulb_id) : null;
    const is_sachivalayam = payload.is_sachivalayam ? 1 : 0;

    await assertActiveVillageParents(district_id, mandal_ulb_id);

    const duplicates = await settingsMdl.getDuplicateVillagesMdl(village_sachivalayam_nm, village_sachivalayam_code, district_id, mandal_ulb_id, village_sachivalayam_id);
    if (duplicates.length) {
        resutils.createError('duplicateRecord', `Another village/sachivalayam already exists with the same name or code (${duplicates[0].village_sachivalayam_nm} - ${duplicates[0].village_sachivalayam_code}).`);
    }

    const result = await settingsMdl.updateVillageMdl(village_sachivalayam_id, { village_sachivalayam_nm, village_sachivalayam_code, district_id, mandal_ulb_id, is_sachivalayam });
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Village/Sachivalayam not found or already deleted.');
    }
    return { village_sachivalayam_id: Number(village_sachivalayam_id), village_sachivalayam_nm };
}

// soft deletes a village/sachivalayam
exports.deleteVillageSrvc = async (village_sachivalayam_id) => {
    // record is fetched first so the success message can carry its name
    const [record] = await settingsMdl.getActiveVillageByIdMdl(village_sachivalayam_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Village/Sachivalayam not found or already deleted.');
    }

    const result = await settingsMdl.softDeleteVillageMdl(village_sachivalayam_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Village/Sachivalayam not found or already deleted.');
    }
    return { village_sachivalayam_id: Number(village_sachivalayam_id), village_sachivalayam_nm: record.village_sachivalayam_nm };
}

// villages hang off a district and optionally a mandal; the mandal must belong to the same district
const assertActiveVillageParents = async (district_id, mandal_ulb_id) => {
    await assertActiveDistrict(district_id);

    if (mandal_ulb_id) {
        const parentMandal = await settingsMdl.getActiveMandalByIdMdl(mandal_ulb_id);
        if (!parentMandal.length) {
            resutils.createError('invalidParent', 'Selected mandal/ULB does not exist or is inactive.');
        }
        if (parentMandal[0].district_id != district_id) {
            resutils.createError('invalidParent', 'Selected mandal/ULB does not belong to the selected district.');
        }
    }
}

// ===================== ROLE MASTER =====================

// handlers are stored lowercase with underscores, e.g. ' Form  Manager ' -> 'form_manager'
const normalizeHandler = (value = '') => value.trim().replace(/\s+/g, '_').toLowerCase();

// empty optional inputs are stored as null instead of empty strings
const emptyToNull = (value) => {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    return trimmed === '' || trimmed === undefined ? null : trimmed;
};

// fetches all active roles
exports.getRolesSrvc = async () => {
    return settingsMdl.getRolesMdl();
}

// fetches active hierarchies for the role form dropdown
exports.getHierarchiesSrvc = async () => {
    return settingsMdl.getHierarchiesMdl();
}

// makes sure the optional parent hierarchy exists and is active
const assertActiveHierarchy = async (hierarchy_id) => {
    if (!hierarchy_id) return;

    const parentHierarchy = await settingsMdl.getActiveHierarchyByIdMdl(hierarchy_id);
    if (!parentHierarchy.length) {
        resutils.createError('invalidParent', 'Selected hierarchy does not exist or is inactive.');
    }
}

// pulls the normalized role fields out of a request payload
const normalizeRolePayload = (payload) => ({
    role_nm: normalizeName(payload.role_nm),
    role_hndlr: normalizeHandler(payload.role_hndlr),
    description: emptyToNull(payload.description),
    landing_url: emptyToNull(payload.landing_url),
    hierarchy_id: payload.hierarchy_id ? Number(payload.hierarchy_id) : null
});

// creates a role, reusing a soft deleted record when the same name/handler comes back
exports.createRoleSrvc = async (payload) => {
    const data = normalizeRolePayload(payload);

    await assertActiveHierarchy(data.hierarchy_id);

    const duplicates = await settingsMdl.getDuplicateRolesMdl(data.role_nm, data.role_hndlr);

    const activeDuplicate = duplicates.find((record) => record.is_active == 1);
    if (activeDuplicate) {
        resutils.createError('duplicateRecord', `Role already exists with the same name or handler (${activeDuplicate.role_nm} - ${activeDuplicate.role_hndlr}).`);
    }

    // a soft deleted duplicate is reactivated instead of inserting a new row
    const inactiveDuplicate = duplicates[0];
    if (inactiveDuplicate) {
        await settingsMdl.reactivateRoleMdl(inactiveDuplicate.role_id, data);
        return { role_id: inactiveDuplicate.role_id, reactivated: true, role_nm: data.role_nm };
    }

    const result = await settingsMdl.insertRoleMdl(data);
    return { role_id: result.insertId, reactivated: false, role_nm: data.role_nm };
}

// updates a role after making sure the new name/handler is not taken by another record
exports.updateRoleSrvc = async (role_id, payload) => {
    const data = normalizeRolePayload(payload);

    await assertActiveHierarchy(data.hierarchy_id);

    const duplicates = await settingsMdl.getDuplicateRolesMdl(data.role_nm, data.role_hndlr, role_id);
    if (duplicates.length) {
        resutils.createError('duplicateRecord', `Another role already exists with the same name or handler (${duplicates[0].role_nm} - ${duplicates[0].role_hndlr}).`);
    }

    const result = await settingsMdl.updateRoleMdl(role_id, data);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Role not found or already deleted.');
    }
    return { role_id: Number(role_id), role_nm: data.role_nm };
}

// soft deletes a role after making sure it is not the super admin role and no active user depends on it
exports.deleteRoleSrvc = async (role_id) => {
    // record is fetched first so the success message can carry its name
    const [record] = await settingsMdl.getActiveRoleByIdMdl(role_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Role not found or already deleted.');
    }

    // deleting the super admin role would lock every administrator out of the system
    if (record.role_hndlr === 'super_admin') {
        resutils.createError('recordInUse', 'The Super Admin role is protected and cannot be deleted.');
    }

    const [{ cnt: userCount }] = await settingsMdl.countActiveUsersByRoleMdl(role_id);
    if (userCount) {
        resutils.createError('recordInUse', `Role cannot be deleted. ${userCount} active user(s) are mapped to it. Reassign those users first.`);
    }

    const result = await settingsMdl.softDeleteRoleMdl(role_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Role not found or already deleted.');
    }
    return { role_id: Number(role_id), role_nm: record.role_nm };
}

// ===================== GENDER MASTER =====================

// fetches all active genders
exports.getGendersSrvc = async () => {
    return settingsMdl.getGendersMdl();
}

// creates a gender, reusing a soft deleted record when the same name/code comes back
exports.createGenderSrvc = async (payload) => {
    const gender_nm = normalizeName(payload.gender_nm);
    const gender_code = normalizeCode(payload.gender_code);

    const duplicates = await settingsMdl.getDuplicateGendersMdl(gender_nm, gender_code);

    const activeDuplicate = duplicates.find((record) => record.is_active == 1);
    if (activeDuplicate) {
        resutils.createError('duplicateRecord', `Gender already exists with the same name or code (${activeDuplicate.gender_nm} - ${activeDuplicate.gender_code}).`);
    }

    // a soft deleted duplicate is reactivated instead of inserting a new row
    const inactiveDuplicate = duplicates[0];
    if (inactiveDuplicate) {
        await settingsMdl.reactivateGenderMdl(inactiveDuplicate.gender_id, { gender_nm, gender_code });
        return { gender_id: inactiveDuplicate.gender_id, reactivated: true, gender_nm };
    }

    const result = await settingsMdl.insertGenderMdl({ gender_nm, gender_code });
    return { gender_id: result.insertId, reactivated: false, gender_nm };
}

// updates a gender after making sure the new name/code is not taken by another record
exports.updateGenderSrvc = async (gender_id, payload) => {
    const gender_nm = normalizeName(payload.gender_nm);
    const gender_code = normalizeCode(payload.gender_code);

    const duplicates = await settingsMdl.getDuplicateGendersMdl(gender_nm, gender_code, gender_id);
    if (duplicates.length) {
        resutils.createError('duplicateRecord', `Another gender already exists with the same name or code (${duplicates[0].gender_nm} - ${duplicates[0].gender_code}).`);
    }

    const result = await settingsMdl.updateGenderMdl(gender_id, { gender_nm, gender_code });
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Gender not found or already deleted.');
    }
    return { gender_id: Number(gender_id), gender_nm };
}

// soft deletes a gender
exports.deleteGenderSrvc = async (gender_id) => {
    // record is fetched first so the success message can carry its name
    const [record] = await settingsMdl.getActiveGenderByIdMdl(gender_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Gender not found or already deleted.');
    }

    const result = await settingsMdl.softDeleteGenderMdl(gender_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Gender not found or already deleted.');
    }
    return { gender_id: Number(gender_id), gender_nm: record.gender_nm };
}

// ===================== HIERARCHY MASTER =====================

// fetches all active hierarchies with their parent names
exports.getHierarchyListSrvc = async () => {
    return settingsMdl.getHierarchyListMdl();
}

// pulls the normalized hierarchy fields out of a request payload
// level types are stored lowercase with underscores and default to 'OTHER'
const normalizeHierarchyPayload = (payload) => ({
    hierarchy_nm: normalizeName(payload.hierarchy_nm),
    level_type: normalizeHandler(payload.level_type || '') || 'OTHER',
    parent_hirrarchy_id: payload.parent_hirrarchy_id ? Number(payload.parent_hirrarchy_id) : null
});

// makes sure the chosen parent exists, is not the record itself and does not create a cycle
const assertValidHierarchyParent = async (parent_hirrarchy_id, selfId = null) => {
    if (!parent_hirrarchy_id) return;

    if (selfId && Number(parent_hirrarchy_id) === Number(selfId)) {
        resutils.createError('invalidParent', 'A hierarchy cannot be its own parent.');
    }

    const parent = await settingsMdl.getActiveHierarchyByIdMdl(parent_hirrarchy_id);
    if (!parent.length) {
        resutils.createError('invalidParent', 'Selected parent hierarchy does not exist or is inactive.');
    }

    // walk up from the chosen parent; reaching the edited record means a circle
    if (selfId) {
        let currentId = Number(parent_hirrarchy_id);
        for (let depth = 0; currentId && depth < 20; depth++) {
            const [row] = await settingsMdl.getHierarchyParentMdl(currentId);
            currentId = row?.parent_hirrarchy_id ? Number(row.parent_hirrarchy_id) : null;

            if (currentId === Number(selfId)) {
                resutils.createError('invalidParent', 'Selected parent would create a circular hierarchy.');
            }
        }
    }
}

// creates a hierarchy, reusing a soft deleted record when the same name comes back
exports.createHierarchySrvc = async (payload) => {
    const data = normalizeHierarchyPayload(payload);

    await assertValidHierarchyParent(data.parent_hirrarchy_id);

    const duplicates = await settingsMdl.getDuplicateHierarchiesMdl(data.hierarchy_nm);

    const activeDuplicate = duplicates.find((record) => record.is_active == 1);
    if (activeDuplicate) {
        resutils.createError('duplicateRecord', `Hierarchy already exists with the same name (${activeDuplicate.hierarchy_nm}).`);
    }

    const inactiveDuplicate = duplicates[0];
    if (inactiveDuplicate) {
        await settingsMdl.reactivateHierarchyMdl(inactiveDuplicate.hierarchy_id, data);
        return { hierarchy_id: inactiveDuplicate.hierarchy_id, reactivated: true, hierarchy_nm: data.hierarchy_nm };
    }

    const result = await settingsMdl.insertHierarchyMdl(data);
    return { hierarchy_id: result.insertId, reactivated: false, hierarchy_nm: data.hierarchy_nm };
}

// updates a hierarchy after re-validating the parent chain and duplicate rules
exports.updateHierarchySrvc = async (hierarchy_id, payload) => {
    const data = normalizeHierarchyPayload(payload);

    await assertValidHierarchyParent(data.parent_hirrarchy_id, hierarchy_id);

    const duplicates = await settingsMdl.getDuplicateHierarchiesMdl(data.hierarchy_nm, hierarchy_id);
    if (duplicates.length) {
        resutils.createError('duplicateRecord', `Another hierarchy already exists with the same name (${duplicates[0].hierarchy_nm}).`);
    }

    const result = await settingsMdl.updateHierarchyMdl(hierarchy_id, data);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Hierarchy not found or already deleted.');
    }
    return { hierarchy_id: Number(hierarchy_id), hierarchy_nm: data.hierarchy_nm };
}

// soft deletes a hierarchy after making sure nothing depends on it
exports.deleteHierarchySrvc = async (hierarchy_id) => {
    // record is fetched first so the success message can carry its name
    const [record] = await settingsMdl.getActiveHierarchyByIdMdl(hierarchy_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Hierarchy not found or already deleted.');
    }

    const [{ cnt: childCount }] = await settingsMdl.countActiveChildHierarchiesMdl(hierarchy_id);
    if (childCount) {
        resutils.createError('recordInUse', `Hierarchy cannot be deleted. ${childCount} active child hierarchy(ies) are under it. Delete or re-parent those first.`);
    }

    const [{ cnt: roleCount }] = await settingsMdl.countActiveRolesByHierarchyMdl(hierarchy_id);
    if (roleCount) {
        resutils.createError('recordInUse', `Hierarchy cannot be deleted. ${roleCount} active role(s) are mapped to it. Reassign those roles first.`);
    }

    const [{ cnt: positionCount }] = await settingsMdl.countActivePositionsByHierarchyMdl(hierarchy_id);
    if (positionCount) {
        resutils.createError('recordInUse', `Hierarchy cannot be deleted. ${positionCount} active position(s) are mapped to it. Reassign those positions first.`);
    }

    const result = await settingsMdl.softDeleteHierarchyMdl(hierarchy_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Hierarchy not found or already deleted.');
    }
    return { hierarchy_id: Number(hierarchy_id), hierarchy_nm: record.hierarchy_nm };
}

// ===================== POSITION MASTER =====================

// login inner-joins position_lst_t on end_date >= today, so a position without an
// end date would silently lock its user out - hence the far-future default of 100 years
const defaultPositionEndDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 100);
    return date.toISOString().slice(0, 10);
};
const DATE_FORMAT_RE = /^\d{4}-\d{2}-\d{2}$/;

// fetches active positions visible to the logged in user's scope
exports.getPositionsSrvc = async (user) => {
    return settingsMdl.getPositionsMdl(user);
}

// fetches active roles for the position form dropdown
exports.getPositionRolesSrvc = async () => {
    return settingsMdl.getPositionRolesMdl();
}

// fetches active users without an active position for the position form dropdown
exports.getPositionUsersSrvc = async (excludePositionId = null) => {
    return settingsMdl.getPositionUsersMdl(excludePositionId);
}

// fetches active branches for the position form dropdown, optionally filtered by dairy farm,
// restricted to the logged in user's scope
exports.getPositionBranchesSrvc = async (user, dairy_farm_id = null) => {
    return settingsMdl.getPositionBranchesMdl(user, dairy_farm_id);
}

// validates an optional YYYY-MM-DD input, falling back to the given default
const normalizePositionDate = (value, label, fallback) => {
    const trimmed = emptyToNull(value);
    if (!trimmed) return fallback;

    if (!DATE_FORMAT_RE.test(trimmed) || isNaN(new Date(trimmed).getTime())) {
        resutils.createError('validationFailed', `${label} must be a valid date (YYYY-MM-DD).`);
    }
    return trimmed;
}

// pulls the normalized position fields out of a request payload
const normalizePositionPayload = (payload) => {
    const today = new Date().toISOString().slice(0, 10);
    const start_date = normalizePositionDate(payload.start_date, 'Start Date', today);
    const end_date = normalizePositionDate(payload.end_date, 'End Date', defaultPositionEndDate());

    // ISO date strings compare correctly as plain strings
    if (end_date < start_date) {
        resutils.createError('validationFailed', 'End Date cannot be earlier than Start Date.');
    }

    // an already-expired position would silently lock its user out of the application
    if (end_date < today) {
        resutils.createError('validationFailed', 'End Date cannot be in the past.');
    }

    return {
        position_nm: normalizeName(payload.position_nm),
        role_id: Number(payload.role_id),
        hierarchy_id: Number(payload.hierarchy_id),
        user_id: payload.user_id ? Number(payload.user_id) : null,
        // unset district/mandal/village are stored as 0 (the columns are NOT NULL DEFAULT 0)
        district_id: payload.district_id ? Number(payload.district_id) : 0,
        mandal_ulb_id: payload.mandal_ulb_id ? Number(payload.mandal_ulb_id) : 0,
        village_sachivalayam_id: payload.village_sachivalayam_id ? Number(payload.village_sachivalayam_id) : 0,
        dairy_farm_id: payload.dairy_farm_id ? Number(payload.dairy_farm_id) : null,
        location_ref_id: payload.location_ref_id ? Number(payload.location_ref_id) : null,
        start_date,
        end_date
    };
}

// makes sure the optional location chain is consistent: mandal/village belong to the chosen
// district (and village to the chosen mandal), and the dairy farm exists and is active
const assertPositionLocation = async (data) => {

    if ((data.mandal_ulb_id || data.village_sachivalayam_id) && !data.district_id) {
        resutils.createError('invalidParent', 'Select a district before choosing a mandal/ULB or village.');
    }

    if (data.district_id) {
        await assertActiveDistrict(data.district_id);
    }

    if (data.mandal_ulb_id) {
        const [mandal] = await settingsMdl.getActiveMandalByIdMdl(data.mandal_ulb_id);
        if (!mandal) {
            resutils.createError('invalidParent', 'Selected mandal/ULB does not exist or is inactive.');
        }
        if (mandal.district_id != data.district_id) {
            resutils.createError('invalidParent', 'Selected mandal/ULB does not belong to the selected district.');
        }
    }

    if (data.village_sachivalayam_id) {
        const [village] = await settingsMdl.getActiveVillageByIdMdl(data.village_sachivalayam_id);
        if (!village) {
            resutils.createError('invalidParent', 'Selected village/sachivalayam does not exist or is inactive.');
        }
        if (village.district_id != data.district_id) {
            resutils.createError('invalidParent', 'Selected village/sachivalayam does not belong to the selected district.');
        }
        if (data.mandal_ulb_id && village.mandal_ulb_id && village.mandal_ulb_id != data.mandal_ulb_id) {
            resutils.createError('invalidParent', 'Selected village/sachivalayam does not belong to the selected mandal/ULB.');
        }
    }

    if (data.dairy_farm_id) {
        const [dairyFarm] = await settingsMdl.getActiveDairyFarmByIdMdl(data.dairy_farm_id);
        if (!dairyFarm) {
            resutils.createError('invalidParent', 'Selected dairy farm does not exist or is inactive.');
        }
    }

    // location_ref_id references a branch, which must belong to the selected dairy farm
    if (data.location_ref_id) {
        if (!data.dairy_farm_id) {
            resutils.createError('invalidParent', 'Select a dairy farm before choosing a branch.');
        }
        const [branch] = await settingsMdl.getActiveBranchByIdMdl(data.location_ref_id);
        if (!branch) {
            resutils.createError('invalidParent', 'Selected branch does not exist or is inactive.');
        }
        if (branch.dairy_farm_id != data.dairy_farm_id) {
            resutils.createError('invalidParent', 'Selected branch does not belong to the selected dairy farm.');
        }
    }
}

// makes sure the chosen role exists and is active
const assertActiveRole = async (role_id) => {
    const parentRole = await settingsMdl.getActiveRoleByIdMdl(role_id);
    if (!parentRole.length) {
        resutils.createError('invalidParent', 'Selected role does not exist or is inactive.');
    }
}

// makes sure the optionally assigned user exists, is active and holds no other active position;
// login resolves a user through exactly one active position, so double assignments would break it
const assertAssignableUser = async (user_id, excludePositionId = null) => {
    if (!user_id) return;

    const user = await settingsMdl.getActiveUserByIdMdl(user_id);
    if (!user.length) {
        resutils.createError('invalidParent', 'Selected user does not exist or is inactive.');
    }

    const [{ cnt: positionCount }] = await settingsMdl.countActivePositionsByUserMdl(user_id, excludePositionId);
    if (positionCount) {
        resutils.createError('duplicateRecord', 'Selected user already holds another active position. Clear that assignment first.');
    }
}

// assigning a position grants its role: the user row's role_id (which login reads) is
// stamped from the position, so users are never given roles directly any more
const syncAssignedUserRole = async (data) => {
    if (!data.user_id) return;
    await settingsMdl.updateUserRoleMdl(data.user_id, data.role_id);
}

// role, hierarchy, location and assignment checks are independent of each other,
// so they run concurrently instead of queueing five round trips
const assertValidPosition = (data, excludePositionId = null) => {
    return Promise.all([
        assertActiveRole(data.role_id),
        assertActiveHierarchy(data.hierarchy_id),
        assertPositionLocation(data),
        assertAssignableUser(data.user_id, excludePositionId)
    ]);
}

// creates a position, reusing a soft deleted record when the same name/role/hierarchy/location comes back
exports.createPositionSrvc = async (payload) => {
    const data = normalizePositionPayload(payload);

    await assertValidPosition(data);

    const duplicates = await settingsMdl.getDuplicatePositionsMdl(data);

    const activeDuplicate = duplicates.find((record) => record.is_active == 1);
    if (activeDuplicate) {
        resutils.createError('duplicateRecord', `Position already exists with the same name, role, hierarchy and location (${activeDuplicate.position_nm}).`);
    }

    // a soft deleted duplicate is reactivated instead of inserting a new row
    const inactiveDuplicate = duplicates[0];
    if (inactiveDuplicate) {
        await settingsMdl.reactivatePositionMdl(inactiveDuplicate.position_id, data);
        await syncAssignedUserRole(data);
        return { position_id: inactiveDuplicate.position_id, reactivated: true, position_nm: data.position_nm };
    }

    const result = await settingsMdl.insertPositionMdl(data);
    await syncAssignedUserRole(data);
    return { position_id: result.insertId, reactivated: false, position_nm: data.position_nm };
}

// updates a position after re-validating parents, location, assignment and duplicate rules
exports.updatePositionSrvc = async (position_id, payload) => {
    const data = normalizePositionPayload(payload);

    await assertValidPosition(data, position_id);

    const duplicates = await settingsMdl.getDuplicatePositionsMdl(data, position_id);
    if (duplicates.length) {
        resutils.createError('duplicateRecord', `Another position already exists with the same name, role, hierarchy and location (${duplicates[0].position_nm}).`);
    }

    const result = await settingsMdl.updatePositionMdl(position_id, data);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Position not found or already deleted.');
    }

    await syncAssignedUserRole(data);

    return { position_id: Number(position_id), position_nm: data.position_nm };
}

// soft deletes a position after making sure no user is assigned to it
exports.deletePositionSrvc = async (position_id) => {
    // record is fetched first so the success message can carry its name
    const [record] = await settingsMdl.getActivePositionByIdMdl(position_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Position not found or already deleted.');
    }

    // an assigned user logs in through this position row - deleting it would lock them out
    if (record.user_id) {
        resutils.createError('recordInUse', 'Position cannot be deleted while a user is assigned to it. Clear the Assigned User first.');
    }

    const result = await settingsMdl.softDeletePositionMdl(position_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Position not found or already deleted.');
    }
    return { position_id: Number(position_id), position_nm: record.position_nm };
}

// ===================== DAIRY FARM MASTER =====================

// fetches active dairy farms visible to the logged in user's scope
exports.getDairyFarmsSrvc = async (user) => {
    return settingsMdl.getDairyFarmsMdl(user);
}

// pulls the normalized dairy farm and main branch fields out of a request payload; the codes
// are not part of the payload - they are generated server-side on create and never change
const normalizeDairyFarmPayload = (payload) => ({
    farm: {
        dairy_farm_name: normalizeName(payload.dairy_farm_name),
        contact_number: emptyToNull(payload.contact_number),
        email: emptyToNull(payload.email)?.toLowerCase() ?? null,
        address: emptyToNull(payload.address)
    },
    branch: {
        branch_name: normalizeName(payload.main_branch_name),
        state_id: Number(payload.state_id),
        district_id: Number(payload.district_id),
        mandal_ulb_id: Number(payload.mandal_ulb_id),
        village_sachivalayam_id: Number(payload.village_sachivalayam_id)
    }
});

// the branch location columns are NOT NULL in branches_lst_t, so the full chain is mandatory:
// state -> district -> mandal/ULB -> village, each child belonging to its chosen parent.
// returns the address composed from the validated location names - addresses are derived, never typed
const assertMainBranchLocation = async (branch) => {

    const [state] = await settingsMdl.getActiveStateByIdMdl(branch.state_id);
    if (!state) {
        resutils.createError('invalidParent', 'Selected state does not exist or is inactive.');
    }

    const [district] = await settingsMdl.getActiveDistrictByIdMdl(branch.district_id);
    if (!district) {
        resutils.createError('invalidParent', 'Selected district does not exist or is inactive.');
    }
    if (district.state_id != branch.state_id) {
        resutils.createError('invalidParent', 'Selected district does not belong to the selected state.');
    }

    const [mandal] = await settingsMdl.getActiveMandalByIdMdl(branch.mandal_ulb_id);
    if (!mandal) {
        resutils.createError('invalidParent', 'Selected mandal/ULB does not exist or is inactive.');
    }
    if (mandal.district_id != branch.district_id) {
        resutils.createError('invalidParent', 'Selected mandal/ULB does not belong to the selected district.');
    }

    const [village] = await settingsMdl.getActiveVillageByIdMdl(branch.village_sachivalayam_id);
    if (!village) {
        resutils.createError('invalidParent', 'Selected village/sachivalayam does not exist or is inactive.');
    }
    if (village.district_id != branch.district_id) {
        resutils.createError('invalidParent', 'Selected village/sachivalayam does not belong to the selected district.');
    }
    if (village.mandal_ulb_id && village.mandal_ulb_id != branch.mandal_ulb_id) {
        resutils.createError('invalidParent', 'Selected village/sachivalayam does not belong to the selected mandal/ULB.');
    }

    return `${village.village_sachivalayam_nm}, ${mandal.mandal_ulb_nm}, ${district.district_name}, ${state.state_name}`;
}

// builds a unique branch code under the farm's code, e.g. 'SDF-3210' + 'Main Branch' -> 'SDF-3210-MB'
const generateBranchCode = async (farm_code, branch_name) => {
    const initials = branch_name.split(/\s+/).map((word) => word[0]).join('').toUpperCase().slice(0, 4);
    const base = `${farm_code}-${initials}`;

    let candidate = base;
    for (let suffix = 2; suffix < 100; suffix++) {
        const existing = await settingsMdl.getBranchByCodeMdl(candidate);
        if (!existing.length) return candidate;
        candidate = `${base}-${suffix}`;
    }
    resutils.createError('duplicateRecord', 'Unable to generate a unique branch code. Please try a different branch name.');
}

// updates, restores or creates the farm's single main branch - farms created before the
// main-branch rule get one here the next time they are saved
const upsertMainBranch = async (dairy_farm_id, farm_code, farm, branch, user_id) => {
    const [existing] = await settingsMdl.getMainBranchByFarmMdl(dairy_farm_id);

    if (existing && existing.is_active == 1) {
        return settingsMdl.updateMainBranchMdl(existing.branch_id, branch, farm, user_id);
    }
    if (existing) {
        return settingsMdl.reactivateMainBranchMdl(existing.branch_id, branch, farm, user_id);
    }

    branch.branch_code = await generateBranchCode(farm_code, branch.branch_name);
    return settingsMdl.insertMainBranchMdl(dairy_farm_id, branch, farm, user_id);
}

// builds a readable unique code from the farm name initials and the mobile's last digits,
// e.g. 'Sunrise Dairy Farm' + 9876543210 -> 'SDF-3210'; a numeric suffix resolves clashes
const generateDairyFarmCode = async (dairy_farm_name, contact_number) => {
    const initials = dairy_farm_name.split(/\s+/).map((word) => word[0]).join('').toUpperCase().slice(0, 4);
    const digits = (contact_number || '').replace(/\D/g, '').slice(-4);
    const base = digits ? `${initials}-${digits}` : initials;

    let candidate = base;
    for (let suffix = 2; suffix < 100; suffix++) {
        const existing = await settingsMdl.getDairyFarmByCodeMdl(candidate);
        if (!existing.length) return candidate;
        candidate = `${base}-${suffix}`;
    }
    resutils.createError('duplicateRecord', 'Unable to generate a unique dairy farm code. Please try a different name.');
}

// creates a dairy farm together with its main branch, reusing a soft deleted farm when the same name comes back
exports.createDairyFarmSrvc = async (payload, user_id) => {
    const { farm, branch } = normalizeDairyFarmPayload(payload);

    // the stored address is always the server-composed location string
    farm.address = await assertMainBranchLocation(branch);

    const duplicates = await settingsMdl.getDuplicateDairyFarmsMdl(farm.dairy_farm_name);

    const activeDuplicate = duplicates.find((record) => record.is_active == 1);
    if (activeDuplicate) {
        resutils.createError('duplicateRecord', `Dairy farm already exists with the same name (${activeDuplicate.dairy_farm_name} - ${activeDuplicate.dairy_farm_code}).`);
    }

    // a soft deleted duplicate is reactivated instead of inserting a new row; it keeps its
    // original code, and its main branch is restored or created alongside it
    const inactiveDuplicate = duplicates[0];
    if (inactiveDuplicate) {
        await settingsMdl.reactivateDairyFarmMdl(inactiveDuplicate.dairy_farm_id, farm, user_id);
        await upsertMainBranch(inactiveDuplicate.dairy_farm_id, inactiveDuplicate.dairy_farm_code, farm, branch, user_id);
        return { dairy_farm_id: inactiveDuplicate.dairy_farm_id, reactivated: true, dairy_farm_name: farm.dairy_farm_name };
    }

    farm.dairy_farm_code = await generateDairyFarmCode(farm.dairy_farm_name, farm.contact_number);
    branch.branch_code = await generateBranchCode(farm.dairy_farm_code, branch.branch_name);

    const result = await settingsMdl.createDairyFarmWithMainBranchMdl(farm, branch, user_id);
    return { dairy_farm_id: result.insertId, reactivated: false, dairy_farm_name: farm.dairy_farm_name };
}

// updates a dairy farm and its main branch after making sure the new name is not taken
exports.updateDairyFarmSrvc = async (dairy_farm_id, payload, user_id) => {
    const { farm, branch } = normalizeDairyFarmPayload(payload);

    // fetched first for its code, which the main branch upsert may need for code generation
    const [record] = await settingsMdl.getActiveDairyFarmByIdMdl(dairy_farm_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Dairy farm not found or already deleted.');
    }

    // the stored address is always the server-composed location string
    farm.address = await assertMainBranchLocation(branch);

    const duplicates = await settingsMdl.getDuplicateDairyFarmsMdl(farm.dairy_farm_name, dairy_farm_id);
    if (duplicates.length) {
        resutils.createError('duplicateRecord', `Another dairy farm already exists with the same name (${duplicates[0].dairy_farm_name} - ${duplicates[0].dairy_farm_code}).`);
    }

    await settingsMdl.updateDairyFarmMdl(dairy_farm_id, farm, user_id);

    // farms created before the main-branch rule get their main branch here
    await upsertMainBranch(dairy_farm_id, record.dairy_farm_code, farm, branch, user_id);

    return { dairy_farm_id: Number(dairy_farm_id), dairy_farm_name: farm.dairy_farm_name };
}

// soft deletes a dairy farm and its main branch after making sure no active sub branch depends on it
exports.deleteDairyFarmSrvc = async (dairy_farm_id, user_id) => {
    // record is fetched first so the success message can carry its name
    const [record] = await settingsMdl.getActiveDairyFarmByIdMdl(dairy_farm_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Dairy farm not found or already deleted.');
    }

    const [{ cnt: subBranchCount }] = await settingsMdl.countActiveSubBranchesByDairyFarmMdl(dairy_farm_id);
    if (subBranchCount) {
        resutils.createError('recordInUse', `Dairy farm cannot be deleted. ${subBranchCount} active branch(es) are mapped to it. Delete those branches first.`);
    }

    // the main branch belongs to the farm and goes down with it, in one transaction
    await settingsMdl.softDeleteDairyFarmWithMainBranchMdl(dairy_farm_id, user_id);

    return { dairy_farm_id: Number(dairy_farm_id), dairy_farm_name: record.dairy_farm_name };
}

// ===================== ROLE PERMISSIONS =====================

// permission keys are stored lowercase with hyphens, e.g. ' Dairy Farm ' -> 'dairy-farm'
const normalizePermissionKey = (value = '') => value.trim().replace(/\s+/g, '-').toLowerCase();

// fetches all active role permissions
exports.getRolePermissionListSrvc = async () => {
    return settingsMdl.getRolePermissionListMdl();
}

// pulls the normalized permission fields out of a request payload
const normalizeRolePermissionPayload = (payload) => ({
    role_id: Number(payload.role_id),
    permission_key: normalizePermissionKey(payload.permission_key),
    can_view: payload.can_view ? 1 : 0,
    can_insert: payload.can_insert ? 1 : 0,
    can_update: payload.can_update ? 1 : 0,
    can_delete: payload.can_delete ? 1 : 0
});

// the super admin's own permission row for this screen must never be edited or removed -
// changing it would lock every administrator out of permission management
const assertNotProtectedPermission = (record) => {
    if (record.role_hndlr === 'super_admin' && record.permission_key === 'role-permissions') {
        resutils.createError('recordInUse', "The Super Admin's 'role-permissions' entry is protected and cannot be changed.");
    }
}

// creates a role permission, reusing a soft deleted record when the same role/key comes back
exports.createRolePermissionSrvc = async (payload) => {
    const data = normalizeRolePermissionPayload(payload);

    await assertActiveRole(data.role_id);

    const duplicates = await settingsMdl.getDuplicateRolePermissionsMdl(data.role_id, data.permission_key);

    const activeDuplicate = duplicates.find((record) => record.is_active == 1);
    if (activeDuplicate) {
        resutils.createError('duplicateRecord', `This role already has a permission entry for '${activeDuplicate.permission_key}'. Edit that entry instead.`);
    }

    const inactiveDuplicate = duplicates[0];
    if (inactiveDuplicate) {
        await settingsMdl.reactivateRolePermissionMdl(inactiveDuplicate.role_permission_id, data);
        return { role_permission_id: inactiveDuplicate.role_permission_id, reactivated: true, permission_key: data.permission_key };
    }

    const result = await settingsMdl.insertRolePermissionMdl(data);
    return { role_permission_id: result.insertId, reactivated: false, permission_key: data.permission_key };
}

// updates a role permission after duplicate and protection checks
exports.updateRolePermissionSrvc = async (role_permission_id, payload) => {
    const data = normalizeRolePermissionPayload(payload);

    const [existing] = await settingsMdl.getActiveRolePermissionByIdMdl(role_permission_id);
    if (!existing) {
        resutils.createError('recordNotFound', 'Permission entry not found or already deleted.');
    }
    assertNotProtectedPermission(existing);

    await assertActiveRole(data.role_id);

    const duplicates = await settingsMdl.getDuplicateRolePermissionsMdl(data.role_id, data.permission_key, role_permission_id);
    if (duplicates.length) {
        resutils.createError('duplicateRecord', `This role already has another permission entry for '${duplicates[0].permission_key}'.`);
    }

    const result = await settingsMdl.updateRolePermissionMdl(role_permission_id, data);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Permission entry not found or already deleted.');
    }
    return { role_permission_id: Number(role_permission_id), permission_key: data.permission_key };
}

// soft deletes a role permission; super admin rows stay - removing them would lock administrators out
exports.deleteRolePermissionSrvc = async (role_permission_id) => {
    const [record] = await settingsMdl.getActiveRolePermissionByIdMdl(role_permission_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Permission entry not found or already deleted.');
    }

    if (record.role_hndlr === 'super_admin') {
        resutils.createError('recordInUse', 'Super Admin permission entries are protected and cannot be deleted.');
    }

    const result = await settingsMdl.softDeleteRolePermissionMdl(role_permission_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Permission entry not found or already deleted.');
    }
    return { role_permission_id: Number(role_permission_id), permission_key: record.permission_key };
}

// ===================== MENU ITEMS =====================

// fetches all active menu items
exports.getMenuItemListSrvc = async () => {
    return settingsMdl.getMenuItemListMdl();
}

// fetches active main menu items for the parent dropdown
exports.getMenuParentItemsSrvc = async () => {
    return settingsMdl.getMenuParentItemsMdl();
}

// pulls the normalized menu item fields out of a request payload
const normalizeMenuItemPayload = (payload) => {
    // presence and allowed values are enforced by the controller's payload schema (enum rule)
    const menu_item_category = emptyToNull(payload.menu_item_category);

    const is_quick_menu = payload.is_quick_menu ? 1 : 0;

    return {
        menu_name: normalizeName(payload.menu_name),
        menu_url: emptyToNull(payload.menu_url),
        icon: emptyToNull(payload.icon),
        is_main_item: payload.is_main_item ? 1 : 0,
        is_quick_menu,
        parent_item_id: payload.parent_item_id ? Number(payload.parent_item_id) : null,
        quick_menu_ctgry_id: payload.quick_menu_ctgry_id ? Number(payload.quick_menu_ctgry_id) : null,
        menu_item_category
    };
}

// cross-field rules: quick menus need a category (the settings hub groups tiles by it),
// main items cannot hang under a parent, and parents/categories must exist and be active
const assertValidMenuItem = async (data, selfId = null) => {

    if (data.is_quick_menu && !data.quick_menu_ctgry_id) {
        resutils.createError('validationFailed', 'Quick menus must be mapped to a quick menu category.');
    }

    if (data.is_main_item && data.parent_item_id) {
        resutils.createError('validationFailed', 'A main menu item cannot have a parent. Clear the parent or the main item flag.');
    }

    if (data.parent_item_id) {
        if (selfId && Number(data.parent_item_id) === Number(selfId)) {
            resutils.createError('invalidParent', 'A menu item cannot be its own parent.');
        }
        const [parent] = await settingsMdl.getActiveMenuItemByIdMdl(data.parent_item_id);
        if (!parent) {
            resutils.createError('invalidParent', 'Selected parent menu does not exist or is inactive.');
        }
    }

    if (data.quick_menu_ctgry_id) {
        const [category] = await settingsMdl.getActiveMenuCategoryByIdMdl(data.quick_menu_ctgry_id);
        if (!category) {
            resutils.createError('invalidParent', 'Selected quick menu category does not exist or is inactive.');
        }
    }
}

// creates a menu item, reusing a soft deleted record when the same name/parent/flag comes back
exports.createMenuItemSrvc = async (payload) => {
    const data = normalizeMenuItemPayload(payload);

    await assertValidMenuItem(data);

    const duplicates = await settingsMdl.getDuplicateMenuItemsMdl(data.menu_name, data.parent_item_id, data.is_quick_menu);

    const activeDuplicate = duplicates.find((record) => record.is_active == 1);
    if (activeDuplicate) {
        resutils.createError('duplicateRecord', `Menu item already exists with the same name under the same parent (${activeDuplicate.menu_name}).`);
    }

    const inactiveDuplicate = duplicates[0];
    if (inactiveDuplicate) {
        await settingsMdl.reactivateMenuItemMdl(inactiveDuplicate.menu_item_id, data);
        return { menu_item_id: inactiveDuplicate.menu_item_id, reactivated: true, menu_name: data.menu_name };
    }

    const result = await settingsMdl.insertMenuItemMdl(data);
    return { menu_item_id: result.insertId, reactivated: false, menu_name: data.menu_name };
}

// updates a menu item after re-validating cross-field and duplicate rules
exports.updateMenuItemSrvc = async (menu_item_id, payload) => {
    const data = normalizeMenuItemPayload(payload);

    await assertValidMenuItem(data, menu_item_id);

    const duplicates = await settingsMdl.getDuplicateMenuItemsMdl(data.menu_name, data.parent_item_id, data.is_quick_menu, menu_item_id);
    if (duplicates.length) {
        resutils.createError('duplicateRecord', `Another menu item already exists with the same name under the same parent (${duplicates[0].menu_name}).`);
    }

    const result = await settingsMdl.updateMenuItemMdl(menu_item_id, data);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Menu item not found or already deleted.');
    }
    return { menu_item_id: Number(menu_item_id), menu_name: data.menu_name };
}

// soft deletes a menu item after making sure no children or role mappings depend on it
exports.deleteMenuItemSrvc = async (menu_item_id) => {
    const [record] = await settingsMdl.getActiveMenuItemByIdMdl(menu_item_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Menu item not found or already deleted.');
    }

    const [{ cnt: childCount }] = await settingsMdl.countActiveChildMenuItemsMdl(menu_item_id);
    if (childCount) {
        resutils.createError('recordInUse', `Menu item cannot be deleted. ${childCount} active sub menu(s) are under it. Delete or re-parent those first.`);
    }

    const [{ cnt: mapCount }] = await settingsMdl.countActiveRoleMapsByMenuItemMdl(menu_item_id);
    if (mapCount) {
        resutils.createError('recordInUse', `Menu item cannot be deleted. ${mapCount} active role mapping(s) reference it. Remove those mappings first.`);
    }

    const result = await settingsMdl.softDeleteMenuItemMdl(menu_item_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Menu item not found or already deleted.');
    }
    return { menu_item_id: Number(menu_item_id), menu_name: record.menu_name };
}

// ===================== QUICK MENU CATEGORIES =====================

// fetches all active quick menu categories
exports.getMenuCategoryListSrvc = async () => {
    return settingsMdl.getMenuCategoryListMdl();
}

// pulls the normalized category fields out of a request payload
const normalizeMenuCategoryPayload = (payload) => ({
    ctgry_nm: normalizeName(payload.ctgry_nm),
    ctgry_cd: normalizeCode(payload.ctgry_cd),
    description: emptyToNull(payload.description),
    display_order: payload.display_order ? Number(payload.display_order) : 0,
    icon: emptyToNull(payload.icon)
});

// creates a quick menu category, reusing a soft deleted record when the same name/code comes back
exports.createMenuCategorySrvc = async (payload) => {
    const data = normalizeMenuCategoryPayload(payload);

    const duplicates = await settingsMdl.getDuplicateMenuCategoriesMdl(data.ctgry_nm, data.ctgry_cd);

    const activeDuplicate = duplicates.find((record) => record.is_active == 1);
    if (activeDuplicate) {
        resutils.createError('duplicateRecord', `Category already exists with the same name or code (${activeDuplicate.ctgry_nm} - ${activeDuplicate.ctgry_cd}).`);
    }

    const inactiveDuplicate = duplicates[0];
    if (inactiveDuplicate) {
        await settingsMdl.reactivateMenuCategoryMdl(inactiveDuplicate.quick_menu_ctgry_id, data);
        return { quick_menu_ctgry_id: inactiveDuplicate.quick_menu_ctgry_id, reactivated: true, ctgry_nm: data.ctgry_nm };
    }

    const result = await settingsMdl.insertMenuCategoryMdl(data);
    return { quick_menu_ctgry_id: result.insertId, reactivated: false, ctgry_nm: data.ctgry_nm };
}

// updates a quick menu category after duplicate checks
exports.updateMenuCategorySrvc = async (quick_menu_ctgry_id, payload) => {
    const data = normalizeMenuCategoryPayload(payload);

    const duplicates = await settingsMdl.getDuplicateMenuCategoriesMdl(data.ctgry_nm, data.ctgry_cd, quick_menu_ctgry_id);
    if (duplicates.length) {
        resutils.createError('duplicateRecord', `Another category already exists with the same name or code (${duplicates[0].ctgry_nm} - ${duplicates[0].ctgry_cd}).`);
    }

    const result = await settingsMdl.updateMenuCategoryMdl(quick_menu_ctgry_id, data);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Category not found or already deleted.');
    }
    return { quick_menu_ctgry_id: Number(quick_menu_ctgry_id), ctgry_nm: data.ctgry_nm };
}

// soft deletes a quick menu category after making sure no menu items depend on it
exports.deleteMenuCategorySrvc = async (quick_menu_ctgry_id) => {
    const [record] = await settingsMdl.getActiveMenuCategoryByIdMdl(quick_menu_ctgry_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Category not found or already deleted.');
    }

    const [{ cnt: itemCount }] = await settingsMdl.countActiveMenuItemsByCategoryMdl(quick_menu_ctgry_id);
    if (itemCount) {
        resutils.createError('recordInUse', `Category cannot be deleted. ${itemCount} active menu item(s) are mapped to it. Re-map those first.`);
    }

    const result = await settingsMdl.softDeleteMenuCategoryMdl(quick_menu_ctgry_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Category not found or already deleted.');
    }
    return { quick_menu_ctgry_id: Number(quick_menu_ctgry_id), ctgry_nm: record.ctgry_nm };
}

// ===================== ROLE MENU MAPPING =====================

// fetches all active role menu mappings
exports.getRoleMenuMapListSrvc = async () => {
    return settingsMdl.getRoleMenuMapListMdl();
}

// fetches active menu items for the mapping form dropdown
exports.getRoleMenuMapMenuItemsSrvc = async () => {
    return settingsMdl.getRoleMenuMapMenuItemsMdl();
}

// creates a role menu mapping; the DB enforces one row per role+menu, so a soft deleted
// pair is ALWAYS reactivated - inserting again would violate the unique key
exports.createRoleMenuMapSrvc = async (payload) => {
    const data = {
        role_id: Number(payload.role_id),
        menu_item_id: Number(payload.menu_item_id),
        display_order: payload.display_order ? Number(payload.display_order) : 0
    };

    await assertActiveRole(data.role_id);

    const [menuItem] = await settingsMdl.getActiveMenuItemByIdMdl(data.menu_item_id);
    if (!menuItem) {
        resutils.createError('invalidParent', 'Selected menu item does not exist or is inactive.');
    }

    const duplicates = await settingsMdl.getDuplicateRoleMenuMapsMdl(data.role_id, data.menu_item_id);

    const activeDuplicate = duplicates.find((record) => record.is_active == 1);
    if (activeDuplicate) {
        resutils.createError('duplicateRecord', 'This role is already mapped to the selected menu item.');
    }

    const inactiveDuplicate = duplicates[0];
    if (inactiveDuplicate) {
        await settingsMdl.reactivateRoleMenuMapMdl(inactiveDuplicate.role_menu_id, data);
        return { role_menu_id: inactiveDuplicate.role_menu_id, reactivated: true, menu_name: menuItem.menu_name };
    }

    const result = await settingsMdl.insertRoleMenuMapMdl(data);
    return { role_menu_id: result.insertId, reactivated: false, menu_name: menuItem.menu_name };
}

// updates a role menu mapping after re-validating parents and the unique role+menu rule
exports.updateRoleMenuMapSrvc = async (role_menu_id, payload) => {
    const data = {
        role_id: Number(payload.role_id),
        menu_item_id: Number(payload.menu_item_id),
        display_order: payload.display_order ? Number(payload.display_order) : 0
    };

    await assertActiveRole(data.role_id);

    const [menuItem] = await settingsMdl.getActiveMenuItemByIdMdl(data.menu_item_id);
    if (!menuItem) {
        resutils.createError('invalidParent', 'Selected menu item does not exist or is inactive.');
    }

    const duplicates = await settingsMdl.getDuplicateRoleMenuMapsMdl(data.role_id, data.menu_item_id, role_menu_id);
    if (duplicates.length) {
        resutils.createError('duplicateRecord', 'Another mapping already exists for this role and menu item.');
    }

    const result = await settingsMdl.updateRoleMenuMapMdl(role_menu_id, data);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Mapping not found or already deleted.');
    }
    return { role_menu_id: Number(role_menu_id), menu_name: menuItem.menu_name };
}

// soft deletes a role menu mapping
exports.deleteRoleMenuMapSrvc = async (role_menu_id) => {
    const [record] = await settingsMdl.getActiveRoleMenuMapByIdMdl(role_menu_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Mapping not found or already deleted.');
    }

    const result = await settingsMdl.softDeleteRoleMenuMapMdl(role_menu_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Mapping not found or already deleted.');
    }
    return { role_menu_id: Number(role_menu_id), menu_name: record.menu_name };
}

// ===================== USERS =====================

// fetches active users visible to the logged in user's scope
exports.getUserListSrvc = async (user) => {
    return settingsMdl.getUserListMdl(user);
}

// pulls the normalized user fields out of a request payload; the login name is always the
// email, and the role is intentionally absent - it is granted through a position assignment
const normalizeUserPayload = (payload) => {
    const email = (payload.email || '').trim().toLowerCase();

    return {
        user_nm: email,
        email,
        first_nm: emptyToNull(payload.first_nm),
        last_nm: emptyToNull(payload.last_nm),
        mobile_no: emptyToNull(payload.mobile_no),
        gender_id: payload.gender_id ? Number(payload.gender_id) : null
    };
}

// makes sure the optionally chosen gender exists and is active
const assertActiveGender = async (gender_id) => {
    if (!gender_id) return;

    const gender = await settingsMdl.getActiveGenderByIdMdl(gender_id);
    if (!gender.length) {
        resutils.createError('invalidParent', 'Selected gender does not exist or is inactive.');
    }
}

// creates a user with a bcrypt-hashed password; password_txt is stored alongside it to
// match the signup convention (note: login only ever verifies against the hash)
exports.createUserSrvc = async (payload) => {
    const data = normalizeUserPayload(payload);

    await assertActiveGender(data.gender_id);

    const password_salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(payload.password, password_salt);
    const credentials = { password_hash, password_salt, password_txt: payload.password };

    const duplicates = await settingsMdl.getDuplicateUsersMdl(data.user_nm);

    const activeDuplicate = duplicates.find((record) => record.is_active == 1);
    if (activeDuplicate) {
        resutils.createError('duplicateRecord', `A user already exists with the email '${activeDuplicate.user_nm}'.`);
    }

    // a soft deleted user is reactivated with fresh details and credentials
    const inactiveDuplicate = duplicates[0];
    if (inactiveDuplicate) {
        await settingsMdl.reactivateUserMdl(inactiveDuplicate.user_id, { ...data, ...credentials });
        return { user_id: inactiveDuplicate.user_id, reactivated: true, user_nm: data.user_nm };
    }

    const result = await settingsMdl.insertUserMdl({ ...data, ...credentials });
    return { user_id: result.insertId, reactivated: false, user_nm: data.user_nm };
}

// updates a user's profile and role; passwords change only through the forgot password flow
exports.updateUserSrvc = async (user_id, payload) => {
    const data = normalizeUserPayload(payload);

    await assertActiveGender(data.gender_id);

    const duplicates = await settingsMdl.getDuplicateUsersMdl(data.user_nm, user_id);
    if (duplicates.length) {
        resutils.createError('duplicateRecord', `Another user already exists with the email '${duplicates[0].user_nm}'.`);
    }

    const result = await settingsMdl.updateUserMdl(user_id, data);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'User not found or already deleted.');
    }
    return { user_id: Number(user_id), user_nm: data.user_nm };
}

// soft deletes a user with three guards: no self-delete, super admins are protected,
// and users still holding an active position must be unassigned first
exports.deleteUserSrvc = async (user_id, requestingUserId) => {
    const [record] = await settingsMdl.getActiveUserForAdminByIdMdl(user_id);
    if (!record) {
        resutils.createError('recordNotFound', 'User not found or already deleted.');
    }

    if (Number(user_id) === Number(requestingUserId)) {
        resutils.createError('recordInUse', 'You cannot delete your own account.');
    }

    if (record.role_hndlr === 'super_admin') {
        resutils.createError('recordInUse', 'Super Admin users are protected and cannot be deleted.');
    }

    const [{ cnt: positionCount }] = await settingsMdl.countActivePositionsByUserMdl(user_id);
    if (positionCount) {
        resutils.createError('recordInUse', 'User still holds an active position. Clear that assignment first.');
    }

    const result = await settingsMdl.softDeleteUserMdl(user_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'User not found or already deleted.');
    }
    return { user_id: Number(user_id), user_nm: record.user_nm };
}
