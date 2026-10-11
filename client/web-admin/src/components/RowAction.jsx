/*
 * The button used for actions inside a grid row - Mark dry, Calved, Add checkup, Edit, Remove.
 *
 * These were coloured text with a hover tint, which reads as a label rather than a control: there
 * is nothing to tell the user it can be clicked until they happen to hover it. Every one now has a
 * border, a tinted surface and a pressed state, so it looks like what it is.
 *
 * The tone drives border, text and surface from a single token, so a row of actions stays legible
 * in both themes without a per-screen colour decision. The tint is mixed from that one token
 * rather than hard-coded, which is what keeps warning/danger/success consistent everywhere.
 */
const TONES = {
    default: 'var(--text-secondary)',
    primary: 'var(--brand-primary)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    info: 'var(--info)'
};

function RowAction({
    icon: Icon, children, tone = 'default', onClick, disabled = false, title, iconOnly = false
}) {

    const color = TONES[tone] || TONES.default;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            aria-label={iconOnly ? (title || undefined) : undefined}
            style={{ '--tone': color, color, borderColor: 'color-mix(in srgb, var(--tone) 32%, transparent)' }}
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border
                bg-[color-mix(in_srgb,var(--tone)_8%,transparent)] text-xs font-medium
                shadow-[var(--shadow-sm)] transition-all duration-150
                hover:bg-[color-mix(in_srgb,var(--tone)_18%,transparent)] hover:shadow
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--tone)]
                active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none
                ${iconOnly ? 'h-7 w-7' : 'px-2.5 py-1.5'}`}>

            {Icon && <Icon size={14} />}
            {!iconOnly && children}

        </button>
    );
}

export default RowAction;
