import { useEffect, useReducer } from 'react';
import * as Icons from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SideDrawer from '../../utils/SideDrawer';
import Modal from '../../utils/ModelComponent';
import Skeleton from '../../utils/Skeleton';
import RowAction from '../../components/RowAction';
import AuthInput from '../../components/AuthInput';
import TreatmentForm from './TreatmentForm';
import CheckupForm from './CheckupForm';
import EntityLink from '../profiles/components/EntityLink';
import ProfileDrawer from '../profiles/ProfileDrawer';
import useProfileDrawer from '../profiles/useProfileDrawer';
import {
    getHealthRegister, createTreatment, updateTreatment, closeTreatment,
    reopenTreatment, deleteTreatment, getCheckups, addCheckup, deleteCheckup
} from '../../services/health.service';
import { useToast } from '../../contexts/MessageContext';
import { displayDate, todayLocal } from '../dashboard/dashboard.utils';

/*
 * The health register: every illness episode, what stage it is at, and the visits recorded
 * against it.
 *
 * An episode is the illness, a checkup is a visit. "Mastitis from the 3rd" is one row here with
 * three checkups under it - which is what makes "what did this mastitis cost" and "what did the
 * vet say last time" answerable at all.
 *
 * The screen never decides whether an animal can be milked. Filling "hold milk until" is what
 * takes her off the sheet, and the server owns that flag.
 */
const STATUS_TABS = [
    { key: 'open', label: 'Under treatment' },
    { key: 'cured', label: 'Cured' },
    { key: '', label: 'All' }
];

const initialState = {
    records: [],
    cattle: [],
    illnesses: [],
    permissions: {},
    status: 'open',
    loading: true,
    refreshing: false,
    drawer: null,            // 'treatment' | 'checkup' | 'history'
    activeRecord: null,
    cureDate: todayLocal(),
    confirming: null,        // { action: 'cure' | 'reopen' | 'delete' | 'delete-checkup', record }
    checkups: [],
    checkupsLoading: false,
    submitting: false
};

function reducer(state, action) {
    switch (action.type) {

        case 'LOADING':
            return { ...state, loading: !state.records.length, refreshing: !!state.records.length };

        case 'LOADED':
            return {
                ...state, records: action.records, cattle: action.cattle, illnesses: action.illnesses,
                permissions: action.permissions, loading: false, refreshing: false
            };

        case 'LOAD_FAILED':
            return { ...state, loading: false, refreshing: false };

        case 'STATUS_CHANGED':
            return { ...state, status: action.status };

        case 'DRAWER_OPENED':
            return {
                ...state, drawer: action.drawer, activeRecord: action.record || null,
                cureDate: todayLocal(), checkups: action.drawer === 'history' ? [] : state.checkups
            };

        case 'DRAWER_CLOSED':
            return { ...state, drawer: null, activeRecord: null, checkups: [] };

        case 'CURE_DATE_CHANGED':
            return { ...state, cureDate: action.value };

        case 'CONFIRMING':
            return { ...state, confirming: action.confirming };

        case 'CHECKUPS_LOADING':
            return { ...state, checkupsLoading: true };

        case 'CHECKUPS_LOADED':
            return { ...state, checkups: action.checkups, checkupsLoading: false };

        case 'CHECKUPS_FAILED':
            return { ...state, checkupsLoading: false };

        case 'SUBMITTING':
            return { ...state, submitting: action.submitting };

        default:
            return state;
    }
}

/*
 * What this episode needs today. Ordered by urgency, first match wins - a withdrawal breach is
 * the only one with a cost outside the system, so it outranks everything.
 */
const describeStage = (record, today) => {
    if (Number(record.withdrawal_active) && Number(record.can_produce_milk)) {
        return { label: 'Milk not held!', tone: 'critical', Icon: Icons.OctagonAlert };
    }
    if (Number(record.withdrawal_active)) {
        const left = Number(record.withdrawal_days_left);
        return { label: `Milk held · ${left}d left`, tone: 'warning', Icon: Icons.MilkOff };
    }
    if (record.cure_date) return { label: 'Cured', tone: 'good', Icon: Icons.CircleCheck };
    if (record.next_checkup_date && record.next_checkup_date <= today) {
        return { label: 'Checkup due', tone: 'warning', Icon: Icons.TriangleAlert };
    }
    return { label: 'Under treatment', tone: 'info', Icon: Icons.Stethoscope };
};

const TONE_COLOR = {
    critical: 'var(--danger)', warning: 'var(--warning)', good: 'var(--success)',
    info: 'var(--info)', muted: 'var(--text-tertiary)'
};

