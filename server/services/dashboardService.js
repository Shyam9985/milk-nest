const dashboardMdl = require('../models/dashboardMdl');
const authMdl = require('../models/authMdl');
const { log } = require('../utils/log.utils');
const { todayLocal, addDaysLocal, daysBetweenLocal, eachDayLocal } = require('../utils/date.utils');

/*
 * Assembles the dashboard from independent aggregate queries. The queries run together in
 * one Promise.all, so the response time is the slowest query rather than the sum, and the
 * shaping below is linear in the number of days / branches / rows - never nested loops.
 */

const toNumber = (value) => (value === null || value === undefined ? 0 : Number(value));
const round = (value, places = 2) => Math.round(toNumber(value) * 10 ** places) / 10 ** places;

// percentage change against the previous period; null when there is nothing to compare with
const deltaPct = (current, previous) => {
    const prev = toNumber(previous);
    if (prev === 0) return null;
    return round(((toNumber(current) - prev) / prev) * 100, 1);
};

// litres per animal per day. one entry is one animal-day, so total / entries is exact
const yieldPerAnimalDay = (stats) => (toNumber(stats.entries) > 0 ? round(toNumber(stats.total) / toNumber(stats.entries)) : 0);

// zero-fills the daily rows so the chart gets one point per calendar day. O(days) via a Map
const fillDays = (rows, from_date, to_date) => {
    const byDate = new Map(rows.map((row) => [row.production_date, row]));
    return eachDayLocal(from_date, to_date).map((date) => {
        const row = byDate.get(date);
        return {
            date,
            morning: row ? round(row.morning) : 0,
            evening: row ? round(row.evening) : 0,
            total: row ? round(row.total) : 0,
            cattle: row ? toNumber(row.cattle) : 0,
            // null (not 0) when nothing was sampled that day, so the quality line breaks instead of dipping
            fat: row && row.avg_fat !== null ? round(row.avg_fat) : null,
            snf: row && row.avg_snf !== null ? round(row.avg_snf) : null,
            fat_readings: row ? toNumber(row.fat_readings) : 0
        };
    });
};

// rolls the (type, breed, count) rows into two donut datasets. breeds beyond the top five
// collapse into "Other" so the chart stays readable as the master grows
const rollupComposition = (rows, topBreeds = 5) => {
    const typeTotals = new Map();
    const breedTotals = new Map();

    for (const row of rows) {
        const count = toNumber(row.cattle_count);
        typeTotals.set(row.cattle_type_name, (typeTotals.get(row.cattle_type_name) || 0) + count);
        breedTotals.set(row.breed_name, (breedTotals.get(row.breed_name) || 0) + count);
    }

    const toSeries = (totals) => [...totals].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const breeds = toSeries(breedTotals);
    const other = breeds.slice(topBreeds).reduce((sum, item) => sum + item.value, 0);
    const by_breed = breeds.slice(0, topBreeds);
    if (other > 0) by_breed.push({ name: 'Other', value: other });

    return { by_type: toSeries(typeTotals), by_breed };
};

// the scope bar feeds: everything the caller may filter by, plus whether the caller may
// record milk (drives the "record today's milk" shortcut - not every role holds that key)
exports.getDashboardFiltersSrvc = async (user) => {
    log('in getDashboardFiltersSrvc');
    const [dairy_farms, branches, [milkPermission]] = await Promise.all([
        dashboardMdl.getScopedDairyFarmsMdl(user),
        dashboardMdl.getScopedBranchesMdl(user),
        authMdl.getRolePermissions(user?.role?.role_hndlr || '', 'milk-production')
    ]);
    return { dairy_farms, branches, can_record_milk: Number(milkPermission?.can_insert) === 1 };
}

