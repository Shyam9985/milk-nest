import * as Icons from 'lucide-react';

// a quiet placeholder for a section with nothing to show yet, with a hint on how to fill it
function EmptyState({ icon: Icon = Icons.Inbox, title, hint, compact = false }) {
    return (
        <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6' : 'py-10'}`}>
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                <Icon size={18} />
            </span>
            <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
            {hint && <p className="mt-1 max-w-xs text-xs text-[var(--text-tertiary)]">{hint}</p>}
        </div>
    );
}

export default EmptyState;
