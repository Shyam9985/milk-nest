const dbutils = require('../utils/db.utils');
const dbConfig = require('../config/db.config');
const { log } = require('../utils/log.utils');

/*
 * Queries behind the public website. Nothing here is scoped to a user - there is no user - so
 * two rules keep these safe to expose:
 *   - reads return platform-wide AGGREGATES only (counts and sums), never a row that names a
 *     farm, a branch, an animal or a person
 *   - each query runs on the least privileged pool that can do the job: the viewer pool
 *     (SELECT only) for reads, the operator pool (no DELETE, no DDL) for the enquiry insert
 */

// head counts for the whole platform in one round trip. three counts over small tables / fk
// indexes; the herd count uses the same definition as the dashboard (active record)
exports.getPlatformCountsMdl = () => {
    log('in getPlatformCountsMdl');
    const qry = `select
        (select count(*) from cattle_lst_t c where c.is_active = 1) as active_cattle,
        (select count(*) from dairy_farm_lst_t df where df.is_active = 1) as dairy_farms,
        (select count(*) from branches_lst_t b where b.is_active = 1) as branches`;
    return dbutils.executeQuery(qry, [], 'get public platform counts model', dbConfig.viewerPool);
}

// litres recorded per day across every branch. branches drive the join so each one is a range
// scan on idx_milk_branch_date (branch_id, production_date) - milk has no index that leads with
// the date, so filtering on the date alone would read the whole table
exports.getDailyMilkTotalsMdl = (from_date, to_date) => {
    log('in getDailyMilkTotalsMdl');
    const qry = `select DATE_FORMAT(mp.production_date, '%Y-%m-%d') as production_date,
        ifnull(sum(mp.total_quantity), 0) as total
        from branches_lst_t b
        join milk_production_lst_t mp on mp.branch_id = b.branch_id
        where b.is_active = 1 and mp.is_active = 1 and mp.production_date between ? and ?
        group by mp.production_date
        order by mp.production_date asc`;
    return dbutils.executeQuery(qry, [from_date, to_date], 'get public daily milk totals model', dbConfig.viewerPool);
}

// stores one website enquiry. uq_enquiries_email rejects a second enquiry from the same email
// with ER_DUP_ENTRY - the database decides, so two submissions racing each other cannot both win
exports.insertEnquiryMdl = (data) => {
    log('in insertEnquiryMdl');
    const qry = `insert into enquiries_lst_t (full_name, phone, email, farm_name, message, ip_address, user_agent)
        values (?, ?, ?, ?, ?, ?, ?)`;
    return dbutils.executeQuery(qry,
        [data.full_name, data.phone, data.email, data.farm_name, data.message, data.ip_address, data.user_agent],
        'insert enquiry model', dbConfig.operatorPool);
}
