const dbutils = require('../utils/db.utils');
const scopeutils = require('../utils/scope.utils');
const { log } = require('../utils/log.utils');

/*
 * Dashboard aggregates. Design rules that keep every request cheap regardless of data size:
 *   - aggregation happens in SQL (SUM / COUNT / GROUP BY), never by looping rows in node
 *   - every milk query is a range scan on idx_milk_branch_date (branch_id, production_date):
 *     the branch join supplies branch_id, the date range bounds production_date
 *   - the user's scope AND the screen filters are one shared WHERE fragment, so a filter
 *     outside the user's jurisdiction intersects to zero rows instead of needing validation
 *   - no per-row queries: anything "per branch" or "per animal" is a single GROUP BY
 */

// scope (from the signed JWT) narrowed by the optional screen filters. every query below
// joins branches_lst_t as `b`, which carries the whole location spine, so one fragment
// serves every hierarchy level
const buildBranchFilter = (user, dairy_farm_id = null, branch_id = null) => {
    const scope = scopeutils.getScopeFilter(user, 'b');
    let clause = scope.clause;
    const params = [...scope.params];

    if (dairy_farm_id) { clause += ' and b.dairy_farm_id = ?'; params.push(dairy_farm_id); }
    if (branch_id) { clause += ' and b.branch_id = ?'; params.push(branch_id); }

    return { clause, params };
};

// LIMIT values are internal constants, never request input. they are inlined because a
// prepared statement cannot bind LIMIT on MySQL 8 ("incorrect arguments to mysqld_stmt_execute")
const safeLimit = (limit, fallback) => (Number.isInteger(limit) && limit > 0 ? limit : fallback);

// totals for one date range in a single pass. called for the current period, the previous
// period and today, in parallel - three small range scans beat one query with eight CASEs
exports.getPeriodStatsMdl = (user, from_date, to_date, filters = {}) => {
    log('in getPeriodStatsMdl');
    const filter = buildBranchFilter(user, filters.dairy_farm_id, filters.branch_id);

    const qry = `select
        ifnull(sum(mp.morning_quantity), 0) as morning_total,
        ifnull(sum(mp.evening_quantity), 0) as evening_total,
        ifnull(sum(mp.total_quantity), 0) as total,
        count(*) as entries,
        count(distinct mp.cattle_id) as milked_cattle,
        count(distinct mp.production_date) as recorded_days,
        avg(mp.fat_percentage) as avg_fat,
        avg(mp.snf_percentage) as avg_snf
        from milk_production_lst_t mp
        join branches_lst_t b on b.branch_id = mp.branch_id
        where mp.is_active = 1 and mp.production_date between ? and ?${filter.clause}`;
    return dbutils.executeQuery(qry, [from_date, to_date, ...filter.params], 'get dashboard period stats model');
}

// one row per day across the current AND previous period (the service splits them), so the
// production trend, its comparison line and the quality trend all come from one scan
exports.getDailyTrendMdl = (user, from_date, to_date, filters = {}) => {
    log('in getDailyTrendMdl');
    const filter = buildBranchFilter(user, filters.dairy_farm_id, filters.branch_id);

    const qry = `select DATE_FORMAT(mp.production_date, '%Y-%m-%d') as production_date,
        ifnull(sum(mp.morning_quantity), 0) as morning,
        ifnull(sum(mp.evening_quantity), 0) as evening,
        ifnull(sum(mp.total_quantity), 0) as total,
        count(distinct mp.cattle_id) as cattle,
        avg(mp.fat_percentage) as avg_fat,
        avg(mp.snf_percentage) as avg_snf,
        count(mp.fat_percentage) as fat_readings
        from milk_production_lst_t mp
        join branches_lst_t b on b.branch_id = mp.branch_id
        where mp.is_active = 1 and mp.production_date between ? and ?${filter.clause}
        group by mp.production_date
        order by mp.production_date asc`;
    return dbutils.executeQuery(qry, [from_date, to_date, ...filter.params], 'get dashboard daily trend model');
}

