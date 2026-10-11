import { get, post, put, remove } from "../store/api.service";

// the breeding register plus the dropdown of animals still available to breed
export async function getPregnancyList(queryParams = {}) {
    try {
        return await get('breeding', queryParams);
    } catch (error) {
        return error;
    }
}

export async function createPregnancy(payload) {
    try {
        return await post('breeding', payload);
    } catch (error) {
        return error;
    }
}

export async function updatePregnancy(pregnancyId, payload) {
    try {
        return await put(`breeding/${pregnancyId}`, payload);
    } catch (error) {
        return error;
    }
}

// the incharge confirming she has stopped giving milk
export async function markDryOff(pregnancyId, payload) {
    try {
        return await put(`breeding/${pregnancyId}/dry-off`, payload);
    } catch (error) {
        return error;
    }
}

// closes the pregnancy and registers the calves in one request
export async function recordCalving(pregnancyId, payload) {
    try {
        return await put(`breeding/${pregnancyId}/calving`, payload);
    } catch (error) {
        return error;
    }
}

export async function markPregnancyAborted(pregnancyId, payload) {
    try {
        return await put(`breeding/${pregnancyId}/abort`, payload);
    } catch (error) {
        return error;
    }
}

export async function deletePregnancy(pregnancyId) {
    try {
        return await remove(`breeding/${pregnancyId}`);
    } catch (error) {
        return error;
    }
}
