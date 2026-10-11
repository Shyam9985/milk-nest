const dbutils = require('../utils/db.utils');
const scopeutils = require('../utils/scope.utils');
const { log } = require('../utils/log.utils');
const { CATTLE_STATUS, MILK_BLOCK_REASON } = require('../utils/cattle.constants');

/*
 * Alert queries for the cattle lifecycle.
 *
 * Performance rules, same as the dashboard:
 *   - one indexed query per alert, never a query per animal
 *   - pregnancy alerts ride idx_pregnancy_alerts (pregnancy_status, expected_dry_off_date,
 *     expected_calving_date); treatment alerts ride idx_treatment_cattle_open
 *   - the comparison is always a bare date column against a bound parameter, so it stays
 *     sargable (no date arithmetic wrapped around the column)
 *   - every alert is scoped through branches_lst_t, so an incharge only ever sees their own
 *   - each returns a bounded row count: the caller shows a list, not the whole herd
 */

// scope from the signed JWT, narrowed by the optional screen filters - the same shared
// fragment the dashboard uses, so a filter outside the user's jurisdiction yields no rows
const buildBranchFilter = (user, dairy_farm_id = null, branch_id = null) => {
    const scope = scopeutils.getScopeFilter(user, 'b');
    let clause = scope.clause;
    const params = [...scope.params];

    if (dairy_farm_id) { clause += ' and b.dairy_farm_id = ?'; params.push(dairy_farm_id); }
    if (branch_id) { clause += ' and b.branch_id = ?'; params.push(branch_id); }

    return { clause, params };
};

// LIMITs are internal constants, never request input; inlined because a prepared statement
// cannot bind LIMIT on MySQL 8
const safeLimit = (limit, fallback) => (Number.isInteger(limit) && limit > 0 ? limit : fallback);

/**********************************************
* name : getCalvingDueAlertMdl
* description : pregnancies at or past their expected calving date with no calving recorded.
*               the incharge has to confirm what happened - this is the alert that has a real
*               deadline attached to it.
* input : (user, today 'YYYY-MM-DD', filters, limit)
************************************************/
exports.getCalvingDueAlertMdl = (user, today, filters = {}, limit = 25) => {
    log('in getCalvingDueAlertMdl');
    const filter = buildBranchFilter(user, filters.dairy_farm_id, filters.branch_id);

    const qry = `select p.pregnancy_id, c.cattle_id, c.cattle_unique_code, b.branch_name,
        DATE_FORMAT(p.conception_date, '%d-%m-%Y') as conception_date,
        DATE_FORMAT(p.expected_calving_date, '%Y-%m-%d') as expected_calving_date,
        datediff(?, p.expected_calving_date) as days_overdue
        from cattle_pregnancy_lst_t p
        join cattle_lst_t c on c.cattle_id = p.cattle_id and c.is_active = 1
        join branches_lst_t b on b.branch_id = c.branch_id
        where p.is_active = 1 and p.pregnancy_status = 'active'
            and p.actual_calving_date is null
            and p.expected_calving_date is not null and p.expected_calving_date <= ?
            ${filter.clause}
        order by days_overdue desc, c.cattle_unique_code asc
        limit ${safeLimit(limit, 25)}`;
    return dbutils.executeQuery(qry, [today, today, ...filter.params], 'get calving due alert model');
}

/**********************************************
* name : getDryOffDueAlertMdl
* description : past the breed's expected dry-off point, still marked as producing. the system
*               never stops her automatically - timing varies by breed and animal - so this
*               asks the incharge to confirm.
* input : (user, today, filters, limit)
************************************************/
exports.getDryOffDueAlertMdl = (user, today, filters = {}, limit = 25) => {
    log('in getDryOffDueAlertMdl');
    const filter = buildBranchFilter(user, filters.dairy_farm_id, filters.branch_id);

    const qry = `select p.pregnancy_id, c.cattle_id, c.cattle_unique_code, b.branch_name,
        DATE_FORMAT(p.conception_date, '%d-%m-%Y') as conception_date,
        DATE_FORMAT(p.expected_dry_off_date, '%Y-%m-%d') as expected_dry_off_date,
        datediff(?, p.expected_dry_off_date) as days_past,
        datediff(?, p.conception_date) as days_pregnant
        from cattle_pregnancy_lst_t p
        join cattle_lst_t c on c.cattle_id = p.cattle_id and c.is_active = 1
        join branches_lst_t b on b.branch_id = c.branch_id
        where p.is_active = 1 and p.pregnancy_status = 'active'
            and p.actual_dry_off_date is null and p.actual_calving_date is null
            and p.expected_dry_off_date is not null and p.expected_dry_off_date <= ?
            and c.can_produce_milk = 1
            ${filter.clause}
        order by days_past desc, c.cattle_unique_code asc
        limit ${safeLimit(limit, 25)}`;
    return dbutils.executeQuery(qry, [today, today, today, ...filter.params], 'get dry off due alert model');
}

