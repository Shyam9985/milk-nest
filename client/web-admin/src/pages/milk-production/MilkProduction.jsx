import { useEffect, useReducer } from 'react';
import * as Icons from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchDropdown from '../../components/SearchDropdown';
import Skeleton from '../../utils/Skeleton';
import Modal from '../../utils/ModelComponent';
import { getCattleFormOptions, getCattleBranchOptions } from '../../services/cattle.service';
import { getMilkProductionSheet, saveMilkProductionSheet } from '../../services/settings.service';
import { markDryOff } from '../../services/breeding.service';
import { markManualDryOff } from '../../services/milkEligibility.service';
import { useToast } from '../../contexts/MessageContext';

/*
 * The day sheet: pick a branch and a date, get one row per animal at that branch and
 * fill in the morning and evening yields. Unlike the master screens this is a batch
 * editor - the whole day is saved in one request, and re-opening the same day loads
 * the saved figures back for correction.
 *
 * It is also where a cow stopping is actually noticed - the incharge is standing in front of
 * an empty bucket - so drying her off is a row action here rather than a trip to the breeding
 * register. Two different things can happen behind that one button, see handleMarkDry.
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
    dirty: false,
    marking: null,    // the row being taken off the sheet
    markDate: new Date().toLocaleDateString('en-CA'),
    markRemarks: '',
    markSubmitting: false
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

        // the dry-off date defaults to today, which is almost always the right answer
        case 'MARK_REQUESTED':
            return { ...state, marking: action.row, markDate: state.productionDate, markRemarks: '' };

        case 'MARK_FIELD_CHANGED':
            return { ...state, [action.field]: action.value };

        case 'MARK_CANCELLED':
            return { ...state, marking: null, markRemarks: '' };

        case 'MARK_SUBMITTING':
            return { ...state, markSubmitting: true };

        case 'MARK_FINISHED':
            return { ...state, markSubmitting: false, marking: action.keepOpen ? state.marking : null };

        default:
            return state;
    }
}

// the badges under the cattle code. only an animal with a pregnancy in flight has any
const TONE_COLOR = { warning: 'var(--warning)', info: 'var(--info)' };

// the running totals shown under the grid
const sumColumn = (entries, field) => Object.values(entries)
    .reduce((total, entry) => total + (Number(entry[field]) || 0), 0);

function MilkProduction() {

    const toast = useToast();
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(reducer, initialState);
    const { dairyFarmOptions, branchOptions, dairyFarmId, branchId, productionDate,
        rows, entries, loadedFor, loading, saving, dirty,
        marking, markDate, markRemarks, markSubmitting } = state;

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

    /*
     * Taking an animal off the sheet. Which endpoint is called depends on WHY she stopped:
     *
     *   - she is pregnant  -> this is her dry-off, so it belongs on the pregnancy record. The
     *                         breeding endpoint stores the actual dry-off date and the server
     *                         blocks her milk in the same transaction.
     *   - she is not       -> nothing in the data explains it, so it is recorded as a manual
     *                         block. That is the one reason no rule can derive, and it is
     *                         deliberately never overridden by one.
     *
     * Either way the server owns the flag - the screen never decides eligibility itself.
     */
    const handleMarkDry = async () => {

        // the modal's primary button stays enabled, so a double click is guarded here
        if (!marking || markSubmitting) return;

        dispatch({ type: 'MARK_SUBMITTING' });

        const result = marking.pregnancy_id
            ? await markDryOff(marking.pregnancy_id, { actual_dry_off_date: markDate })
            : await markManualDryOff(marking.cattle_id, { remarks: markRemarks || undefined });

        if (result?.success) {
            dispatch({ type: 'MARK_FINISHED' });
            toast.success(result?.message || `${marking.cattle_unique_code} marked as dry.`);
            loadSheet(); // she is off the sheet now, so the grid has to come back from the server
        } else {
            // kept open so the message can be read against the animal it is about
            dispatch({ type: 'MARK_FINISHED', keepOpen: true });
            toast.error(result?.error || result?.message || 'Unable to mark her as dry.');
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
                                    <th className="whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-center font-semibold">Actions</th>
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

                                                {/* she is still being milked while carrying - the badge is the nudge to dry her off */}
                                                {!!row.pregnancy_id && (
                                                    <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium"
                                                        style={{ color: TONE_COLOR[Number(row.dry_off_due) ? 'warning' : 'info'] }}>
                                                        {Number(row.dry_off_due)
                                                            ? <><Icons.TriangleAlert size={13} /> Dry-off due</>
                                                            : <><Icons.Baby size={13} /> Pregnant</>}
                                                        {row.days_pregnant != null && ` · ${row.days_pregnant}d`}
                                                    </span>
                                                )}
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

                                            <td className="border-b border-[var(--table-header-border)] px-4 py-2 text-center">
                                                <button type="button" title="She has stopped giving milk"
                                                    onClick={() => dirty
                                                        ? toast.warning('Save the day sheet first - marking her dry reloads the grid.')
                                                        : dispatch({ type: 'MARK_REQUESTED', row })}
                                                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs
                                                        font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)]
                                                        hover:text-[var(--text-primary)]">
                                                    <Icons.MoonStar size={14} /> Mark dry
                                                </button>
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
                                    <td className="px-4 py-3" colSpan={4}></td>
                                </tr>
                            </tfoot>

                        </table>

                    </div>

                </div>
            )}

            {/* ---------------- Mark dry ---------------- */}

            <Modal isOpen={!!marking} onClose={() => !markSubmitting && dispatch({ type: 'MARK_CANCELLED' })}
                onSubmit={handleMarkDry} title="Mark as Dry"
                primaryButtonName={markSubmitting ? 'Saving...' : 'Mark Dry'} secondaryButtonName="Cancel">

                <div className="space-y-3 text-sm text-[var(--text-secondary)]">

                    <p>
                        <strong className="text-[var(--text-primary)]">{marking?.cattle_unique_code}</strong> will be
                        removed from the milking sheet from tomorrow. Today's figures stay as recorded.
                    </p>

                    {marking?.pregnancy_id ? (
                        <>
                            <p className="text-xs">
                                This is recorded against her current pregnancy, so the breeding register shows when
                                she was dried off and she comes back automatically once you record the calving.
                            </p>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                                    Dry-off Date *
                                </label>
                                <input type="date" value={markDate} max={today} disabled={markSubmitting}
                                    onChange={(e) => dispatch({ type: 'MARK_FIELD_CHANGED', field: 'markDate', value: e.target.value })}
                                    className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2
                                        text-[var(--input-text)] outline-none focus:border-[var(--brand-primary)]" />
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-xs">
                                She has no pregnancy on record, so this is saved as a manual mark. She stays off the
                                sheet until someone puts her back - no rule will undo it.
                            </p>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-[var(--text-primary)]">Reason</label>
                                <input type="text" value={markRemarks} maxLength={500} disabled={markSubmitting}
                                    placeholder="e.g. yield dropped to nothing over the last week"
                                    onChange={(e) => dispatch({ type: 'MARK_FIELD_CHANGED', field: 'markRemarks', value: e.target.value })}
                                    className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2
                                        text-[var(--input-text)] outline-none focus:border-[var(--brand-primary)]" />
                                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                                    Kept in the audit trail against your name and the time.
                                </p>
                            </div>
                        </>
                    )}

                </div>

            </Modal>

        </div>
    );
}

export default MilkProduction;
