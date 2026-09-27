import MasterForm from '../components/MasterForm';

const ILLNESS_FORM_FIELDS = [
    { name: 'illness_name', label: 'Illness Name', type: 'text', required: true, minLength: 2, maxLength: 150, placeholder: 'e.g. Mastitis' },
    { name: 'description', label: 'Description', type: 'text', maxLength: 1000, placeholder: 'Symptoms, usual treatment or anything worth remembering' }
];

function IllnessForm({ initialValues = null, submitting = false, onSubmit, onCancel }) {

    return (
        <MasterForm
            fields={ILLNESS_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default IllnessForm;
