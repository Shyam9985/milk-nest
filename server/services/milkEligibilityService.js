const cattleEligibilityMdl = require('../models/cattleEligibilityMdl');
const resutils = require('../utils/response.utils');
const { log } = require('../utils/log.utils');
const { CATTLE_STATUS, MILK_BLOCK_REASON, MILK_BLOCK_LABEL } = require('../utils/cattle.constants');

/*
 * The rules behind can_produce_milk, and the two manual overrides on it.
 *
 * The flag is WRITTEN by one statement, which lives in cattleEligibilityMdl and is run by whichever
 * model transaction caused the change. That is what keeps a cached flag trustworthy: one statement,
 * one rule set, committed with whatever moved it.
 *
 * decideMilkEligibility below is the readable mirror of that statement. It does no IO and writes
 * nothing - it exists so the screen can be TOLD which rule holds an animal ("she is under
 * treatment") instead of an action silently doing nothing. The two must say the same thing; the SQL
 * is the one that decides.
 */

/**********************************************
* name : decideMilkEligibility
* description : pure decision - no IO, nothing persisted. first match wins, most authoritative fact
*               first. mirrors the CASE precedence in cattleEligibilityMdl.
*               a 'manual' block survives because drying off is a human judgement in this farm's
*               workflow; it is never overridden by a rule that says "she looks fine".
* input : (facts row from getEligibilityFactsMdl)
* output : { can_produce_milk: 0|1, milk_block_reason: string|null }
************************************************/
const decideMilkEligibility = (facts) => {

    const blocked = (reason) => ({ can_produce_milk: 0, milk_block_reason: reason });

    // gone from the herd - nothing else matters
    if (facts.cattle_status === CATTLE_STATUS.DEAD) return blocked(MILK_BLOCK_REASON.DEAD);
    if (facts.cattle_status !== CATTLE_STATUS.ACTIVE) return blocked(MILK_BLOCK_REASON.SOLD);

    // biology
    if (facts.gender_nm === 'Male') return blocked(MILK_BLOCK_REASON.MALE);
    // an unknown date of birth does NOT block her: guessing "too young" would hide a real milker,
    // and the dashboard already flags incomplete cattle records
    if (Number(facts.is_calf) === 1) return blocked(MILK_BLOCK_REASON.CALF);

    // food safety beats everything below it: milk must be discarded during withdrawal
    if (facts.withdrawal_treatment_id) return blocked(MILK_BLOCK_REASON.UNDER_TREATMENT);

    // dried off for this pregnancy and not yet calved. driven by the ACTUAL dry-off date the
    // incharge recorded, never by the expected one - the expected date only raises an alert
    if (facts.dried_off_pregnancy_id) return blocked(MILK_BLOCK_REASON.PREGNANT_DRY);

    // someone blocked her by hand and no rule above supersedes it
    if (facts.current_reason === MILK_BLOCK_REASON.MANUAL) return blocked(MILK_BLOCK_REASON.MANUAL);

    return { can_produce_milk: 1, milk_block_reason: null };
};

/**********************************************
* name : recalculateHerdEligibilitySrvc
* description : the nightly catch-up for rules that turn on a date rather than on an action (a calf
*               reaching milking age, a withdrawal period expiring). ONE set-based statement for the
*               whole herd, so the cost is a single pass and not N round trips.
************************************************/
exports.recalculateHerdEligibilitySrvc = async () => {
    log('in recalculateHerdEligibilitySrvc');

    const result = await cattleEligibilityMdl.recalculateHerdEligibilityMdl();
    return { affected_rows: result?.affectedRows ?? 0, changed_rows: result?.changedRows ?? 0 };
}

/**********************************************
* name : setManualMilkBlockSrvc
* description : takes an animal off the milking sheet with no pregnancy behind it - she has simply
*               gone dry, or the incharge judges she should not be milked. this is the one reason no
*               rule can derive, which is why a human has to record it.
*
*               it REFUSES when a rule already blocks her. writing 'manual' over 'under_treatment'
*               would outlive the treatment and leave her blocked for good, because a manual block
*               is deliberately never overridden.
*
*               the note is not stored on the cattle row on purpose - overloading a general remarks
*               column loses the history. it travels in the request body, so the audit trail keeps
*               it against the user and the timestamp.
* input : (cattle_id, { remarks }, user_id)
************************************************/
exports.setManualMilkBlockSrvc = async (cattle_id, payload = {}, user_id = null) => {
    log('in setManualMilkBlockSrvc');

    const [facts] = await cattleEligibilityMdl.getEligibilityFactsMdl(cattle_id);
    if (!facts) {
        resutils.createError('recordNotFound', 'Cattle record not found.');
    }

    // ask the rules who wins if a manual block were in place. anything other than 'manual' means
    // she is already off the sheet for a stronger reason, so there is nothing to do
    const decision = decideMilkEligibility({ ...facts, current_reason: MILK_BLOCK_REASON.MANUAL });

    if (decision.milk_block_reason !== MILK_BLOCK_REASON.MANUAL) {
        resutils.createError('validationFailed',
            `${facts.cattle_unique_code} is already off the milking sheet - ${MILK_BLOCK_LABEL[decision.milk_block_reason]}.`);
    }

    const result = await cattleEligibilityMdl.setManualMilkBlockMdl(cattle_id, user_id);
    if (!result.affectedRows) {
        resutils.createError('recordNotFound', 'Cattle record not found or no longer active.');
    }

    return {
        cattle_id: Number(cattle_id),
        cattle_unique_code: facts.cattle_unique_code,
        remarks: payload.remarks || null,
        ...decision
    };
}

/**********************************************
* name : clearManualMilkBlockSrvc
* description : undoes a manual block - she is back in milk, or it was entered by mistake. only a
*               manual block can be lifted here: a rule-driven block is lifted by fixing the fact
*               behind it (record the calving, cure the treatment), never by overriding the flag.
*
*               the model does not blindly set can_produce_milk = 1. it drops the manual marker and
*               re-runs the same rules, so if she has meanwhile been dried off for a pregnancy she
*               stays blocked - with the correct reason this time.
* input : (cattle_id, user_id)
************************************************/
exports.clearManualMilkBlockSrvc = async (cattle_id, user_id = null) => {
    log('in clearManualMilkBlockSrvc');

    const [facts] = await cattleEligibilityMdl.getEligibilityFactsMdl(cattle_id);
    if (!facts) {
        resutils.createError('recordNotFound', 'Cattle record not found.');
    }
    if (facts.current_reason !== MILK_BLOCK_REASON.MANUAL) {
        resutils.createError('validationFailed', facts.current_reason
            ? `${facts.cattle_unique_code} was not marked dry by hand - she is ${MILK_BLOCK_LABEL[facts.current_reason]}. Fix that record instead.`
            : `${facts.cattle_unique_code} is already on the milking sheet.`);
    }

    await cattleEligibilityMdl.clearManualMilkBlockMdl(cattle_id, user_id);

    const [row] = await cattleEligibilityMdl.getMilkEligibilityMdl(cattle_id);
    return {
        cattle_id: Number(cattle_id),
        cattle_unique_code: facts.cattle_unique_code,
        can_produce_milk: Number(row?.can_produce_milk) === 1 ? 1 : 0,
        milk_block_reason: row?.milk_block_reason ?? null
    };
}

// exported for direct testing of the rules without touching the database
exports.decideMilkEligibility = decideMilkEligibility;