// herd size plus how many records are missing basic details. one count over the fk index
exports.getHerdStatsMdl = (user, filters = {}) => {
    log('in getHerdStatsMdl');
    const filter = buildBranchFilter(user, filters.dairy_farm_id, filters.branch_id);

    const qry = `select count(*) as total,
        ifnull(sum(c.gender_id is null or c.date_of_birth is null or c.weight is null), 0) as incomplete
        from cattle_lst_t c
        join branches_lst_t b on b.branch_id = c.branch_id
        where c.is_active = 1${filter.clause}`;
    return dbutils.executeQuery(qry, filter.params, 'get dashboard herd stats model');
}

// herd grouped by type and breed together; the service rolls it up into both donuts, so the
// two charts cost one scan instead of two
exports.getHerdCompositionMdl = (user, filters = {}) => {
    log('in getHerdCompositionMdl');
    const filter = buildBranchFilter(user, filters.dairy_farm_id, filters.branch_id);

    const qry = `select t.cattle_type_name, br.breed_name, count(*) as cattle_count
        from cattle_lst_t c
        join branches_lst_t b on b.branch_id = c.branch_id
        join cattle_types_mstr_lst_t t on t.cattle_type_id = c.cattle_type_id
        join cattle_breeds_mstr_lst_t br on br.breed_id = c.breed_id
        where c.is_active = 1${filter.clause}
        group by t.cattle_type_name, br.breed_name
        order by cattle_count desc, t.cattle_type_name asc, br.breed_name asc`;
    return dbutils.executeQuery(qry, filter.params, 'get dashboard herd composition model');
}

// every branch in scope with its period totals, herd size and last recorded day. branches
// drive the query (LEFT JOIN) so silent branches still appear with zeros - that is exactly
// what the attention panel needs. the two correlated subqueries run once per branch and are
// index-only lookups (fk_cattle_branch, idx_milk_branch_date descending max)
exports.getBranchSummaryMdl = (user, from_date, to_date, filters = {}) => {
    log('in getBranchSummaryMdl');
    const filter = buildBranchFilter(user, filters.dairy_farm_id, filters.branch_id);

    const qry = `select b.branch_id, b.branch_name, b.branch_code, b.is_main_branch,
        b.dairy_farm_id, df.dairy_farm_name,
        (select count(*) from cattle_lst_t c where c.is_active = 1 and c.branch_id = b.branch_id) as cattle_count,
        ifnull(sum(mp.total_quantity), 0) as total,
        ifnull(sum(mp.morning_quantity), 0) as morning,
        ifnull(sum(mp.evening_quantity), 0) as evening,
        count(distinct mp.cattle_id) as milked_cattle,
        count(distinct mp.production_date) as recorded_days,
        (select DATE_FORMAT(max(x.production_date), '%Y-%m-%d') from milk_production_lst_t x
            where x.is_active = 1 and x.branch_id = b.branch_id) as last_entry
        from branches_lst_t b
        left join dairy_farm_lst_t df on df.dairy_farm_id = b.dairy_farm_id
        left join milk_production_lst_t mp on mp.branch_id = b.branch_id
            and mp.is_active = 1 and mp.production_date between ? and ?
        where b.is_active = 1${filter.clause}
        group by b.branch_id, b.branch_name, b.branch_code, b.is_main_branch, b.dairy_farm_id, df.dairy_farm_name
        order by total desc, b.branch_name asc`;
    return dbutils.executeQuery(qry, [from_date, to_date, ...filter.params], 'get dashboard branch summary model');
}

// period yield per cattle type - what buffaloes vs cows gave, and per animal-day. one
// GROUP BY over the same index range as the period stats
exports.getProductionByTypeMdl = (user, from_date, to_date, filters = {}) => {
    log('in getProductionByTypeMdl');
    const filter = buildBranchFilter(user, filters.dairy_farm_id, filters.branch_id);

    const qry = `select t.cattle_type_id, t.cattle_type_name,
        ifnull(sum(mp.total_quantity), 0) as total,
        ifnull(sum(mp.morning_quantity), 0) as morning,
        ifnull(sum(mp.evening_quantity), 0) as evening,
        count(*) as entries,
        count(distinct mp.cattle_id) as milked_cattle,
        round(avg(mp.fat_percentage), 2) as avg_fat,
        round(avg(mp.snf_percentage), 2) as avg_snf
        from milk_production_lst_t mp
        join branches_lst_t b on b.branch_id = mp.branch_id
        join cattle_lst_t c on c.cattle_id = mp.cattle_id
        join cattle_types_mstr_lst_t t on t.cattle_type_id = c.cattle_type_id
        where mp.is_active = 1 and mp.production_date between ? and ?${filter.clause}
        group by t.cattle_type_id, t.cattle_type_name
        order by total desc, t.cattle_type_name asc`;
    return dbutils.executeQuery(qry, [from_date, to_date, ...filter.params], 'get dashboard production by type model');
}

