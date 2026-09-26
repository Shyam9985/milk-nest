import MasterForm from '../components/MasterForm';

const GENDER_FORM_FIELDS = [
    { name: 'gender_nm', label: 'Gender Name', type: 'text', required: true, minLength: 2, maxLength: 50, placeholder: 'e.g. Female' },
    { name: 'gender_code', label: 'Gender Code', type: 'text', required: true, maxLength: 20, placeholder: 'e.g. F' }
];

function GenderForm({ initialValues = null, submitting = false, onSubmit, onCancel }) {

    return (
        <MasterForm
            fields={GENDER_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default GenderForm;
