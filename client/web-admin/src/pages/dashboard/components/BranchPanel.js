import * as Icons from 'lucide-react';
import SectionCard from './SectionCard';
import HorizontalBars from './HorizontalBars';
import EmptyState from './EmptyState';
import { formatNumber, displayDate } from '../dashboard.utils';

/*
 * Branch comparison: which branch produced how much this period, then the detail grid with
 * herd size, yield per animal and when each branch last recorded. Silent branches stand out
 * with a warning chip rather than colour alone.
 */
function LastEntryChip({ branch, today }) {
    if (!branch.last_entry) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--danger-bg)] px-2 py-0.5 text-xs font-medium text-[var(--danger-text)]">
                <Icons.CircleAlert size={12} /> never
            </span>
        );
    }
    if (branch.last_entry === today) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs font-medium text-[var(--success)]">
                <Icons.CircleCheck size={12} /> today
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs font-medium text-[var(--warning)]">
            <Icons.Clock size={12} /> {displayDate(branch.last_entry)}
        </span>
    );
}

function BranchPanel({ branches, period, showFarm }) {

    const today = period.today;
    const chartData = branches.map((branch) => ({ name: branch.branch_name, total: branch.total }));
    const anyProduction = branches.some((branch) => branch.total > 0);

    return (
        <SectionCard title="Branch comparison" icon={Icons.Building2}
            hint={`Litres per branch for the period, with herd size and the last day each branch recorded`}>

            {!branches.length && (
                <EmptyState icon={Icons.Building2} title="No branches in scope"
                    hint="Branches are added under Settings → Dairy Farm." />
            )}

            {!!branches.length && (
                <div className="space-y-4">

                    {anyProduction
                        ? <HorizontalBars data={chartData} nameKey="name" valueKey="total" valueName="Litres" />
                        : <p className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-tertiary)]">
                            No milk was recorded at any branch in this period.
                          </p>}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                                    <th className="py-2 pr-3 font-medium">Branch</th>
                                    {showFarm && <th className="py-2 pr-3 font-medium">Dairy farm</th>}
                                    <th className="py-2 pr-3 text-right font-medium">Cattle</th>
                                    <th className="py-2 pr-3 text-right font-medium">Milked</th>
                                    <th className="py-2 pr-3 text-right font-medium">Litres</th>
                                    <th className="py-2 pr-3 text-right font-medium">L / animal / day</th>
                                    <th className="py-2 pr-3 text-right font-medium">Days recorded</th>
                                    <th className="py-2 font-medium">Last entry</th>
                                </tr>
                            </thead>
                            <tbody className="text-[var(--text-primary)]">
                                {branches.map((branch) => (
                                    <tr key={branch.branch_id} className="border-t border-[var(--table-cell-border)] transition-colors hover:bg-[var(--table-row-hover)]">
                                        <td className="whitespace-nowrap py-2 pr-3 font-medium">
                                            {branch.branch_name}
                                            {branch.is_main_branch && <span className="ml-1 text-xs font-normal text-[var(--text-tertiary)]">(Main)</span>}
                                        </td>
                                        {showFarm && <td className="whitespace-nowrap py-2 pr-3 text-[var(--text-secondary)]">{branch.dairy_farm_name}</td>}
                                        <td className="py-2 pr-3 text-right tabular-nums">{branch.cattle_count}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{branch.milked_cattle}</td>
                                        <td className="py-2 pr-3 text-right font-medium tabular-nums">{formatNumber(branch.total)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{formatNumber(branch.avg_per_animal_day)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{branch.recorded_days} / {period.days}</td>
                                        <td className="whitespace-nowrap py-2"><LastEntryChip branch={branch} today={today} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            )}

        </SectionCard>
    );
}

export default BranchPanel;
