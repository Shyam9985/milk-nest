import { useEffect, useRef, useState } from 'react';
import * as Icons from 'lucide-react';

/*
 * Custom searchable dropdown. Emits a native-like event ({ target: { name, value } })
 * so it can be swapped in wherever a <select> onChange handler is already wired.
 */
function SearchDropdown({ label, name, value, options = [], onChange, placeholder = 'Select',
    disabled = false, error, required = false }) {

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    const selected = options.find((option) => String(option.value) === String(value));

    const normalizedSearch = search.trim().toLowerCase();
    const filteredOptions = normalizedSearch
        ? options.filter((option) => String(option.label).toLowerCase().includes(normalizedSearch))
        : options;

    // when the list holds exactly one option, bind it automatically.
    // the ref remembers the auto-bound option so that a manual "Clear selection"
    // is not immediately overridden by this effect re-running.
    const autoBoundRef = useRef(null);

    useEffect(() => {

        if (options.length !== 1) {
            autoBoundRef.current = null;
            return;
        }

        const onlyOption = options[0];
        const hasValue = value !== '' && value !== null && value !== undefined;

        if (disabled || hasValue || autoBoundRef.current === String(onlyOption.value)) return;

        autoBoundRef.current = String(onlyOption.value);
        onChange?.({ target: { name, value: onlyOption.value } });
    }, [options, value, disabled]);

    // close when clicking outside the component
    useEffect(() => {

        const handleOutsideClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // fresh search box, focused, every time the panel opens
    useEffect(() => {

        if (open) {
            setSearch('');
            searchInputRef.current?.focus();
        }
    }, [open]);

    const selectOption = (optionValue) => {
        onChange?.({ target: { name, value: optionValue } });
        setOpen(false);
    };

    return (

        <div className="mb-3" ref={containerRef} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>

            {label && (
                <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">
                    {required ? `${label} *` : label}
                </label>
            )}

            <div className="relative">

                {/* the closed control, styled like the other inputs */}
                <button type="button" onClick={() => !disabled && setOpen((prev) => !prev)} disabled={disabled}
                    className={`flex w-full items-center justify-between rounded-lg border border-[var(--input-border)]
                        bg-[var(--input-bg)] px-4 py-3 text-left text-[var(--input-text)] outline-none transition-colors
                        ${disabled ? 'cursor-not-allowed opacity-60' : 'focus:border-[var(--brand-primary)]'}`}>

                    <span className={selected ? '' : 'text-[var(--input-placeholder)]'}>
                        {selected ? selected.label : placeholder}
                    </span>

                    <Icons.ChevronDown size={18}
                        className={`shrink-0 text-[var(--text-secondary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />

                </button>

                {open && (

                    <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-[var(--input-border)]
                        bg-[var(--bg-primary)] shadow-lg">

                        {/* search box */}
                        <div className="flex items-center gap-2 border-b border-[var(--border-primary)] px-3 py-2">

                            <Icons.Search size={16} className="shrink-0 text-[var(--text-secondary)]" />

                            <input ref={searchInputRef} type="text" value={search} placeholder="Type to search..."
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-transparent text-sm text-[var(--input-text)] outline-none
                                    placeholder:text-[var(--input-placeholder)]" />

                        </div>

                        <div className="max-h-56 overflow-y-auto">

                            {/* optional fields can be cleared back to empty */}
                            {!required && value !== '' && value !== null && value !== undefined && (
                                <button type="button" onClick={() => selectOption('')}
                                    className="block w-full px-4 py-2 text-left text-sm italic text-[var(--text-secondary)]
                                        transition-colors hover:bg-[var(--hover-bg)]">
                                    Clear selection
                                </button>
                            )}

                            {filteredOptions.length === 0 && (
                                <p className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                                    No matches found.
                                </p>
                            )}

                            {filteredOptions.map((option) => {

                                const isSelected = String(option.value) === String(value);

                                return (
                                    <button type="button" key={option.value} onClick={() => selectOption(option.value)}
                                        className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm
                                            transition-colors hover:bg-[var(--hover-bg)]
                                            ${isSelected ? 'bg-[var(--active-bg)] font-medium text-[var(--brand-primary)]' : 'text-[var(--text-primary)]'}`}>

                                        {option.label}

                                        {isSelected && <Icons.Check size={16} className="shrink-0" />}

                                    </button>
                                );
                            })}

                        </div>

                    </div>

                )}

            </div>

            {error && (
                <p className="mt-1 text-sm text-[var(--danger)]">
                    {error}
                </p>
            )}

        </div>
    );
}

export default SearchDropdown;
