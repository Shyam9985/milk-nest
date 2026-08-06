import MasterForm from '../components/MasterForm';

function HierarchyForm({ initialValues = null, parentOptions = [], submitting = false, onSubmit, onCancel }) {

    const HIERARCHY_FORM_FIELDS = [
        { name: 'hierarchy_nm', label: 'Hierarchy Name', type: 'text', required: true, minLength: 2, maxLength: 250, placeholder: 'e.g. Dairy Form Branch' },
        { name: 'level_type', label: 'Level Type', type: 'text', maxLength: 50, placeholder: 'e.g. form_branch (defaults to OTHER)' },
        { name: 'parent_hirrarchy_id', label: 'Parent Hierarchy', type: 'select', options: parentOptions, placeholder: 'Select Parent Hierarchy' }
    ];

    return (
        <MasterForm
            fields={HIERARCHY_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default HierarchyForm;
