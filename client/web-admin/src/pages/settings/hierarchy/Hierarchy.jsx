import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import HierarchyForm from './HierarchyForm';
import { getHierarchies, createHierarchy, updateHierarchy, deleteHierarchy } from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const HIERARCHY_COLUMNS = [
    { label: 'Hierarchy Name', field: 'hierarchy_nm' },
    { label: 'Level Type', field: 'level_type' },
    { label: 'Parent', field: 'parent_hierarchy_nm' },
    { label: 'Created On', field: 'created_at', sortable: false },
    { label: 'Updated On', field: 'updated_at', sortable: false }
];

function Hierarchy() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchHierarchies = async () => {

        setLoading(true);
        const result = await getHierarchies();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load hierarchies.');
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchHierarchies();
    }, []);

    // the grid rows double as parent options; the record being edited is excluded
    // so a hierarchy can never pick itself as its parent
    const parentOptions = records
        .filter((record) => record.hierarchy_id !== editingRecord?.hierarchy_id)
        .map((record) => ({
            value: record.hierarchy_id,
            label: `${record.hierarchy_nm} (${record.level_type})`
        }));

    const openAddDrawer = () => {
        setEditingRecord(null);
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (record) => {
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
            ? await updateHierarchy(editingRecord.hierarchy_id, payload)
            : await createHierarchy(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Hierarchy saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchHierarchies();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save hierarchy.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteHierarchy(deletingRecord.hierarchy_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'Hierarchy deleted successfully.');
            fetchHierarchies();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete hierarchy.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Hierarchy Master"
                subtitle="Manage the reporting hierarchy that roles and positions hang off."
                backRoute="/settings"
                columns={HIERARCHY_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Hierarchy"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No hierarchies found. Add the first hierarchy to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update Hierarchy' : 'Add Hierarchy'} drawerSize="xs">

                <HierarchyForm
                    initialValues={editingRecord}
                    parentOptions={parentOptions}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete Hierarchy" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingRecord?.hierarchy_nm}</strong> ({deletingRecord?.level_type})?
                    The record will be deactivated and comes back automatically if the same hierarchy is added again.
                    Hierarchies with child hierarchies, roles or positions mapped to them cannot be deleted.
                </p>

            </Modal>

        </div>
    );
}

export default Hierarchy;
