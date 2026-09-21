import { useState } from 'react';
import * as Icons from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SectionCard from './SectionCard';
import { displayDate } from '../dashboard.utils';
import EntityLink from '../../profiles/components/EntityLink';

/*
 * The "what should I do about it" section. Each item is a plain sentence with a count, a
 * severity icon (never colour alone) and, where there is an obvious next step, a link to the
 * screen that fixes it. Groups expand to show the specific branches / animals / days.
 */
const SEVERITY = {
    critical: { icon: Icons.OctagonAlert, color: 'var(--danger)' },
    warning: { icon: Icons.TriangleAlert, color: 'var(--warning)' },
    info: { icon: Icons.Info, color: 'var(--info)' }
};

function AttentionItem({ severity, title, detail, items, renderItem, action }) {

    const [open, setOpen] = useState(false);
    const { icon: Icon, color } = SEVERITY[severity];
    const expandable = items && items.length > 0;

    return (
        <li className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)]">
            <div className="flex items-start gap-3 px-3 py-2.5">
                <span className="mt-0.5 shrink-0" style={{ color }}><Icon size={18} /></span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
                    {detail && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{detail}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    {action && (
                        <button type="button" onClick={action.onClick} title={action.label}
                            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-[var(--brand-primary)] transition-colors hover:bg-[var(--hover-bg)]">
                            {action.label} <Icons.ArrowRight size={13} />
                        </button>
                    )}
                    {expandable && (
                        <button type="button" onClick={() => setOpen((value) => !value)} title={open ? 'Hide details' : 'Show details'}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)]">
                            <Icons.ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </div>
            </div>
            {open && expandable && (
                <ul className="border-t border-[var(--card-border)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                    {items.map((item, index) => (
                        <li key={index} className="flex items-center justify-between gap-3 py-1">{renderItem(item)}</li>
                    ))}
                </ul>
            )}
        </li>
    );
}

function AttentionPanel({ attention, period, canRecordMilk, onOpenProfile }) {

    const navigate = useNavigate();
    const silent = attention?.silent_branches || [];
    const notMilked = attention?.cattle_not_milked_today || [];
    const missingDays = attention?.days_without_entries || [];
    const incomplete = attention?.incomplete_records || 0;

    const isToday = period.to === period.today;
    const items = [];
    // shortcuts to the milk sheet only for roles that may record on it
    const recordAction = (label) => (canRecordMilk ? { label, onClick: () => navigate('/milk-production') } : null);

    if (silent.length) {
        items.push(
            <AttentionItem key="silent" severity={silent.some((branch) => !branch.last_entry) ? 'critical' : 'warning'}
                title={`${silent.length} ${silent.length === 1 ? 'branch has' : 'branches have'} not recorded today`}
                detail="Today's yield is missing for these branches."
                items={silent}
                renderItem={(branch) => (
                    <>
                        <span className="truncate text-[var(--text-primary)]">
                            <EntityLink type="branch" id={branch.branch_id} onNavigate={onOpenProfile}>{branch.branch_name}</EntityLink>
                            <span className="text-[var(--text-tertiary)]"> · {branch.dairy_farm_name}</span></span>
                        <span className="shrink-0">{branch.cattle_count} cattle · last {branch.last_entry ? displayDate(branch.last_entry) : 'never'}</span>
                    </>
                )}
                action={recordAction('Record')} />
        );
    }

    if (notMilked.length) {
        items.push(
            <AttentionItem key="notMilked" severity="warning"
                title={`${notMilked.length} ${notMilked.length === 1 ? 'animal was' : 'animals were'} milked this period but not today`}
                detail="They have entries earlier in the period and none for today."
                items={notMilked}
                renderItem={(animal) => (
                    <>
                        <span className="truncate text-[var(--text-primary)]">
                            <EntityLink type="cattle" id={animal.cattle_id} onNavigate={onOpenProfile}>{animal.cattle_unique_code}</EntityLink>
                            <span className="text-[var(--text-tertiary)]"> · {animal.branch_name}</span></span>
                        <span className="shrink-0">last {displayDate(animal.last_entry)} · {animal.days_since} d ago</span>
                    </>
                )} />
        );
    }

    if (missingDays.length) {
        const hasEarlierDays = missingDays.some((date) => date !== period.today);
        items.push(
            <AttentionItem key="days" severity={hasEarlierDays ? 'warning' : 'info'}
                title={`${missingDays.length} ${missingDays.length === 1 ? 'day' : 'days'} in the period with no entries at all`}
                detail={hasEarlierDays ? 'Past days can still be filled in on the Milk Production screen.' : 'Only today is pending so far.'}
                items={missingDays}
                renderItem={(date) => <span className="text-[var(--text-primary)]">{displayDate(date)}{date === period.today ? ' (today)' : ''}</span>}
                action={hasEarlierDays ? recordAction('Fill in') : null} />
        );
    }

    if (incomplete > 0) {
        items.push(
            <AttentionItem key="incomplete" severity="info"
                title={`${incomplete} cattle ${incomplete === 1 ? 'record is' : 'records are'} missing basic details`}
                detail="Gender, date of birth or weight is blank. Complete them for better per-animal insights."
                action={{ label: 'Open register', onClick: () => navigate('/settings/master/cattle-management') }} />
        );
    }

    return (
        <SectionCard title="Needs attention" icon={Icons.BellRing}
            hint={isToday ? 'Gaps in today’s recording and in the data' : 'Gaps found in the selected period'}>

            {!items.length && (
                <div className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-3 py-3">
                    <span className="text-[var(--success)]"><Icons.CircleCheck size={20} /></span>
                    <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">All caught up</p>
                        <p className="text-xs text-[var(--text-tertiary)]">Every branch has recorded today and no gaps were found.</p>
                    </div>
                </div>
            )}

            {!!items.length && <ul className="space-y-2">{items}</ul>}

        </SectionCard>
    );
}

export default AttentionPanel;
