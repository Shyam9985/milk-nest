const publicMdl = require('../models/publicMdl');
const resutils = require('../utils/response.utils');
const { getDatabaseError } = require('../utils/db-errors');
const { log } = require('../utils/log.utils');
const { todayLocal, addDaysLocal, eachDayLocal } = require('../utils/date.utils');

/*
 * Everything the public website is allowed to ask for.
 */

const TREND_DAYS = 7;

const toNumber = (value) => (value === null || value === undefined ? 0 : Number(value));
const round = (value, places = 2) => Math.round(toNumber(value) * 10 ** places) / 10 ** places;

// platform-wide totals for the public website, read from the database on every call.
// one milk scan covers both windows: it starts at whichever is earlier, the first of the month
// or the first day of the trend, and the totals below are cut from the same per-day rows
exports.getPublicStatsSrvc = async () => {
    log('in getPublicStatsSrvc');

    const today = todayLocal();
    const trendStart = addDaysLocal(today, -(TREND_DAYS - 1));
    const monthStart = `${today.slice(0, 7)}-01`;
    const from_date = trendStart < monthStart ? trendStart : monthStart;

    const [[counts], dailyRows] = await Promise.all([
        publicMdl.getPlatformCountsMdl(),
        publicMdl.getDailyMilkTotalsMdl(from_date, today)
    ]);

    const totalByDate = new Map(dailyRows.map((row) => [row.production_date, toNumber(row.total)]));
    const sumSince = (start) => {
        let sum = 0;
        for (const [date, total] of totalByDate) if (date >= start) sum += total;
        return round(sum);
    };

    return {
        active_cattle: toNumber(counts?.active_cattle),
        dairy_farms: toNumber(counts?.dairy_farms),
        branches: toNumber(counts?.branches),
        milk_today: round(totalByDate.get(today)),
        milk_week: sumSince(trendStart),
        milk_month: sumSince(monthStart),
        // zero-filled so the chart always gets one bar per calendar day
        trend: eachDayLocal(trendStart, today).map((date) => ({ date, total: round(totalByDate.get(date)) })),
        as_of: new Date().toISOString()
    };
}

// single spaces only, so 'Ravi   Kumar ' and 'Ravi Kumar' store the same
const collapseSpaces = (value) => String(value).trim().replace(/\s+/g, ' ');

// a failed query reaches us as a 'DatabaseError' carrying the friendly text from db-errors, not
// the mysql code, so a unique key violation is recognised by that text (and by the code, should
// it ever be passed along)
const DUPLICATE_ENTRY_MESSAGE = getDatabaseError('ER_DUP_ENTRY').message;
const isDuplicateEntry = (error) =>
    error?.name === 'DatabaseError' && (error.code === 'ER_DUP_ENTRY' || error.message === DUPLICATE_ENTRY_MESSAGE);

// stores a website enquiry. the email is normalised BEFORE the insert because the unique key
// on it is what blocks a repeat enquiry: ' Ravi@Farm.com ' and 'ravi@farm.com' must collide.
// there is no "does it exist?" select first - two submissions arriving together would both
// pass that check, while the unique key lets exactly one of them in
exports.createEnquirySrvc = async (payload, context = {}) => {
    log('in createEnquirySrvc');

    const enquiry = {
        full_name: collapseSpaces(payload.full_name),
        phone: collapseSpaces(payload.phone),
        email: String(payload.email).trim().toLowerCase(),
        farm_name: payload.farm_name ? collapseSpaces(payload.farm_name) || null : null,
        message: String(payload.message).trim(),
        ip_address: context.ip_address || null,
        user_agent: context.user_agent || null
    };

    try {
        await publicMdl.insertEnquiryMdl(enquiry);
    } catch (error) {
        // uq_enquiries_email is the only unique key a new row can hit, so this is a repeat enquiry
        if (isDuplicateEntry(error)) {
            resutils.createError('duplicateRecord',
                'We already have an enquiry from this email address. Our team will get in touch with you shortly.');
        }
        throw error;
    }
    return { full_name: enquiry.full_name };
}
