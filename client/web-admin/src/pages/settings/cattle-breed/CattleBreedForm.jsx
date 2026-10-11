import MasterForm from '../components/MasterForm';

function CattleBreedForm({ initialValues = null, cattleTypeOptions = [], submitting = false, onSubmit, onCancel }) {

    // breed names are unique within a cattle type, so the type is picked first
    const CATTLE_BREED_FORM_FIELDS = [
        { name: 'cattle_type_id', label: 'Cattle Type', type: 'select', required: true, options: cattleTypeOptions, placeholder: 'Select Cattle Type' },
        { name: 'breed_name', label: 'Breed Name', type: 'text', required: true, minLength: 2, maxLength: 255, placeholder: 'e.g. Gir' },
        { name: 'description', label: 'Description', type: 'text', maxLength: 1000, placeholder: 'Notes about this breed' }
    ];

    return (
        <MasterForm
            fields={CATTLE_BREED_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default CattleBreedForm;
