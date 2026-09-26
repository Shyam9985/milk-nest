import { useState } from 'react';
import * as Icons from 'lucide-react';

/*
 * The frame every dashboard section sits in: a title that says what the section answers,
 * an optional one-line hint, and an optional "table view" twin for chart sections so every
 * figure is readable without colour. The twin is a render prop so it stays lazy.
 */
function SectionCard({ title, hint, icon: Icon, action, table, className = '', children }) {

    const [showTable, setShowTable] = useState(false);

    return (
        <section className={`flex flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-sm)] ${className}`}>

            <header className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4 sm:px-5">
                <div className="flex min-w-0 items-start gap-2">
                    {Icon && (
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--brand-primary)]">
                            <Icon size={16} />
                        </span>
                    )}
                    <div className="min-w-0">
                        <h3 className="text-base font-semibold leading-tight text-[var(--text-primary)]">{title}</h3>
                        {hint && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{hint}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {action}
                    {table && (
                        <button type="button" onClick={() => setShowTable((value) => !value)}
                            title={showTable ? 'Show chart' : 'Show as table'}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[var(--text-secondary)]
                                transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]
                                ${showTable ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : 'border-[var(--card-border)]'}`}>
                            {showTable ? <Icons.ChartColumn size={15} /> : <Icons.Table2 size={15} />}
                        </button>
                    )}
                </div>
            </header>

            <div className="flex-1 px-4 pb-4 pt-3 sm:px-5">
                {showTable && table ? table() : children}
            </div>

        </section>
    );
}

export default SectionCard;
