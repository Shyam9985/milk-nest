const breedingMdl = require('../models/breedingMdl');
const cattleEligibilityMdl = require('../models/cattleEligibilityMdl');
const resutils = require('../utils/response.utils');
const { log } = require('../utils/log.utils');
const { todayLocal, addDaysLocal, isValidDateOnly } = require('../utils/date.utils');

/*
 * Breeding: pregnancy, dry-off, calving and calf registration.
 *
 * Three ideas carry this module:
 *
 *  1. The expected dates are computed ONCE, here, from the animal's breed rule (falling back to
 *     the type) and stored on the row. Every alert then compares bare date columns, which keeps
 *     them indexable, and the rule can differ per breed without touching code.
 *
 *  2. Validation and the business guards live here. The model owns the transaction, so this layer
 *     checks what it can up front and then relies on each write carrying its own guard in the
 *     WHERE clause - a zero affectedRows means someone else got there first, and that is what
 *     turns into the message. The check and the write are not one atomic step, so the SQL guard is
 *     what actually protects the data; the read above it only buys a better error message.
 *
 *  3. Nothing here writes can_produce_milk. The model applies the shared eligibility statement
 *     inside its own transaction, and this layer reads the result back to report it.
 */

const emptyToNull = (value) => {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    return trimmed === '' || trimmed === undefined || trimmed === null ? null : trimmed;
};

// a date that must exist, be real, and not be in the future
const assertPastDate = (value, label) => {
    const date = emptyToNull(value);
    if (!date || !isValidDateOnly(date)) {
        resutils.createError('validationFailed', `${label} must be a valid date (YYYY-MM-DD).`);
    }
    if (date > todayLocal()) {
        resutils.createError('validationFailed', `${label} cannot be in the future.`);
    }
    return date;
};

/**********************************************
* name : resolveBreedingRules
* description : the gestation and dry-off days for one animal, and the guards that a pregnancy
*               can be recorded against her at all. a missing rule is a hard error rather than
*               a silent default, because a wrong expected calving date drives a wrong alert.
************************************************/
const resolveBreedingRules = async (cattle_id) => {
    const [cattle] = await breedingMdl.getBreedingRulesMdl(cattle_id);

    if (!cattle || Number(cattle.is_active) !== 1) {
        resutils.createError('invalidParent', 'Selected cattle does not exist or is inactive.');
    }
    if (cattle.cattle_status !== 'active') {
        resutils.createError('validationFailed', `${cattle.cattle_unique_code} is marked as ${cattle.cattle_status} and cannot be bred.`);
    }
    if (cattle.gender_nm === 'Male') {
        resutils.createError('validationFailed', `${cattle.cattle_unique_code} is male - a pregnancy cannot be recorded against it.`);
    }
    if (!cattle.gestation_days || !cattle.expected_dry_off_days) {
        resutils.createError('validationFailed',
            `Gestation and dry-off days are not configured for ${cattle.cattle_unique_code}'s breed or type. Set them on the Cattle Type or Cattle Breed master first.`);
    }
    return cattle;
};

// the two expected dates, from the conception date and the breed's rule
const computeExpectedDates = (conception_date, rules) => ({
    expected_dry_off_date: addDaysLocal(conception_date, Number(rules.expected_dry_off_days)),
    expected_calving_date: addDaysLocal(conception_date, Number(rules.gestation_days))
});

// the pregnancy this action is about, with the guards every action shares
const loadActivePregnancy = async (pregnancy_id, { mustBeActive = true } = {}) => {
    const [pregnancy] = await breedingMdl.getPregnancyByIdMdl(pregnancy_id);

    if (!pregnancy) {
        resutils.createError('recordNotFound', 'Pregnancy record not found.');
    }
    if (mustBeActive && pregnancy.pregnancy_status !== 'active') {
        resutils.createError('validationFailed', `This pregnancy is already ${pregnancy.pregnancy_status}.`);
    }
    return pregnancy;
};

