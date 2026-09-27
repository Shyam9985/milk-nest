const dbutils = require('../utils/db.utils');
const { log } = require('../utils/log.utils');
const { CALF_AGE_MONTHS, CATTLE_STATUS, MILK_BLOCK_REASON } = require('../utils/cattle.constants');

/*
 * can_produce_milk - the flag the milk sheet reads - and the statements that decide it.
 *
 * The flag is a cache of the rules below. It is written by ONE statement per animal, so an
 * animal's eligibility can never be computed from facts that changed underneath it.
 *
 * There are two copies of those rules here: one for a single animal, one for the whole herd
 * (the nightly job). They are the SAME rules and must be changed together - the comment on
 * each says so. Two readable statements were chosen over one statement assembled from string
 * fragments, because this SQL is the most important logic in the module and it has to be
 * possible to read it top to bottom.
 *
 * milkEligibilityStep() returns the single-animal statement as { query, params }, which is what
 * executeTransactionQueries takes. Other models append it to their own statement list, so a
 * pregnancy or treatment write and the milk block it causes commit together - and no function
 * has to accept a connection.
 *
 * Both statements use curdate() rather than a date passed in from Node. That keeps them free of
 * date parameters and, more importantly, agreeing with the register queries, which already ask
 * MySQL for today.
 */

/**********************************************
* name : milkEligibilityStep
* description : re-decides ONE animal, as a { query, params } step for executeTransactionQueries.
*
*               The rules, in order - FIRST match wins, most authoritative fact first:
*                 gone from the herd > male > too young > milk withdrawal > dried off > manual.
*
*               Two of them are deliberate:
*                 - the treatment join ignores cure_date, because medicine residue outlives the
*                   symptoms: she is held until the withdrawal date passes even once cured
*                 - a 'manual' block is preserved rather than recomputed - it is the incharge's
*                   judgement that she has gone dry, and no rule may say "she looks fine" over it
*
*               An unknown date of birth does NOT block her: guessing "too young" would hide a
*               real milker, and the dashboard already flags incomplete cattle records.
*
*               KEEP IN STEP WITH recalculateHerdEligibilityMdl below.
* input : (cattle_id, user_id)
* output : { query, params }
************************************************/
const milkEligibilityStep = (cattle_id, user_id) => ({
    query: `update cattle_lst_t c
        left join gender_mstr_lst_t g on g.gender_id = c.gender_id
        left join cattle_pregnancy_lst_t p on p.cattle_id = c.cattle_id and p.is_active = 1
            and p.pregnancy_status = 'active'
            and p.actual_dry_off_date is not null and p.actual_calving_date is null
        left join cattle_treatment_lst_t t on t.cattle_id = c.cattle_id and t.is_active = 1
            and t.milk_withdrawal_until >= curdate()
        set c.updated_by = ?,
            c.can_produce_milk = case
                when c.cattle_status <> '${CATTLE_STATUS.ACTIVE}' then 0
                when g.gender_nm = 'Male' then 0
                when timestampdiff(month, c.date_of_birth, curdate()) < ${CALF_AGE_MONTHS} then 0
                when t.treatment_id is not null then 0
                when p.pregnancy_id is not null then 0
                when c.milk_block_reason = '${MILK_BLOCK_REASON.MANUAL}' then 0
                else 1 end,
            c.milk_block_reason = case
                when c.cattle_status = '${CATTLE_STATUS.DEAD}' then '${MILK_BLOCK_REASON.DEAD}'
                when c.cattle_status <> '${CATTLE_STATUS.ACTIVE}' then '${MILK_BLOCK_REASON.SOLD}'
                when g.gender_nm = 'Male' then '${MILK_BLOCK_REASON.MALE}'
                when timestampdiff(month, c.date_of_birth, curdate()) < ${CALF_AGE_MONTHS} then '${MILK_BLOCK_REASON.CALF}'
                when t.treatment_id is not null then '${MILK_BLOCK_REASON.UNDER_TREATMENT}'
                when p.pregnancy_id is not null then '${MILK_BLOCK_REASON.PREGNANT_DRY}'
                when c.milk_block_reason = '${MILK_BLOCK_REASON.MANUAL}' then '${MILK_BLOCK_REASON.MANUAL}'
                else null end
        where c.is_active = 1 and c.cattle_id = ?`,
    params: [user_id ?? null, cattle_id]
});

