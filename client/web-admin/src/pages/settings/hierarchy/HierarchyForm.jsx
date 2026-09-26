import MasterForm from '../components/MasterForm';

// mirrors the server enum; these values drive data-scope derivation, so no free typing
const LEVEL_TYPE_OPTIONS = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'state', label: 'State' },
    { value: 'district', label: 'District' },
    { value: 'mandal', label: 'Mandal' },
    { value: 'village', label: 'Village' },
    { value: 'dairy_form', label: 'Dairy Form' },
    { value: 'form_branch', label: 'Form Branch' }
];

function HierarchyForm({ initialValues = null, parentOptions = [], submitting = false, onSubmit, onCancel }) {

    const HIERARCHY_FORM_FIELDS = [
        { name: 'hierarchy_nm', label: 'Hierarchy Name', type: 'text', required: true, minLength: 2, maxLength: 250, placeholder: 'e.g. Dairy Form Branch' },
        { name: 'level_type', label: 'Level Type', type: 'select', options: LEVEL_TYPE_OPTIONS, placeholder: 'Select Level Type (defaults to OTHER)' },
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
