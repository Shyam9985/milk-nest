/*
 * Thresholds for cattle lifecycle rules and alerts.
 *
 * These are deliberately constants and not a settings table: they are farm-wide numbers
 * that essentially never change, and a config screen for values nobody edits is cost
 * without benefit. Promote one to the database only when someone actually needs to tune it.
 *
 * The two rules that DO vary per animal - gestation length and dry-off timing - are not
 * here. They live on cattle_breeds_mstr_lst_t / cattle_types_mstr_lst_t, because they
 * differ by breed (breed value wins, type is the fallback).
 */

// a heifer this young is not milked regardless of anything else
const CALF_AGE_MONTHS = 18;

// an active pregnancy whose expected calving passed this long ago is almost certainly a
// stale record - an abortion or a calving nobody entered
const PREGNANCY_STALE_DAYS = 21;

// a treatment episode still open after this long is either forgotten or genuinely chronic
const TREATMENT_OPEN_DAYS = 30;

// how long after calving we expect her back on the milking sheet
const POST_CALVING_MILK_DAYS = 7;

// reasons a cattle cannot be milked, in the order they are evaluated. the FIRST match wins,
// so the most authoritative fact (she is sold) beats the least (a manual block).
// mirrors the milk_block_reason enum on cattle_lst_t
const MILK_BLOCK_REASON = {
    SOLD: 'sold',
    DEAD: 'dead',
    MALE: 'male',
    CALF: 'calf',
    UNDER_TREATMENT: 'under_treatment',
    PREGNANT_DRY: 'pregnant_dry',
    MANUAL: 'manual'
};

// what each reason is called on screen. kept beside the enum so a new reason cannot be
// added without someone deciding how it reads to the incharge
const MILK_BLOCK_LABEL = {
    [MILK_BLOCK_REASON.SOLD]: 'no longer in the herd',
    [MILK_BLOCK_REASON.DEAD]: 'recorded as dead',
    [MILK_BLOCK_REASON.MALE]: 'male',
    [MILK_BLOCK_REASON.CALF]: 'too young to be milked',
    [MILK_BLOCK_REASON.UNDER_TREATMENT]: 'under treatment - milk withdrawal in force',
    [MILK_BLOCK_REASON.PREGNANT_DRY]: 'dried off for her pregnancy',
    [MILK_BLOCK_REASON.MANUAL]: 'marked dry by hand'
};

// cattle_status enum on cattle_lst_t
const CATTLE_STATUS = {
    ACTIVE: 'active',
    SOLD: 'sold',
    DEAD: 'dead',
    TRANSFERRED: 'transferred'
};

// alert severities, matching what the dashboard's attention panel already renders
const ALERT_SEVERITY = {
    CRITICAL: 'critical',
    WARNING: 'warning',
    INFO: 'info'
};

module.exports = {
    CALF_AGE_MONTHS, PREGNANCY_STALE_DAYS, TREATMENT_OPEN_DAYS, POST_CALVING_MILK_DAYS,
    MILK_BLOCK_REASON, MILK_BLOCK_LABEL, CATTLE_STATUS, ALERT_SEVERITY
};
