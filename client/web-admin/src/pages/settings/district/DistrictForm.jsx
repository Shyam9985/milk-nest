import MasterForm from '../components/MasterForm';

function DistrictForm({ stateOptions = [], initialValues = null, submitting = false, onSubmit, onCancel }) {

    const fields = [
        { name: 'state_id', label: 'State', type: 'select', required: true, options: stateOptions, placeholder: 'Select State' },
        { name: 'district_name', label: 'District Name', type: 'text', required: true, minLength: 2, maxLength: 200, placeholder: 'e.g. Guntur' },
        { name: 'district_code', label: 'District Code', type: 'text', required: true, maxLength: 20, placeholder: 'e.g. GNT' }
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

export default DistrictForm;
