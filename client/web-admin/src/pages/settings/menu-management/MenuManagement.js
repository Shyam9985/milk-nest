import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import MenuItemForm from './MenuItemForm';
import MenuCategoryForm from './MenuCategoryForm';
import {
    getMenuItemList, getMenuParentItems, getMenuCategoryList,
    createMenuItem, updateMenuItem, deleteMenuItem,
    createMenuCategory, updateMenuCategory, deleteMenuCategory
} from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const MENU_ITEM_COLUMNS = [
    { label: 'Menu Name', field: 'menu_name', minWidth: 180 },
    { label: 'URL', field: 'menu_url', minWidth: 220 },
    { label: 'Icon', field: 'icon', minWidth: 120 },
    { label: 'Main', field: 'is_main_item', type: 'boolean', minWidth: 80 },
    { label: 'Parent', field: 'parent_menu_name', minWidth: 150 },
    { label: 'Quick', field: 'is_quick_menu', type: 'boolean', minWidth: 80 },
    { label: 'Quick Category', field: 'ctgry_nm', minWidth: 150 },
    { label: 'Item Category', field: 'menu_item_category', minWidth: 130 },
    { label: 'Created On', field: 'created_at', sortable: false, minWidth: 175 },
    { label: 'Updated On', field: 'updated_at', sortable: false, minWidth: 175 }
];

const MENU_CATEGORY_COLUMNS = [
    { label: 'Category Name', field: 'ctgry_nm', minWidth: 170 },
    { label: 'Code', field: 'ctgry_cd', minWidth: 120 },
    { label: 'Description', field: 'description', minWidth: 220 },
    { label: 'Order', field: 'display_order', minWidth: 90 },
    { label: 'Icon', field: 'icon', minWidth: 120 },
    { label: 'Created On', field: 'created_at', sortable: false, minWidth: 175 },
    { label: 'Updated On', field: 'updated_at', sortable: false, minWidth: 175 }
];

