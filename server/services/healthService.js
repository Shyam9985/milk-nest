const healthMdl = require('../models/healthMdl');
const cattleEligibilityMdl = require('../models/cattleEligibilityMdl');
const resutils = require('../utils/response.utils');
const { log } = require('../utils/log.utils');
const { todayLocal, isValidDateOnly } = require('../utils/date.utils');

/*
 * Health: recording that an animal is ill, what was done about it, and when she is well.
 *
 * Three ideas carry this module:
 *
 *  1. An episode is the illness; a checkup is a visit. "Mastitis from the 3rd" is one row with
 *     three checkups under it, not three unrelated treatments. That is what makes "how much did
 *     this mastitis cost" and "what did the vet say last time" answerable.
 *
 *  2. Validation and the business guards live here. The model owns the transaction, so this layer
 *     checks what it can up front and then relies on each write carrying its own guard in the
 *     WHERE clause - a zero affectedRows means someone else got there first. The read above the
 *     write only buys a better message; the SQL guard is what protects the data.
 *
 *  3. Nothing here writes can_produce_milk. The model applies the shared eligibility statement
 *     inside its own transaction - treated milk reaching the tank is the one failure with a cost
 *     outside the system - and this layer reads the result back to report it.
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

// a withdrawal or next-checkup date is ALLOWED to be in the future - that is the whole point
const assertOptionalDate = (value, label) => {
    const date = emptyToNull(value);
    if (date === null) return null;
    if (!isValidDateOnly(date)) {
        resutils.createError('validationFailed', `${label} must be a valid date (YYYY-MM-DD).`);
    }
    return date;
};

const SEVERITIES = ['mild', 'moderate', 'severe'];

const assertSeverity = (value) => {
    const severity = emptyToNull(value) || 'mild';
    if (!SEVERITIES.includes(severity)) {
        resutils.createError('validationFailed', `Severity must be one of: ${SEVERITIES.join(', ')}.`);
    }
    return severity;
};

// the episode this action is about, with the guard every action shares
const loadTreatment = async (treatment_id) => {
    const [treatment] = await healthMdl.getTreatmentByIdMdl(treatment_id);
    if (!treatment) {
        resutils.createError('recordNotFound', 'Treatment record not found.');
    }
    return treatment;
};

// what the flag ended up as, read back after the model committed it
const readEligibility = async (cattle_id) => {
    const [row] = await cattleEligibilityMdl.getMilkEligibilityMdl(cattle_id);
    return Number(row?.can_produce_milk) === 1 ? 1 : 0;
};

/**********************************************
* name : getHealthRegisterSrvc
* description : the register, the cattle dropdown and the illness dropdown in ONE round trip.
*               three independent queries, so they run together rather than in sequence.
* input : (user, { status, dairy_farm_id, branch_id, cattle_id })
************************************************/
exports.getHealthRegisterSrvc = async (user, filters = {}) => {
    log('in getHealthRegisterSrvc');

    const [records, cattle, illnesses] = await Promise.all([
        healthMdl.getTreatmentListMdl(user, filters),
        healthMdl.getTreatableCattleMdl(user, filters.branch_id),
        healthMdl.getIllnessOptionsMdl()
    ]);
    return { records, cattle, illnesses, today: todayLocal() };
}

// the visit history of one episode, loaded when the user opens it rather than with every row
exports.getCheckupListSrvc = async (treatment_id) => {
    log('in getCheckupListSrvc');

    const treatment = await loadTreatment(treatment_id);
    const records = await healthMdl.getCheckupListMdl(treatment_id);
    return { treatment, records };
}

