import MasterForm from '../components/MasterForm';

function MandalForm({ stateOptions = [], loadDistrictOptions, initialValues = null, submitting = false, onSubmit, onCancel }) {

    const fields = [
        // state is a ui-only filter: it narrows the district list but is not part of the mandal payload
        { name: 'state_id', label: 'State', type: 'select', required: true, uiOnly: true, options: stateOptions, placeholder: 'Select State' },
        // districts are fetched only after a state is picked
        { name: 'district_id', label: 'District', type: 'select', required: true, dependsOn: 'state_id', loadOptions: loadDistrictOptions, placeholder: 'Select District' },
        { name: 'mandal_ulb_nm', label: 'Mandal/ULB Name', type: 'text', required: true, minLength: 2, maxLength: 250, placeholder: 'e.g. Tenali' },
        { name: 'mandal_ulb_code', label: 'Mandal/ULB Code', type: 'text', required: true, maxLength: 20, placeholder: 'e.g. TNL' },
        { name: 'is_ulb', label: 'Is ULB (Urban Local Body)', type: 'checkbox' }
    ];

    return (
        <MasterForm
            fields={fields}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default MandalForm;
