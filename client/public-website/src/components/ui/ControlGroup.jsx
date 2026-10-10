/**
 * The small segmented control used for visitor preferences in the header: a glass
 * pill holding two or three square buttons (theme, font size). Shared so the two
 * controls look identical and a third one would too.
 */
export function ControlGroup({ label, className = "inline-flex", children }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`items-center gap-0.5 rounded-xl border border-ink/10 bg-surface/80 p-1 backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

export function ControlButton({ active = false, label, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`grid size-8 place-items-center rounded-lg text-xs font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? "bg-linear-to-br from-navy-700 to-splash text-white shadow-sm"
          : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
