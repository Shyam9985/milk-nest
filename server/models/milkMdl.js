const dbutils = require('../utils/db.utils');
const scopeutils = require('../utils/scope.utils');
const { log } = require('../utils/log.utils');

/*
 * Milk production queries. One row per cattle per day: morning/evening are columns and
 * total_quantity is a generated column, so a day's total can never drift from its parts.
 * Cattle belong to a branch, so every list is scope filtered through branches_lst_t.
 */

// the day sheet for a branch: every active milking animal there, with its entry for the
// chosen date when one exists. the LEFT JOIN keeps un-milked animals in the list, which is
// what makes this a fill-in register rather than an add-one-at-a-time form.
// males are left out here on purpose: the save path validates submitted cattle against
// this same sheet, so excluding bulls once covers both the screen and the server
exports.getMilkProductionSheetMdl = (branch_id, production_date) => {
    log('in getMilkProductionSheetMdl');
    const qry = `select c.cattle_id, c.cattle_unique_code, t.cattle_type_name, br.breed_name, g.gender_nm,
        mp.milk_production_id, mp.morning_quantity, mp.evening_quantity, mp.total_quantity,
        mp.fat_percentage, mp.snf_percentage, mp.remarks,
        DATE_FORMAT(mp.updated_time, '%d-%m-%Y %H:%i:%s') as updated_at
        from cattle_lst_t c
        join cattle_types_mstr_lst_t t on t.cattle_type_id = c.cattle_type_id
        join cattle_breeds_mstr_lst_t br on br.breed_id = c.breed_id
        left join gender_mstr_lst_t g on g.gender_id = c.gender_id
        left join milk_production_lst_t mp on mp.cattle_id = c.cattle_id
            and mp.production_date = ? and mp.is_active = 1
        where c.is_active = 1 and c.branch_id = ?
            and (g.gender_nm is null or lower(g.gender_nm) <> 'male')
        order by c.cattle_unique_code asc`;
    return dbutils.executeQuery(qry, [production_date, branch_id], 'get milk production sheet model');
}

