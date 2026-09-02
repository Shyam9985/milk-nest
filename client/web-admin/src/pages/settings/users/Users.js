import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import UserForm from './UserForm';
import {
    getUserList, getUserRoles, createUser, updateUser, deleteUser
} from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const USER_COLUMNS = [
    { label: 'First Name', field: 'first_nm', minWidth: 140 },
    { label: 'Last Name', field: 'last_nm', minWidth: 140 },
    { label: 'Email (login)', field: 'user_nm', minWidth: 220 },
    { label: 'Mobile', field: 'mobile_no', minWidth: 130 },
    { label: 'Role', field: 'role_nm', minWidth: 150 },
    { label: 'Locked', field: 'is_locked', type: 'boolean', minWidth: 90 },
    { label: 'Last Login', field: 'last_login', sortable: false, minWidth: 175 },
    { label: 'Created On', field: 'created_at', sortable: false, minWidth: 175 }
];

function Users() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchUsers = async () => {

        setLoading(true);
        const result = await getUserList();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load users.');
        }

        setLoading(false);
    };

    // roles are fetched once, the first time the drawer opens - not on page load
    const ensureRoleOptions = async () => {

        if (roleOptions.length) return;

        const result = await getUserRoles();

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
        fetchUsers();
    }, []);

    const openAddDrawer = () => {
        ensureRoleOptions();
        setEditingRecord(null);
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (record) => {
        ensureRoleOptions();
        // the form reads `email`; the list exposes the login name as user_nm
        setEditingRecord({ ...record, email: record.user_nm });
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
            ? await updateUser(editingRecord.user_id, payload)
            : await createUser(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'User saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchUsers();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save user.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteUser(deletingRecord.user_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'User deleted successfully.');
            fetchUsers();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete user.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="User Management"
                subtitle="Create users and control their roles. New users need an active position before they can log in."
                backRoute="/settings"
                columns={USER_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add User"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No users found. Add the first user to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update User' : 'Add User'} drawerSize="xs">

                <UserForm
                    initialValues={editingRecord}
                    roleOptions={roleOptions}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete User" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingRecord?.user_nm}</strong>?
                    The account is deactivated, not erased - adding the same email again restores it.
                    Your own account, Super Admin users and users holding an active position cannot be deleted.
                </p>

            </Modal>

        </div>
    );
}

export default Users;
