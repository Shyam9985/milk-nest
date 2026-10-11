import { formatNumber } from '../dashboard.utils';

/*
 * One tooltip for every chart so hover reads the same everywhere: a title, then one row per
 * series with its colour swatch, name and exact value. Recharts passes `payload` (the series
 * under the cursor) and `label` (the x value); `title` overrides the label when the axis
 * value needs formatting, `unit` is appended to each value.
 */
function ChartTooltip({ active, payload, label, title, unit = '', hideZero = false }) {

    if (!active || !payload?.length) return null;

    const rows = payload.filter((item) => !hideZero || Number(item.value) !== 0);
    if (!rows.length) return null;

    return (
        <div className="min-w-[10rem] rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs shadow-[var(--shadow-md)]">
            <p className="mb-1 font-semibold text-[var(--text-primary)]">{title ?? label}</p>
            {rows.map((item) => (
                <div key={item.dataKey ?? item.name} className="flex items-center justify-between gap-4 py-0.5">
                    <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color || item.fill || item.payload?.fill }} aria-hidden="true" />
                        {item.name}
                    </span>
                    <span className="font-medium tabular-nums text-[var(--text-primary)]">
                        {formatNumber(item.value)}{unit}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default ChartTooltip;
