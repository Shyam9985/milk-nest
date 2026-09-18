/*
 * Formatting helpers shared by the dashboard sections. Numbers are compacted for tiles
 * (1,284 / 12.9K) and kept exact in grids. Dates follow the project format, dd-MM-yyyy;
 * chart axis ticks drop the year (dd-MM) so they fit, the tooltip shows the full date.
 * Values still travel as YYYY-MM-DD because <input type="date"> and the API speak that.
 */

// YYYY-MM-DD -> 18-09 (axis ticks only)
export const shortDate = (value) => {
    if (!value) return '';
    const [, month, day] = value.split('-');
    return `${day}-${month}`;
};

// YYYY-MM-DD -> 18-09-2026
export const displayDate = (value) => {
    if (!value) return '-';
    const [year, month, day] = value.split('-');
    return `${day}-${month}-${year}`;
};

// today's date as YYYY-MM-DD in local time (same rule as the server)
export const todayLocal = () => new Date().toLocaleDateString('en-CA');

// shifts a YYYY-MM-DD by days, parsing it as a local date so month edges don't drift
export const addDays = (value, days) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-CA');
};

// exact figure with thousands separators for grids and tooltips
export const formatNumber = (value, digits = 2) => {
    const number = Number(value) || 0;
    return number.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: digits });
};

// compact figure for stat tiles: 1,284 / 12.9K / 1.2M
export const compactNumber = (value) => {
    const number = Number(value) || 0;
    if (Math.abs(number) >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
    if (Math.abs(number) >= 10_000) return `${(number / 1_000).toFixed(1)}K`;
    return formatNumber(number, number % 1 === 0 ? 0 : 1);
};

export const formatLitres = (value) => `${formatNumber(value)} L`;

// the period presets shown in the scope bar. each resolves to a from/to pair on demand so
// "today" is evaluated when clicked, not when the module loaded
export const PERIOD_PRESETS = [
    { key: 'today', label: 'Today', range: () => ({ from: todayLocal(), to: todayLocal() }) },
    { key: '7d', label: 'Last 7 days', range: () => ({ from: addDays(todayLocal(), -6), to: todayLocal() }) },
    { key: '30d', label: 'Last 30 days', range: () => ({ from: addDays(todayLocal(), -29), to: todayLocal() }) },
    { key: 'month', label: 'This month', range: () => ({ from: `${todayLocal().slice(0, 7)}-01`, to: todayLocal() }) },
    { key: 'custom', label: 'Custom', range: null }
];
