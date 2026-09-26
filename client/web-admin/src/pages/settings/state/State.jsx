import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import StateForm from './StateForm';
import { getStates, createState, updateState, deleteState } from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const STATE_COLUMNS = [
    { label: 'State Name', field: 'state_name' },
    { label: 'State Code', field: 'state_code' },
    { label: 'Created On', field: 'created_at', sortable: false },
    { label: 'Updated On', field: 'updated_at', sortable: false }
];

function State() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchStates = async () => {

        setLoading(true);
        const result = await getStates();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load states.');
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchStates();
    }, []);

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
            ? await updateState(editingRecord.state_id, payload)
            : await createState(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'State saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchStates();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save state.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteState(deletingRecord.state_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'State deleted successfully.');
            fetchStates();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete state.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="State Master"
                subtitle="Manage the list of states used across the application."
                backRoute="/settings"
                columns={STATE_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add State"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No states found. Add the first state to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update State' : 'Add State'} drawerSize="xs">

                <StateForm
                    initialValues={editingRecord}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete State" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingRecord?.state_name}</strong> ({deletingRecord?.state_code})?
                    The record will be deactivated and comes back automatically if the same state is added again.
                </p>

            </Modal>

        </div>
    );
}

export default State;
