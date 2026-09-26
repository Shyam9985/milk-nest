import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import RoleMenuMapForm from './RoleMenuMapForm';
import {
    getRoleMenuMapList, getRoleMenuMapRoles, getRoleMenuMapMenuItems,
    createRoleMenuMap, updateRoleMenuMap, deleteRoleMenuMap
} from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const ROLE_MENU_MAP_COLUMNS = [
    { label: 'Role', field: 'role_nm', minWidth: 160 },
    { label: 'Menu Item', field: 'menu_name', minWidth: 180 },
    { label: 'URL', field: 'menu_url', minWidth: 220 },
    { label: 'Quick Menu', field: 'is_quick_menu', type: 'boolean', minWidth: 110 },
    { label: 'Order', field: 'display_order', minWidth: 90 },
    { label: 'Created On', field: 'created_at', sortable: false, minWidth: 175 },
    { label: 'Updated On', field: 'updated_at', sortable: false, minWidth: 175 }
];

function RoleMenuMapping() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [menuOptions, setMenuOptions] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchMappings = async () => {

        setLoading(true);
        const result = await getRoleMenuMapList();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load role menu mappings.');
        }

        setLoading(false);
    };

    // dropdown data is fetched once, the first time the drawer opens - not on page load
    const ensureFormOptions = async () => {

        if (roleOptions.length && menuOptions.length) return;

        const [roles, menuItems] = await Promise.all([
            getRoleMenuMapRoles(), getRoleMenuMapMenuItems()
        ]);

        if (roles?.success) {
            setRoleOptions((roles?.data?.records || []).map((role) => ({
                value: role.role_id,
                label: role.role_nm
            })));
        } else {
            toast.error(roles?.error || roles?.message || 'Unable to load roles for the form.');
        }

        if (menuItems?.success) {
            setMenuOptions((menuItems?.data?.records || []).map((item) => ({
                value: item.menu_item_id,
                label: `${item.menu_name}${item.is_quick_menu ? ' (Quick)' : ''}${item.menu_url ? ` - ${item.menu_url}` : ''}`
            })));
        } else {
            toast.error(menuItems?.error || menuItems?.message || 'Unable to load menu items for the form.');
        }
    };

    useEffect(() => {
        fetchMappings();
    }, []);

    const openAddDrawer = () => {
        ensureFormOptions();
        setEditingRecord(null);
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (record) => {
        ensureFormOptions();
        setEditingRecord(record);
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        if (submitting) return;
        setIsDrawerOpen(false);
        setEditingRecord(null);
    };

    const handleSubmit = async (payload) => {

        setSubmitting(true);

        const result = editingRecord
            ? await updateRoleMenuMap(editingRecord.role_menu_id, payload)
            : await createRoleMenuMap(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Mapping saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchMappings();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save mapping.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteRoleMenuMap(deletingRecord.role_menu_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'Mapping deleted successfully.');
            fetchMappings();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete mapping.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Role Menu Mapping"
                subtitle="Choose which menus and settings tiles each role can see, and in what order."
                backRoute="/settings"
                columns={ROLE_MENU_MAP_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Mapping"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No mappings found. Add the first mapping to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update Mapping' : 'Add Mapping'} drawerSize="xs">

                <RoleMenuMapForm
                    initialValues={editingRecord}
                    roleOptions={roleOptions}
                    menuOptions={menuOptions}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete Mapping" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to remove <strong>{deletingRecord?.menu_name}</strong> from
                    the <strong>{deletingRecord?.role_nm}</strong> role?
                    Users with that role will no longer see this menu.
                </p>

            </Modal>

        </div>
    );
}

export default RoleMenuMapping;
