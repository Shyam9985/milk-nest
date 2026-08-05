const settingsMdl = require('../models/settingsMdl');
const resutils = require('../utils/response.utils');

// normalizes names and codes before comparing and storing
const normalizeName = (value = '') => value.trim().replace(/\s+/g, ' ');
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
        return { state_id: inactiveDuplicate.state_id, reactivated: true };
    }

    const result = await settingsMdl.insertStateMdl({ state_name, state_code });
    return { state_id: result.insertId, reactivated: false };
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
    return { state_id: Number(state_id) };
}

// soft deletes a state
exports.deleteStateSrvc = async (state_id) => {
    const result = await settingsMdl.softDeleteStateMdl(state_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'State not found or already deleted.');
    }
    return { state_id: Number(state_id) };
}
