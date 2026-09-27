import MasterForm from '../components/MasterForm';

/*
 * The key is the stable code service logic branches on, so it is captured once on create and
 * read-only afterwards - renaming it would silently break whatever references it.
 */
const buildFields = (isEdit) => [
    {
        name: 'purchase_mode_key', label: 'Key', type: 'text', required: true, minLength: 2, maxLength: 50,
        placeholder: 'e.g. lease_agreement', readOnly: isEdit,
        hint: isEdit
            ? 'The key cannot be changed once the mode exists, because other records refer to it.'
            : 'A short lowercase code used internally. Spaces and dashes become underscores.'
    },
    { name: 'purchase_mode_name', label: 'Display Name', type: 'text', required: true, minLength: 2, maxLength: 100, placeholder: 'e.g. Lease Agreement' },
    { name: 'description', label: 'Description', type: 'text', maxLength: 1000, placeholder: 'When is this mode used?' }
];

function PurchaseModeForm({ initialValues = null, submitting = false, onSubmit, onCancel }) {

    return (
        <MasterForm
            fields={buildFields(!!initialValues)}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default PurchaseModeForm;
