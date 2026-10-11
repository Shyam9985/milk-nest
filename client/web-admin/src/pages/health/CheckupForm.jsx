import { useMemo } from 'react';
import MasterForm from '../settings/components/MasterForm';
import { todayLocal, displayDate } from '../dashboard/dashboard.utils';

/*
 * One visit inside a treatment episode: what was seen, what was given, what it cost.
 *
 * Two fields here have consequences beyond the row. The expense is summed into the episode's
 * total by the server - it is never typed in twice. The withdrawal date only ever pushes the
 * episode's date OUT, never in: a vet giving more medicine today has to hold the milk longer,
 * but a later visit can never release milk an earlier one held back.
 */
function CheckupForm({ treatment, submitting = false, onSubmit, onCancel }) {

    const fields = useMemo(() => [
        {
            name: 'checkup_date', label: 'Checkup Date', type: 'date', required: true,
            max: todayLocal(), min: treatment?.start_date, defaultValue: todayLocal()
        },
        {
            name: 'medicines', label: 'Medicines', type: 'text', maxLength: 2000,
            placeholder: 'e.g. Intramammary tube x3, oxytetracycline 20ml'
        },
        {
            name: 'observation', label: 'Observation', type: 'text', maxLength: 2000,
            placeholder: 'e.g. swelling reduced, still off her feed'
        },
        {
            name: 'expense', label: 'Expense', type: 'number', min: 0,
            hint: "Added to this treatment's running total. Leave empty if there was no cost."
        },
        {
            name: 'attended_by', label: 'Attended By', type: 'text', maxLength: 150,
            placeholder: 'e.g. Dr. Rao'
        },
        {
            name: 'next_checkup_date', label: 'Next Checkup', type: 'date',
            hint: 'Optional. Shown on the register so a follow-up is not forgotten.'
        },
        {
            name: 'milk_withdrawal_until', label: 'Hold Milk Until', type: 'date',
            hint: treatment?.milk_withdrawal_until
                ? `Currently held until ${displayDate(treatment.milk_withdrawal_until)}. A later date here extends it; an earlier one is ignored.`
                : 'Fill this if medicine was given today and her milk must be discarded.'
        }
    ], [treatment]);

    return (
        <div>

            {/* what the user is adding to, so the drawer reads on its own */}
            <div className="mb-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm">
                <p className="font-medium text-[var(--text-primary)]">
                    {treatment?.cattle_unique_code} · {treatment?.illness_name}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                    Started {displayDate(treatment?.start_date)}
                    {treatment?.cure_date ? ` · cured ${displayDate(treatment.cure_date)}` : ' · still open'}
                </p>
            </div>

            <MasterForm
                fields={fields}
                submitting={submitting}
                submitLabel="Add Checkup"
                onSubmit={onSubmit}
                onCancel={onCancel}
            />

        </div>
    );
}

export default CheckupForm;
