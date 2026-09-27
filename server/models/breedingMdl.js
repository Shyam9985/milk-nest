const dbutils = require('../utils/db.utils');
const scopeutils = require('../utils/scope.utils');
const { log } = require('../utils/log.utils');
const { milkEligibilityStep } = require('./cattleEligibilityMdl');

/*
 * Pregnancy queries. A cattle has many pregnancies over her life, so this is a history table,
 * never columns on cattle_lst_t.
 *
 * Transactions are owned HERE, not by the service, and the db util is chosen by the SHAPE of the
 * work - nothing accepts a connection as an argument:
 *
 *   executeQuery              one statement. nothing to open, nothing to roll back.
 *   executeTransactionQueries a FIXED list of statements. everything below except the calving,
 *                             because the eligibility sync needs nothing back from the write in
 *                             front of it, so the whole list is known before any of it runs.
 *   executeTransaction        only where a statement needs an earlier one's RESULT. that is the
 *                             calving alone: each calf's insertId feeds its ownership row and its
 *                             eligibility, so those steps cannot be listed up front.
 *
 * Two rules follow, and both matter:
 *
 *  1. Nothing inside a transaction throws a business error - it would come back out rebranded as a
 *     generic DatabaseError. A zero affectedRows is returned instead, for the service to turn into
 *     a message.
 *
 *  2. Milk eligibility is applied by appending the shared statement from cattleEligibilityMdl to
 *     the same list, so "she is dry" and "she is off the milking sheet" commit together.
 *
 * Performance notes: the list is one query with joins, not a query per pregnancy; the expected
 * dates are STORED, computed once at insert from the breed's rule, so every alert compares bare
 * date columns rather than arithmetic wrapped around them.
 */

const safeLimit = (limit, fallback) => (Number.isInteger(limit) && limit > 0 ? limit : fallback);

/* ------------------------------ reads ------------------------------ */