// what the flag ended up as, read back after the model committed it
const readEligibility = async (cattle_id) => {
    const [row] = await cattleEligibilityMdl.getMilkEligibilityMdl(cattle_id);
    return Number(row?.can_produce_milk) === 1 ? 1 : 0;
};

/**********************************************
* name : getPregnancyListSrvc
* description : the breeding register for the caller's scope, plus the dropdown of animals that
*               can still be bred, so the screen needs one round trip rather than two.
************************************************/
exports.getPregnancyListSrvc = async (user, filters = {}) => {
    log('in getPregnancyListSrvc');

    const [records, breedable] = await Promise.all([
        breedingMdl.getPregnancyListMdl(user, filters),
        breedingMdl.getBreedableCattleMdl(user, filters.branch_id)
    ]);
    return { records, breedable, today: todayLocal() };
}

/**********************************************
* name : createPregnancySrvc
* description : records a conception. the conception date may be approximate - that is expected -
*               but only one pregnancy may be in flight per animal at a time.
************************************************/
exports.createPregnancySrvc = async (payload, user_id) => {
    log('in createPregnancySrvc');

    const cattle_id = Number(payload.cattle_id);
    const conception_date = assertPastDate(payload.conception_date, 'Conception date');

    const rules = await resolveBreedingRules(cattle_id);

    const [existing] = await breedingMdl.getActivePregnancyByCattleMdl(cattle_id);
    if (existing) {
        resutils.createError('duplicateRecord',
            `${rules.cattle_unique_code} already has a pregnancy in progress from ${existing.conception_date}. Close that one first.`);
    }

    const data = {
        cattle_id,
        conception_date,
        ...computeExpectedDates(conception_date, rules),
        remarks: emptyToNull(payload.remarks)
    };

    const result = await breedingMdl.insertPregnancyMdl(data, user_id);
    return {
        pregnancy_id: result.insertId,
        cattle_unique_code: rules.cattle_unique_code,
        expected_dry_off_date: data.expected_dry_off_date,
        expected_calving_date: data.expected_calving_date
    };
}

/**********************************************
* name : updatePregnancySrvc
* description : corrects the conception date, recomputing the expected dates from it so the two
*               can never disagree with the date they were derived from.
************************************************/
exports.updatePregnancySrvc = async (pregnancy_id, payload, user_id) => {
    log('in updatePregnancySrvc');

    const pregnancy = await loadActivePregnancy(pregnancy_id, { mustBeActive: false });

    const conception_date = assertPastDate(payload.conception_date, 'Conception date');
    const rules = await resolveBreedingRules(pregnancy.cattle_id);

    const data = {
        conception_date,
        ...computeExpectedDates(conception_date, rules),
        remarks: emptyToNull(payload.remarks)
    };

    const result = await breedingMdl.updatePregnancyMdl(pregnancy_id, data, user_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Pregnancy record not found or already removed.');
    }
    return { pregnancy_id: Number(pregnancy_id), cattle_unique_code: pregnancy.cattle_unique_code, ...data };
}

/**********************************************
* name : markDryOffSrvc
* description : the incharge confirms she has stopped giving milk. the model commits the pregnancy
*               row and the milk block together, so she can never be recorded as dry while still
*               appearing on tomorrow's milking sheet.
************************************************/
exports.markDryOffSrvc = async (pregnancy_id, payload, user_id) => {
    log('in markDryOffSrvc');

    const actual_dry_off_date = assertPastDate(payload.actual_dry_off_date || todayLocal(), 'Dry-off date');
    const pregnancy = await loadActivePregnancy(pregnancy_id);

    if (actual_dry_off_date < pregnancy.conception_date) {
        resutils.createError('validationFailed', 'Dry-off date cannot be before the conception date.');
    }

    const result = await breedingMdl.markDryOffMdl(pregnancy_id, actual_dry_off_date, pregnancy.cattle_id, user_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Pregnancy record not found or no longer active.');
    }

    return {
        pregnancy_id: Number(pregnancy_id),
        cattle_unique_code: pregnancy.cattle_unique_code,
        actual_dry_off_date,
        can_produce_milk: await readEligibility(pregnancy.cattle_id)
    };
}

