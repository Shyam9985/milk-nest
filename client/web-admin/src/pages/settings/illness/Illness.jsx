import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import IllnessForm from './IllnessForm';
import { getIllnessList, createIllness, updateIllness, deleteIllness } from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const ILLNESS_COLUMNS = [
    { label: 'Illness', field: 'illness_name', minWidth: 200 },
    { label: 'Description', field: 'description', minWidth: 320 },
    { label: 'Created On', field: 'created_at', sortable: false, minWidth: 175 },
    { label: 'Updated On', field: 'updated_at', sortable: false, minWidth: 175 }
];

function Illness() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchIllnesses = async () => {

        setLoading(true);
        const result = await getIllnessList();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load illnesses.');
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchIllnesses();
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
            ? await updateIllness(editingRecord.illness_id, payload)
            : await createIllness(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Illness saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchIllnesses();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save illness.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteIllness(deletingRecord.illness_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'Illness deleted successfully.');
            fetchIllnesses();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete illness.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Illness Master"
                subtitle="The illnesses treatments are recorded against. Keeping them as a list is what makes reporting by illness possible."
                backRoute="/settings"
                columns={ILLNESS_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Illness"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No illnesses found. Add the common ones - mastitis, foot and mouth, bloat, milk fever - before recording treatments.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update Illness' : 'Add Illness'} drawerSize="xs">

                <IllnessForm
                    initialValues={editingRecord}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete Illness" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingRecord?.illness_name}</strong>?
                    Illnesses referred to by a treatment record cannot be deleted.
                    The record is deactivated and comes back automatically if the same illness is added again.
                </p>

            </Modal>

        </div>
    );
}

export default Illness;
