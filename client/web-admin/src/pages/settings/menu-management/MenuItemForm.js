import MasterForm from '../components/MasterForm';

const MENU_ITEM_CATEGORY_OPTIONS = [
    { value: 'mnu', label: 'Main Menu (mnu) - sidebar navigation' },
    { value: 'stp', label: 'Setup (stp) - settings hub tiles' },
    { value: 'rpt', label: 'Report (rpt) - reports' }
];

function MenuItemForm({ initialValues = null, parentOptions = [], categoryOptions = [], submitting = false, onSubmit, onCancel }) {

    const MENU_ITEM_FORM_FIELDS = [
        { name: 'menu_name', label: 'Menu Name', type: 'text', required: true, minLength: 2, maxLength: 250, placeholder: 'e.g. Dairy Farm' },
        { name: 'menu_url', label: 'Menu URL', type: 'text', maxLength: 1000, placeholder: 'e.g. /settings/master/dairy-farm' },
        { name: 'icon', label: 'Icon', type: 'text', maxLength: 200, placeholder: 'Lucide icon name, e.g. Warehouse' },
        { name: 'menu_item_category', label: 'Menu Item Category', type: 'select', required: true, options: MENU_ITEM_CATEGORY_OPTIONS, placeholder: 'Select Category' },
        { name: 'is_main_item', label: 'Is Main Item (sidebar root)', type: 'checkbox' },
        { name: 'parent_item_id', label: 'Parent Menu', type: 'select', options: parentOptions, placeholder: 'Select Parent (optional)' },
        { name: 'is_quick_menu', label: 'Is Quick Menu (settings hub tile)', type: 'checkbox' },
        { name: 'quick_menu_ctgry_id', label: 'Quick Menu Category', type: 'select', options: categoryOptions, placeholder: 'Select Quick Menu Category' }
    ];

    return (
        <MasterForm
            fields={MENU_ITEM_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default MenuItemForm;
