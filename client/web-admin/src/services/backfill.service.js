import { get, post } from "../store/api.service";

/*
 * Data backfill, for filling gaps in the milk register over a past date range.
 *
 * Two calls on purpose: the preview writes nothing and reports what a run would do, so the number
 * of rows about to be created - or replaced - is on screen before anyone commits to it.
 */
export async function previewBackfill(queryParams = {}) {
    try {
        return await get('backfill/preview', queryParams);
    } catch (error) {
        return error;
    }
}

export async function runBackfill(payload) {
    try {
        return await post('backfill/run', payload);
    } catch (error) {
        return error;
    }
}
