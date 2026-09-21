const dbutils = require('../utils/db.utils');
const scopeutils = require('../utils/scope.utils');
const { log } = require('../utils/log.utils');

/*
 * Read-only "profile" views: the complete picture of one dairy farm, branch or animal.
 * Every query is fenced by the user's data scope through branches_lst_t, so an id from
 * outside the caller's jurisdiction simply returns no row - the same fail-closed rule the
 * dashboard and registers follow. New profile types add a model here and a matching
 * service entry; nothing else needs to change.
 */

/* ---------------- dairy farm ---------------- */

// the farm row with its location taken from the main branch, plus herd and branch counts
exports.getDairyFarmProfileMdl = (user, dairy_farm_id) => {
    log('in getDairyFarmProfileMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    const qry = `select df.dairy_farm_id, df.dairy_farm_code, df.dairy_farm_name, df.contact_number, df.email, df.address,
        df.is_active,
        DATE_FORMAT(df.created_time, '%d-%m-%Y %H:%i:%s') as created_at,
        DATE_FORMAT(df.updated_time, '%d-%m-%Y %H:%i:%s') as updated_at,
        (select count(*) from branches_lst_t x where x.dairy_farm_id = df.dairy_farm_id and x.is_active = 1) as branch_count,
        (select count(*) from cattle_lst_t c join branches_lst_t x on x.branch_id = c.branch_id
            where x.dairy_farm_id = df.dairy_farm_id and c.is_active = 1 and x.is_active = 1) as cattle_count,
        (select concat_ws(' ', u.first_nm, u.last_nm) from position_lst_t p join users_lst_t u on u.user_id = p.user_id
            where p.dairy_farm_id = df.dairy_farm_id and p.role_id = 12 and p.is_active = 1 and p.end_date >= curdate() limit 1) as director_name,
        s.state_name, d.district_name, m.mandal_ulb_nm, v.village_sachivalayam_nm
        from dairy_farm_lst_t df
        join branches_lst_t b on b.dairy_farm_id = df.dairy_farm_id and b.is_main_branch = 1
        left join state_mstr_lst_t s on s.state_id = b.state_id
        left join district_mstr_lst_t d on d.district_id = b.district_id
        left join mandal_ulb_mstr_lst_t m on m.mandal_ulb_id = b.mandal_ulb_id
        left join village_sachivalayam_mst_lst_t v on v.village_sachivalayam_id = b.village_sachivalayam_id
        where df.is_active = 1 and df.dairy_farm_id = ?
            and exists (select 1 from branches_lst_t b2 where b2.dairy_farm_id = df.dairy_farm_id and b2.is_active = 1${scope.clause.replace(/\bb\./g, 'b2.')})
        limit 1`;
    return dbutils.executeQuery(qry, [dairy_farm_id, ...scope.params], 'get dairy farm profile model');
}

// the farm's branches with a herd count each, for the profile's branch list
exports.getDairyFarmBranchesMdl = (user, dairy_farm_id) => {
    log('in getDairyFarmBranchesMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    const qry = `select b.branch_id, b.branch_code, b.branch_name, b.is_main_branch, b.contact_number,
        v.village_sachivalayam_nm, m.mandal_ulb_nm, d.district_name,
        (select count(*) from cattle_lst_t c where c.branch_id = b.branch_id and c.is_active = 1) as cattle_count
        from branches_lst_t b
        left join village_sachivalayam_mst_lst_t v on v.village_sachivalayam_id = b.village_sachivalayam_id
        left join mandal_ulb_mstr_lst_t m on m.mandal_ulb_id = b.mandal_ulb_id
        left join district_mstr_lst_t d on d.district_id = b.district_id
        where b.is_active = 1 and b.dairy_farm_id = ?${scope.clause}
        order by b.is_main_branch desc, b.branch_name asc`;
    return dbutils.executeQuery(qry, [dairy_farm_id, ...scope.params], 'get dairy farm branches model');
}

/* ---------------- branch ---------------- */

// one branch with its full location spine, staff, herd count and last recorded day
exports.getBranchProfileMdl = (user, branch_id) => {
    log('in getBranchProfileMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    const qry = `select b.branch_id, b.branch_code, b.branch_name, b.is_main_branch, b.contact_number, b.email, b.address, b.is_active,
        b.dairy_farm_id, df.dairy_farm_name, df.dairy_farm_code,
        s.state_name, d.district_name, m.mandal_ulb_nm, v.village_sachivalayam_nm,
        DATE_FORMAT(b.created_time, '%d-%m-%Y %H:%i:%s') as created_at,
        DATE_FORMAT(b.updated_time, '%d-%m-%Y %H:%i:%s') as updated_at,
        (select count(*) from cattle_lst_t c where c.branch_id = b.branch_id and c.is_active = 1) as cattle_count,
        (select count(*) from cattle_lst_t c left join gender_mstr_lst_t g on g.gender_id = c.gender_id
            where c.branch_id = b.branch_id and c.is_active = 1 and (g.gender_nm is null or lower(g.gender_nm) <> 'male')) as milking_count,
        (select DATE_FORMAT(max(mp.production_date), '%d-%m-%Y') from milk_production_lst_t mp
            where mp.branch_id = b.branch_id and mp.is_active = 1) as last_entry,
        (select concat_ws(' ', u.first_nm, u.last_nm) from position_lst_t p join users_lst_t u on u.user_id = p.user_id
            where p.location_ref_id = b.branch_id and p.role_id = 13 and p.is_active = 1 and p.end_date >= curdate() limit 1) as manager_name,
        (select concat_ws(' ', u.first_nm, u.last_nm) from position_lst_t p join users_lst_t u on u.user_id = p.user_id
            where p.location_ref_id = b.branch_id and p.role_id = 14 and p.is_active = 1 and p.end_date >= curdate() limit 1) as incharge_name
        from branches_lst_t b
        left join dairy_farm_lst_t df on df.dairy_farm_id = b.dairy_farm_id
        left join state_mstr_lst_t s on s.state_id = b.state_id
        left join district_mstr_lst_t d on d.district_id = b.district_id
        left join mandal_ulb_mstr_lst_t m on m.mandal_ulb_id = b.mandal_ulb_id
        left join village_sachivalayam_mst_lst_t v on v.village_sachivalayam_id = b.village_sachivalayam_id
        where b.is_active = 1 and b.branch_id = ?${scope.clause}
        limit 1`;
    return dbutils.executeQuery(qry, [branch_id, ...scope.params], 'get branch profile model');
}

// the branch herd, for the profile's cattle list
exports.getBranchCattleMdl = (user, branch_id) => {
    log('in getBranchCattleMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    const qry = `select c.cattle_id, c.cattle_unique_code, t.cattle_type_name, br.breed_name, g.gender_nm, c.health_status
        from cattle_lst_t c
        join branches_lst_t b on b.branch_id = c.branch_id
        join cattle_types_mstr_lst_t t on t.cattle_type_id = c.cattle_type_id
        join cattle_breeds_mstr_lst_t br on br.breed_id = c.breed_id
        left join gender_mstr_lst_t g on g.gender_id = c.gender_id
        where c.is_active = 1 and c.branch_id = ?${scope.clause}
        order by c.cattle_unique_code asc`;
    return dbutils.executeQuery(qry, [branch_id, ...scope.params], 'get branch cattle model');
}

/* ---------------- cattle ---------------- */

// one animal with its masters resolved, its branch and farm, and lifetime production totals
exports.getCattleProfileMdl = (user, cattle_id) => {
    log('in getCattleProfileMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    const qry = `select c.cattle_id, c.cattle_unique_code, c.weight, c.color, c.purchase_cost, c.health_status, c.remarks, c.is_active,
        t.cattle_type_name, br.breed_name, g.gender_nm,
        b.branch_id, b.branch_name, b.branch_code, b.dairy_farm_id, df.dairy_farm_name, df.dairy_farm_code,
        DATE_FORMAT(c.date_of_birth, '%d-%m-%Y') as date_of_birth,
        TIMESTAMPDIFF(MONTH, c.date_of_birth, curdate()) as age_months,
        DATE_FORMAT(c.purchase_date, '%d-%m-%Y') as purchase_date,
        DATE_FORMAT(c.created_time, '%d-%m-%Y %H:%i:%s') as created_at,
        DATE_FORMAT(c.updated_time, '%d-%m-%Y %H:%i:%s') as updated_at,
        (select count(*) from milk_production_lst_t mp where mp.cattle_id = c.cattle_id and mp.is_active = 1) as recorded_days,
        (select round(sum(mp.total_quantity), 2) from milk_production_lst_t mp where mp.cattle_id = c.cattle_id and mp.is_active = 1) as total_litres,
        (select round(avg(mp.total_quantity), 2) from milk_production_lst_t mp where mp.cattle_id = c.cattle_id and mp.is_active = 1) as avg_litres_per_day,
        (select round(avg(mp.fat_percentage), 2) from milk_production_lst_t mp where mp.cattle_id = c.cattle_id and mp.is_active = 1) as avg_fat,
        (select round(avg(mp.snf_percentage), 2) from milk_production_lst_t mp where mp.cattle_id = c.cattle_id and mp.is_active = 1) as avg_snf,
        (select DATE_FORMAT(max(mp.production_date), '%d-%m-%Y') from milk_production_lst_t mp where mp.cattle_id = c.cattle_id and mp.is_active = 1) as last_entry
        from cattle_lst_t c
        join branches_lst_t b on b.branch_id = c.branch_id
        left join dairy_farm_lst_t df on df.dairy_farm_id = b.dairy_farm_id
        join cattle_types_mstr_lst_t t on t.cattle_type_id = c.cattle_type_id
        join cattle_breeds_mstr_lst_t br on br.breed_id = c.breed_id
        left join gender_mstr_lst_t g on g.gender_id = c.gender_id
        where c.is_active = 1 and c.cattle_id = ?${scope.clause}
        limit 1`;
    return dbutils.executeQuery(qry, [cattle_id, ...scope.params], 'get cattle profile model');
}

// the animal's recent production entries, newest first - enough for the profile grid to page
exports.getCattleRecentProductionMdl = (user, cattle_id, limit = 90) => {
    log('in getCattleRecentProductionMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    const qry = `select DATE_FORMAT(mp.production_date, '%d-%m-%Y') as production_date,
        mp.morning_quantity, mp.evening_quantity, mp.total_quantity, mp.fat_percentage, mp.snf_percentage, mp.remarks
        from milk_production_lst_t mp
        join branches_lst_t b on b.branch_id = mp.branch_id
        where mp.is_active = 1 and mp.cattle_id = ?${scope.clause}
        order by mp.production_date desc
        limit ${Number(limit) || 90}`;
    return dbutils.executeQuery(qry, [cattle_id, ...scope.params], 'get cattle recent production model');
}
