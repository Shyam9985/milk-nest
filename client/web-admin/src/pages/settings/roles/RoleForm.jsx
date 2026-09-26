import MasterForm from '../components/MasterForm';

function RoleForm({ initialValues = null, hierarchyOptions = [], submitting = false, onSubmit, onCancel }) {

    const ROLE_FORM_FIELDS = [
        { name: 'role_nm', label: 'Role Name', type: 'text', required: true, minLength: 2, maxLength: 150, placeholder: 'e.g. Dairy Form Manager' },
        { name: 'role_hndlr', label: 'Role Handler', type: 'text', required: true, minLength: 2, maxLength: 50, placeholder: 'e.g. form_mngr' },
        { name: 'hierarchy_id', label: 'Hierarchy', type: 'select', options: hierarchyOptions, placeholder: 'Select Hierarchy' },
        { name: 'landing_url', label: 'Landing URL', type: 'text', maxLength: 200, placeholder: 'e.g. /dashboard' },
        { name: 'description', label: 'Description', type: 'text', maxLength: 500, placeholder: 'What can this role do?' }
    ];

    return (
        <MasterForm
            fields={ROLE_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default RoleForm;