/**********************************************
* name : getPregnancyListMdl
* description : pregnancies in the caller's scope with everything the screen shows, including
*               the registered calf count. one query; the calf count is a correlated lookup on
*               idx_cattle_pregnancy, executed only for returned rows.
* input : (user, { status, branch_id, dairy_farm_id }, limit)
************************************************/
exports.getPregnancyListMdl = (user, filters = {}, limit = 200) => {
    log('in getPregnancyListMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    let qry = `select p.pregnancy_id, p.cattle_id, p.pregnancy_status, p.calves_born, p.remarks,
        c.cattle_unique_code, c.can_produce_milk, c.milk_block_reason,
        b.branch_id, b.branch_name, df.dairy_farm_id, df.dairy_farm_name,
        t.cattle_type_name, br.breed_name,
        DATE_FORMAT(p.conception_date, '%Y-%m-%d') as conception_date,
        DATE_FORMAT(p.expected_dry_off_date, '%Y-%m-%d') as expected_dry_off_date,
        DATE_FORMAT(p.expected_calving_date, '%Y-%m-%d') as expected_calving_date,
        DATE_FORMAT(p.actual_dry_off_date, '%Y-%m-%d') as actual_dry_off_date,
        DATE_FORMAT(p.actual_calving_date, '%Y-%m-%d') as actual_calving_date,
        datediff(curdate(), p.conception_date) as days_pregnant,
        (select count(*) from cattle_lst_t calf
            where calf.pregnancy_id = p.pregnancy_id and calf.is_active = 1) as calves_registered
        from cattle_pregnancy_lst_t p
        join cattle_lst_t c on c.cattle_id = p.cattle_id
        join branches_lst_t b on b.branch_id = c.branch_id
        left join dairy_farm_lst_t df on df.dairy_farm_id = b.dairy_farm_id
        left join cattle_types_mstr_lst_t t on t.cattle_type_id = c.cattle_type_id
        left join cattle_breeds_mstr_lst_t br on br.breed_id = c.breed_id
        where p.is_active = 1${scope.clause}`;
    const params = [...scope.params];

    if (filters.status) { qry += ' and p.pregnancy_status = ?'; params.push(filters.status); }
    if (filters.dairy_farm_id) { qry += ' and b.dairy_farm_id = ?'; params.push(filters.dairy_farm_id); }
    if (filters.branch_id) { qry += ' and b.branch_id = ?'; params.push(filters.branch_id); }
    if (filters.cattle_id) { qry += ' and p.cattle_id = ?'; params.push(filters.cattle_id); }

    // active ones first, then by how far along they are
    qry += ` order by field(p.pregnancy_status, 'active', 'completed', 'aborted'),
        p.expected_calving_date asc, c.cattle_unique_code asc
        limit ${safeLimit(limit, 200)}`;
    return dbutils.executeQuery(qry, params, 'get pregnancy list model');
}

/**********************************************
* name : getPregnancyByIdMdl
* description : one pregnancy with the mother's branch, type and breed - everything the calving
*               and dry-off paths need to validate and to inherit onto a calf.
************************************************/
exports.getPregnancyByIdMdl = (pregnancy_id) => {
    log('in getPregnancyByIdMdl');
    const qry = `select p.pregnancy_id, p.cattle_id, p.pregnancy_status, p.calves_born,
        DATE_FORMAT(p.conception_date, '%Y-%m-%d') as conception_date,
        DATE_FORMAT(p.actual_dry_off_date, '%Y-%m-%d') as actual_dry_off_date,
        DATE_FORMAT(p.actual_calving_date, '%Y-%m-%d') as actual_calving_date,
        c.cattle_unique_code, c.branch_id, c.cattle_type_id, c.breed_id, c.is_active as cattle_is_active,
        b.branch_code
        from cattle_pregnancy_lst_t p
        join cattle_lst_t c on c.cattle_id = p.cattle_id
        join branches_lst_t b on b.branch_id = c.branch_id
        where p.is_active = 1 and p.pregnancy_id = ?`;
    return dbutils.executeQuery(qry, [pregnancy_id], 'get pregnancy by id model');
}

/**********************************************
* name : getActivePregnancyByCattleMdl
* description : a cattle may have only one pregnancy in flight; this is the guard's lookup.
************************************************/
exports.getActivePregnancyByCattleMdl = (cattle_id) => {
    log('in getActivePregnancyByCattleMdl');
    const qry = `select pregnancy_id, DATE_FORMAT(conception_date, '%Y-%m-%d') as conception_date
        from cattle_pregnancy_lst_t
        where is_active = 1 and pregnancy_status = 'active' and cattle_id = ?`;
    return dbutils.executeQuery(qry, [cattle_id], 'get active pregnancy by cattle model');
}

/**********************************************
* name : getBreedingRulesMdl
* description : the gestation and dry-off rule for one animal, breed value winning over the
*               type's. this is what makes the rules data rather than constants in code, and
*               why buffalo (~310 days) and cow (~283) get different expected calving dates.
************************************************/
exports.getBreedingRulesMdl = (cattle_id) => {
    log('in getBreedingRulesMdl');
    const qry = `select c.cattle_id, c.cattle_type_id, c.breed_id, g.gender_nm, c.cattle_status, c.is_active,
        c.cattle_unique_code, c.branch_id,
        ifnull(br.gestation_days, t.gestation_days) as gestation_days,
        ifnull(br.expected_dry_off_days, t.expected_dry_off_days) as expected_dry_off_days
        from cattle_lst_t c
        left join gender_mstr_lst_t g on g.gender_id = c.gender_id
        left join cattle_types_mstr_lst_t t on t.cattle_type_id = c.cattle_type_id
        left join cattle_breeds_mstr_lst_t br on br.breed_id = c.breed_id
        where c.cattle_id = ?`;
    return dbutils.executeQuery(qry, [cattle_id], 'get breeding rules model');
}

/**********************************************
* name : getBreedableCattleMdl
* description : the dropdown for recording a pregnancy - females in scope with no pregnancy
*               already in flight. filtering here means the form cannot offer an invalid choice.
************************************************/
exports.getBreedableCattleMdl = (user, branch_id = null) => {
    log('in getBreedableCattleMdl');
    const scope = scopeutils.getScopeFilter(user, 'b');

    let qry = `select c.cattle_id, c.cattle_unique_code, c.branch_id, b.branch_name,
        t.cattle_type_name, br.breed_name
        from cattle_lst_t c
        join branches_lst_t b on b.branch_id = c.branch_id
        left join gender_mstr_lst_t g on g.gender_id = c.gender_id
        left join cattle_types_mstr_lst_t t on t.cattle_type_id = c.cattle_type_id
        left join cattle_breeds_mstr_lst_t br on br.breed_id = c.breed_id
        where c.is_active = 1 and c.cattle_status = 'active'
            and (g.gender_nm is null or g.gender_nm <> 'Male')
            and not exists (select 1 from cattle_pregnancy_lst_t p
                where p.cattle_id = c.cattle_id and p.is_active = 1 and p.pregnancy_status = 'active')
            ${scope.clause}`;
    const params = [...scope.params];

    if (branch_id) { qry += ' and c.branch_id = ?'; params.push(branch_id); }

    qry += ' order by c.cattle_unique_code asc';
    return dbutils.executeQuery(qry, params, 'get breedable cattle model');
}

/**********************************************
* name : getGenderOptionsMdl
* description : the gender dropdown for registering a calf. it is served from HERE rather than from
*               admin/genders, because that route is gated on the 'users' permission - it exists for
*               user management - and an incharge who can record a calving does not hold it.
************************************************/
exports.getGenderOptionsMdl = () => {
    log('in getGenderOptionsMdl');
    const qry = `select gender_id, gender_nm from gender_mstr_lst_t
        where is_active = 1 order by gender_nm asc`;
    return dbutils.executeQuery(qry, [], 'get gender options model');
}

// calves registered against a pregnancy; the guard that stops it being deleted and orphaning them
exports.countCalvesByPregnancyMdl = (pregnancy_id) => {
    log('in countCalvesByPregnancyMdl');
    const qry = 'select count(*) as cnt from cattle_lst_t where pregnancy_id = ? and is_active = 1';
    return dbutils.executeQuery(qry, [pregnancy_id], 'count calves by pregnancy model');
}

/* ------------------------------ single-statement writes ------------------------------ */

/**********************************************
* name : insertPregnancyMdl
* description : records a conception, with its expected dates already computed by the service.
*               NO transaction and no eligibility sync: conceiving does not stop her giving milk.
*               Only the actual dry-off does, and that is a separate decision by the incharge.
************************************************/
exports.insertPregnancyMdl = (data, user_id) => {
    log('in insertPregnancyMdl');
    const qry = `insert into cattle_pregnancy_lst_t
        (cattle_id, conception_date, expected_dry_off_date, expected_calving_date, remarks, created_by)
        values (?, ?, ?, ?, ?, ?)`;
    return dbutils.executeQuery(qry, [data.cattle_id, data.conception_date, data.expected_dry_off_date,
        data.expected_calving_date, data.remarks, user_id ?? null], 'insert pregnancy model');
}

// corrects the conception date and the dates derived from it; eligibility is untouched, for the
// same reason as above
exports.updatePregnancyMdl = (pregnancy_id, data, user_id) => {
    log('in updatePregnancyMdl');
    const qry = `update cattle_pregnancy_lst_t
        set conception_date = ?, expected_dry_off_date = ?, expected_calving_date = ?, remarks = ?, updated_by = ?
        where is_active = 1 and pregnancy_id = ?`;
    return dbutils.executeQuery(qry, [data.conception_date, data.expected_dry_off_date,
        data.expected_calving_date, data.remarks, user_id ?? null, pregnancy_id],
        'update pregnancy model');
}

/* ------------------------------ transactional writes ------------------------------ */

/**********************************************
* name : markDryOffMdl
* description : records the date the incharge actually stopped milking her, and takes her off the
*               milking sheet. TRANSACTIONAL: she can never be recorded as dry while still
*               appearing on tomorrow's sheet, nor the reverse.
*               the pregnancy_status guard is in the WHERE, so a zero affectedRows means someone
*               else already moved this pregnancy on - the service turns that into the message.
* input : (pregnancy_id, actual_dry_off_date, cattle_id, user_id)
************************************************/
exports.markDryOffMdl = async (pregnancy_id, actual_dry_off_date, cattle_id, user_id) => {
    log('in markDryOffMdl');

    const [result] = await dbutils.executeTransactionQueries([
        {
            query: `update cattle_pregnancy_lst_t set actual_dry_off_date = ?, updated_by = ?
                where is_active = 1 and pregnancy_status = 'active' and pregnancy_id = ?`,
            params: [actual_dry_off_date, user_id ?? null, pregnancy_id]
        },
        milkEligibilityStep(cattle_id, user_id)
    ], 'mark dry off');

    return result;
}

/**********************************************
* name : recordCalvingMdl
* description : closes the pregnancy, registers the calves and puts the mother back on the milking
*               sheet - ONE transaction, because a calf registered against a pregnancy that never
*               closed is corrupt data.
*
*               The pregnancy is closed FIRST, on a guarded WHERE. That ordering is deliberate: if
*               it changed nothing, no calf has been written yet, so the function can return
*               without throwing inside the transaction.
*
*               Twins are ordinary here. Each calf is a row in cattle_lst_t carrying this
*               pregnancy_id, and the codes are generated on THIS connection so the second calf
*               sees the first one's insert - counting on another connection would hand both the
*               same code.
* input : (pregnancy, { actual_calving_date, remarks, calves: [ { gender_id, weight, color, remarks } ] }, user_id)
* output : { affectedRows, calves: [ { cattle_id, cattle_unique_code } ], codeExhausted? }
************************************************/
exports.recordCalvingMdl = async (pregnancy, data, user_id) => {
    log('in recordCalvingMdl');

    const calves = Array.isArray(data.calves) ? data.calves : [];

    return dbutils.executeTransaction(async (connection) => {

        const [result] = await connection.execute(
            `update cattle_pregnancy_lst_t
                set actual_calving_date = ?, calves_born = ?, pregnancy_status = 'completed',
                    remarks = ifnull(?, remarks), updated_by = ?
                where is_active = 1 and pregnancy_status = 'active' and pregnancy_id = ?`,
            [data.actual_calving_date, calves.length, data.remarks ?? null, user_id ?? null, pregnancy.pregnancy_id]
        );

        // already calved, aborted or removed by someone else - nothing written, nothing to undo
        if (!result.affectedRows) return { affectedRows: 0, calves: [] };

        // the next free code at this branch. a closure over the transaction's own connection, so
        // the count and the duplicate check see the calves inserted moments ago in this same loop
        const nextCalfCode = async () => {
            const [[{ cnt }]] = await connection.execute(
                'select count(*) as cnt from cattle_lst_t where branch_id = ?', [pregnancy.branch_id]);

            for (let sequence = Number(cnt) + 1; sequence < Number(cnt) + 500; sequence++) {
                const candidate = `${pregnancy.branch_code}-C${String(sequence).padStart(3, '0')}`;
                const [taken] = await connection.execute(
                    'select cattle_id from cattle_lst_t where cattle_unique_code = ?', [candidate]);
                if (!taken.length) return candidate;
            }
            return null;
        };

        const registered = [];

        for (const calf of calves) {

            const cattle_unique_code = await nextCalfCode();
            // no free code in 500 tries means the branch numbering is broken. returning rather
            // than throwing rolls the transaction back cleanly and lets the service explain it
            if (!cattle_unique_code) return { affectedRows: 0, calves: [], codeExhausted: true };

            // type, breed and branch are inherited from the mother; date of birth IS the calving
            // date. this insert mirrors cattleMdl.insertCattleMdl - the SQL is repeated so that
            // the whole calving stays one self-contained transaction
            const [calfResult] = await connection.execute(
                `insert into cattle_lst_t (branch_id, cattle_unique_code, cattle_type_id, breed_id, gender_id,
                    date_of_birth, weight, color, purchase_date, purchase_cost, remarks,
                    mother_cattle_id, pregnancy_id, created_by)
                    values (?, ?, ?, ?, ?, ?, ?, ?, null, null, ?, ?, ?, ?)`,
                [pregnancy.branch_id, cattle_unique_code, pregnancy.cattle_type_id, pregnancy.breed_id,
                    calf.gender_id, data.actual_calving_date, calf.weight ?? null, calf.color ?? null,
                    calf.remarks ?? null, pregnancy.cattle_id, pregnancy.pregnancy_id, user_id ?? null]
            );

            // every animal needs a current ownership row; a calf's is 'born on farm' at zero cost
            await connection.execute(
                `insert into cattle_ownership_lst_t (cattle_id, purchase_mode_id, effective_from, amount, created_by)
                    select ?, purchase_mode_id, ?, 0, ? from purchase_mode_mstr_lst_t
                    where purchase_mode_key = 'born_on_farm' and is_active = 1 limit 1`,
                [calfResult.insertId, data.actual_calving_date, user_id ?? null]
            );

            // a calf is never milkable: this sets reason 'calf' (or 'male') rather than leaving the
            // column at its default with no explanation for the screen
            const calfEligibility = milkEligibilityStep(calfResult.insertId, user_id);
            await connection.execute(calfEligibility.query, calfEligibility.params);

            registered.push({ cattle_id: calfResult.insertId, cattle_unique_code });
        }

        // she has calved, so the dry-off block no longer applies - back on the milking sheet
        await connection.execute(ELIGIBILITY_SYNC_ONE_QRY,
            eligibilitySyncOneParams(pregnancy.cattle_id, user_id));

        return { affectedRows: result.affectedRows, calves: registered };
    }, 'record calving');
}

/**********************************************
* name : markPregnancyAbortedMdl
* description : ends a pregnancy that did not reach calving, and reassesses her milk - a cow dried
*               off for a pregnancy that ends should not stay blocked for it.
* input : (pregnancy_id, remarks, cattle_id, user_id)
************************************************/
exports.markPregnancyAbortedMdl = async (pregnancy_id, remarks, cattle_id, user_id) => {
    log('in markPregnancyAbortedMdl');

    const [result] = await dbutils.executeTransactionQueries([
        {
            query: `update cattle_pregnancy_lst_t
                set pregnancy_status = 'aborted', remarks = ifnull(?, remarks), updated_by = ?
                where is_active = 1 and pregnancy_status = 'active' and pregnancy_id = ?`,
            params: [remarks ?? null, user_id ?? null, pregnancy_id]
        },
        milkEligibilityStep(cattle_id, user_id)
    ], 'mark pregnancy aborted');

    return result;
}

/**********************************************
* name : softDeletePregnancyMdl
* description : removes a pregnancy entered by mistake and reassesses her milk, since the block she
*               was under may have been this pregnancy's. the calf guard lives in the service -
*               it needs to say how many calves are in the way.
* input : (pregnancy_id, cattle_id, user_id)
************************************************/
exports.softDeletePregnancyMdl = async (pregnancy_id, cattle_id, user_id) => {
    log('in softDeletePregnancyMdl');

    const [result] = await dbutils.executeTransactionQueries([
        {
            query: `update cattle_pregnancy_lst_t
                set is_active = 0, deleted_by = ?, deleted_time = current_timestamp
                where is_active = 1 and pregnancy_id = ?`,
            params: [user_id ?? null, pregnancy_id]
        },
        milkEligibilityStep(cattle_id, user_id)
    ], 'delete pregnancy');

    return result;
}
