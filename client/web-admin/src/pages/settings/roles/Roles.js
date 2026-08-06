import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import RoleForm from './RoleForm';
import { getRoles, getRoleHierarchies, createRole, updateRole, deleteRole } from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const ROLE_COLUMNS = [
    { label: 'Role Name', field: 'role_nm' },
    { label: 'Handler', field: 'role_hndlr' },
    { label: 'Hierarchy', field: 'hierarchy_nm' },
    { label: 'Created On', field: 'created_at', sortable: false },
    { label: 'Updated On', field: 'updated_at', sortable: false }
];

function Roles() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [hierarchyOptions, setHierarchyOptions] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchRoles = async () => {

        setLoading(true);
        const result = await getRoles();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load roles.');
        }

        setLoading(false);
    };

    // hierarchies are fetched once, the first time the drawer opens - not on page load
    const ensureHierarchyOptions = async () => {

        if (hierarchyOptions.length) return;

        const result = await getRoleHierarchies();

        if (result?.success) {
            const options = (result?.data?.records || []).map((hierarchy) => ({
                value: hierarchy.hierarchy_id,
                label: `${hierarchy.hierarchy_nm} (${hierarchy.level_type})`
            }));
            setHierarchyOptions(options);
        } else {
            toast.error(result?.error || result?.message || 'Unable to load hierarchies for the form.');
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const openAddDrawer = () => {
        ensureHierarchyOptions();
        setEditingRecord(null);
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (record) => {
        ensureHierarchyOptions();
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
            ? await updateRole(editingRecord.role_id, payload)
            : await createRole(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Role saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchRoles();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save role.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteRole(deletingRecord.role_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'Role deleted successfully.');
            fetchRoles();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete role.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Role Master"
                subtitle="Manage the roles that control what users can see and do."
                backRoute="/settings"
                columns={ROLE_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Role"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No roles found. Add the first role to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update Role' : 'Add Role'} drawerSize="xs">

                <RoleForm
                    initialValues={editingRecord}
                    hierarchyOptions={hierarchyOptions}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete Role" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingRecord?.role_nm}</strong> ({deletingRecord?.role_hndlr})?
                    The record will be deactivated and comes back automatically if the same role is added again.
                    Roles with active users mapped to them cannot be deleted.
                </p>

            </Modal>

        </div>
    );
}

export default Roles;
