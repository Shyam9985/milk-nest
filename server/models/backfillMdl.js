const dbutils = require('../utils/db.utils');
const scopeutils = require('../utils/scope.utils');
const { log } = require('../utils/log.utils');

/*
 * Reads for the data backfill screen.
 *
 * There is deliberately no write model here. Backfilled days are written through
 * milkMdl.saveMilkProductionSheetMdl - the same statement the day sheet uses - so a row created by
 * the backfill and a row typed by the incharge can never be built differently.
 */

/**********************************************
* name : getBackfillHerdMdl
* description : the animals a backfill would write for, with everything the yield model needs and
*               the branch incharge (falling back to the manager) as the recorder.
*
*               It reads can_produce_milk, which is TODAY's state. For recent gaps that is right;
*               for a range months back it is an approximation, because a cow dried off this week
*               was milking then. The screen says so rather than pretending otherwise.
* input : (user, { dairy_farm_id, branch_id })
************************************************/
exports.getBackfillHerdMdl = (user, filters = {}) => {
    log('in getBackfillHerdMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    let qry = `select c.cattle_id, c.branch_id, c.cattle_unique_code,
        t.cattle_type_name, br.breed_name, b.branch_name,
        coalesce(
            (select p.user_id from position_lst_t p
                where p.location_ref_id = c.branch_id and p.role_id = 14 and p.is_active = 1 limit 1),
            (select p.user_id from position_lst_t p
                where p.location_ref_id = c.branch_id and p.role_id = 13 and p.is_active = 1 limit 1)
        ) as recorder_id
        from cattle_lst_t c
        join branches_lst_t b on b.branch_id = c.branch_id and b.is_active = 1
        join cattle_types_mstr_lst_t t on t.cattle_type_id = c.cattle_type_id
        join cattle_breeds_mstr_lst_t br on br.breed_id = c.breed_id
        where c.is_active = 1 and c.can_produce_milk = 1${scope.clause}`;
    const params = [...scope.params];

    if (filters.dairy_farm_id) { qry += ' and b.dairy_farm_id = ?'; params.push(filters.dairy_farm_id); }
    if (filters.branch_id) { qry += ' and c.branch_id = ?'; params.push(filters.branch_id); }

    qry += ' order by c.branch_id, c.cattle_unique_code';
    return dbutils.executeQuery(qry, params, 'get backfill herd model');
}

/**********************************************
* name : getExistingCountsByDateMdl
* description : how many live entries each date in the range already has, within the chosen scope.
*               this is what lets the preview say "this day already has 47 rows" before anything
*               is written, so overwriting is never a surprise.
*               one grouped query over idx_milk_branch_date, not a count per day.
* input : (user, { dairy_farm_id, branch_id }, from_date, to_date)
************************************************/
exports.getExistingCountsByDateMdl = (user, filters = {}, from_date, to_date) => {
    log('in getExistingCountsByDateMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    let qry = `select DATE_FORMAT(mp.production_date, '%Y-%m-%d') as production_date,
        count(*) as entries
        from milk_production_lst_t mp
        join branches_lst_t b on b.branch_id = mp.branch_id
        where mp.is_active = 1 and mp.production_date between ? and ?${scope.clause}`;
    const params = [from_date, to_date, ...scope.params];

    if (filters.dairy_farm_id) { qry += ' and b.dairy_farm_id = ?'; params.push(filters.dairy_farm_id); }
    if (filters.branch_id) { qry += ' and mp.branch_id = ?'; params.push(filters.branch_id); }

    qry += ' group by mp.production_date order by mp.production_date';
    return dbutils.executeQuery(qry, params, 'get existing counts by date model');
}
