import { get, post, put, remove } from "../store/api.service";

export async function getStates() {
    try {
        return await get('settings/master/state');
    } catch (error) {
        return error;
    }
}

export async function createState(payload) {
    try {
        return await post('settings/master/state', payload);
    } catch (error) {
        return error;
    }
}

export async function updateState(stateId, payload) {
    try {
        return await put(`settings/master/state/${stateId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteState(stateId) {
    try {
        return await remove(`settings/master/state/${stateId}`);
    } catch (error) {
        return error;
    }
}

export async function getDistricts(queryParams = {}) {
    try {
        return await get('settings/master/district', queryParams);
    } catch (error) {
        return error;
    }
}

export async function createDistrict(payload) {
    try {
        return await post('settings/master/district', payload);
    } catch (error) {
        return error;
    }
}

export async function updateDistrict(districtId, payload) {
    try {
        return await put(`settings/master/district/${districtId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteDistrict(districtId) {
    try {
        return await remove(`settings/master/district/${districtId}`);
    } catch (error) {
        return error;
    }
}

export async function getMandals(queryParams = {}) {
    try {
        return await get('settings/master/mandal', queryParams);
    } catch (error) {
        return error;
    }
}

export async function createMandal(payload) {
    try {
        return await post('settings/master/mandal', payload);
    } catch (error) {
        return error;
    }
}

export async function updateMandal(mandalId, payload) {
    try {
        return await put(`settings/master/mandal/${mandalId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteMandal(mandalId) {
    try {
        return await remove(`settings/master/mandal/${mandalId}`);
    } catch (error) {
        return error;
    }
}

export async function getVillages() {
    try {
        return await get('settings/master/village');
    } catch (error) {
        return error;
    }
}

export async function createVillage(payload) {
    try {
        return await post('settings/master/village', payload);
    } catch (error) {
        return error;
    }
}

export async function updateVillage(villageId, payload) {
    try {
        return await put(`settings/master/village/${villageId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteVillage(villageId) {
    try {
        return await remove(`settings/master/village/${villageId}`);
    } catch (error) {
        return error;
    }
}

export async function getRoles() {
    try {
        return await get('settings/master/role');
    } catch (error) {
        return error;
    }
}

export async function getRoleHierarchies() {
    try {
        return await get('settings/master/role/hierarchy');
    } catch (error) {
        return error;
    }
}

export async function createRole(payload) {
    try {
        return await post('settings/master/role', payload);
    } catch (error) {
        return error;
    }
}

export async function updateRole(roleId, payload) {
    try {
        return await put(`settings/master/role/${roleId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteRole(roleId) {
    try {
        return await remove(`settings/master/role/${roleId}`);
    } catch (error) {
        return error;
    }
}