/**********************************************
* name : getMilkWithdrawalBreachAlertMdl
* description : FOOD SAFETY. a treatment whose withdrawal period is still running where the
*               animal is nonetheless flagged milkable, or milk was actually recorded during it.
*               a breach means treated milk may have reached the tank.
*               a CURED treatment still counts: residue outlives the symptoms, so the withdrawal
*               date is what matters and not whether she is better.
* input : (user, today, filters, limit)
************************************************/
exports.getMilkWithdrawalBreachAlertMdl = (user, today, filters = {}, limit = 25) => {
    log('in getMilkWithdrawalBreachAlertMdl');
    const filter = buildBranchFilter(user, filters.dairy_farm_id, filters.branch_id);

    const qry = `select t.treatment_id, c.cattle_id, c.cattle_unique_code, b.branch_name,
        i.illness_name,
        DATE_FORMAT(t.milk_withdrawal_until, '%Y-%m-%d') as milk_withdrawal_until,
        datediff(t.milk_withdrawal_until, ?) as days_remaining,
        c.can_produce_milk,
        (select count(*) from milk_production_lst_t mp
            where mp.cattle_id = c.cattle_id and mp.is_active = 1
              and mp.production_date between t.start_date and t.milk_withdrawal_until) as entries_during_withdrawal
        from cattle_treatment_lst_t t
        join cattle_lst_t c on c.cattle_id = t.cattle_id and c.is_active = 1
        join branches_lst_t b on b.branch_id = c.branch_id
        left join illness_mstr_lst_t i on i.illness_id = t.illness_id
        where t.is_active = 1
            and t.milk_withdrawal_until is not null and t.milk_withdrawal_until >= ?
            ${filter.clause}
        having c.can_produce_milk = 1 or entries_during_withdrawal > 0
        order by entries_during_withdrawal desc, t.milk_withdrawal_until asc
        limit ${safeLimit(limit, 25)}`;
    return dbutils.executeQuery(qry, [today, today, ...filter.params], 'get milk withdrawal breach alert model');
}

/**********************************************
* name : getCalfNotRegisteredAlertMdl
* description : a calving was recorded but no calf rows exist against it, so the register is
*               half finished and the calf is invisible to the system.
* input : (user, filters, limit)
************************************************/
exports.getCalfNotRegisteredAlertMdl = (user, filters = {}, limit = 25) => {
    log('in getCalfNotRegisteredAlertMdl');
    const filter = buildBranchFilter(user, filters.dairy_farm_id, filters.branch_id);

    const qry = `select p.pregnancy_id, c.cattle_id, c.cattle_unique_code, b.branch_name,
        DATE_FORMAT(p.actual_calving_date, '%Y-%m-%d') as actual_calving_date,
        p.calves_born
        from cattle_pregnancy_lst_t p
        join cattle_lst_t c on c.cattle_id = p.cattle_id and c.is_active = 1
        join branches_lst_t b on b.branch_id = c.branch_id
        where p.is_active = 1 and p.actual_calving_date is not null
            and not exists (select 1 from cattle_lst_t calf
                where calf.pregnancy_id = p.pregnancy_id and calf.is_active = 1)
            ${filter.clause}
        order by p.actual_calving_date asc
        limit ${safeLimit(limit, 25)}`;
    return dbutils.executeQuery(qry, filter.params, 'get calf not registered alert model');
}

/**********************************************
* name : getEligibilityDriftAlertMdl
* description : cross-checks that catch the CODE failing to maintain can_produce_milk, rather
*               than anything wrong on the farm. worth having precisely because the flag is a
*               cache: sold animals still flagged milkable, milk recorded against a blocked
*               animal, or an active animal with no ownership row. one pass, three signals.
* input : (user, filters, limit)
************************************************/
exports.getEligibilityDriftAlertMdl = (user, filters = {}, limit = 50) => {
    log('in getEligibilityDriftAlertMdl');
    const filter = buildBranchFilter(user, filters.dairy_farm_id, filters.branch_id);

    // the milk check is an EXISTS restricted to blocked animals, not an aggregate over the
    // whole production table: that turns a full index scan of milk_production_lst_t into one
    // range seek on uq_milk_cattle_date (cattle_id, production_date) per candidate row.
    // the count in the select list runs only for rows that already passed the WHERE.
    const qry = `select c.cattle_id, c.cattle_unique_code, b.branch_name, c.cattle_status,
        c.can_produce_milk, c.milk_block_reason,
        case
            when c.cattle_status <> '${CATTLE_STATUS.ACTIVE}' and c.can_produce_milk = 1 then 'status_says_gone_but_milkable'
            when c.can_produce_milk = 0 and exists (select 1 from milk_production_lst_t mp
                    where mp.cattle_id = c.cattle_id and mp.is_active = 1 and mp.production_date >= ?)
                then 'blocked_but_milk_recorded'
            else 'no_current_ownership'
        end as drift_type,
        (select count(*) from milk_production_lst_t mp2
            where mp2.cattle_id = c.cattle_id and mp2.is_active = 1 and mp2.production_date >= ?) as recent_entry_count
        from cattle_lst_t c
        join branches_lst_t b on b.branch_id = c.branch_id
        where c.is_active = 1${filter.clause}
          and (
            (c.cattle_status <> '${CATTLE_STATUS.ACTIVE}' and c.can_produce_milk = 1)
            or (c.can_produce_milk = 0 and c.milk_block_reason <> '${MILK_BLOCK_REASON.MALE}'
                and exists (select 1 from milk_production_lst_t mp3
                    where mp3.cattle_id = c.cattle_id and mp3.is_active = 1 and mp3.production_date >= ?))
            or not exists (select 1 from cattle_ownership_lst_t o
                where o.cattle_id = c.cattle_id and o.is_active = 1 and o.effective_to is null)
          )
        order by c.cattle_unique_code asc
        limit ${safeLimit(limit, 50)}`;
    return dbutils.executeQuery(qry,
        [filters.since, filters.since, ...filter.params, filters.since],
        'get eligibility drift alert model');
}