// recorded entries for a date range, restricted to the user's scope through the branch
exports.getMilkProductionListMdl = (user, from_date, to_date, branch_id = null) => {
    log('in getMilkProductionListMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    let qry = `select mp.milk_production_id, mp.cattle_id, mp.branch_id,
        mp.morning_quantity, mp.evening_quantity, mp.total_quantity,
        mp.fat_percentage, mp.snf_percentage, mp.remarks,
        c.cattle_unique_code, t.cattle_type_name, br.breed_name,
        b.branch_name, df.dairy_farm_name,
        DATE_FORMAT(mp.production_date, '%Y-%m-%d') as production_date,
        DATE_FORMAT(mp.created_time, '%d-%m-%Y %H:%i:%s') as created_at,
        DATE_FORMAT(mp.updated_time, '%d-%m-%Y %H:%i:%s') as updated_at
        from milk_production_lst_t mp
        join branches_lst_t b on b.branch_id = mp.branch_id
        left join dairy_farm_lst_t df on df.dairy_farm_id = b.dairy_farm_id
        join cattle_lst_t c on c.cattle_id = mp.cattle_id
        join cattle_types_mstr_lst_t t on t.cattle_type_id = c.cattle_type_id
        join cattle_breeds_mstr_lst_t br on br.breed_id = c.breed_id
        where mp.is_active = 1 and mp.production_date between ? and ?${scope.clause}`;
    const params = [from_date, to_date, ...scope.params];

    if (branch_id) {
        qry += ' and mp.branch_id = ?';
        params.push(branch_id);
    }

    qry += ' order by mp.production_date desc, c.cattle_unique_code asc';
    return dbutils.executeQuery(qry, params, 'get milk production list model');
}

// daily totals for the same range, for the summary strip above the grid
exports.getMilkProductionSummaryMdl = (user, from_date, to_date, branch_id = null) => {
    log('in getMilkProductionSummaryMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    let qry = `select DATE_FORMAT(mp.production_date, '%Y-%m-%d') as production_date,
        count(*) as entries,
        sum(ifnull(mp.morning_quantity, 0)) as morning_total,
        sum(ifnull(mp.evening_quantity, 0)) as evening_total,
        sum(mp.total_quantity) as day_total
        from milk_production_lst_t mp
        join branches_lst_t b on b.branch_id = mp.branch_id
        where mp.is_active = 1 and mp.production_date between ? and ?${scope.clause}`;
    const params = [from_date, to_date, ...scope.params];

    if (branch_id) {
        qry += ' and mp.branch_id = ?';
        params.push(branch_id);
    }

    qry += ' group by mp.production_date order by mp.production_date desc';
    return dbutils.executeQuery(qry, params, 'get milk production summary model');
}

// fetches the active branch a sheet is being recorded against
exports.getActiveBranchByIdMdl = (branch_id) => {
    log('in getActiveBranchByIdMdl');
    const qry = 'select branch_id, branch_name, branch_code, dairy_farm_id from branches_lst_t where is_active = 1 and branch_id = ?';
    return dbutils.executeQuery(qry, [branch_id], 'get active branch by id model');
}

// saves one day sheet in a single transaction: rows carrying a value are inserted or
// updated, rows the user cleared are soft deleted. the unique key on
// (cattle_id, production_date) is what makes the upsert safe against double submission
exports.saveMilkProductionSheetMdl = (branch_id, production_date, entries, user_id) => {
    log('in saveMilkProductionSheetMdl');

    return dbutils.executeTransaction(async (connection) => {
        let inserted = 0, updated = 0, removed = 0;

        for (const entry of entries) {
            if (entry.isEmpty) {
                // nothing recorded for this animal - clear any existing entry for the day
                const [result] = await connection.execute(
                    `update milk_production_lst_t set is_active = 0, deleted_by = ?, deleted_time = current_timestamp
                        where is_active = 1 and cattle_id = ? and production_date = ?`,
                    [user_id, entry.cattle_id, production_date]
                );
                removed += result.affectedRows;
                continue;
            }

            // one statement handles the first save and every later correction, and revives
            // a row that was cleared earlier the same day
            const [result] = await connection.execute(
                `insert into milk_production_lst_t
                    (branch_id, cattle_id, production_date, morning_quantity, evening_quantity,
                     fat_percentage, snf_percentage, remarks, recorded_by)
                 values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                 on duplicate key update
                    branch_id = values(branch_id),
                    morning_quantity = values(morning_quantity),
                    evening_quantity = values(evening_quantity),
                    fat_percentage = values(fat_percentage),
                    snf_percentage = values(snf_percentage),
                    remarks = values(remarks),
                    updated_by = values(recorded_by),
                    is_active = 1, deleted_by = null, deleted_time = null`,
                [branch_id, entry.cattle_id, production_date, entry.morning_quantity, entry.evening_quantity,
                    entry.fat_percentage, entry.snf_percentage, entry.remarks, user_id]
            );

            // mysql reports 1 affected row for an insert and 2 for an update on this path
            if (result.affectedRows === 1) inserted++; else updated++;
        }

        return { inserted, updated, removed };
    }, 'save milk production sheet model');
}

// fetches one active entry, used before deleting a single record
exports.getActiveMilkProductionByIdMdl = (milk_production_id) => {
    log('in getActiveMilkProductionByIdMdl');
    const qry = `select mp.milk_production_id, mp.cattle_id, mp.branch_id, c.cattle_unique_code,
        DATE_FORMAT(mp.production_date, '%Y-%m-%d') as production_date
        from milk_production_lst_t mp
        join cattle_lst_t c on c.cattle_id = mp.cattle_id
        where mp.is_active = 1 and mp.milk_production_id = ?`;
    return dbutils.executeQuery(qry, [milk_production_id], 'get active milk production by id model');
}

// soft deletes a single entry
exports.softDeleteMilkProductionMdl = (milk_production_id, user_id) => {
    log('in softDeleteMilkProductionMdl');
    const qry = `update milk_production_lst_t set is_active = 0, deleted_by = ?, deleted_time = current_timestamp
        where is_active = 1 and milk_production_id = ?`;
    return dbutils.executeQuery(qry, [user_id, milk_production_id], 'soft delete milk production model');
}
