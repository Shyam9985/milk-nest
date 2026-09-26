import MasterForm from '../components/MasterForm';

function MenuCategoryForm({ initialValues = null, submitting = false, onSubmit, onCancel }) {

    const MENU_CATEGORY_FORM_FIELDS = [
        { name: 'ctgry_nm', label: 'Category Name', type: 'text', required: true, minLength: 2, maxLength: 100, placeholder: 'e.g. Master Data' },
        { name: 'ctgry_cd', label: 'Category Code', type: 'text', required: true, maxLength: 50, placeholder: 'e.g. MASTER' },
        { name: 'description', label: 'Description', type: 'text', maxLength: 300, placeholder: 'What belongs in this category?' },
        { name: 'display_order', label: 'Display Order', type: 'number', placeholder: 'e.g. 1' },
        { name: 'icon', label: 'Icon', type: 'text', maxLength: 100, placeholder: 'Lucide icon name, e.g. Database' }
    ];

    return (
        <MasterForm
            fields={MENU_CATEGORY_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default MenuCategoryForm;
