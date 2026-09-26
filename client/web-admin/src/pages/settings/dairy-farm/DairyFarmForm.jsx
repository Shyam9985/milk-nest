import MasterForm from '../components/MasterForm';

// the farm code is generated server-side; the address is the farm's own registered
// address, while branches are managed on the branches grid below
const DAIRY_FARM_FORM_FIELDS = [
    { name: 'dairy_farm_name', label: 'Dairy Farm Name', type: 'text', required: true, minLength: 2, maxLength: 255, placeholder: 'e.g. MilkNest Dairy Farm' },
    { name: 'contact_number', label: 'Contact Number', type: 'text', maxLength: 20, placeholder: 'e.g. 9876543210' },
    { name: 'email', label: 'Email', type: 'email', maxLength: 255, placeholder: 'e.g. contact@milknest.com' },
    { name: 'address', label: 'Address', type: 'text', maxLength: 1000, placeholder: 'Registered address of the dairy farm' }
];

function DairyFarmForm({ initialValues = null, submitting = false, onSubmit, onCancel }) {

    return (
        <MasterForm
            fields={DAIRY_FARM_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default DairyFarmForm;