function MenuManagement() {

    const toast = useToast();

    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [parentOptions, setParentOptions] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);
    const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);

    const [editingCategory, setEditingCategory] = useState(null);
    const [deletingCategory, setDeletingCategory] = useState(null);
    const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);

    const fetchMenuItems = async () => {

        setLoadingItems(true);
        const result = await getMenuItemList();

        if (result?.success) {
            setItems(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load menu items.');
        }

        setLoadingItems(false);
    };

    const fetchCategories = async () => {

        setLoadingCategories(true);
        const result = await getMenuCategoryList();

        if (result?.success) {
            setCategories(result?.data?.records || []);
        } else {
            toast.error(result?.error || result?.message || 'Unable to load menu categories.');
        }

        setLoadingCategories(false);
    };

    // parent options are fetched once, the first time the item drawer opens
    const ensureParentOptions = async () => {

        if (parentOptions.length) return;

        const result = await getMenuParentItems();

        if (result?.success) {
            setParentOptions((result?.data?.records || []).map((item) => ({
                value: item.menu_item_id,
                label: item.menu_name
            })));
        } else {
            toast.error(result?.error || result?.message || 'Unable to load parent menus for the form.');
        }
    };

    useEffect(() => {
        fetchMenuItems();
        fetchCategories();
    }, []);

    // the loaded category grid doubles as the quick-menu-category dropdown source
    const categoryOptions = categories.map((category) => ({
        value: category.quick_menu_ctgry_id,
        label: `${category.ctgry_nm} (${category.ctgry_cd})`
    }));

    /* ---------------- Menu items ---------------- */

    const openAddItemDrawer = () => {
        ensureParentOptions();
        setEditingItem(null);
        setIsItemDrawerOpen(true);
    };

    const openEditItemDrawer = (record) => {
        ensureParentOptions();
        setEditingItem(record);
        setIsItemDrawerOpen(true);
    };

    const closeItemDrawer = () => {
        if (submitting) return;
        setIsItemDrawerOpen(false);
        setEditingItem(null);
    };

    const handleItemSubmit = async (payload) => {

        setSubmitting(true);

        const result = editingItem
            ? await updateMenuItem(editingItem.menu_item_id, payload)
            : await createMenuItem(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Menu item saved successfully.');
            setIsItemDrawerOpen(false);
            setEditingItem(null);
            setParentOptions([]); // a new main item may now be a valid parent
            fetchMenuItems();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save menu item.');
        }
    };

    const handleItemDelete = async () => {

        if (!deletingItem) return;

        const result = await deleteMenuItem(deletingItem.menu_item_id);
        setDeletingItem(null);

        if (result?.success) {
            toast.success(result?.message || 'Menu item deleted successfully.');
            setParentOptions([]);
            fetchMenuItems();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete menu item.');
        }
    };

    /* ---------------- Categories ---------------- */

    const openAddCategoryDrawer = () => {
        setEditingCategory(null);
        setIsCategoryDrawerOpen(true);
    };

    const openEditCategoryDrawer = (record) => {
        setEditingCategory(record);
        setIsCategoryDrawerOpen(true);
    };

    const closeCategoryDrawer = () => {
        if (submitting) return;
        setIsCategoryDrawerOpen(false);
        setEditingCategory(null);
    };

    const handleCategorySubmit = async (payload) => {

        setSubmitting(true);

        const result = editingCategory
            ? await updateMenuCategory(editingCategory.quick_menu_ctgry_id, payload)
            : await createMenuCategory(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Category saved successfully.');
            setIsCategoryDrawerOpen(false);
            setEditingCategory(null);
            fetchCategories();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save category.');
        }
    };

    const handleCategoryDelete = async () => {

        if (!deletingCategory) return;

        const result = await deleteMenuCategory(deletingCategory.quick_menu_ctgry_id);
        setDeletingCategory(null);

        if (result?.success) {
            toast.success(result?.message || 'Category deleted successfully.');
            fetchCategories();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete category.');
        }
    };

    return (

        <div className="space-y-8 p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Menu Management"
                subtitle="Define sidebar menus and settings hub tiles. Quick menus appear on the settings page grouped by category."
                backRoute="/settings"
                columns={MENU_ITEM_COLUMNS}
                rows={items}
                loading={loadingItems}
                permissions={permissions}
                addLabel="Add Menu Item"
                onAdd={openAddItemDrawer}
                onEdit={openEditItemDrawer}
                onDelete={(record) => setDeletingItem(record)}
                config={{ emptyMessage: 'No menu items found. Add the first menu item to get started.' }}
            />

            <DataGrid
                title="Quick Menu Categories"
                subtitle="Categories group the quick menu tiles shown on the settings hub."
                columns={MENU_CATEGORY_COLUMNS}
                rows={categories}
                loading={loadingCategories}
                permissions={permissions}
                addLabel="Add Category"
                onAdd={openAddCategoryDrawer}
                onEdit={openEditCategoryDrawer}
                onDelete={(record) => setDeletingCategory(record)}
                config={{ emptyMessage: 'No categories found. Add the first category to get started.' }}
            />

            <SideDrawer isOpen={isItemDrawerOpen} onClose={closeItemDrawer}
                title={editingItem ? 'Update Menu Item' : 'Add Menu Item'} drawerSize="xs">

                <MenuItemForm
                    initialValues={editingItem}
                    parentOptions={parentOptions}
                    categoryOptions={categoryOptions}
                    submitting={submitting}
                    onSubmit={handleItemSubmit}
                    onCancel={closeItemDrawer}
                />

            </SideDrawer>

            <SideDrawer isOpen={isCategoryDrawerOpen} onClose={closeCategoryDrawer}
                title={editingCategory ? 'Update Category' : 'Add Category'} drawerSize="xs">

                <MenuCategoryForm
                    initialValues={editingCategory}
                    submitting={submitting}
                    onSubmit={handleCategorySubmit}
                    onCancel={closeCategoryDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingItem} onClose={() => setDeletingItem(null)} onSubmit={handleItemDelete}
                title="Delete Menu Item" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingItem?.menu_name}</strong>?
                    Menu items with active sub menus or role mappings cannot be deleted.
                </p>

            </Modal>

            <Modal isOpen={!!deletingCategory} onClose={() => setDeletingCategory(null)} onSubmit={handleCategoryDelete}
                title="Delete Category" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingCategory?.ctgry_nm}</strong> ({deletingCategory?.ctgry_cd})?
                    Categories with active menu items mapped to them cannot be deleted.
                </p>

            </Modal>

        </div>
    );
}

export default MenuManagement;
