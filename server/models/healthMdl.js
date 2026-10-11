const dbutils = require('../utils/db.utils');
const scopeutils = require('../utils/scope.utils');
const { log } = require('../utils/log.utils');
const { milkEligibilityStep } = require('./cattleEligibilityMdl');

/*
 * Health: treatment episodes and the checkups inside them.
 *
 * The shape follows how a farm actually treats an animal. "Mastitis, started on the 3rd" is
 * ONE episode; the vet visiting three times is THREE checkups against it. That is why the
 * episode carries the illness, the dates and the withdrawal period, while each visit carries
 * its own medicines, observation and cost.
 *
 * Performance notes:
 *   - the register is one query with joins plus two correlated counts, evaluated only for the
 *     rows actually returned
 *   - total_expense on the episode is DERIVED from its checkups by one set-based statement,
 *     never accumulated in application code - a deleted checkup can then never leave a wrong
 *     total behind
 *
 * Transactions are owned here, not by the service, and the db util is chosen by the SHAPE of the
 * work - nothing accepts a connection as an argument:
 *
 *   executeQuery              one statement (every read below).
 *   executeTransactionQueries a FIXED list of statements - every write below. the eligibility step
 *                             needs nothing back from the write in front of it, so the whole list
 *                             is known before any of it runs.
 *
 * Nothing inside a transaction throws a business error: it would come back out rebranded as a
 * generic DatabaseError. Each write carries its own guard in the WHERE instead, and a zero
 * affectedRows is what the service turns into a message.
 */

const safeLimit = (limit, fallback) => (Number.isInteger(limit) && limit > 0 ? limit : fallback);

/* ------------------------------ reads ------------------------------ */

