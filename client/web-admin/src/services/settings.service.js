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