// the best animals of the period. GROUP BY cattle then LIMIT - the sort is over a handful
// of aggregated rows, not over raw entries
exports.getTopProducersMdl = (user, from_date, to_date, filters = {}, limit = 5) => {
    log('in getTopProducersMdl');
    const filter = buildBranchFilter(user, filters.dairy_farm_id, filters.branch_id);

    const qry = `select c.cattle_id, c.cattle_unique_code, t.cattle_type_name, br.breed_name, b.branch_name,
        ifnull(sum(mp.total_quantity), 0) as total,
        count(distinct mp.production_date) as days,
        round(sum(mp.total_quantity) / count(distinct mp.production_date), 2) as avg_per_day,
        round(avg(mp.fat_percentage), 2) as avg_fat
        from milk_production_lst_t mp
        join branches_lst_t b on b.branch_id = mp.branch_id
        join cattle_lst_t c on c.cattle_id = mp.cattle_id
        join cattle_types_mstr_lst_t t on t.cattle_type_id = c.cattle_type_id
        join cattle_breeds_mstr_lst_t br on br.breed_id = c.breed_id
        where mp.is_active = 1 and mp.production_date between ? and ?${filter.clause}
        group by c.cattle_id, c.cattle_unique_code, t.cattle_type_name, br.breed_name, b.branch_name
        order by total desc, c.cattle_unique_code asc
        limit ${safeLimit(limit, 5)}`;
    return dbutils.executeQuery(qry, [from_date, to_date, ...filter.params], 'get dashboard top producers model');
}

// animals that were milked during the period but have no entry for today. GROUP BY + HAVING
// on max(date) answers it in one pass, no NOT EXISTS per animal
exports.getCattleNotMilkedTodayMdl = (user, from_date, to_date, today, filters = {}, limit = 20) => {
    log('in getCattleNotMilkedTodayMdl');
    const filter = buildBranchFilter(user, filters.dairy_farm_id, filters.branch_id);

    const qry = `select c.cattle_id, c.cattle_unique_code, b.branch_name,
        DATE_FORMAT(max(mp.production_date), '%Y-%m-%d') as last_entry,
        datediff(?, max(mp.production_date)) as days_since
        from milk_production_lst_t mp
        join branches_lst_t b on b.branch_id = mp.branch_id
        join cattle_lst_t c on c.cattle_id = mp.cattle_id and c.is_active = 1
        where mp.is_active = 1 and mp.production_date between ? and ?${filter.clause}
        group by c.cattle_id, c.cattle_unique_code, b.branch_name
        having max(mp.production_date) < ?
        order by days_since desc, c.cattle_unique_code asc
        limit ${safeLimit(limit, 20)}`;
    return dbutils.executeQuery(qry, [today, from_date, to_date, ...filter.params, today], 'get dashboard cattle not milked today model');
}

// dropdown feeds for the scope bar. lean on purpose - the settings feeds carry addresses and
// audit columns the dashboard never shows. a farm is listed when it has a branch in scope
exports.getScopedDairyFarmsMdl = (user) => {
    log('in getScopedDairyFarmsMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    const qry = `select distinct df.dairy_farm_id, df.dairy_farm_name, df.dairy_farm_code
        from dairy_farm_lst_t df
        join branches_lst_t b on b.dairy_farm_id = df.dairy_farm_id and b.is_active = 1
        where df.is_active = 1${scope.clause}
        order by df.dairy_farm_name asc`;
    return dbutils.executeQuery(qry, scope.params, 'get dashboard dairy farms model');
}

exports.getScopedBranchesMdl = (user) => {
    log('in getScopedBranchesMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    const qry = `select b.branch_id, b.branch_name, b.branch_code, b.is_main_branch, b.dairy_farm_id
        from branches_lst_t b
        where b.is_active = 1${scope.clause}
        order by b.dairy_farm_id asc, b.is_main_branch desc, b.branch_name asc`;
    return dbutils.executeQuery(qry, scope.params, 'get dashboard branches model');
}
