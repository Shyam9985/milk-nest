import MasterForm from '../components/MasterForm';

function MandalForm({ districtOptions = [], initialValues = null, submitting = false, onSubmit, onCancel }) {

    const fields = [
        { name: 'district_id', label: 'District', type: 'select', required: true, options: districtOptions, placeholder: 'Select District' },
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