/**********************************************
* name : getTreatmentListMdl
* description : the health register for the caller's scope. days_open and withdrawal_active are
*               computed in SQL so the screen never has to know today's date, and the two
*               counts are correlated lookups on indexed columns.
* input : (user, { status: 'open'|'cured', dairy_farm_id, branch_id, cattle_id }, limit)
************************************************/
exports.getTreatmentListMdl = (user, filters = {}, limit = 200) => {
    log('in getTreatmentListMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    let qry = `select t.treatment_id, t.cattle_id, t.illness_id, t.severity, t.attended_by,
        t.total_expense, t.remarks,
        i.illness_name,
        c.cattle_unique_code, c.can_produce_milk, c.milk_block_reason,
        b.branch_id, b.branch_name, df.dairy_farm_id, df.dairy_farm_name,
        ct.cattle_type_name, cb.breed_name,
        DATE_FORMAT(t.start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(t.cure_date, '%Y-%m-%d') as cure_date,
        DATE_FORMAT(t.milk_withdrawal_until, '%Y-%m-%d') as milk_withdrawal_until,
        datediff(ifnull(t.cure_date, curdate()), t.start_date) as days_open,
        (t.milk_withdrawal_until is not null and t.milk_withdrawal_until >= curdate()) as withdrawal_active,
        datediff(t.milk_withdrawal_until, curdate()) as withdrawal_days_left,
        (select count(*) from cattle_treatment_history_t h
            where h.treatment_id = t.treatment_id and h.is_active = 1) as checkup_count,
        (select DATE_FORMAT(max(h.next_checkup_date), '%Y-%m-%d') from cattle_treatment_history_t h
            where h.treatment_id = t.treatment_id and h.is_active = 1) as next_checkup_date
        from cattle_treatment_lst_t t
        join cattle_lst_t c on c.cattle_id = t.cattle_id
        join branches_lst_t b on b.branch_id = c.branch_id
        left join dairy_farm_lst_t df on df.dairy_farm_id = b.dairy_farm_id
        left join illness_mstr_lst_t i on i.illness_id = t.illness_id
        left join cattle_types_mstr_lst_t ct on ct.cattle_type_id = c.cattle_type_id
        left join cattle_breeds_mstr_lst_t cb on cb.breed_id = c.breed_id
        where t.is_active = 1${scope.clause}`;
    const params = [...scope.params];

    if (filters.status === 'open') qry += ' and t.cure_date is null';
    if (filters.status === 'cured') qry += ' and t.cure_date is not null';
    if (filters.dairy_farm_id) { qry += ' and b.dairy_farm_id = ?'; params.push(filters.dairy_farm_id); }
    if (filters.branch_id) { qry += ' and b.branch_id = ?'; params.push(filters.branch_id); }
    if (filters.cattle_id) { qry += ' and t.cattle_id = ?'; params.push(filters.cattle_id); }

    // open episodes first, then the most recently started - what needs attention is at the top
    qry += ` order by (t.cure_date is null) desc, t.start_date desc, t.treatment_id desc
        limit ${safeLimit(limit, 200)}`;
    return dbutils.executeQuery(qry, params, 'get treatment list model');
}

/**********************************************
* name : getTreatmentByIdMdl
* description : one episode with the animal's identity, for the guards and the response message.
************************************************/
exports.getTreatmentByIdMdl = (treatment_id) => {
    log('in getTreatmentByIdMdl');
    const qry = `select t.treatment_id, t.cattle_id, t.illness_id, t.severity,
        DATE_FORMAT(t.start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(t.cure_date, '%Y-%m-%d') as cure_date,
        DATE_FORMAT(t.milk_withdrawal_until, '%Y-%m-%d') as milk_withdrawal_until,
        c.cattle_unique_code, c.branch_id, i.illness_name
        from cattle_treatment_lst_t t
        join cattle_lst_t c on c.cattle_id = t.cattle_id
        left join illness_mstr_lst_t i on i.illness_id = t.illness_id
        where t.is_active = 1 and t.treatment_id = ?`;
    return dbutils.executeQuery(qry, [treatment_id], 'get treatment by id model');
}

/**********************************************
* name : getOpenTreatmentForIllnessMdl
* description : the guard's lookup - the same animal must not have two open episodes of the same
*               illness, because then nobody knows which one the vet is treating. uses
*               idx_treatment_cattle_open, so it is an index lookup rather than a scan.
************************************************/
exports.getOpenTreatmentForIllnessMdl = (cattle_id, illness_id, exclude_id = null) => {
    log('in getOpenTreatmentForIllnessMdl');
    let qry = `select treatment_id, DATE_FORMAT(start_date, '%Y-%m-%d') as start_date
        from cattle_treatment_lst_t
        where is_active = 1 and cure_date is null and cattle_id = ? and illness_id = ?`;
    const params = [cattle_id, illness_id];

    if (exclude_id) { qry += ' and treatment_id <> ?'; params.push(exclude_id); }

    return dbutils.executeQuery(qry, params, 'get open treatment for illness model');
}

/**********************************************
* name : getTreatableCattleMdl
* description : the dropdown. every animal still in the herd can fall ill - males and calves
*               included - so this filters only on being active, never on milkability.
************************************************/
exports.getTreatableCattleMdl = (user, branch_id = null) => {
    log('in getTreatableCattleMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    let qry = `select c.cattle_id, c.cattle_unique_code, c.can_produce_milk, c.milk_block_reason,
        b.branch_id, b.branch_name, t.cattle_type_name, br.breed_name
        from cattle_lst_t c
        join branches_lst_t b on b.branch_id = c.branch_id
        left join cattle_types_mstr_lst_t t on t.cattle_type_id = c.cattle_type_id
        left join cattle_breeds_mstr_lst_t br on br.breed_id = c.breed_id
        where c.is_active = 1 and c.cattle_status = 'active'${scope.clause}`;
    const params = [...scope.params];

    if (branch_id) { qry += ' and c.branch_id = ?'; params.push(branch_id); }

    qry += ' order by c.cattle_unique_code asc';
    return dbutils.executeQuery(qry, params, 'get treatable cattle model');
}

// the guard's lookup before opening an episode: she must still be in the herd
exports.getTreatableCattleByIdMdl = (cattle_id) => {
    log('in getTreatableCattleByIdMdl');
    const qry = `select cattle_id, cattle_unique_code, branch_id, cattle_status
        from cattle_lst_t
        where is_active = 1 and cattle_status = 'active' and cattle_id = ?`;
    return dbutils.executeQuery(qry, [cattle_id], 'get treatable cattle by id model');
}

// the illness master, for the episode form
exports.getIllnessOptionsMdl = () => {
    log('in getIllnessOptionsMdl');
    const qry = `select illness_id, illness_name, description from illness_mstr_lst_t
        where is_active = 1 order by illness_name asc`;
    return dbutils.executeQuery(qry, [], 'get illness options model');
}

// the visit history of one episode, newest first
exports.getCheckupListMdl = (treatment_id) => {
    log('in getCheckupListMdl');
    const qry = `select h.history_id, h.treatment_id, h.medicines, h.observation, h.expense, h.attended_by,
        DATE_FORMAT(h.checkup_date, '%Y-%m-%d') as checkup_date,
        DATE_FORMAT(h.next_checkup_date, '%Y-%m-%d') as next_checkup_date,
        DATE_FORMAT(h.created_time, '%d-%m-%Y %H:%i:%s') as created_at
        from cattle_treatment_history_t h
        where h.is_active = 1 and h.treatment_id = ?
        order by h.checkup_date desc, h.history_id desc`;
    return dbutils.executeQuery(qry, [treatment_id], 'get checkup list model');
}

exports.getCheckupByIdMdl = (history_id) => {
    log('in getCheckupByIdMdl');
    const qry = `select history_id, treatment_id, DATE_FORMAT(checkup_date, '%Y-%m-%d') as checkup_date
        from cattle_treatment_history_t where is_active = 1 and history_id = ?`;
    return dbutils.executeQuery(qry, [history_id], 'get checkup by id model');
}

// delete guard: soft deletes mean the FK cannot protect the checkups below an episode
exports.countCheckupsByTreatmentMdl = (treatment_id) => {
    log('in countCheckupsByTreatmentMdl');
    const qry = `select count(*) as cnt from cattle_treatment_history_t
        where is_active = 1 and treatment_id = ?`;
    return dbutils.executeQuery(qry, [treatment_id], 'count checkups by treatment model');
}


/* ------------------------------ writes ------------------------------ */

/*
 * Every write here is a FIXED list of statements, so they all go through
 * executeTransactionQueries. Each list ends with the eligibility step, because a withdrawal period
 * starting, moving or expiring is exactly what puts an animal on or off the milking sheet -
 * recording the treatment and blocking her milk is one fact, so it commits as one.
 */

// the episode's total is the sum of its live checkups, recomputed rather than incremented - which
// is what makes a corrected or deleted visit impossible to get wrong
const recalcExpenseStep = (treatment_id) => ({
    query: `update cattle_treatment_lst_t t
        set t.total_expense = ifnull((select sum(h.expense) from cattle_treatment_history_t h
            where h.treatment_id = t.treatment_id and h.is_active = 1), 0)
        where t.treatment_id = ?`,
    params: [treatment_id]
});

/**********************************************
* name : insertTreatmentMdl
* description : opens an episode and applies the milk block it implies. total_expense starts at 0
*               and is only ever written by recalcExpenseStep above.
* input : ({ cattle_id, illness_id, start_date, severity, attended_by, milk_withdrawal_until, remarks }, user_id)
************************************************/
exports.insertTreatmentMdl = async (data, user_id) => {
    log('in insertTreatmentMdl');

    const [result] = await dbutils.executeTransactionQueries([
        {
            query: `insert into cattle_treatment_lst_t
                (cattle_id, illness_id, start_date, severity, attended_by, milk_withdrawal_until, remarks, created_by)
                values (?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [data.cattle_id, data.illness_id, data.start_date, data.severity,
                data.attended_by, data.milk_withdrawal_until, data.remarks, user_id ?? null]
        },
        milkEligibilityStep(data.cattle_id, user_id)
    ], 'insert treatment');

    return result;
}

/**********************************************
* name : updateTreatmentMdl
* description : corrects an episode. the animal and the illness are NOT updatable: changing either
*               makes it a different episode, and the checkups hanging off it would then describe
*               the wrong illness. shortening the withdrawal period can put her back on the sheet,
*               which is why the eligibility step runs here too.
* input : (treatment_id, data, cattle_id, user_id)
************************************************/
exports.updateTreatmentMdl = async (treatment_id, data, cattle_id, user_id) => {
    log('in updateTreatmentMdl');

    const [result] = await dbutils.executeTransactionQueries([
        {
            query: `update cattle_treatment_lst_t
                set start_date = ?, severity = ?, attended_by = ?, milk_withdrawal_until = ?,
                    remarks = ?, updated_by = ?
                where is_active = 1 and treatment_id = ?`,
            params: [data.start_date, data.severity, data.attended_by,
                data.milk_withdrawal_until, data.remarks, user_id ?? null, treatment_id]
        },
        milkEligibilityStep(cattle_id, user_id)
    ], 'update treatment');

    return result;
}

/**********************************************
* name : closeTreatmentMdl
* description : she is well. the withdrawal date is deliberately left alone - medicine residue
*               outlives the symptoms, so the eligibility step keeps her off the sheet until that
*               date passes rather than releasing her along with the cure.
*               the 'cure_date is null' guard is in the WHERE: a zero affectedRows means someone
*               else already closed it.
* input : (treatment_id, cure_date, cattle_id, user_id)
************************************************/
exports.closeTreatmentMdl = async (treatment_id, cure_date, cattle_id, user_id) => {
    log('in closeTreatmentMdl');

    const [result] = await dbutils.executeTransactionQueries([
        {
            query: `update cattle_treatment_lst_t set cure_date = ?, updated_by = ?
                where is_active = 1 and cure_date is null and treatment_id = ?`,
            params: [cure_date, user_id ?? null, treatment_id]
        },
        milkEligibilityStep(cattle_id, user_id)
    ], 'close treatment');

    return result;
}

// reopens an episode closed by mistake, or one she has relapsed into
exports.reopenTreatmentMdl = async (treatment_id, cattle_id, user_id) => {
    log('in reopenTreatmentMdl');

    const [result] = await dbutils.executeTransactionQueries([
        {
            query: `update cattle_treatment_lst_t set cure_date = null, updated_by = ?
                where is_active = 1 and cure_date is not null and treatment_id = ?`,
            params: [user_id ?? null, treatment_id]
        },
        milkEligibilityStep(cattle_id, user_id)
    ], 'reopen treatment');

    return result;
}

/**********************************************
* name : softDeleteTreatmentMdl
* description : removes an episode entered by mistake. the block she was under may have been this
*               episode's, so she is re-decided in the same transaction. the checkup guard lives in
*               the service - it needs to say how many are in the way.
* input : (treatment_id, cattle_id, user_id)
************************************************/
exports.softDeleteTreatmentMdl = async (treatment_id, cattle_id, user_id) => {
    log('in softDeleteTreatmentMdl');

    const [result] = await dbutils.executeTransactionQueries([
        {
            query: `update cattle_treatment_lst_t
                set is_active = 0, deleted_by = ?, deleted_time = current_timestamp
                where is_active = 1 and treatment_id = ?`,
            params: [user_id ?? null, treatment_id]
        },
        milkEligibilityStep(cattle_id, user_id)
    ], 'delete treatment');

    return result;
}

/**********************************************
* name : insertCheckupMdl
* description : one visit, and the three things that follow from it:
*                 - the episode's total is recomputed from its live checkups
*                 - a withdrawal date given today only ever PUSHES the episode's date out. the
*                   guard is in the WHERE: the vet gave more medicine so the milk is held longer,
*                   but a later visit can never release milk an earlier one held back
*                 - her eligibility is re-decided from the result
*               the withdrawal step is only in the list when a date was actually given, which is
*               known before anything runs - so this is still a fixed list.
* input : (data, cattle_id, milk_withdrawal_until|null, user_id)
************************************************/
exports.insertCheckupMdl = async (data, cattle_id, milk_withdrawal_until, user_id) => {
    log('in insertCheckupMdl');

    const [result] = await dbutils.executeTransactionQueries([
        {
            query: `insert into cattle_treatment_history_t
                (treatment_id, checkup_date, medicines, observation, expense, attended_by, next_checkup_date, created_by)
                values (?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [data.treatment_id, data.checkup_date, data.medicines, data.observation,
                data.expense, data.attended_by, data.next_checkup_date, user_id ?? null]
        },
        recalcExpenseStep(data.treatment_id),
        ...(milk_withdrawal_until ? [{
            query: `update cattle_treatment_lst_t
                set milk_withdrawal_until = ?, updated_by = ?
                where is_active = 1 and treatment_id = ?
                  and (milk_withdrawal_until is null or milk_withdrawal_until < ?)`,
            params: [milk_withdrawal_until, user_id ?? null, data.treatment_id, milk_withdrawal_until]
        }] : []),
        milkEligibilityStep(cattle_id, user_id)
    ], 'insert checkup');

    return result;
}

/**********************************************
* name : softDeleteCheckupMdl
* description : removes a visit entered by mistake and recomputes the episode's total from the
*               visits that remain. no eligibility step: deleting a visit does not move the
*               episode's own withdrawal date, and that is what holds her milk.
* input : (history_id, treatment_id, user_id)
************************************************/
exports.softDeleteCheckupMdl = async (history_id, treatment_id, user_id) => {
    log('in softDeleteCheckupMdl');

    const [result] = await dbutils.executeTransactionQueries([
        {
            query: `update cattle_treatment_history_t
                set is_active = 0, deleted_by = ?, deleted_time = current_timestamp
                where is_active = 1 and history_id = ?`,
            params: [user_id ?? null, history_id]
        },
        recalcExpenseStep(treatment_id)
    ], 'delete checkup');

    return result;
}
