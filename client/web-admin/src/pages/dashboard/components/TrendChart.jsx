import * as Icons from 'lucide-react';
import {
    ResponsiveContainer, ComposedChart, BarChart, Area, Line, Bar,
    CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';
import SectionCard from './SectionCard';
import ChartTooltip from './ChartTooltip';
import EmptyState from './EmptyState';
import { shortDate, displayDate, formatNumber } from '../dashboard.utils';
import SimpleTable from '../../../components/table/SimpleTable';

// the series painted on the chart, in fixed slot order. the previous period is a neutral
// dashed line so it reads as context, never as a third category
const SERIES = [
    { key: 'morning', name: 'Morning', color: 'var(--chart-1)' },
    { key: 'evening', name: 'Evening', color: 'var(--chart-2)' },
    { key: 'prevTotal', name: 'Previous period', color: 'var(--chart-previous)', dashed: true }
];

const AXIS_TICK = { fill: 'var(--chart-axis-text)', fontSize: 11 };

function LegendRow({ items }) {
    return (
        <ul className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
            {items.map((item) => (
                <li key={item.key} className="flex items-center gap-1.5">
                    {item.dashed
                        ? <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: item.color }} aria-hidden="true" />
                        : <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} aria-hidden="true" />}
                    {item.name}
                </li>
            ))}
        </ul>
    );
}

// tooltip title shows the day and, for the ghost line, the day it is compared with
const TrendTooltip = ({ active, payload, label }) => {
    const point = payload?.[0]?.payload;
    const title = point
        ? `${displayDate(point.date)}${point.prevDate ? `  (vs ${displayDate(point.prevDate)})` : ''}`
        : label;
    return <ChartTooltip active={active} payload={payload} title={title} unit=" L" />;
};

function TrendChart({ trend, period }) {

    const current = trend?.current || [];
    const previous = trend?.previous || [];

    // both periods have the same length, so day i lines up with day i of the period before
    const data = current.map((point, index) => ({
        ...point,
        label: shortDate(point.date),
        prevTotal: previous[index]?.total ?? 0,
        prevDate: previous[index]?.date ?? null
    }));

    const hasData = data.some((point) => point.total > 0 || point.prevTotal > 0);
    const singleDay = data.length === 1;

    // for a one-day period the "trend" is morning vs evening, today against the day before
    const singleDayData = singleDay ? [
        { label: 'Morning', current: data[0].morning, previous: previous[0]?.morning ?? 0 },
        { label: 'Evening', current: data[0].evening, previous: previous[0]?.evening ?? 0 }
    ] : [];

    // day-by-day grid twin of the chart: searchable by displayed date, paged like every grid
    const tableRows = data.map((point) => ({ ...point, dateLabel: displayDate(point.date) }));
    const table = () => (
        <SimpleTable rows={tableRows} rowKey="date" pageSize={10} searchPlaceholder="Search by date..."
            columns={[
                { label: 'Date', field: 'dateLabel', className: 'whitespace-nowrap' },
                { label: 'Morning (L)', field: 'morning', align: 'right', searchable: false, className: 'tabular-nums', render: (value) => formatNumber(value) },
                { label: 'Evening (L)', field: 'evening', align: 'right', searchable: false, className: 'tabular-nums', render: (value) => formatNumber(value) },
                { label: 'Total (L)', field: 'total', align: 'right', searchable: false, className: 'tabular-nums font-medium', render: (value) => formatNumber(value) },
                { label: 'Animals', field: 'cattle', align: 'right', searchable: false, className: 'tabular-nums' },
                { label: 'Previous (L)', field: 'prevTotal', align: 'right', searchable: false, className: 'tabular-nums text-[var(--text-secondary)]', render: (value) => formatNumber(value) },
            ]} />
    );

    return (
        <SectionCard title="Production trend" icon={Icons.Activity} table={hasData ? table : null}
            hint={singleDay
                ? `Morning and evening yield for ${displayDate(period.from)}, against ${displayDate(period.prev_to)}`
                : `Litres per day, morning and evening stacked, with the previous ${period.days} days for comparison`}>

            {!hasData && (
                <EmptyState icon={Icons.Activity} title="No milk recorded in this period"
                    hint="Entries made on the Milk Production screen will show up here as a daily trend." />
            )}

            {hasData && singleDay && (
                <>
                    <LegendRow items={[
                        { key: 'current', name: displayDate(period.from), color: 'var(--chart-1)' },
                        { key: 'previous', name: displayDate(period.prev_to), color: 'var(--chart-previous)' }
                    ]} />
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={singleDayData} barGap={2} barCategoryGap="30%" margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip unit=" L" />} cursor={{ fill: 'var(--hover-bg)' }} />
                                <Bar dataKey="current" name={displayDate(period.from)} fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={56} />
                                <Bar dataKey="previous" name={displayDate(period.prev_to)} fill="var(--chart-previous)" radius={[4, 4, 0, 0]} maxBarSize={56} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}

            {hasData && !singleDay && (
                <>
                    <LegendRow items={SERIES} />
                    <div className="h-64 sm:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                                <defs>
                                    {SERIES.filter((series) => !series.dashed).map((series) => (
                                        <linearGradient key={series.key} id={`trend-${series.key}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={series.color} stopOpacity={0.45} />
                                            <stop offset="100%" stopColor={series.color} stopOpacity={0.08} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={24} />
                                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                                <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--border-primary)', strokeWidth: 1 }} />
                                <Area type="monotone" dataKey="morning" name="Morning" stackId="day"
                                    stroke="var(--chart-1)" strokeWidth={2} fill="url(#trend-morning)"
                                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card-bg)' }} />
                                <Area type="monotone" dataKey="evening" name="Evening" stackId="day"
                                    stroke="var(--chart-2)" strokeWidth={2} fill="url(#trend-evening)"
                                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card-bg)' }} />
                                <Line type="monotone" dataKey="prevTotal" name="Previous period"
                                    stroke="var(--chart-previous)" strokeWidth={2} strokeDasharray="5 4" dot={false}
                                    activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card-bg)' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}

        </SectionCard>
    );
}

export default TrendChart;
