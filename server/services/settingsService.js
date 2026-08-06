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

// fetches all active villages/sachivalayams
exports.getVillagesSrvc = async () => {
    return settingsMdl.getVillagesMdl();
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