/**********************************************
* name : recalculateHerdEligibilityMdl
* description : the nightly catch-up, for rules that turn on a DATE rather than on an action - a
*               calf reaching milking age, a withdrawal period expiring. Nobody does anything on
*               those days, so nothing else would notice.
*               same rules as milkEligibilityStep above, minus the cattle_id, so it is ONE pass
*               over the herd instead of N round trips.
*               KEEP IN STEP WITH milkEligibilityStep above.
************************************************/
exports.recalculateHerdEligibilityMdl = () => {
    log('in recalculateHerdEligibilityMdl');

    const qry = `update cattle_lst_t c
        left join gender_mstr_lst_t g on g.gender_id = c.gender_id
        left join cattle_pregnancy_lst_t p on p.cattle_id = c.cattle_id and p.is_active = 1
            and p.pregnancy_status = 'active'
            and p.actual_dry_off_date is not null and p.actual_calving_date is null
        left join cattle_treatment_lst_t t on t.cattle_id = c.cattle_id and t.is_active = 1
            and t.milk_withdrawal_until >= curdate()
        set c.updated_by = ?,
            c.can_produce_milk = case
                when c.cattle_status <> '${CATTLE_STATUS.ACTIVE}' then 0
                when g.gender_nm = 'Male' then 0
                when timestampdiff(month, c.date_of_birth, curdate()) < ${CALF_AGE_MONTHS} then 0
                when t.treatment_id is not null then 0
                when p.pregnancy_id is not null then 0
                when c.milk_block_reason = '${MILK_BLOCK_REASON.MANUAL}' then 0
                else 1 end,
            c.milk_block_reason = case
                when c.cattle_status = '${CATTLE_STATUS.DEAD}' then '${MILK_BLOCK_REASON.DEAD}'
                when c.cattle_status <> '${CATTLE_STATUS.ACTIVE}' then '${MILK_BLOCK_REASON.SOLD}'
                when g.gender_nm = 'Male' then '${MILK_BLOCK_REASON.MALE}'
                when timestampdiff(month, c.date_of_birth, curdate()) < ${CALF_AGE_MONTHS} then '${MILK_BLOCK_REASON.CALF}'
                when t.treatment_id is not null then '${MILK_BLOCK_REASON.UNDER_TREATMENT}'
                when p.pregnancy_id is not null then '${MILK_BLOCK_REASON.PREGNANT_DRY}'
                when c.milk_block_reason = '${MILK_BLOCK_REASON.MANUAL}' then '${MILK_BLOCK_REASON.MANUAL}'
                else null end
        where c.is_active = 1`;
    return dbutils.executeQuery(qry, [null], 'recalculate herd eligibility model');
}

/**********************************************
* name : getEligibilityFactsMdl
* description : the facts behind the decision, as a plain read. nothing writes from this - it exists
*               so the manual dry-off can TELL the user which rule already holds an animal ("she is
*               under treatment") instead of the action silently doing nothing.
*               each LEFT JOIN is an index lookup, so this is O(1) whatever the herd size.
************************************************/
exports.getEligibilityFactsMdl = (cattle_id) => {
    log('in getEligibilityFactsMdl');

    const qry = `select c.cattle_id, c.cattle_unique_code, c.branch_id, c.cattle_status,
        c.can_produce_milk as current_flag, c.milk_block_reason as current_reason,
        c.date_of_birth, g.gender_nm,
        (timestampdiff(month, c.date_of_birth, curdate()) < ${CALF_AGE_MONTHS}) as is_calf,
        p.pregnancy_id as dried_off_pregnancy_id,
        t.treatment_id as withdrawal_treatment_id,
        DATE_FORMAT(t.milk_withdrawal_until, '%Y-%m-%d') as milk_withdrawal_until
        from cattle_lst_t c
        left join gender_mstr_lst_t g on g.gender_id = c.gender_id
        left join cattle_pregnancy_lst_t p on p.cattle_id = c.cattle_id and p.is_active = 1
            and p.pregnancy_status = 'active'
            and p.actual_dry_off_date is not null and p.actual_calving_date is null
        left join cattle_treatment_lst_t t on t.cattle_id = c.cattle_id and t.is_active = 1
            and t.milk_withdrawal_until >= curdate()
        where c.cattle_id = ?
        limit 1`;
    return dbutils.executeQuery(qry, [cattle_id], 'get eligibility facts model');
}

// the current flag and reason, for reporting back what a change ended up doing
exports.getMilkEligibilityMdl = (cattle_id) => {
    log('in getMilkEligibilityMdl');

    const qry = `select cattle_id, cattle_unique_code, can_produce_milk, milk_block_reason
        from cattle_lst_t where cattle_id = ?`;
    return dbutils.executeQuery(qry, [cattle_id], 'get milk eligibility model');
}

/**********************************************
* name : setManualMilkBlockMdl
* description : the one reason no rule can derive - she has simply gone dry. ONE statement, so it
*               needs no transaction. the guard that refuses it when a stronger rule already holds
*               her lives in the service, where the message belongs.
************************************************/
exports.setManualMilkBlockMdl = (cattle_id, user_id) => {
    log('in setManualMilkBlockMdl');

    const qry = `update cattle_lst_t
        set can_produce_milk = 0, milk_block_reason = '${MILK_BLOCK_REASON.MANUAL}', updated_by = ?
        where is_active = 1 and cattle_id = ?`;
    return dbutils.executeQuery(qry, [user_id ?? null, cattle_id], 'set manual milk block model');
}

/**********************************************
* name : clearManualMilkBlockMdl
* description : lifts a manual block. TWO statements, so they go in a transaction, and the order is
*               the point: the marker has to go first because the rules in the second statement read
*               milk_block_reason off this same row.
*               she is not put back on the sheet blindly - if she has since been dried off for a
*               pregnancy she stays blocked, with the right reason this time.
************************************************/
exports.clearManualMilkBlockMdl = async (cattle_id, user_id) => {
    log('in clearManualMilkBlockMdl');

    const [result] = await dbutils.executeTransactionQueries([
        {
            query: `update cattle_lst_t set milk_block_reason = null, updated_by = ?
                where is_active = 1 and cattle_id = ?`,
            params: [user_id ?? null, cattle_id]
        },
        milkEligibilityStep(cattle_id, user_id)
    ], 'clear manual milk block');

    return result;
}

// shared with the other models so they can append the same rules to their own statement list
exports.milkEligibilityStep = milkEligibilityStep;
