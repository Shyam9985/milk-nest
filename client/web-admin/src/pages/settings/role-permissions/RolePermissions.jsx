import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import RolePermissionForm from './RolePermissionForm';
import {
    getRolePermissionList, getRolePermissionRoles,
    createRolePermission, updateRolePermission, deleteRolePermission
} from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const ROLE_PERMISSION_COLUMNS = [
    { label: 'Role', field: 'role_nm', minWidth: 160 },
    { label: 'Permission Key', field: 'permission_key', minWidth: 180 },
    { label: 'View', field: 'can_view', type: 'boolean', minWidth: 90 },
    { label: 'Insert', field: 'can_insert', type: 'boolean', minWidth: 90 },
    { label: 'Update', field: 'can_update', type: 'boolean', minWidth: 90 },
    { label: 'Delete', field: 'can_delete', type: 'boolean', minWidth: 90 },
    { label: 'Created On', field: 'created_at', sortable: false, minWidth: 175 },
    { label: 'Updated On', field: 'updated_at', sortable: false, minWidth: 175 }
];

function RolePermissions() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchRolePermissions = async () => {

        setLoading(true);
        const result = await getRolePermissionList();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load role permissions.');
        }

        setLoading(false);
    };

    // roles are fetched once, the first time the drawer opens - not on page load
    const ensureRoleOptions = async () => {

        if (roleOptions.length) return;

        const result = await getRolePermissionRoles();

        if (result?.success) {
            setRoleOptions((result?.data?.records || []).map((role) => ({
                value: role.role_id,
                label: role.role_nm
            })));
        } else {
            toast.error(result?.error || result?.message || 'Unable to load roles for the form.');
        }
    };

    useEffect(() => {
        fetchRolePermissions();
    }, []);

    const openAddDrawer = () => {
        ensureRoleOptions();
        setEditingRecord(null);
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (record) => {
        ensureRoleOptions();
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
            ? await updateRolePermission(editingRecord.role_permission_id, payload)
            : await createRolePermission(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Permission saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchRolePermissions();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save permission.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteRolePermission(deletingRecord.role_permission_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'Permission deleted successfully.');
            fetchRolePermissions();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete permission.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Role Permissions"
                subtitle="Control what each role can view, insert, update and delete per permission key."
                backRoute="/settings"
                columns={ROLE_PERMISSION_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Permission"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No permissions found. Add the first permission to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update Permission' : 'Add Permission'} drawerSize="xs">

                <RolePermissionForm
                    initialValues={editingRecord}
                    roleOptions={roleOptions}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete Permission" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete the <strong>{deletingRecord?.permission_key}</strong> permission
                    for <strong>{deletingRecord?.role_nm}</strong>?
                    Users with that role will immediately lose access to the related screens.
                    Super Admin permission entries are protected and cannot be deleted.
                </p>

            </Modal>

        </div>
    );
}

export default RolePermissions;
