import * as Icons from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import SectionCard from './SectionCard';
import ChartTooltip from './ChartTooltip';
import EmptyState from './EmptyState';
import { shortDate, displayDate, formatNumber } from '../dashboard.utils';

/*
 * Milk quality over the period: the daily average fat % and SNF %, the two figures milk is
 * priced on. Days with no reading leave a gap in the line rather than dropping to zero, and
 * every sampled day carries a dot so sparse sampling is still readable. Both series are
 * percentages on the same scale, so they share one axis.
 */
const SERIES = [
    { key: 'fat', name: 'Fat %', color: 'var(--chart-3)' },
    { key: 'snf', name: 'SNF %', color: 'var(--chart-6)' }
];

const AXIS_TICK = { fill: 'var(--chart-axis-text)', fontSize: 11 };

const QualityTooltip = ({ active, payload }) => {
    const point = payload?.[0]?.payload;
    const title = point ? `${displayDate(point.date)} · ${point.fat_readings} ${point.fat_readings === 1 ? 'reading' : 'readings'}` : '';
    return <ChartTooltip active={active} payload={payload} title={title} unit="%" />;
};

function QualityChart({ trend, quality }) {

    const data = (trend?.current || []).map((point) => ({ ...point, label: shortDate(point.date) }));
    const sampled = data.filter((point) => point.fat !== null || point.snf !== null);
    const hasData = sampled.length > 0;

    const table = () => (
        <table className="w-full text-sm">
            <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 text-right font-medium">Fat %</th>
                    <th className="py-2 pr-3 text-right font-medium">SNF %</th>
                    <th className="py-2 text-right font-medium">Readings</th>
                </tr>
            </thead>
            <tbody className="tabular-nums text-[var(--text-primary)]">
                {sampled.map((point) => (
                    <tr key={point.date} className="border-t border-[var(--table-cell-border)]">
                        <td className="py-2 pr-3">{displayDate(point.date)}</td>
                        <td className="py-2 pr-3 text-right">{point.fat === null ? '-' : formatNumber(point.fat)}</td>
                        <td className="py-2 pr-3 text-right">{point.snf === null ? '-' : formatNumber(point.snf)}</td>
                        <td className="py-2 text-right">{point.fat_readings}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <SectionCard title="Milk quality" icon={Icons.Droplets} table={hasData ? table : null}
            hint={hasData
                ? `Daily average fat and SNF · period average ${formatNumber(quality.fat)}% fat, ${formatNumber(quality.snf)}% SNF`
                : 'Daily average fat and SNF from the readings entered with each yield'}>

            {!hasData && (
                <EmptyState icon={Icons.Droplets} title="No fat / SNF readings in this period"
                    hint="Enter fat and SNF on the Milk Production sheet to track quality here." />
            )}

            {hasData && (
                <>
                    <ul className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                        {SERIES.map((series) => (
                            <li key={series.key} className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ background: series.color }} aria-hidden="true" />
                                {series.name}
                            </li>
                        ))}
                    </ul>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={24} />
                                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} domain={['auto', 'auto']} unit="%" />
                                <Tooltip content={<QualityTooltip />} cursor={{ stroke: 'var(--border-primary)', strokeWidth: 1 }} />
                                {SERIES.map((series) => (
                                    <Line key={series.key} type="monotone" dataKey={series.key} name={series.name}
                                        stroke={series.color} strokeWidth={2} connectNulls={false} isAnimationActive={false}
                                        dot={{ r: 4, fill: series.color, strokeWidth: 2, stroke: 'var(--card-bg)' }}
                                        activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--card-bg)' }} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}

        </SectionCard>
    );
}

export default QualityChart;
