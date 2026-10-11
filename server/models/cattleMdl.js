const dbutils = require('../utils/db.utils');
const scopeutils = require('../utils/scope.utils');
const { log } = require('../utils/log.utils');
const { milkEligibilityStep } = require('./cattleEligibilityMdl');

/*
 * The cattle register itself - the animals, not the masters behind them.
 *
 * Cattle type and breed are configuration and stay in settingsMdl; a cattle record is operational
 * data, created and corrected daily at a branch, so it lives here with its own service, controller
 * and router.
 *
 * Note what is NOT here: a calf born on the farm is written by breedingMdl.recordCalvingMdl,
 * inside the calving transaction, so that the pregnancy, the calf and its ownership row commit
 * together. This module covers animals entered by hand.
 */

/**********************************************
* name : getCattleListMdl
* description : every active animal in the caller's scope, with its type, breed, gender, branch and
*               farm resolved, plus her current breeding and health state. one query - the screen
*               never asks for anything per row.
*
*               Those last two are for DISPLAY only. A pregnancy is an event with its own row and
*               derived dates; an illness is an episode with visits and a withdrawal period. Both
*               are owned by their own modules, and a second writer on the cattle screen is exactly
*               how can_produce_milk would start disagreeing with reality.
*
*               The pregnancy is a LEFT JOIN because at most one can be in flight (the breeding
*               service guards that). The treatment is a correlated subquery instead, because an
*               animal CAN have several open episodes at once and a join would multiply her row.
************************************************/
exports.getCattleListMdl = (user) => {
    log('in getCattleListMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    const qry = `select c.cattle_id, c.cattle_unique_code, c.branch_id, c.cattle_type_id, c.breed_id, c.gender_id,
        c.weight, c.color, c.purchase_cost, c.remarks, c.is_active,
        c.can_produce_milk, c.milk_block_reason, c.cattle_status,
        b.branch_name, b.dairy_farm_id, df.dairy_farm_name,
        t.cattle_type_name, br.breed_name, g.gender_nm,
        DATE_FORMAT(c.date_of_birth, '%Y-%m-%d') as date_of_birth,
        DATE_FORMAT(c.purchase_date, '%Y-%m-%d') as purchase_date,
        DATE_FORMAT(c.created_time, '%d-%m-%Y %H:%i:%s') as created_at,
        DATE_FORMAT(c.updated_time, '%d-%m-%Y %H:%i:%s') as updated_at,

        p.pregnancy_id,
        DATE_FORMAT(p.conception_date, '%Y-%m-%d') as conception_date,
        DATE_FORMAT(p.expected_dry_off_date, '%Y-%m-%d') as expected_dry_off_date,
        DATE_FORMAT(p.expected_calving_date, '%Y-%m-%d') as expected_calving_date,
        DATE_FORMAT(p.actual_dry_off_date, '%Y-%m-%d') as actual_dry_off_date,
        datediff(curdate(), p.conception_date) as days_pregnant,
        (p.pregnancy_id is not null and p.actual_dry_off_date is null
            and p.expected_dry_off_date <= curdate()) as dry_off_due,

        (select count(*) from cattle_treatment_lst_t ot
            where ot.cattle_id = c.cattle_id and ot.is_active = 1 and ot.cure_date is null) as open_treatments,
        (select i.illness_name from cattle_treatment_lst_t ot
            join illness_mstr_lst_t i on i.illness_id = ot.illness_id
            where ot.cattle_id = c.cattle_id and ot.is_active = 1 and ot.cure_date is null
            order by ot.start_date desc limit 1) as open_illness,
        (select DATE_FORMAT(max(ot.milk_withdrawal_until), '%Y-%m-%d') from cattle_treatment_lst_t ot
            where ot.cattle_id = c.cattle_id and ot.is_active = 1
              and ot.milk_withdrawal_until >= curdate()) as milk_withdrawal_until

        from cattle_lst_t c
        join branches_lst_t b on b.branch_id = c.branch_id
        left join dairy_farm_lst_t df on df.dairy_farm_id = b.dairy_farm_id
        join cattle_types_mstr_lst_t t on t.cattle_type_id = c.cattle_type_id
        join cattle_breeds_mstr_lst_t br on br.breed_id = c.breed_id
        left join gender_mstr_lst_t g on g.gender_id = c.gender_id
        left join cattle_pregnancy_lst_t p on p.cattle_id = c.cattle_id and p.is_active = 1
            and p.pregnancy_status = 'active'
        where c.is_active = 1${scope.clause}
        order by c.cattle_unique_code asc`;
    return dbutils.executeQuery(qry, scope.params, 'get cattle list model');
}

// checks whether a generated cattle code is already taken (the column is unique)
exports.getCattleByCodeMdl = (cattle_unique_code) => {
    log('in getCattleByCodeMdl');
    const qry = 'select cattle_id from cattle_lst_t where cattle_unique_code = ?';
    return dbutils.executeQuery(qry, [cattle_unique_code], 'get cattle by code model');
}

// counts cattle ever recorded at a branch, used to seed the generated code sequence
exports.countCattleByBranchMdl = (branch_id) => {
    log('in countCattleByBranchMdl');
    const qry = 'select count(*) as cnt from cattle_lst_t where branch_id = ?';
    return dbutils.executeQuery(qry, [branch_id], 'count cattle by branch model');
}

/**********************************************
* name : insertCattleMdl
* description : records an animal entered by hand, WITH the ownership row that says how the farm
*               came to hold her. TRANSACTIONAL, and it has to be: an animal with no current
*               ownership row is flagged by the eligibility drift alert as needing a data
*               correction, so creating one without the other produces a record that is broken the
*               moment it is saved.
*
*               executeTransaction rather than executeTransactionQueries because the ownership row
*               needs the cattle's insertId - the second statement depends on the first one's result.
*
*               mother_cattle_id and pregnancy_id are left null: those are only set on a calf, and a
*               calf is written by the calving transaction in breedingMdl, which inserts its own
*               'born_on_farm' ownership row the same way.
* input : (data incl. ownership fields, user_id)
* output : { insertId }
************************************************/
exports.insertCattleMdl = async (data, user_id) => {
    log('in insertCattleMdl');

    return dbutils.executeTransaction(async (connection) => {

        const [result] = await connection.execute(
            `insert into cattle_lst_t (branch_id, cattle_unique_code, cattle_type_id, breed_id, gender_id,
                date_of_birth, weight, color, purchase_date, purchase_cost, remarks, created_by)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.branch_id, data.cattle_unique_code, data.cattle_type_id, data.breed_id, data.gender_id,
                data.date_of_birth, data.weight, data.color, data.purchase_date, data.purchase_cost,
                data.remarks, user_id ?? null]
        );

        // the arrangement the farm holds her under. effective_to stays null - this is the CURRENT
        // one, and a later arrangement closes it rather than overwriting it
        await connection.execute(
            `insert into cattle_ownership_lst_t
                (cattle_id, purchase_mode_id, effective_from, amount, partner_name, partner_share_pct,
                 partner_contact, remarks, created_by)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [result.insertId, data.purchase_mode_id, data.effective_from, data.amount,
                data.partner_name, data.partner_share_pct, data.partner_contact,
                data.ownership_remarks, user_id ?? null]
        );

        // can_produce_milk defaults to 0, so without this she is off the milking sheet with no
        // reason given until the nightly job runs. the rules decide it now, on this transaction
        const eligibility = milkEligibilityStep(result.insertId, user_id);
        await connection.execute(eligibility.query, eligibility.params);

        return result;
    }, 'insert cattle');
}

// updates an animal's details; the generated code never changes once assigned
exports.updateCattleMdl = (cattle_id, data, user_id) => {
    log('in updateCattleMdl');
    const qry = `update cattle_lst_t set branch_id = ?, cattle_type_id = ?, breed_id = ?, gender_id = ?,
        date_of_birth = ?, weight = ?, color = ?, purchase_date = ?, purchase_cost = ?,
        remarks = ?, updated_by = ?
        where is_active = 1 and cattle_id = ?`;
    return dbutils.executeQuery(qry, [data.branch_id, data.cattle_type_id, data.breed_id, data.gender_id,
        data.date_of_birth, data.weight, data.color, data.purchase_date, data.purchase_cost,
        data.remarks, user_id ?? null, cattle_id], 'update cattle model');
}

// fetches an active cattle record by id
exports.getActiveCattleByIdMdl = (cattle_id) => {
    log('in getActiveCattleByIdMdl');
    const qry = `select cattle_id, cattle_unique_code, branch_id, gender_id from cattle_lst_t
        where is_active = 1 and cattle_id = ?`;
    return dbutils.executeQuery(qry, [cattle_id], 'get active cattle by id model');
}

// soft deletes a cattle record, stamping who removed it and when
exports.softDeleteCattleMdl = (cattle_id, user_id) => {
    log('in softDeleteCattleMdl');
    const qry = `update cattle_lst_t set is_active = 0, deleted_by = ?, deleted_time = current_timestamp
        where is_active = 1 and cattle_id = ?`;
    return dbutils.executeQuery(qry, [user_id ?? null, cattle_id], 'soft delete cattle model');
}
