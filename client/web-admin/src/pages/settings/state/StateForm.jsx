import MasterForm from '../components/MasterForm';

const STATE_FORM_FIELDS = [
    { name: 'state_name', label: 'State Name', type: 'text', required: true, minLength: 2, maxLength: 200, placeholder: 'e.g. Andhra Pradesh' },
    { name: 'state_code', label: 'State Code', type: 'text', required: true, maxLength: 20, placeholder: 'e.g. AP' }
];

function StateForm({ initialValues = null, submitting = false, onSubmit, onCancel }) {

    return (
        <MasterForm
            fields={STATE_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default StateForm;
