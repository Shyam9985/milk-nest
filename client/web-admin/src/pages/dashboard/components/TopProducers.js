import * as Icons from 'lucide-react';
import SectionCard from './SectionCard';
import EmptyState from './EmptyState';
import { formatNumber } from '../dashboard.utils';

// the five best animals of the period, ranked by litres with their per-day average
function TopProducers({ producers, showBranch }) {

    const rows = producers || [];
    const best = rows[0]?.total || 0;

    return (
        <SectionCard title="Top producers" icon={Icons.Trophy}
            hint="The animals that gave the most milk in the period">

            {!rows.length && (
                <EmptyState icon={Icons.Trophy} title="No production recorded yet" compact
                    hint="Rankings appear once yields are recorded for the period." />
            )}

            {!!rows.length && (
                <ol className="space-y-2">
                    {rows.map((row, index) => (
                        <li key={row.cattle_id} className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-3 py-2">
                            <div className="flex items-center gap-3">
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold
                                    ${index === 0 ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
                                    {index + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{row.cattle_unique_code}</p>
                                    <p className="truncate text-xs text-[var(--text-tertiary)]">
                                        {row.cattle_type_name} · {row.breed_name}{showBranch ? ` · ${row.branch_name}` : ''}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">{formatNumber(row.total)} L</p>
                                    <p className="text-xs tabular-nums text-[var(--text-tertiary)]">{formatNumber(row.avg_per_day)} L/day · {row.days} d</p>
                                </div>
                            </div>
                            {/* a relative bar under each row shows the gap to the leader at a glance */}
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                                <span className="block h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${best ? (row.total / best) * 100 : 0}%` }} />
                            </div>
                        </li>
                    ))}
                </ol>
            )}

        </SectionCard>
    );
}

export default TopProducers;
