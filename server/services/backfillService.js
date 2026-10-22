const backfillMdl = require('../models/backfillMdl');
const milkMdl = require('../models/milkMdl');
const resutils = require('../utils/response.utils');
const { log } = require('../utils/log.utils');
const { todayLocal, addDaysLocal, daysBetweenLocal, eachDayLocal, isValidDateOnly } = require('../utils/date.utils');
const { generateEntry, round2 } = require('../utils/milkYield.utils');

/*
 * Data backfill: filling gaps in the milk register for a past date range.
 *
 * Three things keep this from being dangerous:
 *
 *  1. It writes through milkMdl.saveMilkProductionSheetMdl - the same upsert the day sheet uses -
 *     so a backfilled row is built exactly like a hand-entered one, and the unique key on
 *     (cattle_id, production_date) makes a repeat run idempotent rather than duplicating.
 *
 *  2. A day that already has entries is SKIPPED unless overwrite was explicitly asked for. The
 *     preview reports those counts first, so replacing real figures is always a deliberate act.
 *
 *  3. One transaction per day, not one for the range. A failure on day 9 leaves days 1-8 committed
 *     and reported, rather than rolling back a fortnight and holding locks while it does.
 */

// a month is the most one run will do. past that the request stops being a request - it is a job,
// and should be built as one rather than quietly timing out
const MAX_SPAN_DAYS = 31;

const assertDateRange = (from_date, to_date) => {
    if (!isValidDateOnly(from_date) || !isValidDateOnly(to_date)) {
        resutils.createError('validationFailed', 'From and to dates must be valid dates (YYYY-MM-DD).');
    }
    if (to_date < from_date) {
        resutils.createError('validationFailed', 'The to-date cannot be before the from-date.');
    }
    if (to_date > todayLocal()) {
        resutils.createError('validationFailed', 'Production cannot be backfilled for a future date.');
    }

    const span = daysBetweenLocal(from_date, to_date);
    if (span > MAX_SPAN_DAYS) {
        resutils.createError('validationFailed',
            `A single run covers at most ${MAX_SPAN_DAYS} days. This range is ${span}. Run it in shorter stretches.`);
    }
    return span;
};

/**********************************************
* name : previewBackfillSrvc
* description : what a run WOULD do, without writing anything: the herd it would cover, and for
*               each day whether it is empty, already filled, or would be overwritten.
* input : (user, { dairy_farm_id, branch_id, from_date, to_date })
************************************************/
exports.previewBackfillSrvc = async (user, filters = {}) => {
    log('in previewBackfillSrvc');

    const { from_date, to_date } = filters;
    const span = assertDateRange(from_date, to_date);

    const [herd, counts] = await Promise.all([
        backfillMdl.getBackfillHerdMdl(user, filters),
        backfillMdl.getExistingCountsByDateMdl(user, filters, from_date, to_date)
    ]);

    const existingByDate = new Map(counts.map((row) => [row.production_date, Number(row.entries)]));

    const days = eachDayLocal(from_date, to_date).map((date) => {
        const existing = existingByDate.get(date) || 0;
        return {
            production_date: date,
            existing_entries: existing,
            would_write: existing ? 0 : herd.length,
            status: existing ? 'has entries' : 'empty'
        };
    });

    const emptyDays = days.filter((d) => !d.existing_entries).length;

    return {
        herd_size: herd.length,
        branches: new Set(herd.map((a) => a.branch_id)).size,
        span_days: span,
        max_span_days: MAX_SPAN_DAYS,
        empty_days: emptyDays,
        filled_days: days.length - emptyDays,
        estimated_rows: emptyDays * herd.length,
        days
    };
}

/**********************************************
* name : runBackfillSrvc
* description : generates and writes a day at a time, branch by branch, reporting what each day did.
*               the herd is fetched ONCE and reused across every day - it does not change between
*               them, and refetching it per day would be N round trips for the same answer.
* input : (user, { dairy_farm_id, branch_id, from_date, to_date, overwrite }, user_id)
************************************************/
exports.runBackfillSrvc = async (user, payload = {}, user_id) => {
    log('in runBackfillSrvc');

    const { from_date, to_date, overwrite = false } = payload;
    assertDateRange(from_date, to_date);

    const herd = await backfillMdl.getBackfillHerdMdl(user, payload);
    if (!herd.length) {
        resutils.createError('validationFailed',
            'No milking animals were found for this selection. Check the farm and branch, and that the herd is marked as able to produce milk.');
    }

    const counts = await backfillMdl.getExistingCountsByDateMdl(user, payload, from_date, to_date);
    const existingByDate = new Map(counts.map((row) => [row.production_date, Number(row.entries)]));

    // the herd grouped by branch once, because the day sheet model saves one branch at a time
    const byBranch = herd.reduce((acc, animal) => {
        (acc[animal.branch_id] = acc[animal.branch_id] || []).push(animal);
        return acc;
    }, {});

    const results = [];
    let totalRows = 0;
    let totalLitres = 0;

    for (const production_date of eachDayLocal(from_date, to_date)) {

        const existing = existingByDate.get(production_date) || 0;
        if (existing && !overwrite) {
            results.push({ production_date, status: 'skipped', reason: `${existing} entries already recorded`, rows: 0, litres: 0 });
            continue;
        }

        let dayRows = 0;
        let dayLitres = 0;

        try {
            for (const [branch_id, animals] of Object.entries(byBranch)) {

                // a dry animal simply gets no row: generateEntry returning null means she gave
                // nothing, which is not the same as an empty row the sheet would soft delete
                const entries = animals
                    .map((animal) => ({ animal, entry: generateEntry(animal) }))
                    .filter((row) => row.entry)
                    .map(({ animal, entry }) => ({ cattle_id: animal.cattle_id, ...entry }));

                if (!entries.length) continue;

                await milkMdl.saveMilkProductionSheetMdl(Number(branch_id), production_date, entries, user_id);

                dayRows += entries.length;
                dayLitres += entries.reduce((sum, e) => sum + (e.morning_quantity || 0) + (e.evening_quantity || 0), 0);
            }

            results.push({
                production_date,
                status: existing ? 'overwritten' : 'filled',
                reason: existing ? `replaced ${existing} entries` : null,
                rows: dayRows,
                litres: round2(dayLitres)
            });
            totalRows += dayRows;
            totalLitres += dayLitres;

        } catch (error) {
            // one bad day does not abandon the rest: each day is its own transaction, so the days
            // already committed stay, and the failure is reported against the day it happened on
            log(`backfill failed on ${production_date}: ${error.message}`);
            results.push({ production_date, status: 'failed', reason: error.message, rows: 0, litres: 0 });
        }
    }

    return {
        from_date,
        to_date,
        herd_size: herd.length,
        total_rows: totalRows,
        total_litres: round2(totalLitres),
        filled_days: results.filter((r) => r.status === 'filled').length,
        overwritten_days: results.filter((r) => r.status === 'overwritten').length,
        skipped_days: results.filter((r) => r.status === 'skipped').length,
        failed_days: results.filter((r) => r.status === 'failed').length,
        days: results
    };
}
