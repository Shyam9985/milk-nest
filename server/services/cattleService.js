const cattleMdl = require('../models/cattleMdl');
const settingsMdl = require('../models/settingsMdl');
const settingsService = require('./settingsService');
const resutils = require('../utils/response.utils');
const { log } = require('../utils/log.utils');
const { todayLocal, DATE_ONLY_RE } = require('../utils/date.utils');

/*
 * The cattle register: recording an animal, correcting its details, retiring it.
 *
 * It reads the settings masters it depends on - branch, cattle type, breed, gender - but owns
 * nothing of them. Every parent is verified to exist and be active before a write, because the
 * foreign keys alone cannot: masters are soft deleted, so a deactivated breed still satisfies its
 * FK and would silently attach to a new animal.
 *
 * Milk eligibility is deliberately NOT set here. A newly recorded animal keeps the column default
 * until something decides it - the nightly herd recalculation, or the first lifecycle action
 * against her. milkEligibilityService stays the only owner of that flag.
 */

const emptyToNull = (value) => {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    return trimmed === '' || trimmed === undefined || trimmed === null ? null : trimmed;
};

// optional numeric input: '' -> null, otherwise a validated positive number
const parsePositiveNumber = (value, label) => {
    const raw = emptyToNull(value);
    if (raw === null) return null;

    const parsed = Number(raw);
    if (isNaN(parsed) || parsed < 0) {
        resutils.createError('validationFailed', `${label} must be a positive number.`);
    }
    return parsed;
};

// optional YYYY-MM-DD input that may not be in the future
const parsePastDate = (value, label) => {
    const raw = emptyToNull(value);
    if (raw === null) return null;

    if (!DATE_ONLY_RE.test(raw) || isNaN(new Date(raw).getTime())) {
        resutils.createError('validationFailed', `${label} must be a valid date (YYYY-MM-DD).`);
    }
    if (raw > todayLocal()) {
        resutils.createError('validationFailed', `${label} cannot be in the future.`);
    }
    return raw;
};

// pulls the normalized cattle fields out of a request payload; the unique code is generated
// server-side on create and never changes afterwards
const normalizeCattlePayload = (payload) => {
    const date_of_birth = parsePastDate(payload.date_of_birth, 'Date of Birth');
    const purchase_date = parsePastDate(payload.purchase_date, 'Purchase Date');

    // ISO date strings compare correctly as plain strings
    if (date_of_birth && purchase_date && purchase_date < date_of_birth) {
        resutils.createError('validationFailed', 'Purchase Date cannot be earlier than the Date of Birth.');
    }

    return {
        branch_id: Number(payload.branch_id),
        cattle_type_id: Number(payload.cattle_type_id),
        breed_id: Number(payload.breed_id),
        gender_id: payload.gender_id ? Number(payload.gender_id) : null,
        date_of_birth,
        purchase_date,
        weight: parsePositiveNumber(payload.weight, 'Weight'),
        purchase_cost: parsePositiveNumber(payload.purchase_cost, 'Purchase Cost'),
        color: emptyToNull(payload.color),
        remarks: emptyToNull(payload.remarks)
    };
};

/**********************************************
* name : assertCattleParents
* description : every parent must exist and be ACTIVE, and the breed must belong to the chosen type.
*               the foreign keys cannot enforce the active part - masters are soft deleted, so a
*               retired breed still satisfies its FK.
************************************************/
const assertCattleParents = async (data) => {
    const [branch] = await settingsMdl.getActiveBranchByIdMdl(data.branch_id);
    if (!branch) {
        resutils.createError('invalidParent', 'Selected branch does not exist or is inactive.');
    }

    const [cattleType] = await settingsMdl.getActiveCattleTypeByIdMdl(data.cattle_type_id);
    if (!cattleType) {
        resutils.createError('invalidParent', 'Selected cattle type does not exist or is inactive.');
    }

    const [breed] = await settingsMdl.getActiveCattleBreedByIdMdl(data.breed_id);
    if (!breed) {
        resutils.createError('invalidParent', 'Selected breed does not exist or is inactive.');
    }
    if (breed.cattle_type_id != data.cattle_type_id) {
        resutils.createError('invalidParent', 'Selected breed does not belong to the selected cattle type.');
    }

    if (data.gender_id) {
        const gender = await settingsMdl.getActiveGenderByIdMdl(data.gender_id);
        if (!gender.length) {
            resutils.createError('invalidParent', 'Selected gender does not exist or is inactive.');
        }
    }

    return branch;
};

