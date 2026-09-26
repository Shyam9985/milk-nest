import { useEffect, useReducer } from 'react';
import * as Icons from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchDropdown from '../../components/SearchDropdown';
import Skeleton from '../../utils/Skeleton';
import {
    getCattleFormOptions, getCattleBranchOptions,
    getMilkProductionSheet, saveMilkProductionSheet
} from '../../services/settings.service';
import { useToast } from '../../contexts/MessageContext';

/*
 * The day sheet: pick a branch and a date, get one row per animal at that branch and
 * fill in the morning and evening yields. Unlike the master screens this is a batch
 * editor - the whole day is saved in one request, and re-opening the same day loads
 * the saved figures back for correction.
 *
 * All of its state moves together (rows, edits, dirty flag), so it lives in one reducer.
 */
const initialState = {
    dairyFarmOptions: [],
    branchOptions: [],
    dairyFarmId: '',
    branchId: '',
    productionDate: new Date().toLocaleDateString('en-CA'),
    rows: [],
    entries: {},      // cattle_id -> editable values
    loadedFor: null,  // which branch/date the rows belong to
    loading: false,
    saving: false,
    dirty: false
};

// the editable columns, in grid order
const EDITABLE = ['morning_quantity', 'evening_quantity', 'fat_percentage', 'snf_percentage', 'remarks'];

const toEntry = (row) => ({
    morning_quantity: row.morning_quantity ?? '',
    evening_quantity: row.evening_quantity ?? '',
    fat_percentage: row.fat_percentage ?? '',
    snf_percentage: row.snf_percentage ?? '',
    remarks: row.remarks ?? ''
});

function reducer(state, action) {
    switch (action.type) {

        case 'FARM_OPTIONS_LOADED':
            return { ...state, dairyFarmOptions: action.options };

        case 'BRANCH_OPTIONS_LOADED':
            return { ...state, branchOptions: action.options };

        // changing the farm clears the branch below it, and any unsaved sheet with it
        case 'FARM_CHANGED':
            return { ...state, dairyFarmId: action.value, branchId: '', branchOptions: [], rows: [], entries: {}, loadedFor: null, dirty: false };

        case 'BRANCH_CHANGED':
            return { ...state, branchId: action.value, rows: [], entries: {}, loadedFor: null, dirty: false };

        case 'DATE_CHANGED':
            return { ...state, productionDate: action.value, rows: [], entries: {}, loadedFor: null, dirty: false };

        case 'SHEET_LOADING':
            return { ...state, loading: true };

        case 'SHEET_LOADED': {
            const entries = {};
            action.rows.forEach((row) => { entries[row.cattle_id] = toEntry(row); });
            return { ...state, loading: false, rows: action.rows, entries, loadedFor: action.loadedFor, dirty: false };
        }

        case 'SHEET_LOAD_FAILED':
            return { ...state, loading: false, rows: [], entries: {}, loadedFor: null };

        case 'CELL_CHANGED':
            return {
                ...state,
                dirty: true,
                entries: {
                    ...state.entries,
                    [action.cattleId]: { ...state.entries[action.cattleId], [action.field]: action.value }
                }
            };

        case 'SAVING':
            return { ...state, saving: true };

        case 'SAVE_FINISHED':
            return { ...state, saving: false };

        default:
            return state;
    }
}

// the running totals shown under the grid
const sumColumn = (entries, field) => Object.values(entries)
    .reduce((total, entry) => total + (Number(entry[field]) || 0), 0);

