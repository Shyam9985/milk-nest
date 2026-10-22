import { useEffect, useReducer } from 'react';
import * as Icons from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchDropdown from '../../components/SearchDropdown';
import Modal from '../../utils/ModelComponent';
import Skeleton from '../../utils/Skeleton';
import { getCattleFormOptions, getCattleBranchOptions } from '../../services/cattle.service';
import { previewBackfill, runBackfill } from '../../services/backfill.service';
import { useToast } from '../../contexts/MessageContext';
import { displayDate } from '../dashboard/dashboard.utils';

/*
 * Data backfill: fills gaps in the milk register for a past date range.
 *
 * The screen is deliberately two steps. Preview writes nothing and reports, day by day, what a run
 * would do - how many rows it would create and which days already hold entries. Only then does Run
 * appear, and overwriting a day that already has figures needs its own explicit tick.
 *
 * Scope, dates, the preview and the result all move together, so the whole screen is one reducer.
 */
const today = new Date().toLocaleDateString('en-CA');

const initialState = {
    dairyFarmOptions: [],
    branchOptions: [],
    dairyFarmId: '',
    branchId: '',
    fromDate: '',
    toDate: today,
    preview: null,
    result: null,
    overwrite: false,
    confirming: false,
    loading: false,
    running: false
};

function reducer(state, action) {
    switch (action.type) {

        case 'FARM_OPTIONS_LOADED':
            return { ...state, dairyFarmOptions: action.options };

        case 'BRANCH_OPTIONS_LOADED':
            return { ...state, branchOptions: action.options };

        // any change to the scope or the dates invalidates a preview: it described a different run
        case 'FARM_CHANGED':
            return { ...state, dairyFarmId: action.value, branchId: '', branchOptions: [], preview: null, result: null, overwrite: false };

        case 'SCOPE_CHANGED':
            return { ...state, [action.field]: action.value, preview: null, result: null, overwrite: false };

        case 'PREVIEW_LOADING':
            return { ...state, loading: true, result: null };

        case 'PREVIEW_LOADED':
            return { ...state, loading: false, preview: action.preview };

        case 'PREVIEW_FAILED':
            return { ...state, loading: false, preview: null };

        case 'OVERWRITE_TOGGLED':
            return { ...state, overwrite: action.value };

        case 'CONFIRMING':
            return { ...state, confirming: action.value };

        case 'RUNNING':
            return { ...state, running: true };

        case 'RUN_FINISHED':
            // the preview is cleared on success: those days are no longer empty, so the figures
            // on screen would be describing a state that no longer exists
            return {
                ...state, running: false, confirming: false,
                result: action.result || state.result,
                preview: action.result ? null : state.preview
            };

        default:
            return state;
    }
}

const STATUS_TONE = {
    empty: 'var(--text-tertiary)',
    'has entries': 'var(--warning)',
    filled: 'var(--success)',
    overwritten: 'var(--warning)',
    skipped: 'var(--text-tertiary)',
    failed: 'var(--danger)'
};

function Stat({ label, value, hint, tone }) {
    return (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3">
            <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums" style={{ color: tone || 'var(--text-primary)' }}>{value}</p>
            {hint && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{hint}</p>}
        </div>
    );
}

