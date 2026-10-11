import * as Icons from 'lucide-react';
import SectionCard from './SectionCard';
import HorizontalBars from './HorizontalBars';
import EmptyState from './EmptyState';
import { formatNumber, displayDate } from '../dashboard.utils';
import EntityLink from '../../profiles/components/EntityLink';
import SimpleTable from '../../../components/table/SimpleTable';

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

// onOpenProfile is optional: with it, branch and farm names open their profiles
function BranchPanel({ branches, period, showFarm, onOpenProfile }) {

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

                    <SimpleTable rows={branches} rowKey="branch_id" searchPlaceholder="Search branches..."
                        columns={[
                            { label: 'Branch', field: 'branch_name', className: 'whitespace-nowrap font-medium',
                              render: (value, branch) => (
                                  <>
                                      <EntityLink type="branch" id={branch.branch_id} onNavigate={onOpenProfile}>{value}</EntityLink>
                                      {branch.is_main_branch && <span className="ml-1 text-xs font-normal text-[var(--text-tertiary)]">(Main)</span>}
                                  </>
                              ) },
                            ...(showFarm ? [{ label: 'Dairy farm', field: 'dairy_farm_name', className: 'whitespace-nowrap text-[var(--text-secondary)]',
                              render: (value, branch) => <EntityLink type="dairy-farm" id={branch.dairy_farm_id} onNavigate={onOpenProfile}>{value}</EntityLink> }] : []),
                            { label: 'Cattle', field: 'cattle_count', align: 'right', searchable: false, className: 'tabular-nums' },
                            { label: 'Milked', field: 'milked_cattle', align: 'right', searchable: false, className: 'tabular-nums' },
                            { label: 'Litres', field: 'total', align: 'right', searchable: false, className: 'tabular-nums font-medium', render: (value) => formatNumber(value) },
                            { label: 'L / animal / day', field: 'avg_per_animal_day', align: 'right', searchable: false, className: 'tabular-nums', render: (value) => formatNumber(value) },
                            { label: 'Days recorded', field: 'recorded_days', align: 'right', searchable: false, className: 'tabular-nums', render: (value) => `${value} / ${period.days}` },
                            { label: 'Last entry', field: 'last_entry', sortable: false, searchable: false, className: 'whitespace-nowrap',
                              render: (_value, branch) => <LastEntryChip branch={branch} today={today} /> },
                        ]} />

                </div>
            )}

        </SectionCard>
    );
}

export default BranchPanel;
