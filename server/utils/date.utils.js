/*
 * Date helpers for day-grained data (production dates, birth dates, position validity).
 *
 * Everything here works in the SERVER'S LOCAL timezone on purpose. The browser sends
 * dates as plain YYYY-MM-DD picked from a local calendar, so comparing them against a
 * UTC "today" rejects the current day for every timezone ahead of UTC - in IST that is
 * every entry made between midnight and 05:30.
 */

// today as YYYY-MM-DD in local time ('en-CA' formats exactly that way)
const todayLocal = () => new Date().toLocaleDateString('en-CA');

// the same, shifted by a number of years (used for far-future defaults)
const yearsFromTodayLocal = (years) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + years);
    return date.toLocaleDateString('en-CA');
};

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

// true when the value is a well formed, real calendar date
const isValidDateOnly = (value) => DATE_ONLY_RE.test(value) && !isNaN(new Date(value).getTime());

module.exports = { todayLocal, yearsFromTodayLocal, DATE_ONLY_RE, isValidDateOnly };
