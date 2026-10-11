import MasterForm from '../components/MasterForm';

const CATTLE_TYPE_FORM_FIELDS = [
    { name: 'cattle_type_name', label: 'Cattle Type Name', type: 'text', required: true, minLength: 2, maxLength: 100, placeholder: 'e.g. Cow' },
    { name: 'description', label: 'Description', type: 'text', maxLength: 1000, placeholder: 'What defines this cattle type?' }
];

function CattleTypeForm({ initialValues = null, submitting = false, onSubmit, onCancel }) {

    return (
        <MasterForm
            fields={CATTLE_TYPE_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default CattleTypeForm;
