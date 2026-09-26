import * as Icons from 'lucide-react';
import SearchDropdown from '../../../components/SearchDropdown';
import { PERIOD_PRESETS, displayDate, todayLocal } from '../dashboard.utils';

/*
 * The one filter row every section answers to: Dairy Farm -> Branch, then the period.
 * The dropdowns only ever contain what the server put in scope, so a branch incharge sees
 * their farm and branch pre-selected and locked, a director picks among their branches, and
 * a super user roams freely - with no role checks in the UI.
 */
function ScopeBar({ dairyFarms, branches, dairyFarmId, branchId, period, onFarmChange, onBranchChange, onPeriodChange, refreshing, onRefresh }) {

    const today = todayLocal();
    const farmOptions = dairyFarms.map((farm) => ({ value: farm.dairy_farm_id, label: `${farm.dairy_farm_name} (${farm.dairy_farm_code})` }));
    const branchOptions = branches
        .filter((branch) => !dairyFarmId || String(branch.dairy_farm_id) === String(dairyFarmId))
        .map((branch) => ({ value: branch.branch_id, label: `${branch.branch_name}${branch.is_main_branch ? ' (Main)' : ''}` }));

    const farmLocked = farmOptions.length <= 1;
    const branchLocked = branchOptions.length <= 1;

    const selectPreset = (preset) => {
        if (preset.key === 'custom') {
            onPeriodChange({ preset: 'custom', from: period.from, to: period.to });
            return;
        }
        onPeriodChange({ preset: preset.key, ...preset.range() });
    };

    return (
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-sm)]">

            <div className="grid gap-x-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto] xl:items-end">

                <SearchDropdown name="dairy_farm_id" label="Dairy Farm"
                    value={dairyFarmId} options={farmOptions} placeholder="All dairy farms"
                    disabled={farmLocked} onChange={(e) => onFarmChange(e.target.value)} />

                <SearchDropdown name="branch_id" label="Branch"
                    value={branchId} options={branchOptions} placeholder="All branches"
                    disabled={branchLocked} onChange={(e) => onBranchChange(e.target.value)} />

                {/* period presets read as one control; "Custom" reveals the date inputs */}
                <div className="mb-3">
                    <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Period</label>
                    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] p-1">
                        {PERIOD_PRESETS.map((preset) => {
                            const active = period.preset === preset.key;
                            return (
                                <button key={preset.key} type="button" onClick={() => selectPreset(preset)}
                                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors
                                        ${active
                                            ? 'bg-[var(--toggle-active-bg)] text-[var(--toggle-active-text)]'
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'}`}>
                                    {preset.label}
                                </button>
                            );
                        })}
                        <button type="button" onClick={onRefresh} disabled={refreshing} title="Refresh"
                            className="ml-auto flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-secondary)]
                                transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] disabled:opacity-50">
                            <Icons.RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

            </div>

            {period.preset === 'custom' && (
                <div className="grid gap-3 sm:grid-cols-2 lg:max-w-md">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">From</label>
                        <input type="date" value={period.from} max={period.to || today}
                            onChange={(e) => onPeriodChange({ preset: 'custom', from: e.target.value, to: period.to })}
                            className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3
                                text-[var(--input-text)] outline-none focus:border-[var(--brand-primary)]" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">To</label>
                        <input type="date" value={period.to} min={period.from} max={today}
                            onChange={(e) => onPeriodChange({ preset: 'custom', from: period.from, to: e.target.value })}
                            className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3
                                text-[var(--input-text)] outline-none focus:border-[var(--brand-primary)]" />
                    </div>
                </div>
            )}

            {/* the plain-language context line: what exactly is on screen right now */}
            <p className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-[var(--text-tertiary)]">
                <Icons.Info size={13} />
                Showing
                <strong className="text-[var(--text-secondary)]">
                    {branchId
                        ? branchOptions.find((option) => String(option.value) === String(branchId))?.label
                        : dairyFarmId
                            ? `all branches of ${farmOptions.find((option) => String(option.value) === String(dairyFarmId))?.label}`
                            : 'every dairy farm in your scope'}
                </strong>
                for
                <strong className="text-[var(--text-secondary)]">
                    {period.from === period.to ? displayDate(period.from) : `${displayDate(period.from)} to ${displayDate(period.to)}`}
                </strong>
            </p>

        </div>
    );
}

export default ScopeBar;