function MilkProduction() {

    const toast = useToast();
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(reducer, initialState);
    const { dairyFarmOptions, branchOptions, dairyFarmId, branchId, productionDate,
        rows, entries, loadedFor, loading, saving, dirty } = state;

    const today = new Date().toLocaleDateString('en-CA');

    useEffect(() => {
        (async () => {
            const result = await getCattleFormOptions();
            if (result?.success) {
                dispatch({
                    type: 'FARM_OPTIONS_LOADED',
                    options: (result?.data?.dairy_farms || []).map((farm) => ({
                        value: farm.dairy_farm_id,
                        label: `${farm.dairy_farm_name} (${farm.dairy_farm_code})`
                    }))
                });
            } else {
                toast.error(result?.error || result?.message || 'Unable to load dairy farms.');
            }
        })();
    }, []);

    // branches reload whenever the chosen farm changes
    useEffect(() => {
        if (!dairyFarmId) return;

        (async () => {
            const result = await getCattleBranchOptions({ dairy_farm_id: dairyFarmId });
            if (result?.success) {
                dispatch({
                    type: 'BRANCH_OPTIONS_LOADED',
                    options: (result?.data?.records || []).map((branch) => ({
                        value: branch.branch_id,
                        label: `${branch.branch_name}${branch.is_main_branch ? ' (Main)' : ''}`
                    }))
                });
            } else {
                toast.error(result?.error || result?.message || 'Unable to load branches.');
            }
        })();
    }, [dairyFarmId]);

    const loadSheet = async () => {

        if (!branchId || !productionDate) {
            toast.warning('Select a branch and a date first.');
            return;
        }

        dispatch({ type: 'SHEET_LOADING' });
        const result = await getMilkProductionSheet({ branch_id: branchId, production_date: productionDate });

        if (result?.success) {
            dispatch({
                type: 'SHEET_LOADED',
                rows: result?.data?.records || [],
                loadedFor: `${branchId}|${productionDate}`
            });
            if (!(result?.data?.records || []).length) {
                toast.info('No active cattle are recorded at this branch yet.');
            }
        } else {
            dispatch({ type: 'SHEET_LOAD_FAILED' });
            toast.error(result?.error || result?.message || 'Unable to load the day sheet.');
        }
    };

    const handleSave = async () => {

        dispatch({ type: 'SAVING' });

        const payload = {
            branch_id: Number(branchId),
            production_date: productionDate,
            entries: rows.map((row) => ({ cattle_id: row.cattle_id, ...entries[row.cattle_id] }))
        };

        const result = await saveMilkProductionSheet(payload);
        dispatch({ type: 'SAVE_FINISHED' });

        if (result?.success) {
            toast.success(result?.message || 'Milk production saved.');
            loadSheet(); // reload so generated totals and timestamps are the stored ones
        } else {
            toast.error(result?.error || result?.message || 'Unable to save the day sheet.');
        }
    };

    const morningTotal = sumColumn(entries, 'morning_quantity');
    const eveningTotal = sumColumn(entries, 'evening_quantity');
    const recordedCount = Object.values(entries)
        .filter((entry) => EDITABLE.some((field) => String(entry[field] ?? '').trim() !== '')).length;

    const cellClass = `w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-2 py-1.5
        text-right text-[var(--input-text)] outline-none focus:border-[var(--brand-primary)]`;

    return (

        <div className="space-y-4 p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            {/* ---------------- Header ---------------- */}

            <div className="flex flex-wrap items-center gap-3">

                <button type="button" title="Back" onClick={() => navigate('/dashboard')}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--card-border)]
                        text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]">
                    <Icons.ArrowLeft size={18} />
                </button>

                <div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">Milk Production</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Record the morning and evening yield for every animal at a branch, one day at a time.
                    </p>
                </div>

            </div>

            {/* ---------------- Sheet selection ---------------- */}

            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 lg:items-end">

                    <SearchDropdown name="dairy_farm_id" label="Dairy Farm" required
                        value={dairyFarmId} options={dairyFarmOptions} placeholder="Select Dairy Farm"
                        onChange={(e) => dispatch({ type: 'FARM_CHANGED', value: e.target.value })} />

                    <SearchDropdown name="branch_id" label="Branch" required
                        value={branchId} options={branchOptions} placeholder="Select Branch"
                        disabled={!dairyFarmId}
                        onChange={(e) => dispatch({ type: 'BRANCH_CHANGED', value: e.target.value })} />

                    <div className="mb-3">
                        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                            Production Date *
                        </label>
                        <input type="date" value={productionDate} max={today}
                            onChange={(e) => dispatch({ type: 'DATE_CHANGED', value: e.target.value })}
                            className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3
                                text-[var(--input-text)] outline-none focus:border-[var(--brand-primary)]" />
                    </div>

                    <div className="mb-3">
                        <button type="button" onClick={loadSheet} disabled={loading || !branchId}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--btn-primary-bg)]
                                px-4 py-3 font-medium text-[var(--btn-primary-text)] shadow-sm transition-all duration-200
                                hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
                            <Icons.ClipboardList size={18} />
                            {loading ? 'Loading...' : 'Load Day Sheet'}
                        </button>
                    </div>

                </div>

            </div>

            {/* ---------------- Day sheet ---------------- */}

            {loading && <Skeleton variant="table" rows={5} columns={6} />}

            {!loading && !loadedFor && (
                <div className="rounded-2xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)]
                    p-10 text-center text-sm text-[var(--text-secondary)]">
                    Choose a dairy farm, branch and date, then load the day sheet to start recording.
                </div>
            )}

            {!loading && loadedFor && !rows.length && (
                <div className="rounded-2xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)]
                    p-10 text-center text-sm text-[var(--text-secondary)]">
                    No active cattle at this branch. Add cattle first from Settings, then record their yield here.
                </div>
            )}

            {!loading && !!rows.length && (

                <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--table-row-bg)] shadow-[var(--shadow-sm)]">

                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--table-toolbar-border)]
                        bg-[var(--table-toolbar-bg)] px-4 py-3">

                        <p className="text-sm text-[var(--text-secondary)]">
                            <strong className="text-[var(--text-primary)]">{rows.length}</strong> cattle
                            &middot; <strong className="text-[var(--text-primary)]">{recordedCount}</strong> with entries
                            {dirty && <span className="ml-2 text-[var(--warning)]">unsaved changes</span>}
                        </p>

                        <button type="button" onClick={handleSave} disabled={saving || !dirty}
                            className="flex items-center gap-2 rounded-lg bg-[var(--btn-primary-bg)] px-4 py-2 text-sm font-medium
                                text-[var(--btn-primary-text)] shadow-sm transition-all duration-200 hover:opacity-90
                                active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
                            <Icons.Save size={16} />
                            {saving ? 'Saving...' : 'Save Day Sheet'}
                        </button>

                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full border-collapse text-sm">

                            <thead>
                                <tr className="bg-[var(--table-header-bg)] text-[var(--table-header-text)]">
                                    <th className="min-w-[10rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Cattle</th>
                                    <th className="min-w-[8rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Type / Breed</th>
                                    <th className="min-w-[7rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-right font-semibold">Morning (L)</th>
                                    <th className="min-w-[7rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-right font-semibold">Evening (L)</th>
                                    <th className="min-w-[6rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-right font-semibold">Total (L)</th>
                                    <th className="min-w-[6rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-right font-semibold">Fat %</th>
                                    <th className="min-w-[6rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-right font-semibold">SNF %</th>
                                    <th className="min-w-[12rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Remarks</th>
                                </tr>
                            </thead>

                            <tbody>

                                {rows.map((row) => {

                                    const entry = entries[row.cattle_id] || {};
                                    const rowTotal = (Number(entry.morning_quantity) || 0) + (Number(entry.evening_quantity) || 0);

                                    const onCell = (field) => (e) => dispatch({
                                        type: 'CELL_CHANGED', cattleId: row.cattle_id, field, value: e.target.value
                                    });

                                    return (
                                        <tr key={row.cattle_id} className="bg-[var(--table-row-bg)] transition-colors hover:bg-[var(--table-row-hover)]">

                                            <td className="border-b border-[var(--table-header-border)] px-4 py-2 text-[var(--text-primary)]">
                                                <span className="font-medium">{row.cattle_unique_code}</span>
                                                {row.gender_nm && <span className="ml-2 text-xs text-[var(--text-secondary)]">{row.gender_nm}</span>}
                                            </td>

                                            <td className="border-b border-[var(--table-header-border)] px-4 py-2 text-[var(--text-secondary)]">
                                                {row.cattle_type_name} / {row.breed_name}
                                            </td>

                                            <td className="border-b border-[var(--table-header-border)] px-2 py-2">
                                                <input type="number" step="0.01" min="0" value={entry.morning_quantity ?? ''}
                                                    onChange={onCell('morning_quantity')} className={cellClass} placeholder="0.00" />
                                            </td>

                                            <td className="border-b border-[var(--table-header-border)] px-2 py-2">
                                                <input type="number" step="0.01" min="0" value={entry.evening_quantity ?? ''}
                                                    onChange={onCell('evening_quantity')} className={cellClass} placeholder="0.00" />
                                            </td>

                                            <td className="border-b border-[var(--table-header-border)] px-4 py-2 text-right font-medium text-[var(--text-primary)]">
                                                {rowTotal ? rowTotal.toFixed(2) : '-'}
                                            </td>

                                            <td className="border-b border-[var(--table-header-border)] px-2 py-2">
                                                <input type="number" step="0.01" min="0" value={entry.fat_percentage ?? ''}
                                                    onChange={onCell('fat_percentage')} className={cellClass} placeholder="-" />
                                            </td>

                                            <td className="border-b border-[var(--table-header-border)] px-2 py-2">
                                                <input type="number" step="0.01" min="0" value={entry.snf_percentage ?? ''}
                                                    onChange={onCell('snf_percentage')} className={cellClass} placeholder="-" />
                                            </td>

                                            <td className="border-b border-[var(--table-header-border)] px-2 py-2">
                                                <input type="text" value={entry.remarks ?? ''} maxLength={500}
                                                    onChange={onCell('remarks')}
                                                    className={`${cellClass} text-left`} placeholder="Optional" />
                                            </td>

                                        </tr>
                                    );
                                })}

                            </tbody>

                            <tfoot>
                                <tr className="bg-[var(--table-header-bg)] font-semibold text-[var(--table-header-text)]">
                                    <td className="px-4 py-3" colSpan={2}>Day total</td>
                                    <td className="px-4 py-3 text-right">{morningTotal.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right">{eveningTotal.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right">{(morningTotal + eveningTotal).toFixed(2)}</td>
                                    <td className="px-4 py-3" colSpan={3}></td>
                                </tr>
                            </tfoot>

                        </table>

                    </div>

                </div>
            )}

        </div>
    );
}

export default MilkProduction;
