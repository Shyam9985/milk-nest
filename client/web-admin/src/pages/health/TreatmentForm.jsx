import { useMemo } from 'react';
import MasterForm from '../settings/components/MasterForm';
import { todayLocal } from '../dashboard/dashboard.utils';

/*
 * Opens or corrects a treatment episode.
 *
 * The animal and the illness are locked once the episode exists. Changing either would make it a
 * different episode while the checkups already recorded under it stay behind describing the old
 * illness - so the server ignores them on update and the form shows why.
 *
 * The withdrawal date is the field that matters most here: filling it takes her off the milking
 * sheet immediately, and leaving it empty means her milk is safe to collect.
 */
const SEVERITY_OPTIONS = [
    { value: 'mild', label: 'Mild' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'severe', label: 'Severe' }
];

function TreatmentForm({ cattle = [], illnesses = [], initialValues = null, submitting = false, onSubmit, onCancel }) {

    const isEdit = !!initialValues;

    const fields = useMemo(() => [
        {
            name: 'cattle_id', label: 'Cattle', type: 'select', required: true,
            readOnly: isEdit, disabled: isEdit,
            options: cattle.map((animal) => ({
                value: animal.cattle_id,
                label: `${animal.cattle_unique_code} - ${animal.cattle_type_name || ''}${animal.breed_name ? ` (${animal.breed_name})` : ''}`.trim()
            })),
            hint: isEdit
                ? 'The animal cannot be changed on an existing treatment.'
                : 'Any animal still in the herd can be treated - males and calves included.'
        },
        {
            name: 'illness_id', label: 'Illness', type: 'select', required: true,
            readOnly: isEdit, disabled: isEdit,
            options: illnesses.map((illness) => ({ value: illness.illness_id, label: illness.illness_name })),
            hint: isEdit
                ? 'The illness cannot be changed - record a separate treatment instead.'
                : 'Missing one? Add it under Settings, Illness Master.'
        },
        {
            name: 'start_date', label: 'Start Date', type: 'date', required: true,
            max: todayLocal(), defaultValue: todayLocal(),
            hint: 'When the symptoms were first noticed.'
        },
        {
            name: 'severity', label: 'Severity', type: 'select',
            options: SEVERITY_OPTIONS, defaultValue: 'mild'
        },
        {
            name: 'attended_by', label: 'Attended By', type: 'text', maxLength: 150,
            placeholder: 'e.g. Dr. Rao, or the incharge who treated her'
        },
        {
            name: 'milk_withdrawal_until', label: 'Hold Milk Until', type: 'date',
            hint: 'Leave empty if her milk is safe to collect. Filling it removes her from the milking sheet until that date passes - even after she is cured.'
        },
        {
            name: 'remarks', label: 'Remarks', type: 'text', maxLength: 1000,
            placeholder: 'e.g. swelling in the right rear quarter'
        }
    ], [cattle, illnesses, isEdit]);

    // on edit the animal and illness are fixed, so they are seeded although the fields are locked
    const values = isEdit
        ? {
            cattle_id: initialValues.cattle_id,
            illness_id: initialValues.illness_id,
            start_date: initialValues.start_date,
            severity: initialValues.severity || 'mild',
            attended_by: initialValues.attended_by || '',
            milk_withdrawal_until: initialValues.milk_withdrawal_until || '',
            remarks: initialValues.remarks || ''
        }
        : null;

    return (
        <MasterForm
            fields={fields}
            initialValues={values}
            submitting={submitting}
            submitLabel={isEdit ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default TreatmentForm;