/**********************************************
* name : createTreatmentSrvc
* description : opens an episode. a withdrawal period entered here takes her off the milking sheet
*               in the same transaction as the insert.
* input : ({ cattle_id, illness_id, start_date, severity, attended_by, milk_withdrawal_until, remarks }, user_id)
************************************************/
exports.createTreatmentSrvc = async (payload, user_id) => {
    log('in createTreatmentSrvc');

    const data = {
        cattle_id: Number(payload.cattle_id),
        illness_id: Number(payload.illness_id),
        start_date: assertPastDate(payload.start_date, 'Start date'),
        severity: assertSeverity(payload.severity),
        attended_by: emptyToNull(payload.attended_by),
        milk_withdrawal_until: assertOptionalDate(payload.milk_withdrawal_until, 'Milk withdrawal date'),
        remarks: emptyToNull(payload.remarks)
    };

    if (data.milk_withdrawal_until && data.milk_withdrawal_until < data.start_date) {
        resutils.createError('validationFailed', 'Milk withdrawal date cannot be before the start date.');
    }

    const [cattle] = await healthMdl.getTreatableCattleByIdMdl(data.cattle_id);
    if (!cattle) {
        resutils.createError('invalidParent', 'Selected cattle does not exist or is no longer in the herd.');
    }

    // one open episode per illness per animal, or nobody knows which one is being treated
    const [existing] = await healthMdl.getOpenTreatmentForIllnessMdl(data.cattle_id, data.illness_id);
    if (existing) {
        resutils.createError('duplicateRecord',
            `${cattle.cattle_unique_code} already has an open treatment for this illness, started on ${existing.start_date}. Add a checkup to it instead.`);
    }

    const result = await healthMdl.insertTreatmentMdl(data, user_id);

    return {
        treatment_id: result.insertId,
        cattle_unique_code: cattle.cattle_unique_code,
        milk_withdrawal_until: data.milk_withdrawal_until,
        can_produce_milk: await readEligibility(data.cattle_id)
    };
}

/**********************************************
* name : updateTreatmentSrvc
* description : corrects an episode. the animal and the illness are fixed - changing either makes it
*               a different episode, and the checkups under it would then describe the wrong
*               illness. shortening the withdrawal period can put her back on the sheet, which the
*               model handles in the same transaction.
************************************************/
exports.updateTreatmentSrvc = async (treatment_id, payload, user_id) => {
    log('in updateTreatmentSrvc');

    const data = {
        start_date: assertPastDate(payload.start_date, 'Start date'),
        severity: assertSeverity(payload.severity),
        attended_by: emptyToNull(payload.attended_by),
        milk_withdrawal_until: assertOptionalDate(payload.milk_withdrawal_until, 'Milk withdrawal date'),
        remarks: emptyToNull(payload.remarks)
    };

    if (data.milk_withdrawal_until && data.milk_withdrawal_until < data.start_date) {
        resutils.createError('validationFailed', 'Milk withdrawal date cannot be before the start date.');
    }

    const treatment = await loadTreatment(treatment_id);

    if (treatment.cure_date && data.start_date > treatment.cure_date) {
        resutils.createError('validationFailed', 'Start date cannot be after the cure date.');
    }

    const result = await healthMdl.updateTreatmentMdl(treatment_id, data, treatment.cattle_id, user_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Treatment record not found.');
    }

    return {
        treatment_id: Number(treatment_id),
        cattle_unique_code: treatment.cattle_unique_code,
        can_produce_milk: await readEligibility(treatment.cattle_id)
    };
}

/**********************************************
* name : closeTreatmentSrvc
* description : she is well. the withdrawal date is deliberately NOT cleared - medicine residue
*               outlives the symptoms, so she comes back onto the sheet when that date passes and
*               not a day earlier.
* input : (treatment_id, { cure_date }, user_id)
************************************************/
exports.closeTreatmentSrvc = async (treatment_id, payload, user_id) => {
    log('in closeTreatmentSrvc');

    const cure_date = assertPastDate(payload.cure_date || todayLocal(), 'Cure date');
    const treatment = await loadTreatment(treatment_id);

    if (treatment.cure_date) {
        resutils.createError('validationFailed',
            `This treatment was already closed on ${treatment.cure_date}.`);
    }
    if (cure_date < treatment.start_date) {
        resutils.createError('validationFailed', 'Cure date cannot be before the start date.');
    }

    const result = await healthMdl.closeTreatmentMdl(treatment_id, cure_date, treatment.cattle_id, user_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Treatment record not found or already closed.');
    }

    return {
        treatment_id: Number(treatment_id),
        cattle_unique_code: treatment.cattle_unique_code,
        cure_date,
        milk_withdrawal_until: treatment.milk_withdrawal_until,
        can_produce_milk: await readEligibility(treatment.cattle_id)
    };
}