/**********************************************
* name : recordCalvingSrvc
* description : closes the pregnancy and registers the calves. every calf is validated HERE before
*               the model opens its transaction, so a bad row is refused with a message naming it
*               rather than aborting a half-written calving.
* input : (pregnancy_id, { actual_calving_date, remarks, calves: [ { gender_id, weight, color } ] }, user_id)
************************************************/
exports.recordCalvingSrvc = async (pregnancy_id, payload, user_id) => {
    log('in recordCalvingSrvc');

    const actual_calving_date = assertPastDate(payload.actual_calving_date, 'Calving date');
    const pregnancy = await loadActivePregnancy(pregnancy_id);

    if (actual_calving_date < pregnancy.conception_date) {
        resutils.createError('validationFailed', 'Calving date cannot be before the conception date.');
    }

    // an empty list is allowed: that is how a stillbirth is recorded
    const calves = (Array.isArray(payload.calves) ? payload.calves : []).map((calf, index) => {
        if (!calf?.gender_id) {
            resutils.createError('validationFailed', `Calf ${index + 1}: please select a gender.`);
        }
        return {
            gender_id: Number(calf.gender_id),
            weight: emptyToNull(calf.weight),
            color: emptyToNull(calf.color),
            remarks: emptyToNull(calf.remarks)
        };
    });

    const result = await breedingMdl.recordCalvingMdl(pregnancy,
        { actual_calving_date, remarks: emptyToNull(payload.remarks), calves }, user_id);

    if (result.codeExhausted) {
        resutils.createError('duplicateRecord', 'Unable to generate a unique calf code. Please try again.');
    }
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Pregnancy record not found or no longer active.');
    }

    return {
        pregnancy_id: Number(pregnancy_id),
        cattle_unique_code: pregnancy.cattle_unique_code,
        actual_calving_date,
        calves: result.calves,
        mother_can_produce_milk: await readEligibility(pregnancy.cattle_id)
    };
}

/**********************************************
* name : markPregnancyAbortedSrvc
* description : ends a pregnancy that did not reach calving. the model reassesses her milk in the
*               same transaction, since a dried-off cow whose pregnancy ends should be rechecked.
************************************************/
exports.markPregnancyAbortedSrvc = async (pregnancy_id, payload, user_id) => {
    log('in markPregnancyAbortedSrvc');

    const pregnancy = await loadActivePregnancy(pregnancy_id);

    const result = await breedingMdl.markPregnancyAbortedMdl(pregnancy_id,
        emptyToNull(payload.remarks), pregnancy.cattle_id, user_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Pregnancy record not found or no longer active.');
    }

    return {
        pregnancy_id: Number(pregnancy_id),
        cattle_unique_code: pregnancy.cattle_unique_code,
        can_produce_milk: await readEligibility(pregnancy.cattle_id)
    };
}

/**********************************************
* name : deletePregnancySrvc
* description : soft deletes a pregnancy. blocked once calves are registered against it, because
*               removing it would orphan their lineage. the guard is this function's own, so the
*               message can say how many calves are in the way.
************************************************/
exports.deletePregnancySrvc = async (pregnancy_id, user_id) => {
    log('in deletePregnancySrvc');

    const pregnancy = await loadActivePregnancy(pregnancy_id, { mustBeActive: false });

    const [{ cnt: calfCount }] = await breedingMdl.countCalvesByPregnancyMdl(pregnancy_id);
    if (Number(calfCount)) {
        resutils.createError('recordInUse',
            `This pregnancy cannot be deleted. ${calfCount} calf record(s) are registered against it.`);
    }

    const result = await breedingMdl.softDeletePregnancyMdl(pregnancy_id, pregnancy.cattle_id, user_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Pregnancy record not found or already removed.');
    }

    return {
        pregnancy_id: Number(pregnancy_id),
        cattle_unique_code: pregnancy.cattle_unique_code,
        can_produce_milk: await readEligibility(pregnancy.cattle_id)
    };
}