function Backfill() {

    const toast = useToast();
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(reducer, initialState);
    const { dairyFarmOptions, branchOptions, dairyFarmId, branchId, fromDate, toDate,
        preview, result, overwrite, confirming, loading, running } = state;

    useEffect(() => {
        (async () => {
            const res = await getCattleFormOptions();
            if (res?.success) {
                dispatch({
                    type: 'FARM_OPTIONS_LOADED',
                    options: (res?.data?.dairy_farms || []).map((farm) => ({
                        value: farm.dairy_farm_id,
                        label: `${farm.dairy_farm_name} (${farm.dairy_farm_code})`
                    }))
                });
            } else {
                toast.error(res?.error || res?.message || 'Unable to load dairy farms.');
            }
        })();
    }, []);

    useEffect(() => {
        if (!dairyFarmId) return;

        (async () => {
            const res = await getCattleBranchOptions({ dairy_farm_id: dairyFarmId });
            if (res?.success) {
                dispatch({
                    type: 'BRANCH_OPTIONS_LOADED',
                    options: (res?.data?.records || []).map((branch) => ({
                        value: branch.branch_id,
                        label: `${branch.branch_name}${branch.is_main_branch ? ' (Main)' : ''}`
                    }))
                });
            } else {
                toast.error(res?.error || res?.message || 'Unable to load branches.');
            }
        })();
    }, [dairyFarmId]);

    const handlePreview = async () => {

        if (!dairyFarmId || !fromDate || !toDate) {
            toast.warning('Choose a dairy farm and both dates first.');
            return;
        }

        dispatch({ type: 'PREVIEW_LOADING' });
        const res = await previewBackfill({
            dairy_farm_id: dairyFarmId,
            ...(branchId ? { branch_id: branchId } : {}),
            from_date: fromDate,
            to_date: toDate
        });

        if (res?.success) {
            dispatch({ type: 'PREVIEW_LOADED', preview: res?.data });
        } else {
            dispatch({ type: 'PREVIEW_FAILED' });
            toast.error(res?.error || res?.message || 'Unable to preview the backfill.');
        }
    };

    const handleRun = async () => {

        dispatch({ type: 'RUNNING' });
        const res = await runBackfill({
            dairy_farm_id: Number(dairyFarmId),
            ...(branchId ? { branch_id: Number(branchId) } : {}),
            from_date: fromDate,
            to_date: toDate,
            overwrite
        });

        if (res?.success) {
            dispatch({ type: 'RUN_FINISHED', result: res?.data });
            toast.success(res?.message || 'Backfill finished.');
        } else {
            dispatch({ type: 'RUN_FINISHED' });
            toast.error(res?.error || res?.message || 'The backfill failed.');
        }
    };

    // nothing to do when every day in the range already holds entries and overwrite is off
    const rowsToWrite = preview
        ? (overwrite
            ? preview.days.reduce((sum, d) => sum + (d.existing_entries ? preview.herd_size : d.would_write), 0)
            : preview.estimated_rows)
        : 0;

    return (

        <div className="space-y-4 p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            {/* ---------------- Header ---------------- */}

            <div className="flex flex-wrap items-start gap-3">

                <button type="button" title="Back" onClick={() => navigate('/dashboard')}
                    className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--card-border)]
                        text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]">
                    <Icons.ArrowLeft size={18} />
                </button>

                <div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">Data Backfill</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Fill gaps in the milk register for a past date range. Preview first - nothing is written until you run it.
                    </p>
                </div>

            </div>

            {/* ---------------- Scope ---------------- */}

            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5 lg:items-end">

                    <SearchDropdown name="dairy_farm_id" label="Dairy Farm" required
                        value={dairyFarmId} options={dairyFarmOptions} placeholder="Select Dairy Farm"
                        onChange={(e) => dispatch({ type: 'FARM_CHANGED', value: e.target.value })} />

                    <SearchDropdown name="branch_id" label="Branch" value={branchId} options={branchOptions}
                        placeholder="All branches" disabled={!dairyFarmId}
                        onChange={(e) => dispatch({ type: 'SCOPE_CHANGED', field: 'branchId', value: e.target.value })} />

                    <div className="mb-3">
                        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">From Date *</label>
                        <input type="date" value={fromDate} max={toDate || today}
                            onChange={(e) => dispatch({ type: 'SCOPE_CHANGED', field: 'fromDate', value: e.target.value })}
                            className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3
                                text-[var(--input-text)] outline-none focus:border-[var(--brand-primary)]" />
                    </div>

                    <div className="mb-3">
                        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">To Date *</label>
                        <input type="date" value={toDate} max={today} min={fromDate || undefined}
                            onChange={(e) => dispatch({ type: 'SCOPE_CHANGED', field: 'toDate', value: e.target.value })}
                            className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3
                                text-[var(--input-text)] outline-none focus:border-[var(--brand-primary)]" />
                    </div>

                    <div className="mb-3">
                        <button type="button" onClick={handlePreview} disabled={loading || !dairyFarmId}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--btn-primary-bg)]
                                px-4 py-3 font-medium text-[var(--btn-primary-text)] shadow-sm transition-all duration-200
                                hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
                            <Icons.Search size={18} />
                            {loading ? 'Checking...' : 'Preview'}
                        </button>
                    </div>

                </div>

                <p className="text-xs text-[var(--text-tertiary)]">
                    A run covers at most 31 days. Figures are generated from each animal's breed and type, and use the
                    herd that can produce milk <strong>today</strong> - for a range far back, animals since dried off are not included.
                </p>

            </div>

            {loading && <Skeleton variant="table" rows={5} columns={4} />}

            {/* ---------------- Preview ---------------- */}

            {!loading && preview && (
                <div className="space-y-4">

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Stat label="Milking animals" value={preview.herd_size} hint={`${preview.branches} branch(es)`} />
                        <Stat label="Days in range" value={preview.span_days} hint={`max ${preview.max_span_days}`} />
                        <Stat label="Empty days" value={preview.empty_days} tone="var(--success)" hint="will be filled" />
                        <Stat label="Days with entries" value={preview.filled_days}
                            tone={preview.filled_days ? 'var(--warning)' : undefined}
                            hint={preview.filled_days ? 'skipped unless overwritten' : 'none'} />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--table-row-bg)]">

                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--table-toolbar-border)]
                            bg-[var(--table-toolbar-bg)] px-4 py-3">

                            <p className="text-sm text-[var(--text-secondary)]">
                                <strong className="text-[var(--text-primary)]">{rowsToWrite}</strong> row(s) would be written
                            </p>

                            <div className="flex flex-wrap items-center gap-3">

                                {!!preview.filled_days && (
                                    <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                                        <input type="checkbox" checked={overwrite} disabled={running}
                                            onChange={(e) => dispatch({ type: 'OVERWRITE_TOGGLED', value: e.target.checked })}
                                            className="h-4 w-4 accent-[var(--danger)]" />
                                        Replace the {preview.filled_days} day(s) that already have entries
                                    </label>
                                )}

                                <button type="button" disabled={running || !rowsToWrite}
                                    onClick={() => dispatch({ type: 'CONFIRMING', value: true })}
                                    className="flex items-center gap-2 rounded-lg bg-[var(--btn-primary-bg)] px-4 py-2 text-sm font-medium
                                        text-[var(--btn-primary-text)] shadow-sm transition-all duration-200 hover:opacity-90
                                        active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
                                    <Icons.DatabaseBackup size={16} />
                                    {running ? 'Running...' : 'Run Backfill'}
                                </button>

                            </div>

                        </div>

                        <DayTable days={preview.days} mode="preview" />

                    </div>

                </div>
            )}

            {/* ---------------- Result ---------------- */}

            {result && (
                <div className="space-y-4">

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Stat label="Rows written" value={result.total_rows} tone="var(--success)" />
                        <Stat label="Litres generated" value={result.total_litres} />
                        <Stat label="Days filled" value={result.filled_days + result.overwritten_days}
                            hint={result.overwritten_days ? `${result.overwritten_days} overwritten` : undefined} />
                        <Stat label="Skipped / failed" value={`${result.skipped_days} / ${result.failed_days}`}
                            tone={result.failed_days ? 'var(--danger)' : undefined} />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--table-row-bg)]">
                        <div className="border-b border-[var(--table-toolbar-border)] bg-[var(--table-toolbar-bg)] px-4 py-3">
                            <p className="text-sm text-[var(--text-secondary)]">
                                Result for {displayDate(result.from_date)} to {displayDate(result.to_date)}
                            </p>
                        </div>
                        <DayTable days={result.days} mode="result" />
                    </div>

                </div>
            )}

            {!loading && !preview && !result && (
                <div className="rounded-2xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)]
                    p-10 text-center text-sm text-[var(--text-secondary)]">
                    Choose a dairy farm and a date range, then preview to see what would be written.
                </div>
            )}

            {/* ---------------- Confirmation ---------------- */}

            <Modal isOpen={confirming} onClose={() => !running && dispatch({ type: 'CONFIRMING', value: false })}
                onSubmit={handleRun} title="Run Data Backfill"
                primaryButtonName={running ? 'Running...' : 'Run Backfill'} secondaryButtonName="Cancel">

                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                    <p>
                        About to write <strong className="text-[var(--text-primary)]">{rowsToWrite}</strong> milk
                        production row(s) for {displayDate(fromDate)} to {displayDate(toDate)}.
                    </p>
                    {overwrite && !!preview?.filled_days && (
                        <p className="rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-[var(--danger-text)]">
                            {preview.filled_days} day(s) already hold entries and will be replaced. Figures recorded by hand
                            on those days will be lost.
                        </p>
                    )}
                    <p className="text-xs text-[var(--text-tertiary)]">
                        Each day is written separately, so a failure part way through keeps the days already done.
                    </p>
                </div>

            </Modal>

        </div>
    );
}

