import { useEffect, useReducer, useRef } from 'react';
import * as Icons from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../../utils/Skeleton';
import { getDashboardFilters, getDashboard } from '../../services/dashboard.service';
import { useToast } from '../../contexts/MessageContext';
import ScopeBar from './components/ScopeBar';
import KpiTile from './components/KpiTile';
import TrendChart from './components/TrendChart';
import HerdComposition from './components/HerdComposition';
import BranchPanel from './components/BranchPanel';
import YieldByType from './components/YieldByType';
import TopProducers from './components/TopProducers';
import AttentionPanel from './components/AttentionPanel';
import QualityChart from './components/QualityChart';
import { PERIOD_PRESETS, compactNumber, formatNumber, displayDate } from './dashboard.utils';

/*
 * The business at a glance. One request returns every section for the chosen scope and
 * period; the scope bar only offers what the server put in the user's jurisdiction, so the
 * same screen serves a super user, a farm director and a branch incharge.
 *
 * Scope, period and the loaded data move together, so they live in one reducer.
 */
const defaultPeriod = PERIOD_PRESETS.find((preset) => preset.key === '7d');

const initialState = {
    dairyFarms: [],
    branches: [],
    filtersLoaded: false,
    canRecordMilk: false,
    dairyFarmId: '',
    branchId: '',
    period: { preset: defaultPeriod.key, ...defaultPeriod.range() },
    data: null,
    loading: true,      // first load - skeleton
    refreshing: false,  // later loads - keep the previous render, dimmed
    error: null
};

// a single farm or branch in scope is pre-selected so the dropdowns can be locked
const preselect = (dairyFarms, branches) => {
    const dairyFarmId = dairyFarms.length === 1 ? dairyFarms[0].dairy_farm_id : '';
    const inFarm = dairyFarmId ? branches.filter((branch) => branch.dairy_farm_id === dairyFarmId) : branches;
    const branchId = inFarm.length === 1 ? inFarm[0].branch_id : '';
    return { dairyFarmId, branchId };
};

function reducer(state, action) {
    switch (action.type) {

        case 'FILTERS_LOADED':
            return {
                ...state, filtersLoaded: true, canRecordMilk: action.canRecordMilk,
                dairyFarms: action.dairyFarms, branches: action.branches,
                ...preselect(action.dairyFarms, action.branches)
            };

        case 'FILTERS_FAILED':
            return { ...state, filtersLoaded: true };

        // changing the farm clears the branch below it, unless the new farm has exactly one
        case 'FARM_CHANGED': {
            const inFarm = action.value ? state.branches.filter((branch) => String(branch.dairy_farm_id) === String(action.value)) : [];
            return { ...state, dairyFarmId: action.value, branchId: inFarm.length === 1 ? inFarm[0].branch_id : '' };
        }

        case 'BRANCH_CHANGED':
            return { ...state, branchId: action.value };

        case 'PERIOD_CHANGED':
            return { ...state, period: action.period };

        case 'LOADING':
            return { ...state, loading: !state.data, refreshing: !!state.data, error: null };

        case 'LOADED':
            return { ...state, data: action.data, loading: false, refreshing: false, error: null };

        case 'LOAD_FAILED':
            return { ...state, loading: false, refreshing: false, error: action.error };

        default:
            return state;
    }
}

// a custom range is only fetched once both dates are set and in order
const isPeriodReady = (period) => !!period.from && !!period.to && period.from <= period.to;