// the whole dashboard for a period and optional farm / branch filters
exports.getDashboardSrvc = async (user, from_date, to_date, filters = {}) => {
    log('in getDashboardSrvc');

    const today = todayLocal();
    const days = daysBetweenLocal(from_date, to_date);
    const prev_to = addDaysLocal(from_date, -1);
    const prev_from = addDaysLocal(prev_to, -(days - 1));

    const [
        [current], [previous], [todayStats], trendRows, [herd],
        compositionRows, branchRows, byTypeRows, topProducers, notMilkedToday
    ] = await Promise.all([
        dashboardMdl.getPeriodStatsMdl(user, from_date, to_date, filters),
        dashboardMdl.getPeriodStatsMdl(user, prev_from, prev_to, filters),
        dashboardMdl.getPeriodStatsMdl(user, today, today, filters),
        dashboardMdl.getDailyTrendMdl(user, prev_from, to_date, filters),
        dashboardMdl.getHerdStatsMdl(user, filters),
        dashboardMdl.getHerdCompositionMdl(user, filters),
        dashboardMdl.getBranchSummaryMdl(user, from_date, to_date, filters),
        dashboardMdl.getProductionByTypeMdl(user, from_date, to_date, filters),
        dashboardMdl.getTopProducersMdl(user, from_date, to_date, filters),
        dashboardMdl.getCattleNotMilkedTodayMdl(user, from_date, to_date, today, filters)
    ]);

    // the trend query covered both periods; split it once by date
    const currentTrendRows = trendRows.filter((row) => row.production_date >= from_date);
    const previousTrendRows = trendRows.filter((row) => row.production_date < from_date);
    const trend = {
        current: fillDays(currentTrendRows, from_date, to_date),
        previous: fillDays(previousTrendRows, prev_from, prev_to)
    };

    const branches = branchRows.map((row) => ({
        branch_id: row.branch_id,
        branch_name: row.branch_name,
        branch_code: row.branch_code,
        is_main_branch: toNumber(row.is_main_branch) === 1,
        dairy_farm_id: row.dairy_farm_id,
        dairy_farm_name: row.dairy_farm_name,
        cattle_count: toNumber(row.cattle_count),
        total: round(row.total),
        morning: round(row.morning),
        evening: round(row.evening),
        milked_cattle: toNumber(row.milked_cattle),
        recorded_days: toNumber(row.recorded_days),
        avg_per_animal_day: toNumber(row.milked_cattle) > 0 && toNumber(row.recorded_days) > 0
            ? round(toNumber(row.total) / (toNumber(row.milked_cattle) * toNumber(row.recorded_days)))
            : 0,
        last_entry: row.last_entry,
        recorded_today: row.last_entry === today
    }));

    const recordedToday = branches.filter((branch) => branch.recorded_today).length;
    const silentBranches = branches.filter((branch) => !branch.recorded_today);

    // calendar days inside the period (up to today) that have no entry at all
    const recordedDates = new Set(currentTrendRows.map((row) => row.production_date));
    const daysWithoutEntries = eachDayLocal(from_date, to_date).filter((date) => date <= today && !recordedDates.has(date));

    const currentYield = yieldPerAnimalDay(current);
    const previousYield = yieldPerAnimalDay(previous);

    return {
        period: { from: from_date, to: to_date, days, prev_from, prev_to, today },
        filters: { dairy_farm_id: filters.dairy_farm_id || null, branch_id: filters.branch_id || null },
        kpis: {
            milk: {
                total: round(current.total),
                morning: round(current.morning_total),
                evening: round(current.evening_total),
                entries: toNumber(current.entries),
                recorded_days: toNumber(current.recorded_days),
                prev_total: round(previous.total),
                delta_pct: deltaPct(current.total, previous.total)
            },
            today: {
                total: round(todayStats.total),
                morning: round(todayStats.morning_total),
                evening: round(todayStats.evening_total),
                entries: toNumber(todayStats.entries),
                milked_cattle: toNumber(todayStats.milked_cattle)
            },
            yield: {
                per_animal_day: currentYield,
                prev_per_animal_day: previousYield,
                delta_pct: deltaPct(currentYield, previousYield)
            },
            herd: {
                total: toNumber(herd.total),
                milked: toNumber(current.milked_cattle),
                incomplete: toNumber(herd.incomplete)
            },
            quality: {
                fat: current.avg_fat === null ? null : round(current.avg_fat),
                snf: current.avg_snf === null ? null : round(current.avg_snf),
                prev_fat: previous.avg_fat === null ? null : round(previous.avg_fat),
                prev_snf: previous.avg_snf === null ? null : round(previous.avg_snf)
            },
            coverage: {
                recorded_today: recordedToday,
                total_branches: branches.length
            }
        },
        trend,
        branches,
        composition: rollupComposition(compositionRows),
        by_type: byTypeRows.map((row) => ({
            cattle_type_id: row.cattle_type_id,
            cattle_type_name: row.cattle_type_name,
            total: round(row.total),
            morning: round(row.morning),
            evening: round(row.evening),
            entries: toNumber(row.entries),
            milked_cattle: toNumber(row.milked_cattle),
            avg_per_animal_day: yieldPerAnimalDay(row),
            avg_fat: row.avg_fat === null ? null : round(row.avg_fat),
            avg_snf: row.avg_snf === null ? null : round(row.avg_snf)
        })),
        top_producers: topProducers.map((row) => ({
            cattle_id: row.cattle_id,
            cattle_unique_code: row.cattle_unique_code,
            cattle_type_name: row.cattle_type_name,
            breed_name: row.breed_name,
            branch_name: row.branch_name,
            total: round(row.total),
            days: toNumber(row.days),
            avg_per_day: round(row.avg_per_day),
            avg_fat: row.avg_fat === null ? null : round(row.avg_fat)
        })),
        attention: {
            silent_branches: silentBranches.map(({ branch_id, branch_name, dairy_farm_name, last_entry, cattle_count }) =>
                ({ branch_id, branch_name, dairy_farm_name, last_entry, cattle_count })),
            cattle_not_milked_today: notMilkedToday.map((row) => ({ ...row, days_since: toNumber(row.days_since) })),
            days_without_entries: daysWithoutEntries,
            incomplete_records: toNumber(herd.incomplete)
        }
    };
}
