const cattleAlertsMdl = require('../models/cattleAlertsMdl');
const { log } = require('../utils/log.utils');
const { todayLocal, addDaysLocal, displayDate } = require('../utils/date.utils');
const { ALERT_SEVERITY } = require('../utils/cattle.constants');

/*
 * Turns the alert queries into a uniform list the UI can render without knowing what any
 * individual alert means.
 *
 * Every alert has the same shape - key, severity, title, detail, count, items - so the
 * attention panel renders an unfamiliar alert correctly the day it is added. Adding one is
 * a query plus an entry in the builder list below; no UI change.
 *
 * All five queries run in one Promise.all, so the response costs the slowest query rather
 * than the sum of them.
 */

// how far back the drift cross-check looks for milk recorded against a blocked animal
const DRIFT_LOOKBACK_DAYS = 30;

const plural = (count, singular, pluralForm) => `${count} ${count === 1 ? singular : pluralForm}`;

/**********************************************
* name : getCattleAlertsSrvc
* description : every lifecycle alert for the caller's jurisdiction, most urgent first.
* input : (req.user, { dairy_farm_id, branch_id })
* output : { generated_at, total, alerts: [ { key, severity, title, detail, count, items } ] }
************************************************/
exports.getCattleAlertsSrvc = async (user, filters = {}) => {
    log('in getCattleAlertsSrvc');

    const today = todayLocal();
    const driftFilters = { ...filters, since: addDaysLocal(today, -DRIFT_LOOKBACK_DAYS) };

    const [withdrawal, calving, dryOff, calfMissing, drift] = await Promise.all([
        cattleAlertsMdl.getMilkWithdrawalBreachAlertMdl(user, today, filters),
        cattleAlertsMdl.getCalvingDueAlertMdl(user, today, filters),
        cattleAlertsMdl.getDryOffDueAlertMdl(user, today, filters),
        cattleAlertsMdl.getCalfNotRegisteredAlertMdl(user, filters),
        cattleAlertsMdl.getEligibilityDriftAlertMdl(user, driftFilters)
    ]);

    // each builder returns null when there is nothing to report, so a quiet farm produces an
    // empty list rather than five "0 items" cards
    const builders = [

        // food safety first: this is the only alert where the consequence leaves the farm
        () => {
            if (!withdrawal.length) return null;
            const recorded = withdrawal.filter((row) => Number(row.entries_during_withdrawal) > 0).length;
            return {
                key: 'milk_withdrawal_breach',
                severity: ALERT_SEVERITY.CRITICAL,
                title: `${plural(withdrawal.length, 'animal is', 'animals are')} under milk withdrawal but still milkable`,
                detail: recorded
                    ? `Milk was already recorded for ${plural(recorded, 'animal', 'animals')} during a withdrawal period. That milk must be discarded.`
                    : 'Their milk must be discarded until the withdrawal period ends.',
                count: withdrawal.length,
                items: withdrawal.map((row) => ({
                    cattle_id: row.cattle_id,
                    cattle_unique_code: row.cattle_unique_code,
                    branch_name: row.branch_name,
                    label: row.illness_name || 'Under treatment',
                    note: `withdrawal until ${displayDate(row.milk_withdrawal_until)}`
                        + (Number(row.entries_during_withdrawal) > 0 ? ` · ${row.entries_during_withdrawal} entry(s) already recorded` : '')
                }))
            };
        },

        // has a real deadline: the calving either happened or something went wrong
        () => {
            if (!calving.length) return null;
            const overdue = calving.filter((row) => Number(row.days_overdue) > 0).length;
            return {
                key: 'calving_due',
                severity: overdue ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
                title: `${plural(calving.length, 'pregnancy has', 'pregnancies have')} reached the expected calving date`,
                detail: 'Record the calving and the calf details, or mark the pregnancy as aborted.',
                count: calving.length,
                items: calving.map((row) => ({
                    cattle_id: row.cattle_id,
                    cattle_unique_code: row.cattle_unique_code,
                    branch_name: row.branch_name,
                    label: `expected ${displayDate(row.expected_calving_date)}`,
                    note: Number(row.days_overdue) > 0 ? `${row.days_overdue} day(s) overdue` : 'due today'
                }))
            };
        },

        // the reason can_produce_milk is a human decision: only the incharge can confirm
        () => {
            if (!dryOff.length) return null;
            return {
                key: 'dry_off_due',
                severity: ALERT_SEVERITY.WARNING,
                title: `${plural(dryOff.length, 'animal is', 'animals are')} past the expected dry-off point and still milking`,
                detail: 'Dry-off timing varies by breed and animal, so nothing was changed automatically. Confirm whether each should be dried off.',
                count: dryOff.length,
                items: dryOff.map((row) => ({
                    cattle_id: row.cattle_id,
                    cattle_unique_code: row.cattle_unique_code,
                    branch_name: row.branch_name,
                    label: `${row.days_pregnant} day(s) pregnant`,
                    note: `expected dry-off ${displayDate(row.expected_dry_off_date)} · ${row.days_past} day(s) ago`
                }))
            };
        },

        // the calving record is only half done until the calf exists in the register
        () => {
            if (!calfMissing.length) return null;
            return {
                key: 'calf_not_registered',
                severity: ALERT_SEVERITY.WARNING,
                title: `${plural(calfMissing.length, 'calving has', 'calvings have')} no calf registered`,
                detail: 'Register the calf so it enters the cattle register with its mother recorded.',
                count: calfMissing.length,
                items: calfMissing.map((row) => ({
                    cattle_id: row.cattle_id,
                    cattle_unique_code: row.cattle_unique_code,
                    branch_name: row.branch_name,
                    label: `calved ${displayDate(row.actual_calving_date)}`,
                    note: 'no calf record'
                }))
            };
        },

        // not a farm problem: these mean the app failed to maintain the cached flag
        () => {
            if (!drift.length) return null;
            const DRIFT_TEXT = {
                status_says_gone_but_milkable: 'no longer in the herd but still marked milkable',
                blocked_but_milk_recorded: 'milk recorded while marked as not milkable',
                no_current_ownership: 'no current ownership record'
            };
            return {
                key: 'eligibility_drift',
                severity: ALERT_SEVERITY.INFO,
                title: `${plural(drift.length, 'record needs', 'records need')} a data correction`,
                detail: 'These are internal consistency checks, not farm issues. They usually clear on the next nightly recalculation.',
                count: drift.length,
                items: drift.map((row) => ({
                    cattle_id: row.cattle_id,
                    cattle_unique_code: row.cattle_unique_code,
                    branch_name: row.branch_name,
                    label: DRIFT_TEXT[row.drift_type] || row.drift_type,
                    note: row.milk_block_reason ? `status ${row.cattle_status} · blocked: ${row.milk_block_reason}` : `status ${row.cattle_status}`
                }))
            };
        }
    ];

    const alerts = builders.map((build) => build()).filter(Boolean);

    return {
        generated_at: today,
        total: alerts.reduce((sum, alert) => sum + alert.count, 0),
        alerts
    };
}
