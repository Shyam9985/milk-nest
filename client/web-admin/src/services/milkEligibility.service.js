import { put } from "../store/api.service";

/*
 * The manual overrides on whether an animal appears on the milking sheet.
 *
 * Everything else that takes her off the sheet is derived from a record elsewhere - a dry-off
 * on her pregnancy, a treatment, a sale. These two cover the case no rule can see: she has
 * simply gone dry.
 */

// she has stopped giving milk with no pregnancy behind it
export async function markManualDryOff(cattleId, payload = {}) {
    try {
        return await put(`milk-eligibility/${cattleId}/dry-off`, payload);
    } catch (error) {
        return error;
    }
}

// back in milk, or the mark was a mistake
export async function resumeMilking(cattleId) {
    try {
        return await put(`milk-eligibility/${cattleId}/resume-milking`, {});
    } catch (error) {
        return error;
    }
}