function Dashboard() {

    const toast = useToast();
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(reducer, initialState);
    const requestSeq = useRef(0);   // only the latest request may update the screen
    const { dairyFarms, branches, filtersLoaded, canRecordMilk, dairyFarmId, branchId, period, data, loading, refreshing, error } = state;

    useEffect(() => {
        (async () => {
            const result = await getDashboardFilters();
            if (result?.success) {
                dispatch({
                    type: 'FILTERS_LOADED',
                    dairyFarms: result?.data?.dairy_farms || [],
                    branches: result?.data?.branches || [],
                    canRecordMilk: !!result?.data?.can_record_milk
                });
            } else {
                dispatch({ type: 'FILTERS_FAILED' });
                toast.error(result?.error || result?.message || 'Unable to load dashboard filters.');
            }
        })();
    }, []);

    const load = async () => {
        const seq = ++requestSeq.current;
        dispatch({ type: 'LOADING' });
        const result = await getDashboard({
            from_date: period.from, to_date: period.to,
            ...(dairyFarmId ? { dairy_farm_id: dairyFarmId } : {}),
            ...(branchId ? { branch_id: branchId } : {})
        });

        // a slower, older response must not overwrite the one for the current selection
        if (seq !== requestSeq.current) return;

        if (result?.success) {
            dispatch({ type: 'LOADED', data: result.data });
        } else {
            const message = result?.error || result?.message || 'Unable to load the dashboard.';
            dispatch({ type: 'LOAD_FAILED', error: message });
            toast.error(message);
        }
    };

    // every scope or period change is one request; the first waits for the pre-selection
    useEffect(() => {
        if (!filtersLoaded || !isPeriodReady(period)) return;
        load();
    }, [filtersLoaded, dairyFarmId, branchId, period.from, period.to]);

    const kpis = data?.kpis;
    const periodInfo = data?.period;
    const multiBranch = (data?.branches?.length || 0) > 1;
    const multiFarm = dairyFarms.length > 1 && !dairyFarmId;
    const periodLabel = periodInfo?.days === 1 ? 'today' : `${periodInfo?.days} days`;

    return (

        <div className="space-y-4 p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            {/* ---------------- Header ---------------- */}

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">Dashboard</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        How your dairy business is doing - production, herd and what needs a look today.
                    </p>
                </div>
                {canRecordMilk && (
                    <button type="button" onClick={() => navigate('/milk-production')}
                        className="flex items-center gap-2 rounded-lg bg-[var(--btn-primary-bg)] px-4 py-2 text-sm font-medium
                            text-[var(--btn-primary-text)] shadow-sm transition-all duration-200 hover:opacity-90 active:scale-95">
                        <Icons.ClipboardList size={16} /> Record today's milk
                    </button>
                )}
            </div>

            {/* ---------------- Scope & period ---------------- */}

            <ScopeBar dairyFarms={dairyFarms} branches={branches} dairyFarmId={dairyFarmId} branchId={branchId} period={period}
                onFarmChange={(value) => dispatch({ type: 'FARM_CHANGED', value })}
                onBranchChange={(value) => dispatch({ type: 'BRANCH_CHANGED', value })}
                onPeriodChange={(next) => dispatch({ type: 'PERIOD_CHANGED', period: next })}
                refreshing={refreshing} onRefresh={load} />

            {/* ---------------- First load ---------------- */}

            {loading && (
                <div className="space-y-4">
                    <Skeleton variant="card" count={3} />
                    <Skeleton variant="table" rows={4} columns={5} />
                </div>
            )}

            {!loading && !data && error && (
                <div className="rounded-2xl border border-dashed border-[var(--danger-border)] bg-[var(--danger-bg)] p-10 text-center text-sm text-[var(--danger-text)]">
                    {error}
                </div>
            )}

            {/* ---------------- Sections (held at reduced opacity while refreshing, no layout jump) ---------------- */}

            {!loading && data && (
                <div className={`space-y-4 transition-opacity duration-200 ${refreshing ? 'pointer-events-none opacity-60' : ''}`}>

                    {/* KPI strip */}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">

                        <KpiTile label="Total milk" icon={Icons.Milk} accent="var(--chart-1)"
                            value={compactNumber(kpis.milk.total)} unit="L"
                            delta={kpis.milk.delta_pct} deltaLabel={`vs previous ${periodLabel}`}
                            footnote={`Morning ${formatNumber(kpis.milk.morning)} L · Evening ${formatNumber(kpis.milk.evening)} L`} />

                        <KpiTile label="Today's yield" icon={Icons.Sun} accent="var(--chart-4)"
                            value={compactNumber(kpis.today.total)} unit="L"
                            footnote={kpis.today.entries
                                ? `Morning ${formatNumber(kpis.today.morning)} L · Evening ${formatNumber(kpis.today.evening)} L · ${kpis.today.milked_cattle} animals`
                                : 'Nothing recorded yet today'} />

                        <KpiTile label="Yield per animal" icon={Icons.Gauge} accent="var(--chart-3)"
                            value={formatNumber(kpis.yield.per_animal_day)} unit="L / day"
                            delta={kpis.yield.delta_pct} deltaLabel={`vs previous ${periodLabel}`}
                            footnote={`Across ${kpis.milk.entries} animal-days recorded`} />

                        <KpiTile label="Herd size" icon={Icons.Beef} accent="var(--chart-2)"
                            value={compactNumber(kpis.herd.total)} unit={kpis.herd.total === 1 ? 'animal' : 'animals'}
                            footnote={`${kpis.herd.milked} milked in the period${kpis.herd.incomplete ? ` · ${kpis.herd.incomplete} with incomplete details` : ''}`} />

                        <KpiTile label="Milk quality" icon={Icons.Droplets} accent="var(--chart-5)"
                            value={kpis.quality.fat === null ? '-' : formatNumber(kpis.quality.fat)} unit="% fat"
                            footnote={kpis.quality.snf === null
                                ? 'No fat / SNF readings in the period'
                                : `SNF ${formatNumber(kpis.quality.snf)}%${kpis.quality.prev_fat !== null ? ` · previously ${formatNumber(kpis.quality.prev_fat)}% fat` : ''}`} />

                        <KpiTile label="Recorded today" icon={Icons.ClipboardCheck} accent="var(--chart-6)"
                            value={`${kpis.coverage.recorded_today} / ${kpis.coverage.total_branches}`} unit="branches"
                            footnote={kpis.coverage.total_branches === kpis.coverage.recorded_today
                                ? 'Every branch has recorded today'
                                : `${kpis.coverage.total_branches - kpis.coverage.recorded_today} still to record for ${displayDate(periodInfo.today)}`} />

                    </div>

                    {/* trend + herd */}
                    <div className="grid gap-4 xl:grid-cols-3">
                        <div className="xl:col-span-2"><TrendChart trend={data.trend} period={periodInfo} /></div>
                        <HerdComposition composition={data.composition} herdTotal={kpis.herd.total} />
                    </div>

                    {/* branches (only when there is something to compare) */}
                    {multiBranch && <BranchPanel branches={data.branches} period={periodInfo} showFarm={multiFarm} />}

                    {/* by type + top producers */}
                    <div className="grid gap-4 xl:grid-cols-2">
                        <YieldByType byType={data.by_type} />
                        <TopProducers producers={data.top_producers} showBranch={multiBranch} />
                    </div>

                    {/* attention + quality */}
                    <div className="grid gap-4 xl:grid-cols-2">
                        <AttentionPanel attention={data.attention} period={periodInfo} canRecordMilk={canRecordMilk} />
                        <QualityChart trend={data.trend} quality={kpis.quality} />
                    </div>

                </div>
            )}

        </div>
    );
}

export default Dashboard;
