import { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { filterRows, paginateRows, sortRows } from './tableUtils';

/*
 * A light grid for lists inside cards, panels and drawers - places where the full DataGrid
 * (title bar, export buttons, MUI chrome) is too heavy but the house rule still applies:
 * every grid is searchable and paged. Search, sort and paging reuse tableUtils, so the
 * behaviour matches DataGrid exactly.
 *
 * columns: [{ label, field, render?(value, row), align?, searchable?, sortable?, className? }]
 */
const PAGE_SIZES = [5, 10, 25];

function SimpleTable({
    columns = [], rows = [], rowKey = 'id', pageSize = 5, searchPlaceholder = 'Search...',
    emptyMessage = 'No records.', searchable = true, sortable = true, dense = false,
}) {

    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [perPage, setPerPage] = useState(PAGE_SIZES.includes(pageSize) ? pageSize : PAGE_SIZES[0]);
    const [sort, setSort] = useState(null);

    // new data (a different profile in the same drawer) starts on page one with no filter
    useEffect(() => { setPage(0); setQuery(''); setSort(null); }, [rows]);

    const filtered = useMemo(() => filterRows(rows, query, columns), [rows, query, columns]);
    const sorted = useMemo(() => sortRows(filtered, sort), [filtered, sort]);
    const paged = useMemo(() => paginateRows(sorted, page, perPage), [sorted, page, perPage]);

    const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
    const from = sorted.length ? page * perPage + 1 : 0;
    const to = Math.min(sorted.length, (page + 1) * perPage);

    const toggleSort = (column) => {
        if (!sortable || column.sortable === false) return;
        setSort((current) => {
            if (current?.field !== column.field) return { field: column.field, direction: 'asc' };
            if (current.direction === 'asc') return { field: column.field, direction: 'desc' };
            return null;
        });
    };

    const alignClass = (align) => align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
    const cellPad = dense ? 'px-2 py-1.5' : 'px-3 py-2';

    return (
        <div className="space-y-3">

            {/* search + count */}
            {(searchable || rows.length > perPage) && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {searchable && (
                        <label className="relative flex-1 min-w-[12rem] max-w-xs">
                            <Icons.Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                            <input type="text" value={query} placeholder={searchPlaceholder}
                                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                                className="w-full rounded-lg border border-[var(--table-search-border)] bg-[var(--table-search-bg)] py-1.5 pl-8 pr-3
                                    text-sm text-[var(--table-search-text)] placeholder:text-[var(--text-tertiary)]
                                    focus:border-[var(--brand-primary)] focus:outline-none" />
                        </label>
                    )}
                    <span className="text-xs text-[var(--text-tertiary)]">
                        {sorted.length === rows.length ? `${rows.length} record${rows.length === 1 ? '' : 's'}` : `${sorted.length} of ${rows.length}`}
                    </span>
                </div>
            )}

            {/* grid */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                            {columns.map((column) => {
                                const canSort = sortable && column.sortable !== false;
                                const active = sort?.field === column.field;
                                return (
                                    <th key={column.field} onClick={() => toggleSort(column)}
                                        className={`${cellPad} font-medium ${alignClass(column.align)} ${canSort ? 'cursor-pointer select-none hover:text-[var(--text-primary)]' : ''}`}>
                                        <span className="inline-flex items-center gap-1">
                                            {column.label}
                                            {active && (sort.direction === 'asc' ? <Icons.ChevronUp size={12} /> : <Icons.ChevronDown size={12} />)}
                                        </span>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="text-[var(--text-primary)]">
                        {!paged.length && (
                            <tr>
                                <td colSpan={columns.length} className="px-3 py-6 text-center text-sm text-[var(--text-tertiary)]">
                                    {query ? `Nothing matches "${query}".` : emptyMessage}
                                </td>
                            </tr>
                        )}
                        {paged.map((row, index) => (
                            <tr key={row[rowKey] ?? index} className="border-t border-[var(--table-cell-border)] transition-colors hover:bg-[var(--table-row-hover)]">
                                {columns.map((column) => (
                                    <td key={column.field} className={`${cellPad} ${alignClass(column.align)} ${column.className || ''}`}>
                                        {column.render ? column.render(row[column.field], row) : (row[column.field] ?? '-')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* pager - shown once there is more than one page's worth of data */}
            {rows.length > PAGE_SIZES[0] && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
                    <label className="flex items-center gap-1.5">
                        Rows
                        <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }}
                            className="rounded-md border border-[var(--border-primary)] bg-[var(--bg-primary)] px-1.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none">
                            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                        </select>
                    </label>
                    <div className="flex items-center gap-1">
                        <span className="mr-2 tabular-nums">{from}–{to} of {sorted.length}</span>
                        <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} title="Previous page"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors
                                hover:bg-[var(--hover-bg)] disabled:cursor-not-allowed disabled:opacity-40">
                            <Icons.ChevronLeft size={16} />
                        </button>
                        <span className="tabular-nums">{page + 1} / {pageCount}</span>
                        <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)} title="Next page"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors
                                hover:bg-[var(--hover-bg)] disabled:cursor-not-allowed disabled:opacity-40">
                            <Icons.ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

export default SimpleTable;
