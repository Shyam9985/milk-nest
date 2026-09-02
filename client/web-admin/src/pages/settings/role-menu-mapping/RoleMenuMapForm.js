import MasterForm from '../components/MasterForm';

function RoleMenuMapForm({ initialValues = null, roleOptions = [], menuOptions = [], submitting = false, onSubmit, onCancel }) {

    const ROLE_MENU_MAP_FORM_FIELDS = [
        { name: 'role_id', label: 'Role', type: 'select', required: true, options: roleOptions, placeholder: 'Select Role' },
        { name: 'menu_item_id', label: 'Menu Item', type: 'select', required: true, options: menuOptions, placeholder: 'Select Menu Item' },
        { name: 'display_order', label: 'Display Order', type: 'number', placeholder: 'e.g. 1' }
    ];

    return (
        <MasterForm
            fields={ROLE_MENU_MAP_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default RoleMenuMapForm;
