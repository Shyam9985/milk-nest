import { useMemo, useReducer } from 'react';
import * as Icons from 'lucide-react';
import SearchDropdown from '../../components/SearchDropdown';
import AuthInput from '../../components/AuthInput';
import { todayLocal, displayDate } from '../dashboard/dashboard.utils';

/*
 * Records a calving and registers the calves in one submission.
 *
 * Twins are ordinary here, not an edge case - the calf list grows and shrinks, and each calf
 * becomes its own row in the cattle register sharing this pregnancy. Type, breed and branch are
 * inherited from the mother by the server, and date of birth IS the calving date, so the only
 * thing the user has to supply per calf is gender.
 *
 * Calving date plus a variable number of calves means this state moves together, so it lives in
 * one reducer rather than a pile of useState calls.
 *
 * The genders arrive as a prop from the breeding register's own response. They are NOT fetched here:
 * the admin/genders endpoint is gated on the 'users' permission, which an incharge who records
 * calvings does not hold, so fetching them would 403 for exactly the person using this form.
 */
const emptyCalf = () => ({ gender_id: '', weight: '', color: '', remarks: '' });

const initialState = {
    actual_calving_date: todayLocal(),
    remarks: '',
    calves: [emptyCalf()],
    errors: {}
};

function reducer(state, action) {
    switch (action.type) {

        case 'FIELD_CHANGED':
            return { ...state, [action.field]: action.value, errors: { ...state.errors, [action.field]: null } };

        case 'CALF_CHANGED': {
            const calves = state.calves.map((calf, index) =>
                index === action.index ? { ...calf, [action.field]: action.value } : calf);
            return { ...state, calves, errors: { ...state.errors, [`calf_${action.index}`]: null } };
        }

        case 'CALF_ADDED':
            return { ...state, calves: [...state.calves, emptyCalf()] };

        // a stillbirth is a calving with no calf registered, so removing the last row is allowed
        case 'CALF_REMOVED':
            return { ...state, calves: state.calves.filter((_, index) => index !== action.index) };

        case 'VALIDATION_FAILED':
            return { ...state, errors: action.errors };

        default:
            return state;
    }
}

