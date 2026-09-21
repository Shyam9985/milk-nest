/*
 * Building blocks shared by every profile: a labelled value, a grid of them, a titled
 * section, and a stat tile. Profiles compose these so all of them read the same way and
 * a styling change lands everywhere at once.
 */

export function ProfileField({ label, value, className = '' }) {
    const empty = value === null || value === undefined || value === '';
    return (
        <div className={`min-w-0 ${className}`}>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">{label}</p>
            <p className={`mt-0.5 break-words text-sm ${empty ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
                {empty ? '-' : value}
            </p>
        </div>
    );
}

export function ProfileGrid({ children, columns = 2 }) {
    const cols = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' }[columns] || 'sm:grid-cols-2';
    return <div className={`grid grid-cols-1 gap-x-6 gap-y-4 ${cols}`}>{children}</div>;
}

export function ProfileSection({ title, icon: Icon, children, action }) {
    return (
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-primary)] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                    {Icon && <Icon size={16} className="text-[var(--brand-primary)]" />}
                    {title}
                </h4>
                {action}
            </div>
            {children}
        </section>
    );
}

export function ProfileStat({ label, value, unit, hint }) {
    const empty = value === null || value === undefined || value === '';
    return (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-3 py-2.5">
            <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                {empty ? '-' : value}{!empty && unit && <span className="ml-1 text-xs font-normal text-[var(--text-secondary)]">{unit}</span>}
            </p>
            {hint && <p className="mt-0.5 truncate text-[11px] text-[var(--text-tertiary)]">{hint}</p>}
        </div>
    );
}

// a coloured pill for statuses like health or main-branch
export function ProfileBadge({ children, tone = 'neutral' }) {
    const tones = {
        neutral: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
        success: 'bg-[var(--bg-tertiary)] text-[var(--success)]',
        warning: 'bg-[var(--bg-tertiary)] text-[var(--warning)]',
        danger: 'bg-[var(--danger-bg)] text-[var(--danger-text)]',
        brand: 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone] || tones.neutral}`}>
            {children}
        </span>
    );
}

// the header strip every profile opens with: a code, a name and a line of context
export function ProfileHeader({ icon: Icon, code, name, subtitle, badges }) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                {Icon && <Icon size={26} />}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium tracking-wide text-[var(--text-tertiary)]">{code}</p>
                <h3 className="truncate text-xl font-semibold text-[var(--text-primary)]">{name}</h3>
                {subtitle && <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{subtitle}</p>}
                {badges && <div className="mt-2 flex flex-wrap gap-1.5">{badges}</div>}
            </div>
        </div>
    );
}
