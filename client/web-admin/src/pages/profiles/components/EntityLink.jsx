/*
 * A code or name that opens an entity's profile. It only reports "the user wants to see
 * <type> #<id>" through onNavigate; whoever renders it decides what opening means (a
 * drawer today, maybe a route tomorrow). Without onNavigate it degrades to plain text,
 * so a screen can reuse a panel with or without profile support.
 */
function EntityLink({ type, id, onNavigate, children, className = '' }) {

    if (!onNavigate || !id) {
        return <span className={className}>{children}</span>;
    }

    return (
        <button type="button"
            onClick={(e) => { e.stopPropagation(); onNavigate(type, id); }}
            title={`Open ${type.replace('-', ' ')} profile`}
            className={`inline cursor-pointer rounded text-left font-medium text-[var(--brand-primary)] underline-offset-2
                transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] ${className}`}>
            {children}
        </button>
    );
}

export default EntityLink;