const SEVERITY_COLOR = {
    mild: 'var(--text-tertiary)', moderate: 'var(--warning)', severe: 'var(--danger)'
};

// MasterForm hands back strings; ids and money have to be numbers, and '' means "not given"
const cleanPayload = (payload, numericFields = []) => {
    const cleaned = {};
    Object.entries(payload).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) return;
        cleaned[key] = numericFields.includes(key) ? Number(value) : value;
    });
    return cleaned;
};

function Health() {

    const toast = useToast();
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(reducer, initialState);
    const profileDrawer = useProfileDrawer();
    const { records, cattle, illnesses, permissions, status, loading, refreshing, drawer,
        activeRecord, cureDate, confirming, checkups, checkupsLoading, submitting } = state;

    const today = todayLocal();

    const load = async () => {
        dispatch({ type: 'LOADING' });
        const result = await getHealthRegister(status ? { status } : {});

        if (result?.success) {
            dispatch({
                type: 'LOADED',
                records: result?.data?.records || [],
                cattle: result?.data?.cattle || [],
                illnesses: result?.data?.illnesses || [],
                permissions: result?.data?.permissions || {}
            });
        } else {
            dispatch({ type: 'LOAD_FAILED' });
            toast.error(result?.error || result?.message || 'Unable to load the health register.');
        }
    };

    useEffect(() => {
        load();
    }, [status]);

    // the visit history is fetched on demand, not with every row of the register
    const loadCheckups = async (treatmentId) => {
        dispatch({ type: 'CHECKUPS_LOADING' });
        const result = await getCheckups(treatmentId);

        if (result?.success) {
            dispatch({ type: 'CHECKUPS_LOADED', checkups: result?.data?.records || [] });
        } else {
            dispatch({ type: 'CHECKUPS_FAILED' });
            toast.error(result?.error || result?.message || 'Unable to load the checkup history.');
        }
    };

    const openHistory = (record) => {
        dispatch({ type: 'DRAWER_OPENED', drawer: 'history', record });
        loadCheckups(record.treatment_id);
    };

    // every action shares this shape: submit, report, reload
    const runAction = async (label, call, { keepDrawer = false } = {}) => {
        dispatch({ type: 'SUBMITTING', submitting: true });
        const result = await call();
        dispatch({ type: 'SUBMITTING', submitting: false });

        if (result?.success) {
            toast.success(result?.message || `${label} saved.`);
            dispatch({ type: 'CONFIRMING', confirming: null });
            if (!keepDrawer) dispatch({ type: 'DRAWER_CLOSED' });
            load();
            return true;
        }

        toast.error(result?.error || result?.message || `Unable to ${label.toLowerCase()}.`);
        return false;
    };

    const handleTreatmentSubmit = (payload) => {
        const body = cleanPayload(payload, ['cattle_id', 'illness_id']);
        return runAction(
            activeRecord ? 'Update treatment' : 'Record treatment',
            () => activeRecord
                ? updateTreatment(activeRecord.treatment_id, body)
                : createTreatment(body)
        );
    };

    const handleCheckupSubmit = (payload) =>
        runAction('Add checkup', () => addCheckup(activeRecord.treatment_id, cleanPayload(payload, ['expense'])));

    const handleConfirm = async () => {
        const { action, record } = confirming;

        if (action === 'cure') return runAction('Mark cured', () => closeTreatment(record.treatment_id, { cure_date: cureDate }));
        if (action === 'reopen') return runAction('Reopen treatment', () => reopenTreatment(record.treatment_id));
        if (action === 'delete') return runAction('Delete treatment', () => deleteTreatment(record.treatment_id));

        // a checkup is deleted from inside the history drawer, which stays open behind it
        const done = await runAction('Delete checkup', () => deleteCheckup(record.history_id), { keepDrawer: true });
        if (done && activeRecord) loadCheckups(activeRecord.treatment_id);
    };

    const canWrite = permissions?.can_insert || permissions?.can_update;
    const checkupTotal = checkups.reduce((total, checkup) => total + (Number(checkup.expense) || 0), 0);

    return (

        <div className="space-y-4 p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            {/* ---------------- Header ---------------- */}

            <div className="flex flex-wrap items-center justify-between gap-3">

                <div className="flex items-start gap-3">
                    <button type="button" title="Back" onClick={() => navigate('/dashboard')}
                        className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--card-border)]
                            text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]">
                        <Icons.ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Health Register</h2>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            Illnesses, medication and vet visits. Holding an animal's milk here removes her from the milking sheet.
                        </p>
                    </div>
                </div>

                {permissions?.can_insert && (
                    <button type="button" onClick={() => dispatch({ type: 'DRAWER_OPENED', drawer: 'treatment' })}
                        disabled={!cattle.length || !illnesses.length}
                        title={illnesses.length
                            ? 'Record a new illness'
                            : 'Add at least one illness under Settings, Illness Master first'}
                        className="flex items-center gap-2 rounded-lg bg-[var(--btn-primary-bg)] px-4 py-2 text-sm font-medium
                            text-[var(--btn-primary-text)] shadow-sm transition-all duration-200 hover:opacity-90
                            active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
                        <Icons.Plus size={16} /> Record Illness
                    </button>
                )}

            </div>

            {/* ---------------- Status tabs ---------------- */}

            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] p-1">
                {STATUS_TABS.map((tab) => (
                    <button key={tab.key || 'all'} type="button"
                        onClick={() => dispatch({ type: 'STATUS_CHANGED', status: tab.key })}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors
                            ${status === tab.key
                                ? 'bg-[var(--toggle-active-bg)] text-[var(--toggle-active-text)]'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'}`}>
                        {tab.label}
                    </button>
                ))}
                <button type="button" onClick={load} disabled={refreshing} title="Refresh"
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-secondary)]
                        transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-50">
                    <Icons.RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* ---------------- Register ---------------- */}

            {loading && <Skeleton variant="table" rows={5} columns={6} />}

            {!loading && !records.length && (
                <div className="rounded-2xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)]
                    p-10 text-center text-sm text-[var(--text-secondary)]">
                    {status === 'open'
                        ? 'No animal is under treatment. Record an illness to start tracking medication and costs.'
                        : 'Nothing to show for this filter.'}
                </div>
            )}

            {!loading && !!records.length && (
                <div className={`overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--table-row-bg)]
                    shadow-[var(--shadow-sm)] transition-opacity ${refreshing ? 'opacity-60' : ''}`}>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">

                            <thead>
                                <tr className="bg-[var(--table-header-bg)] text-[var(--table-header-text)]">
                                    <th className="min-w-[11rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Cattle</th>
                                    <th className="min-w-[10rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Illness</th>
                                    <th className="min-w-[11rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Status</th>
                                    <th className="min-w-[8rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Started</th>
                                    <th className="min-w-[7rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-center font-semibold">Checkups</th>
                                    <th className="min-w-[7rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-right font-semibold">Spent</th>
                                    <th className="min-w-[9rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Branch</th>
                                    {canWrite && <th className="min-w-[12rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-right font-semibold">Actions</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {records.map((record) => {

                                    const stage = describeStage(record, today);
                                    const isOpen = !record.cure_date;

                                    return (
                                        <tr key={record.treatment_id} className="border-b border-[var(--table-cell-border)] transition-colors hover:bg-[var(--table-row-hover)]">

                                            <td className="whitespace-nowrap px-4 py-3">
                                                <EntityLink type="cattle" id={record.cattle_id} onNavigate={profileDrawer.open}>
                                                    {record.cattle_unique_code}
                                                </EntityLink>
                                                <p className="text-xs text-[var(--text-tertiary)]">
                                                    {record.cattle_type_name}{record.breed_name ? ` · ${record.breed_name}` : ''}
                                                </p>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span className="text-[var(--text-primary)]">{record.illness_name}</span>
                                                <p className="text-xs capitalize" style={{ color: SEVERITY_COLOR[record.severity] }}>
                                                    {record.severity}
                                                </p>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: TONE_COLOR[stage.tone] }}>
                                                    <stage.Icon size={14} /> {stage.label}
                                                </span>
                                                {isOpen && (
                                                    <p className="text-xs text-[var(--text-tertiary)]">
                                                        {record.days_open} day{Number(record.days_open) === 1 ? '' : 's'} open
                                                        {record.next_checkup_date ? ` · next ${displayDate(record.next_checkup_date)}` : ''}
                                                    </p>
                                                )}
                                                {!isOpen && record.milk_withdrawal_until && (
                                                    <p className="text-xs text-[var(--text-tertiary)]">
                                                        milk held to {displayDate(record.milk_withdrawal_until)}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
                                                {displayDate(record.start_date)}
                                                {record.cure_date && (
                                                    <p className="text-xs text-[var(--text-tertiary)]">cured {displayDate(record.cure_date)}</p>
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-center">
                                                <RowAction tone="primary" icon={Icons.NotebookPen}
                                                    title="See every visit recorded against this illness"
                                                    onClick={() => openHistory(record)}>
                                                    {record.checkup_count}
                                                </RowAction>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-right text-[var(--text-primary)]">
                                                {Number(record.total_expense) ? Number(record.total_expense).toFixed(2) : '-'}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">{record.branch_name}</td>

                                            {canWrite && (
                                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">

                                                        {isOpen && permissions?.can_insert && (
                                                            <RowAction tone="primary" icon={Icons.Plus}
                                                                title="Record a vet visit or medication"
                                                                onClick={() => dispatch({ type: 'DRAWER_OPENED', drawer: 'checkup', record })}>
                                                                Add checkup
                                                            </RowAction>
                                                        )}

                                                        {isOpen && permissions?.can_update && (
                                                            <RowAction tone="success" icon={Icons.CircleCheck}
                                                                title="She has recovered"
                                                                onClick={() => dispatch({ type: 'CONFIRMING', confirming: { action: 'cure', record } })}>
                                                                Cured
                                                            </RowAction>
                                                        )}

                                                        {!isOpen && permissions?.can_update && (
                                                            <RowAction tone="warning" icon={Icons.RotateCcw}
                                                                title="Closed by mistake, or she relapsed"
                                                                onClick={() => dispatch({ type: 'CONFIRMING', confirming: { action: 'reopen', record } })}>
                                                                Reopen
                                                            </RowAction>
                                                        )}

                                                        {permissions?.can_update && (
                                                            <RowAction iconOnly icon={Icons.Pencil}
                                                                title="Edit the dates, severity or withdrawal period"
                                                                onClick={() => dispatch({ type: 'DRAWER_OPENED', drawer: 'treatment', record })} />
                                                        )}

                                                        {permissions?.can_delete && (
                                                            <RowAction iconOnly tone="danger" icon={Icons.Trash2}
                                                                title="Remove this record"
                                                                onClick={() => dispatch({ type: 'CONFIRMING', confirming: { action: 'delete', record } })} />
                                                        )}

                                                    </div>
                                                </td>
                                            )}

                                        </tr>
                                    );
                                })}
                            </tbody>

                        </table>
                    </div>

                </div>
            )}

            {/* ---------------- Record / edit an illness ---------------- */}

            <SideDrawer isOpen={drawer === 'treatment'} onClose={() => !submitting && dispatch({ type: 'DRAWER_CLOSED' })}
                title={activeRecord ? 'Update Treatment' : 'Record Illness'} drawerSize="xs">

                <TreatmentForm
                    cattle={activeRecord
                        ? [{ cattle_id: activeRecord.cattle_id, cattle_unique_code: activeRecord.cattle_unique_code, cattle_type_name: activeRecord.cattle_type_name, breed_name: activeRecord.breed_name }]
                        : cattle}
                    illnesses={activeRecord
                        ? [{ illness_id: activeRecord.illness_id, illness_name: activeRecord.illness_name }]
                        : illnesses}
                    initialValues={activeRecord}
                    submitting={submitting}
                    onSubmit={handleTreatmentSubmit}
                    onCancel={() => dispatch({ type: 'DRAWER_CLOSED' })}
                />

            </SideDrawer>

            {/* ---------------- Add a checkup ---------------- */}

            <SideDrawer isOpen={drawer === 'checkup'} onClose={() => !submitting && dispatch({ type: 'DRAWER_CLOSED' })}
                title="Add Checkup" drawerSize="xs">

                {activeRecord && (
                    <CheckupForm
                        treatment={activeRecord}
                        submitting={submitting}
                        onSubmit={handleCheckupSubmit}
                        onCancel={() => dispatch({ type: 'DRAWER_CLOSED' })}
                    />
                )}

            </SideDrawer>

            {/* ---------------- Visit history ---------------- */}

            <SideDrawer isOpen={drawer === 'history'} onClose={() => !submitting && dispatch({ type: 'DRAWER_CLOSED' })}
                title="Checkup History" drawerSize="sm">

                <div>

                    <div className="mb-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm">
                        <p className="font-medium text-[var(--text-primary)]">
                            {activeRecord?.cattle_unique_code} · {activeRecord?.illness_name}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                            Started {displayDate(activeRecord?.start_date)}
                            {activeRecord?.cure_date ? ` · cured ${displayDate(activeRecord.cure_date)}` : ' · still open'}
                            {checkups.length ? ` · ${checkupTotal.toFixed(2)} spent over ${checkups.length} visit(s)` : ''}
                        </p>
                    </div>

                    {checkupsLoading && <Skeleton variant="card" count={2} />}

                    {!checkupsLoading && !checkups.length && (
                        <p className="rounded-lg border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)]
                            px-3 py-6 text-center text-xs text-[var(--text-tertiary)]">
                            No visit recorded yet. Add a checkup to log the medicines given and what they cost.
                        </p>
                    )}

                    {!checkupsLoading && checkups.map((checkup) => (
                        <div key={checkup.history_id} className="mb-3 rounded-xl border border-[var(--card-border)] p-3">

                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                        {displayDate(checkup.checkup_date)}
                                        {Number(checkup.expense) ? <span className="ml-2 text-xs text-[var(--text-secondary)]">{Number(checkup.expense).toFixed(2)}</span> : null}
                                    </p>
                                    {checkup.attended_by && (
                                        <p className="text-xs text-[var(--text-tertiary)]">{checkup.attended_by}</p>
                                    )}
                                </div>

                                {permissions?.can_delete && (
                                    <RowAction iconOnly tone="danger" icon={Icons.Trash2} title="Remove this visit"
                                        onClick={() => dispatch({ type: 'CONFIRMING', confirming: { action: 'delete-checkup', record: checkup } })} />
                                )}
                            </div>

                            {checkup.medicines && (
                                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                                    <span className="text-[var(--text-tertiary)]">Medicines: </span>{checkup.medicines}
                                </p>
                            )}

                            {checkup.observation && (
                                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                    <span className="text-[var(--text-tertiary)]">Observation: </span>{checkup.observation}
                                </p>
                            )}

                            {checkup.next_checkup_date && (
                                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                                    Next checkup {displayDate(checkup.next_checkup_date)}
                                </p>
                            )}

                        </div>
                    ))}

                </div>

            </SideDrawer>

            {/* ---------------- Confirmations ---------------- */}

            <Modal isOpen={!!confirming} onClose={() => !submitting && dispatch({ type: 'CONFIRMING', confirming: null })}
                onSubmit={handleConfirm}
                title={confirming?.action === 'cure' ? 'Mark as Cured'
                    : confirming?.action === 'reopen' ? 'Reopen Treatment'
                        : confirming?.action === 'delete' ? 'Delete Treatment' : 'Delete Checkup'}
                primaryButtonName={confirming?.action === 'cure' ? 'Mark Cured'
                    : confirming?.action === 'reopen' ? 'Reopen' : 'Delete'}
                secondaryButtonName="Cancel">

                {confirming?.action === 'cure' && (
                    <div>
                        <p className="text-sm text-[var(--text-secondary)]">
                            <strong className="text-[var(--text-primary)]">{confirming?.record?.cattle_unique_code}</strong> has
                            recovered from {confirming?.record?.illness_name}.
                            {confirming?.record?.milk_withdrawal_until && Number(confirming?.record?.withdrawal_active)
                                ? ` Her milk stays on hold until ${displayDate(confirming.record.milk_withdrawal_until)} - residue outlives the symptoms.`
                                : ' She returns to the milking sheet if nothing else holds her back.'}
                        </p>

                        <div className="mt-3">
                            <AuthInput name="cure_date" type="date" label="Cure Date *"
                                value={cureDate} max={today} min={confirming?.record?.start_date} disabled={submitting}
                                onChange={(e) => dispatch({ type: 'CURE_DATE_CHANGED', value: e.target.value })} />
                        </div>
                    </div>
                )}

                {confirming?.action === 'reopen' && (
                    <p>
                        Reopen the {confirming?.record?.illness_name} treatment
                        for <strong>{confirming?.record?.cattle_unique_code}</strong>? Use this if it was closed by mistake
                        or she relapsed before recovering.
                    </p>
                )}

                {confirming?.action === 'delete' && (
                    <p>
                        Remove the {confirming?.record?.illness_name} record
                        for <strong>{confirming?.record?.cattle_unique_code}</strong>? Records with checkups against them
                        cannot be removed - mark them cured instead.
                    </p>
                )}

                {confirming?.action === 'delete-checkup' && (
                    <p>
                        Remove the visit dated <strong>{displayDate(confirming?.record?.checkup_date)}</strong>?
                        The treatment's total cost will be recalculated from the visits that remain.
                    </p>
                )}

            </Modal>

            <ProfileDrawer {...profileDrawer.props} />

        </div>
    );
}

export default Health;
