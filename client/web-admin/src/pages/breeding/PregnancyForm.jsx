import { useMemo } from 'react';
import MasterForm from '../settings/components/MasterForm';
import { todayLocal } from '../dashboard/dashboard.utils';

/*
 * Records a conception. The expected dry-off and calving dates are NOT asked for - the server
 * derives them from the breed's rule (falling back to the type), which is why buffalo and cow
 * get different calving dates from the same conception date.
 *
 * The cattle dropdown only ever contains animals that can actually be bred: the server filters
 * out males, sold animals and anyone with a pregnancy already in flight, so the form cannot
 * offer an invalid choice in the first place.
 */
function PregnancyForm({ breedable = [], initialValues = null, submitting = false, onSubmit, onCancel }) {

    const isEdit = !!initialValues;

    const fields = useMemo(() => [
        {
            name: 'cattle_id', label: 'Cattle', type: 'select', required: true,
            readOnly: isEdit, disabled: isEdit,
            options: breedable.map((cattle) => ({
                value: cattle.cattle_id,
                label: `${cattle.cattle_unique_code} - ${cattle.cattle_type_name || ''} ${cattle.breed_name ? `(${cattle.breed_name})` : ''}`.trim()
            })),
            hint: isEdit
                ? 'The animal cannot be changed on an existing pregnancy record.'
                : 'Only females without a pregnancy already in progress are listed.'
        },
        {
            name: 'conception_date', label: 'Conception Date', type: 'date', required: true,
            max: todayLocal(),
            hint: 'An approximate date is fine. The expected dry-off and calving dates are calculated from it.'
        },
        { name: 'remarks', label: 'Remarks', type: 'text', maxLength: 1000, placeholder: 'e.g. date estimated from the vet visit' }
    ], [breedable, isEdit]);

    // on edit the cattle is fixed, so it is seeded into the form even though the field is locked
    const values = isEdit
        ? { cattle_id: initialValues.cattle_id, conception_date: initialValues.conception_date, remarks: initialValues.remarks }
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

export default PregnancyForm;