// the per-day breakdown, used for both the preview and the result
function DayTable({ days = [], mode }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">

                <thead>
                    <tr className="bg-[var(--table-header-bg)] text-[var(--table-header-text)]">
                        <th className="min-w-[8rem] border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Date</th>
                        <th className="min-w-[9rem] border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Status</th>
                        <th className="min-w-[7rem] border-b border-[var(--table-header-border)] px-4 py-3 text-right font-semibold">
                            {mode === 'preview' ? 'Existing' : 'Rows'}
                        </th>
                        <th className="min-w-[8rem] border-b border-[var(--table-header-border)] px-4 py-3 text-right font-semibold">
                            {mode === 'preview' ? 'Would write' : 'Litres'}
                        </th>
                        {mode === 'result' && (
                            <th className="min-w-[12rem] border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Note</th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {days.map((day) => (
                        <tr key={day.production_date} className="bg-[var(--table-row-bg)] transition-colors hover:bg-[var(--table-row-hover)]">

                            <td className="whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-2 text-[var(--text-primary)]">
                                {displayDate(day.production_date)}
                            </td>

                            <td className="whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-2">
                                <span className="text-xs font-medium" style={{ color: STATUS_TONE[day.status] || 'var(--text-secondary)' }}>
                                    {day.status}
                                </span>
                            </td>

                            <td className="border-b border-[var(--table-header-border)] px-4 py-2 text-right tabular-nums text-[var(--text-secondary)]">
                                {mode === 'preview' ? day.existing_entries : day.rows}
                            </td>

                            <td className="border-b border-[var(--table-header-border)] px-4 py-2 text-right tabular-nums text-[var(--text-primary)]">
                                {mode === 'preview' ? day.would_write : day.litres}
                            </td>

                            {mode === 'result' && (
                                <td className="border-b border-[var(--table-header-border)] px-4 py-2 text-xs text-[var(--text-tertiary)]">
                                    {day.reason || '-'}
                                </td>
                            )}

                        </tr>
                    ))}
                </tbody>

            </table>
        </div>
    );
}

export default Backfill;
