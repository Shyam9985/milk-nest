import { get, post, put, remove } from "../store/api.service";

/*
 * The cattle register. These used to sit under settings/master/cattle; the animals are operational
 * data, so they have their own endpoint now. The permission key is still 'cattle', so no role grant
 * changed - only the path.
 *
 * Cattle TYPE and BREED remain settings masters and stay in settings.service.js.
 */
export async function getCattleList(queryParams = {}) {
    try {
        return await get('cattle', queryParams);
    } catch (error) {
        return error;
    }
}

// dairy farms, cattle types and genders in one call, the first time the form opens
export async function getCattleFormOptions() {
    try {
        return await get('cattle/form-options');
    } catch (error) {
        return error;
    }
}

// the two dependent dropdowns, fetched when their parent is chosen
export async function getCattleBranchOptions(queryParams = {}) {
    try {
        return await get('cattle/branch', queryParams);
    } catch (error) {
        return error;
    }
}

export async function getCattleBreedOptions(queryParams = {}) {
    try {
        return await get('cattle/breed', queryParams);
    } catch (error) {
        return error;
    }
}

export async function createCattle(payload) {
    try {
        return await post('cattle', payload);
    } catch (error) {
        return error;
    }
}

export async function updateCattle(cattleId, payload) {
    try {
        return await put(`cattle/${cattleId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteCattle(cattleId) {
    try {
        return await remove(`cattle/${cattleId}`);
    } catch (error) {
        return error;
    }
}
