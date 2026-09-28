import { useEffect, useReducer } from 'react';
import * as Icons from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SideDrawer from '../../utils/SideDrawer';
import Modal from '../../utils/ModelComponent';
import Skeleton from '../../utils/Skeleton';
import RowAction from '../../components/RowAction';
import AuthInput from '../../components/AuthInput';
import PregnancyForm from './PregnancyForm';
import CalvingForm from './CalvingForm';
import EntityLink from '../profiles/components/EntityLink';
import ProfileDrawer from '../profiles/ProfileDrawer';
import useProfileDrawer from '../profiles/useProfileDrawer';
import {
    getPregnancyList, createPregnancy, updatePregnancy,
    markDryOff, recordCalving, markPregnancyAborted, deletePregnancy
} from '../../services/breeding.service';
import { useToast } from '../../contexts/MessageContext';
import { displayDate, todayLocal } from '../dashboard/dashboard.utils';

/*
 * The breeding register: every pregnancy, what stage it is at, and the two actions that move it
 * forward - marking her dry and recording the calving.
 *
 * Nothing here changes milk eligibility on its own. The system flags animals that are past their
 * expected dry-off point and leaves the decision to the incharge, because dry-off timing varies
 * by breed and by animal. That is why "Mark dry" is a button and not a background job.
 */