// closed by mistake, or she relapsed before the episode was really over
exports.reopenTreatmentSrvc = async (treatment_id, user_id) => {
    log('in reopenTreatmentSrvc');

    const treatment = await loadTreatment(treatment_id);

    if (!treatment.cure_date) {
        resutils.createError('validationFailed', 'This treatment is already open.');
    }

    // a second open episode of the same illness is what the create guard prevents, so reopening
    // must respect it too
    const [other] = await healthMdl.getOpenTreatmentForIllnessMdl(
        treatment.cattle_id, treatment.illness_id, treatment_id);
    if (other) {
        resutils.createError('duplicateRecord',
            `${treatment.cattle_unique_code} already has an open treatment for this illness, started on ${other.start_date}.`);
    }

    const result = await healthMdl.reopenTreatmentMdl(treatment_id, treatment.cattle_id, user_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Treatment record not found or already open.');
    }

    return {
        treatment_id: Number(treatment_id),
        cattle_unique_code: treatment.cattle_unique_code,
        can_produce_milk: await readEligibility(treatment.cattle_id)
    };
}

/**********************************************
* name : deleteTreatmentSrvc
* description : removes an episode entered by mistake. soft deletes mean the FK cannot stop an
*               episode disappearing from under its checkups, so the guard is here - and it is this
*               function's own guard, not a shared one, so the message can say what to do instead.
************************************************/
exports.deleteTreatmentSrvc = async (treatment_id, user_id) => {
    log('in deleteTreatmentSrvc');

    const treatment = await loadTreatment(treatment_id);

    const [{ cnt }] = await healthMdl.countCheckupsByTreatmentMdl(treatment_id);
    if (Number(cnt) > 0) {
        resutils.createError('recordInUse',
            `This treatment has ${cnt} checkup(s) recorded against it. Remove them first, or close the treatment instead of deleting it.`);
    }

    const result = await healthMdl.softDeleteTreatmentMdl(treatment_id, treatment.cattle_id, user_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Treatment record not found or already removed.');
    }

    return {
        treatment_id: Number(treatment_id),
        cattle_unique_code: treatment.cattle_unique_code,
        can_produce_milk: await readEligibility(treatment.cattle_id)
    };
}

/**********************************************
* name : addCheckupSrvc
* description : one visit: what was seen, what was given, what it cost. the model recomputes the
*               episode's total from its checkups and extends the withdrawal period if a later date
*               was given today, all in one transaction with the eligibility.
* input : (treatment_id, { checkup_date, medicines, observation, expense, attended_by,
*                          next_checkup_date, milk_withdrawal_until }, user_id)
************************************************/
exports.addCheckupSrvc = async (treatment_id, payload, user_id) => {
    log('in addCheckupSrvc');

    const data = {
        treatment_id: Number(treatment_id),
        checkup_date: assertPastDate(payload.checkup_date, 'Checkup date'),
        medicines: emptyToNull(payload.medicines),
        observation: emptyToNull(payload.observation),
        expense: payload.expense === undefined || payload.expense === '' ? 0 : Number(payload.expense),
        attended_by: emptyToNull(payload.attended_by),
        next_checkup_date: assertOptionalDate(payload.next_checkup_date, 'Next checkup date')
    };

    const withdrawal = assertOptionalDate(payload.milk_withdrawal_until, 'Milk withdrawal date');

    if (!(data.expense >= 0)) {
        resutils.createError('validationFailed', 'Expense cannot be negative.');
    }
    if (data.next_checkup_date && data.next_checkup_date < data.checkup_date) {
        resutils.createError('validationFailed', 'Next checkup cannot be before this checkup.');
    }

    const treatment = await loadTreatment(treatment_id);

    if (data.checkup_date < treatment.start_date) {
        resutils.createError('validationFailed',
            `Checkup date cannot be before the treatment started (${treatment.start_date}).`);
    }

    await healthMdl.insertCheckupMdl(data, treatment.cattle_id, withdrawal, user_id);

    return {
        treatment_id: Number(treatment_id),
        cattle_unique_code: treatment.cattle_unique_code,
        can_produce_milk: await readEligibility(treatment.cattle_id)
    };
}

// removes a visit entered by mistake. the episode total follows from what is left
exports.deleteCheckupSrvc = async (history_id, user_id) => {
    log('in deleteCheckupSrvc');

    const [checkup] = await healthMdl.getCheckupByIdMdl(history_id);
    if (!checkup) {
        resutils.createError('recordNotFound', 'Checkup record not found.');
    }

    const result = await healthMdl.softDeleteCheckupMdl(history_id, checkup.treatment_id, user_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Checkup record not found or already removed.');
    }

    return { history_id: Number(history_id), treatment_id: checkup.treatment_id };
}
