import { get, post, put, remove } from "../store/api.service";

/*
 * Cattle health. An episode is the illness ("mastitis from the 3rd"); a checkup is one visit
 * inside it. The register and both dropdowns arrive in a single response, and the visit history
 * is fetched only when a user opens an episode.
 */
export async function getHealthRegister(queryParams = {}) {
    try {
        return await get('health', queryParams);
    } catch (error) {
        return error;
    }
}

export async function createTreatment(payload) {
    try {
        return await post('health', payload);
    } catch (error) {
        return error;
    }
}

export async function updateTreatment(treatmentId, payload) {
    try {
        return await put(`health/${treatmentId}`, payload);
    } catch (error) {
        return error;
    }
}

// she is well. her milk stays on hold until the withdrawal date passes
export async function closeTreatment(treatmentId, payload) {
    try {
        return await put(`health/${treatmentId}/close`, payload);
    } catch (error) {
        return error;
    }
}

export async function reopenTreatment(treatmentId) {
    try {
        return await put(`health/${treatmentId}/reopen`, {});
    } catch (error) {
        return error;
    }
}

export async function deleteTreatment(treatmentId) {
    try {
        return await remove(`health/${treatmentId}`);
    } catch (error) {
        return error;
    }
}

/* ------------------------------ checkups ------------------------------ */

export async function getCheckups(treatmentId) {
    try {
        return await get(`health/${treatmentId}/checkups`);
    } catch (error) {
        return error;
    }
}

export async function addCheckup(treatmentId, payload) {
    try {
        return await post(`health/${treatmentId}/checkups`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteCheckup(historyId) {
    try {
        return await remove(`health/checkups/${historyId}`);
    } catch (error) {
        return error;
    }
}