const STATUS_TABS = [
    { key: 'active', label: 'In progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'aborted', label: 'Aborted' },
    { key: '', label: 'All' }
];

const initialState = {
    records: [],
    breedable: [],
    genders: [],
    permissions: {},
    status: 'active',
    loading: true,
    refreshing: false,
    drawer: null,          // 'pregnancy' | 'calving' | 'dry-off'
    activeRecord: null,
    dryOffDate: todayLocal(),
    confirming: null,      // { action: 'abort' | 'delete', record }
    submitting: false
};

function reducer(state, action) {
    switch (action.type) {

        case 'LOADING':
            return { ...state, loading: !state.records.length, refreshing: !!state.records.length };

        case 'LOADED':
            return {
                ...state, records: action.records, breedable: action.breedable,
                genders: action.genders, permissions: action.permissions,
                loading: false, refreshing: false
            };

        case 'LOAD_FAILED':
            return { ...state, loading: false, refreshing: false };

        case 'STATUS_CHANGED':
            return { ...state, status: action.status };

        case 'DRAWER_OPENED':
            return { ...state, drawer: action.drawer, activeRecord: action.record || null, dryOffDate: todayLocal() };

        case 'DRAWER_CLOSED':
            return { ...state, drawer: null, activeRecord: null };

        case 'DRY_OFF_DATE_CHANGED':
            return { ...state, dryOffDate: action.value };

        case 'CONFIRMING':
            return { ...state, confirming: action.confirming };

        case 'SUBMITTING':
            return { ...state, submitting: action.submitting };

        default:
            return state;
    }
}

// what stage this pregnancy is at, and whether it needs attention today
const describeStage = (record, today) => {
    if (record.pregnancy_status === 'aborted') return { label: 'Aborted', tone: 'muted', Icon: Icons.CircleSlash };
    if (record.pregnancy_status === 'completed') {
        return record.calves_registered > 0
            ? { label: `Calved · ${record.calves_registered} calf${record.calves_registered === 1 ? '' : 's'}`, tone: 'good', Icon: Icons.CircleCheck }
            : { label: 'Calved · no calf registered', tone: 'warning', Icon: Icons.TriangleAlert };
    }
    if (record.expected_calving_date && record.expected_calving_date <= today) {
        return { label: 'Calving due', tone: 'critical', Icon: Icons.OctagonAlert };
    }
    if (!record.actual_dry_off_date && record.expected_dry_off_date && record.expected_dry_off_date <= today) {
        return { label: 'Dry-off due', tone: 'warning', Icon: Icons.TriangleAlert };
    }
    if (record.actual_dry_off_date) return { label: 'Dry', tone: 'info', Icon: Icons.MoonStar };
    return { label: 'In milk', tone: 'good', Icon: Icons.Milk };
};

const TONE_COLOR = {
    critical: 'var(--danger)', warning: 'var(--warning)', good: 'var(--success)',
    info: 'var(--info)', muted: 'var(--text-tertiary)'
};

function Breeding() {

    const toast = useToast();
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(reducer, initialState);
    const profileDrawer = useProfileDrawer();
    const { records, breedable, genders, permissions, status, loading, refreshing, drawer, activeRecord, dryOffDate, confirming, submitting } = state;

    const today = todayLocal();

    const load = async () => {
        dispatch({ type: 'LOADING' });
        const result = await getPregnancyList(status ? { status } : {});

        if (result?.success) {
            dispatch({
                type: 'LOADED',
                records: result?.data?.records || [],
                breedable: result?.data?.breedable || [],
                genders: result?.data?.genders || [],
                permissions: result?.data?.permissions || {}
            });
        } else {
            dispatch({ type: 'LOAD_FAILED' });
            toast.error(result?.error || result?.message || 'Unable to load the breeding register.');
        }
    };

    useEffect(() => {
        load();
    }, [status]);

    // every action shares this shape: submit, report, reload
    const runAction = async (label, call) => {
        dispatch({ type: 'SUBMITTING', submitting: true });
        const result = await call();
        dispatch({ type: 'SUBMITTING', submitting: false });

        if (result?.success) {
            toast.success(result?.message || `${label} saved.`);
            dispatch({ type: 'DRAWER_CLOSED' });
            dispatch({ type: 'CONFIRMING', confirming: null });
            load();
        } else {
            toast.error(result?.error || result?.message || `Unable to ${label.toLowerCase()}.`);
        }
    };

    const handlePregnancySubmit = (payload) => runAction(
        activeRecord ? 'Update pregnancy' : 'Record pregnancy',
        () => activeRecord
            ? updatePregnancy(activeRecord.pregnancy_id, payload)
            : createPregnancy({ ...payload, cattle_id: Number(payload.cattle_id) })
    );

    const handleDryOff = () => runAction('Mark dry',
        () => markDryOff(activeRecord.pregnancy_id, { actual_dry_off_date: dryOffDate }));

    const handleCalving = (payload) => runAction('Record calving',
        () => recordCalving(activeRecord.pregnancy_id, payload));

    const handleConfirm = () => {
        const { action, record } = confirming;
        if (action === 'abort') return runAction('Mark aborted', () => markPregnancyAborted(record.pregnancy_id, {}));
        return runAction('Delete pregnancy', () => deletePregnancy(record.pregnancy_id));
    };

    const canWrite = permissions?.can_insert || permissions?.can_update;

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
                        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Breeding Register</h2>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            Pregnancies, dry-off and calving. Expected dates are calculated from each breed's gestation rule.
                        </p>
                    </div>
                </div>

                {permissions?.can_insert && (
                    <button type="button" onClick={() => dispatch({ type: 'DRAWER_OPENED', drawer: 'pregnancy' })}
                        disabled={!breedable.length}
                        title={breedable.length ? 'Record a new pregnancy' : 'Every eligible animal already has a pregnancy in progress'}
                        className="flex items-center gap-2 rounded-lg bg-[var(--btn-primary-bg)] px-4 py-2 text-sm font-medium
                            text-[var(--btn-primary-text)] shadow-sm transition-all duration-200 hover:opacity-90
                            active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
                        <Icons.Plus size={16} /> Record Pregnancy
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
                    {status === 'active'
                        ? 'No pregnancies in progress. Record one to start tracking dry-off and calving dates.'
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
                                    <th className="min-w-[10rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Stage</th>
                                    <th className="min-w-[8rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Conceived</th>
                                    <th className="min-w-[8rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Dry-off</th>
                                    <th className="min-w-[8rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Calving</th>
                                    <th className="min-w-[9rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-left font-semibold">Branch</th>
                                    {canWrite && <th className="min-w-[12rem] whitespace-nowrap border-b border-[var(--table-header-border)] px-4 py-3 text-right font-semibold">Actions</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {records.map((record) => {

                                    const stage = describeStage(record, today);
                                    const isActive = record.pregnancy_status === 'active';

                                    return (
                                        <tr key={record.pregnancy_id} className="border-b border-[var(--table-cell-border)] transition-colors hover:bg-[var(--table-row-hover)]">

                                            <td className="whitespace-nowrap px-4 py-3">
                                                <EntityLink type="cattle" id={record.cattle_id} onNavigate={profileDrawer.open}>
                                                    {record.cattle_unique_code}
                                                </EntityLink>
                                                <p className="text-xs text-[var(--text-tertiary)]">
                                                    {record.cattle_type_name}{record.breed_name ? ` · ${record.breed_name}` : ''}
                                                </p>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: TONE_COLOR[stage.tone] }}>
                                                    <stage.Icon size={14} /> {stage.label}
                                                </span>
                                                {isActive && <p className="text-xs text-[var(--text-tertiary)]">{record.days_pregnant} days pregnant</p>}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">{displayDate(record.conception_date)}</td>

                                            <td className="whitespace-nowrap px-4 py-3">
                                                {record.actual_dry_off_date
                                                    ? <span className="text-[var(--text-primary)]">{displayDate(record.actual_dry_off_date)}</span>
                                                    : <span className="text-[var(--text-tertiary)]">exp. {displayDate(record.expected_dry_off_date)}</span>}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3">
                                                {record.actual_calving_date
                                                    ? <span className="text-[var(--text-primary)]">{displayDate(record.actual_calving_date)}</span>
                                                    : <span className="text-[var(--text-tertiary)]">exp. {displayDate(record.expected_calving_date)}</span>}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">{record.branch_name}</td>

                                            {canWrite && (
                                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                                    {isActive ? (
                                                        <div className="flex items-center justify-end gap-1.5">

                                                            {!record.actual_dry_off_date && permissions?.can_update && (
                                                                <RowAction tone="warning" icon={Icons.MoonStar}
                                                                    title="Mark her as dry - removes her from the milking sheet"
                                                                    onClick={() => dispatch({ type: 'DRAWER_OPENED', drawer: 'dry-off', record })}>
                                                                    Mark dry
                                                                </RowAction>
                                                            )}

                                                            {permissions?.can_update && (
                                                                <RowAction tone="success" icon={Icons.Baby}
                                                                    title="Record the calving and register the calves"
                                                                    onClick={() => dispatch({ type: 'DRAWER_OPENED', drawer: 'calving', record })}>
                                                                    Calved
                                                                </RowAction>
                                                            )}

                                                            {permissions?.can_update && (
                                                                <RowAction iconOnly icon={Icons.Pencil} title="Edit the conception date"
                                                                    onClick={() => dispatch({ type: 'DRAWER_OPENED', drawer: 'pregnancy', record })} />
                                                            )}

                                                            {permissions?.can_update && (
                                                                <RowAction iconOnly tone="danger" icon={Icons.CircleSlash}
                                                                    title="Pregnancy did not reach calving"
                                                                    onClick={() => dispatch({ type: 'CONFIRMING', confirming: { action: 'abort', record } })} />
                                                            )}

                                                        </div>
                                                    ) : (
                                                        permissions?.can_delete && (
<RowAction iconOnly tone="danger" icon={Icons.Trash2} title="Remove this record"
                                                                onClick={() => dispatch({ type: 'CONFIRMING', confirming: { action: 'delete', record } })} />
                                                        )
                                                    )}
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

            {/* ---------------- Record / edit a pregnancy ---------------- */}

            <SideDrawer isOpen={drawer === 'pregnancy'} onClose={() => !submitting && dispatch({ type: 'DRAWER_CLOSED' })}
                title={activeRecord ? 'Update Pregnancy' : 'Record Pregnancy'} drawerSize="xs">

                <PregnancyForm
                    breedable={activeRecord
                        ? [{ cattle_id: activeRecord.cattle_id, cattle_unique_code: activeRecord.cattle_unique_code, cattle_type_name: activeRecord.cattle_type_name, breed_name: activeRecord.breed_name }]
                        : breedable}
                    initialValues={activeRecord}
                    submitting={submitting}
                    onSubmit={handlePregnancySubmit}
                    onCancel={() => dispatch({ type: 'DRAWER_CLOSED' })}
                />

            </SideDrawer>

            {/* ---------------- Mark dry ---------------- */}

            <SideDrawer isOpen={drawer === 'dry-off'} onClose={() => !submitting && dispatch({ type: 'DRAWER_CLOSED' })}
                title="Mark as Dry" drawerSize="xs">

                <div>
                    <p className="mb-4 text-sm text-[var(--text-secondary)]">
                        <strong className="text-[var(--text-primary)]">{activeRecord?.cattle_unique_code}</strong> will be
                        removed from the milking sheet from this date. She returns automatically once her calving is recorded.
                    </p>

                    <AuthInput name="actual_dry_off_date" type="date" label="Dry-off Date *"
                        value={dryOffDate} max={today} min={activeRecord?.conception_date} disabled={submitting}
                        onChange={(e) => dispatch({ type: 'DRY_OFF_DATE_CHANGED', value: e.target.value })} />

                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => dispatch({ type: 'DRAWER_CLOSED' })} disabled={submitting}
                            className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-2 font-medium
                                text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--hover-bg)] active:scale-95">
                            Cancel
                        </button>
                        <button type="button" onClick={handleDryOff} disabled={submitting || !dryOffDate}
                            className="rounded-lg bg-[var(--btn-primary-bg)] px-4 py-2 font-medium text-[var(--btn-primary-text)]
                                shadow-sm transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60">
                            {submitting ? 'Saving...' : 'Mark Dry'}
                        </button>
                    </div>
                </div>

            </SideDrawer>

            {/* ---------------- Record calving ---------------- */}

            <SideDrawer isOpen={drawer === 'calving'} onClose={() => !submitting && dispatch({ type: 'DRAWER_CLOSED' })}
                title="Record Calving" drawerSize="sm">

                {activeRecord && (
                    <CalvingForm
                        pregnancy={activeRecord}
                        genders={genders}
                        submitting={submitting}
                        onSubmit={handleCalving}
                        onCancel={() => dispatch({ type: 'DRAWER_CLOSED' })}
                    />
                )}

            </SideDrawer>

            {/* ---------------- Confirmations ---------------- */}

            <Modal isOpen={!!confirming} onClose={() => dispatch({ type: 'CONFIRMING', confirming: null })}
                onSubmit={handleConfirm}
                title={confirming?.action === 'abort' ? 'Mark Pregnancy Aborted' : 'Delete Pregnancy Record'}
                primaryButtonName={confirming?.action === 'abort' ? 'Mark Aborted' : 'Delete'} secondaryButtonName="Cancel">

                {confirming?.action === 'abort' ? (
                    <p>
                        Mark the pregnancy for <strong>{confirming?.record?.cattle_unique_code}</strong> as aborted?
                        Her milk eligibility will be reassessed, and she becomes available to breed again.
                    </p>
                ) : (
                    <p>
                        Remove the pregnancy record for <strong>{confirming?.record?.cattle_unique_code}</strong>?
                        Records with calves registered against them cannot be removed.
                    </p>
                )}

            </Modal>

            <ProfileDrawer {...profileDrawer.props} />

        </div>
    );
}

export default Breeding;
