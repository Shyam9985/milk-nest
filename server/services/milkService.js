const milkMdl = require('../models/milkMdl');
const resutils = require('../utils/response.utils');
const { log } = require('../utils/log.utils');
const { todayLocal, isValidDateOnly } = require('../utils/date.utils');

// empty optional inputs are stored as null instead of empty strings
const emptyToNull = (value) => {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    return trimmed === '' || trimmed === undefined || trimmed === null ? null : trimmed;
};

// the day sheet: every active animal at the branch with its entry for that date
exports.getMilkProductionSheetSrvc = async (branch_id, production_date) => {
    log('in getMilkProductionSheetSrvc');

    const [branch] = await milkMdl.getActiveBranchByIdMdl(branch_id);
    if (!branch) {
        resutils.createError('invalidParent', 'Selected branch does not exist or is inactive.');
    }

    return milkMdl.getMilkProductionSheetMdl(branch_id, production_date);
}

// recorded entries plus their daily totals for a date range
exports.getMilkProductionListSrvc = async (user, from_date, to_date, branch_id = null) => {
    log('in getMilkProductionListSrvc');
    const [records, summary] = await Promise.all([
        milkMdl.getMilkProductionListMdl(user, from_date, to_date, branch_id),
        milkMdl.getMilkProductionSummaryMdl(user, from_date, to_date, branch_id)
    ]);
    return { records, summary };
}

// yields and quality readings are optional per animal, but must be sane when given
const parseMilkNumber = (value, label, max) => {
    const raw = emptyToNull(value);
    if (raw === null) return null;

    const parsed = Number(raw);
    if (isNaN(parsed) || parsed < 0) {
        resutils.createError('validationFailed', `${label} must be a positive number.`);
    }
    if (parsed > max) {
        resutils.createError('validationFailed', `${label} looks too high (maximum ${max}). Please check the entry.`);
    }
    return parsed;
}

// turns one submitted row into the shape the upsert expects; a row with no yield,
// quality reading or remark counts as empty and clears any existing entry for the day
const normalizeMilkEntry = (entry) => {
    const morning_quantity = parseMilkNumber(entry.morning_quantity, 'Morning quantity', 999);
    const evening_quantity = parseMilkNumber(entry.evening_quantity, 'Evening quantity', 999);
    const fat_percentage = parseMilkNumber(entry.fat_percentage, 'Fat percentage', 99);
    const snf_percentage = parseMilkNumber(entry.snf_percentage, 'SNF percentage', 99);
    const remarks = emptyToNull(entry.remarks);

    const isEmpty = morning_quantity === null && evening_quantity === null
        && fat_percentage === null && snf_percentage === null && remarks === null;

    return {
        cattle_id: Number(entry.cattle_id),
        morning_quantity, evening_quantity, fat_percentage, snf_percentage, remarks, isEmpty
    };
}

// saves a whole day sheet for one branch in a single transaction
exports.saveMilkProductionSheetSrvc = async (payload, user_id) => {
    log('in saveMilkProductionSheetSrvc');

    const branch_id = Number(payload.branch_id);
    const production_date = emptyToNull(payload.production_date);

    if (!production_date || !isValidDateOnly(production_date)) {
        resutils.createError('validationFailed', 'Production Date must be a valid date (YYYY-MM-DD).');
    }
    // milk cannot be recorded before it is produced (compared in local time, see date.utils)
    if (production_date > todayLocal()) {
        resutils.createError('validationFailed', 'Production Date cannot be in the future.');
    }

    const [branch] = await milkMdl.getActiveBranchByIdMdl(branch_id);
    if (!branch) {
        resutils.createError('invalidParent', 'Selected branch does not exist or is inactive.');
    }

    if (!Array.isArray(payload.entries) || !payload.entries.length) {
        resutils.createError('validationFailed', 'No cattle rows were submitted.');
    }

    const entries = payload.entries.map(normalizeMilkEntry);

    // every animal must be on this branch's milking sheet - the sheet is built from the
    // branch's own female cattle, so a mismatch means a bull, another branch's animal, or a
    // stale submission. the check is against the sheet, not the raw cattle table, so the
    // rule "bulls are never milked" lives in exactly one query
    const sheet = await milkMdl.getMilkProductionSheetMdl(branch_id, production_date);
    const allowed = new Set(sheet.map((row) => Number(row.cattle_id)));

    if (entries.some((entry) => !allowed.has(entry.cattle_id))) {
        resutils.createError('invalidParent', 'One or more cattle are not on the milking sheet for this branch (bulls cannot be milked). Please reload the sheet.');
    }

    const result = await milkMdl.saveMilkProductionSheetMdl(branch_id, production_date, entries, user_id);
    return { branch_id, production_date, ...result };
}

// soft deletes a single day entry
exports.deleteMilkProductionSrvc = async (milk_production_id, user_id) => {
    log('in deleteMilkProductionSrvc');
    // record is fetched first so the success message can name the animal and date
    const [record] = await milkMdl.getActiveMilkProductionByIdMdl(milk_production_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Milk production entry not found or already deleted.');
    }

    const result = await milkMdl.softDeleteMilkProductionMdl(milk_production_id, user_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Milk production entry not found or already deleted.');
    }
    return {
        milk_production_id: Number(milk_production_id),
        cattle_unique_code: record.cattle_unique_code,
        production_date: record.production_date
    };
}