function CalvingForm({ pregnancy, genders = [], submitting = false, onSubmit, onCancel }) {

    const [state, dispatch] = useReducer(reducer, initialState);
    const { actual_calving_date, remarks, calves, errors } = state;

    const genderOptions = useMemo(
        () => genders.map((gender) => ({ value: gender.gender_id, label: gender.gender_nm })),
        [genders]);

    const handleSubmit = (event) => {
        event.preventDefault();

        const nextErrors = {};

        if (!actual_calving_date) {
            nextErrors.actual_calving_date = 'Calving date is required.';
        } else if (actual_calving_date > todayLocal()) {
            nextErrors.actual_calving_date = 'Calving date cannot be in the future.';
        } else if (pregnancy?.conception_date && actual_calving_date < pregnancy.conception_date) {
            nextErrors.actual_calving_date = 'Calving date cannot be before the conception date.';
        }

        // every listed calf needs a gender; an empty list is fine (stillbirth)
        calves.forEach((calf, index) => {
            if (!calf.gender_id) nextErrors[`calf_${index}`] = 'Gender is required for this calf.';
        });

        if (Object.keys(nextErrors).length) {
            dispatch({ type: 'VALIDATION_FAILED', errors: nextErrors });
            return;
        }

        onSubmit({
            actual_calving_date,
            remarks: remarks || null,
            calves: calves.map((calf) => ({
                gender_id: Number(calf.gender_id),
                weight: calf.weight === '' ? undefined : Number(calf.weight),
                color: calf.color || undefined,
                remarks: calf.remarks || undefined
            }))
        });
    };

    return (
        <form onSubmit={handleSubmit} noValidate>

            {/* what the user is acting on, so the drawer is readable on its own */}
            <div className="mb-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm">
                <p className="font-medium text-[var(--text-primary)]">{pregnancy?.cattle_unique_code}</p>
                <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                    Conceived {displayDate(pregnancy?.conception_date)}
                    {pregnancy?.expected_calving_date ? ` · calving expected ${displayDate(pregnancy.expected_calving_date)}` : ''}
                </p>
            </div>

            <AuthInput name="actual_calving_date" type="date" label="Calving Date *"
                value={actual_calving_date} error={errors.actual_calving_date}
                max={todayLocal()} min={pregnancy?.conception_date}
                disabled={submitting}
                onChange={(e) => dispatch({ type: 'FIELD_CHANGED', field: 'actual_calving_date', value: e.target.value })} />

            {/* ---------------- Calves ---------------- */}

            <div className="mb-2 mt-1 flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                    Calves {calves.length > 1 && <span className="text-[var(--text-tertiary)]">({calves.length})</span>}
                </label>
                <button type="button" onClick={() => dispatch({ type: 'CALF_ADDED' })} disabled={submitting}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--brand-primary)]
                        transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-50">
                    <Icons.Plus size={14} /> Add calf
                </button>
            </div>

            {!calves.length && (
                <p className="mb-3 rounded-lg border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)]
                    px-3 py-3 text-xs text-[var(--text-tertiary)]">
                    No calf will be registered. Use this only for a stillbirth - otherwise add a calf so it enters the cattle register.
                </p>
            )}

            {calves.map((calf, index) => (
                <div key={index} className="mb-3 rounded-xl border border-[var(--card-border)] p-3">

                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                            Calf {index + 1}
                        </span>
                        <button type="button" onClick={() => dispatch({ type: 'CALF_REMOVED', index })} disabled={submitting}
                            title="Remove this calf"
                            className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-secondary)]
                                transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--danger)] disabled:opacity-50">
                            <Icons.Trash2 size={14} />
                        </button>
                    </div>

                    <SearchDropdown name={`calf_gender_${index}`} label="Gender" required
                        value={calf.gender_id} options={genderOptions} placeholder="Select Gender"
                        disabled={submitting} error={errors[`calf_${index}`]}
                        onChange={(e) => dispatch({ type: 'CALF_CHANGED', index, field: 'gender_id', value: e.target.value })} />

                    <div className="grid gap-3 sm:grid-cols-2">
                        <AuthInput name={`calf_weight_${index}`} type="number" label="Weight (kg)"
                            value={calf.weight} min="0" max="2000" disabled={submitting}
                            onChange={(e) => dispatch({ type: 'CALF_CHANGED', index, field: 'weight', value: e.target.value })} />

                        <AuthInput name={`calf_color_${index}`} type="text" label="Colour"
                            value={calf.color} disabled={submitting}
                            onChange={(e) => dispatch({ type: 'CALF_CHANGED', index, field: 'color', value: e.target.value })} />
                    </div>

                    <p className="-mt-2 text-xs text-[var(--text-tertiary)]">
                        Type, breed and branch are inherited from the mother. Date of birth is the calving date.
                    </p>

                </div>
            ))}

            <AuthInput name="remarks" type="text" label="Remarks"
                value={remarks} disabled={submitting}
                onChange={(e) => dispatch({ type: 'FIELD_CHANGED', field: 'remarks', value: e.target.value })} />

            <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={onCancel} disabled={submitting}
                    className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-2 font-medium
                        text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--hover-bg)] active:scale-95">
                    Cancel
                </button>
                <button type="submit" disabled={submitting}
                    className="rounded-lg bg-[var(--btn-primary-bg)] px-4 py-2 font-medium text-[var(--btn-primary-text)]
                        shadow-sm transition-all duration-200 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
                    {submitting ? 'Saving...' : 'Record Calving'}
                </button>
            </div>

        </form>
    );
}

export default CalvingForm;
