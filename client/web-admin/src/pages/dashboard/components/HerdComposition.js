import * as Icons from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import SectionCard from './SectionCard';
import ChartTooltip from './ChartTooltip';
import EmptyState from './EmptyState';

// categorical slots in fixed order; "Other" always takes the neutral so it never looks like a breed
const SLOT_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];

const colorFor = (item, index) => (item.name === 'Other' ? 'var(--chart-other)' : SLOT_COLORS[index % SLOT_COLORS.length]);

// name, count and share for every segment - the readable twin of the chart, always visible
function SegmentList({ items, total }) {
    return (
        <ul className="w-full space-y-1.5 text-sm">
            {items.map((item, index) => (
                <li key={item.name} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 text-[var(--text-secondary)]">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colorFor(item, index) }} aria-hidden="true" />
                        <span className="truncate">{item.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-[var(--text-primary)]">
                        {item.value}
                        <span className="ml-1 text-xs text-[var(--text-tertiary)]">{total ? Math.round((item.value / total) * 100) : 0}%</span>
                    </span>
                </li>
            ))}
        </ul>
    );
}

// one or two segments read better as a proportion bar than as a pie
function ProportionBar({ items, total }) {
    return (
        <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
            {items.map((item, index) => (
                <span key={item.name} title={`${item.name}: ${item.value}`}
                    className="h-full rounded-full transition-all"
                    style={{ width: `${total ? (item.value / total) * 100 : 0}%`, background: colorFor(item, index) }} />
            ))}
        </div>
    );
}

function Donut({ items, total, label }) {
    return (
        <div className="relative h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={items} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="100%"
                        paddingAngle={2} stroke="var(--card-bg)" strokeWidth={2} isAnimationActive={false}>
                        {items.map((item, index) => <Cell key={item.name} fill={colorFor(item, index)} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                </PieChart>
            </ResponsiveContainer>
            {/* the hero of each donut is the total in its hole */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold leading-none text-[var(--text-primary)]">{total}</span>
                <span className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">{label}</span>
            </div>
        </div>
    );
}

function Breakdown({ title, items }) {

    const total = items.reduce((sum, item) => sum + item.value, 0);

    return (
        <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">{title}</p>
            {items.length >= 3 ? (
                <div className="flex flex-wrap items-center gap-4">
                    <Donut items={items} total={total} label="animals" />
                    <div className="min-w-[8rem] flex-1"><SegmentList items={items} total={total} /></div>
                </div>
            ) : (
                <div className="space-y-2">
                    <ProportionBar items={items} total={total} />
                    <SegmentList items={items} total={total} />
                </div>
            )}
        </div>
    );
}

function HerdComposition({ composition, herdTotal }) {

    const byType = composition?.by_type || [];
    const byBreed = composition?.by_breed || [];

    const table = () => (
        <div className="grid gap-4 sm:grid-cols-2">
            {[['By type', byType], ['By breed', byBreed]].map(([title, items]) => (
                <table key={title} className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                            <th className="py-2 pr-3 font-medium">{title}</th>
                            <th className="py-2 text-right font-medium">Animals</th>
                        </tr>
                    </thead>
                    <tbody className="tabular-nums text-[var(--text-primary)]">
                        {items.map((item) => (
                            <tr key={item.name} className="border-t border-[var(--table-cell-border)]">
                                <td className="py-2 pr-3">{item.name}</td>
                                <td className="py-2 text-right">{item.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ))}
        </div>
    );

    return (
        <SectionCard title="Herd composition" icon={Icons.ChartPie} table={byType.length ? table : null}
            hint={`${herdTotal} active animals by type and breed`}>

            {!byType.length && (
                <EmptyState icon={Icons.ChartPie} title="No cattle registered yet"
                    hint="Register animals under Settings → Cattle Management to see the herd here." />
            )}

            {!!byType.length && (
                <div className="space-y-5">
                    <Breakdown title="By type" items={byType} />
                    <Breakdown title="By breed" items={byBreed} />
                </div>
            )}

        </SectionCard>
    );
}

export default HerdComposition;
