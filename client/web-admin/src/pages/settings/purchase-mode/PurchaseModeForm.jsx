import MasterForm from '../components/MasterForm';

/*
 * A purchase mode is not just a label - it carries the RULES the cattle register follows when an
 * animal is recorded under it. That is what stops the register branching on mode names in code:
 * add "Lease Agreement" here, tick that it has another party, and the cattle form starts asking
 * for the lessor's details without anyone touching a service.
 *
 * The key stays read-only once created: reports and seeded rows refer to it.
 */
const AMOUNT_SOURCE_OPTIONS = [
    { value: 'purchase_cost', label: 'The purchase price paid for the animal' },
    { value: 'recurring', label: 'A recurring amount paid each period' },
    { value: 'none', label: 'Nothing is paid' }
];

const hasCounterparty = (values) => !!values.needs_counterparty;

const buildFields = (isEdit) => [
    {
        name: 'purchase_mode_key', label: 'Key', type: 'text', required: true, minLength: 2, maxLength: 50,
        placeholder: 'e.g. lease_agreement', readOnly: isEdit,
        hint: isEdit
            ? 'The key cannot be changed once the mode exists, because other records refer to it.'
            : 'A short lowercase code used internally. Spaces and dashes become underscores.'
    },
    {
        name: 'purchase_mode_name', label: 'Display Name', type: 'text', required: true,
        minLength: 2, maxLength: 100, placeholder: 'e.g. Lease Agreement'
    },
    {
        name: 'description', label: 'Description', type: 'text', maxLength: 1000,
        placeholder: 'When is this mode used?'
    },

    /* ---------------- what this mode means for a cattle record ---------------- */

    {
        name: 'amount_source', label: 'Amount Recorded', type: 'select', required: true,
        options: AMOUNT_SOURCE_OPTIONS, defaultValue: 'purchase_cost', fullWidth: true,
        hint: 'What the amount on an ownership record means under this mode. A recurring amount is asked for separately, because the farm has not bought the animal.'
    },
    {
        name: 'needs_counterparty', label: 'There is another party to this arrangement', type: 'checkbox',
        fullWidth: true
    },
    {
        name: 'counterparty_label', label: 'What to Call Them', type: 'text', maxLength: 50,
        placeholder: 'e.g. Partner, Owner, Lessor', showWhen: hasCounterparty,
        hint: 'Used as the field label on the cattle form. Defaults to Partner.'
    },
    {
        name: 'needs_share_pct', label: 'They hold a percentage share of the animal', type: 'checkbox',
        showWhen: hasCounterparty, fullWidth: true
    }
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