// builds a unique tag under the branch code, e.g. 'SDF-3210-HOB' -> 'SDF-3210-HOB-C001'
const generateCattleCode = async (branch_id, branch_code) => {
    const [{ cnt }] = await cattleMdl.countCattleByBranchMdl(branch_id);

    for (let sequence = Number(cnt) + 1; sequence < Number(cnt) + 500; sequence++) {
        const candidate = `${branch_code}-C${String(sequence).padStart(3, '0')}`;
        const existing = await cattleMdl.getCattleByCodeMdl(candidate);
        if (!existing.length) return candidate;
    }
    resutils.createError('duplicateRecord', 'Unable to generate a unique cattle code. Please try again.');
};

// every active animal visible to the logged in user's scope
exports.getCattleListSrvc = async (user) => {
    log('in getCattleListSrvc');
    return cattleMdl.getCattleListMdl(user);
}

/**********************************************
* name : getCattleFormOptionsSrvc
* description : the static dropdown lists the cattle form needs, in ONE round trip. dairy farms are
*               scope filtered, so a branch user only ever picks their own farm.
************************************************/
exports.getCattleFormOptionsSrvc = async (user) => {
    log('in getCattleFormOptionsSrvc');

    const [dairy_farms, cattle_types, genders] = await Promise.all([
        settingsMdl.getDairyFarmsMdl(user),
        settingsMdl.getCattleTypeListMdl(),
        settingsMdl.getGendersMdl()
    ]);
    return { dairy_farms, cattle_types, genders };
}

// the two dependent dropdowns, loaded when their parent is chosen. both are settings masters, so
// they are fetched through the settings service rather than re-implemented here
exports.getBranchOptionsSrvc = async (user, dairy_farm_id) => {
    log('in getBranchOptionsSrvc');
    return settingsService.getPositionBranchesSrvc(user, dairy_farm_id);
}

exports.getBreedOptionsSrvc = async (cattle_type_id) => {
    log('in getBreedOptionsSrvc');
    return settingsService.getCattleBreedListSrvc(cattle_type_id);
}

// records a new animal at a branch
exports.createCattleSrvc = async (payload, user_id) => {
    log('in createCattleSrvc');

    const data = normalizeCattlePayload(payload);
    const branch = await assertCattleParents(data);

    data.cattle_unique_code = await generateCattleCode(data.branch_id, branch.branch_code);

    const result = await cattleMdl.insertCattleMdl(data, user_id);
    return { cattle_id: result.insertId, cattle_unique_code: data.cattle_unique_code };
}

// updates an animal's details; its tag stays with it for life
exports.updateCattleSrvc = async (cattle_id, payload, user_id) => {
    log('in updateCattleSrvc');

    const data = normalizeCattlePayload(payload);

    const [record] = await cattleMdl.getActiveCattleByIdMdl(cattle_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Cattle record not found or already deleted.');
    }

    await assertCattleParents(data);

    const result = await cattleMdl.updateCattleMdl(cattle_id, data, user_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Cattle record not found or already deleted.');
    }
    return { cattle_id: Number(cattle_id), cattle_unique_code: record.cattle_unique_code };
}

// soft deletes a cattle record
exports.deleteCattleSrvc = async (cattle_id, user_id) => {
    log('in deleteCattleSrvc');

    // the record is fetched first so the success message can carry its tag
    const [record] = await cattleMdl.getActiveCattleByIdMdl(cattle_id);
    if (!record) {
        resutils.createError('recordNotFound', 'Cattle record not found or already deleted.');
    }

    const result = await cattleMdl.softDeleteCattleMdl(cattle_id, user_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Cattle record not found or already deleted.');
    }
    return { cattle_id: Number(cattle_id), cattle_unique_code: record.cattle_unique_code };
}
