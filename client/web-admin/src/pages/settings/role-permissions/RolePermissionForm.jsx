import MasterForm from '../components/MasterForm';

function RolePermissionForm({ initialValues = null, roleOptions = [], submitting = false, onSubmit, onCancel }) {

    const ROLE_PERMISSION_FORM_FIELDS = [
        { name: 'role_id', label: 'Role', type: 'select', required: true, options: roleOptions, placeholder: 'Select Role' },
        { name: 'permission_key', label: 'Permission Key', type: 'text', required: true, minLength: 2, maxLength: 200, placeholder: 'e.g. dairy-farm' },
        { name: 'can_view', label: 'Can View', type: 'checkbox' },
        { name: 'can_insert', label: 'Can Insert', type: 'checkbox' },
        { name: 'can_update', label: 'Can Update', type: 'checkbox' },
        { name: 'can_delete', label: 'Can Delete', type: 'checkbox' }
    ];

    return (
        <MasterForm
            fields={ROLE_PERMISSION_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default RolePermissionForm;
