import * as Icons from 'lucide-react';

/*
 * A stat tile: label, one big number, an optional signed delta against the previous period
 * and a one-line footnote that says what the number is made of. The delta colour follows
 * direction x whether "up is good"; null delta means there was nothing to compare with.
 */
function KpiTile({ label, value, unit, delta, deltaLabel = 'vs previous period', upIsGood = true, footnote, icon: Icon, accent = 'var(--brand-primary)' }) {

    const hasDelta = delta !== null && delta !== undefined && Number.isFinite(Number(delta));
    const numericDelta = hasDelta ? Number(delta) : 0;
    const isFlat = hasDelta && numericDelta === 0;
    const isGood = numericDelta > 0 ? upIsGood : !upIsGood;
    const deltaColor = isFlat ? 'var(--text-tertiary)' : isGood ? 'var(--success)' : 'var(--danger)';
    const DeltaIcon = isFlat ? Icons.Minus : numericDelta > 0 ? Icons.TrendingUp : Icons.TrendingDown;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-sm)]">

            {/* a thin accent bar keeps tiles distinct without painting the whole card */}
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} aria-hidden="true" />

            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">{label}</p>
                {Icon && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]" style={{ color: accent }}>
                        <Icon size={16} />
                    </span>
                )}
            </div>

            <p className="mt-2 flex items-baseline gap-1 text-[var(--text-primary)]">
                <span className="text-3xl font-semibold leading-none">{value}</span>
                {unit && <span className="text-sm text-[var(--text-secondary)]">{unit}</span>}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                {hasDelta ? (
                    <span className="inline-flex items-center gap-1 font-medium" style={{ color: deltaColor }}>
                        <DeltaIcon size={14} />
                        {numericDelta > 0 ? '+' : ''}{numericDelta}%
                        <span className="font-normal text-[var(--text-tertiary)]">{deltaLabel}</span>
                    </span>
                ) : footnote ? (
                    <span className="text-[var(--text-tertiary)]">{footnote}</span>
                ) : null}
            </div>

            {hasDelta && footnote && <p className="mt-1 text-xs text-[var(--text-tertiary)]">{footnote}</p>}

        </div>
    );
}

export default KpiTile;
