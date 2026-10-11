import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import GenderForm from './GenderForm';
import { getGenders, createGender, updateGender, deleteGender } from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const GENDER_COLUMNS = [
    { label: 'Gender Name', field: 'gender_nm' },
    { label: 'Gender Code', field: 'gender_code' },
    { label: 'Created On', field: 'created_at', sortable: false },
    { label: 'Updated On', field: 'updated_at', sortable: false }
];

function Gender() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchGenders = async () => {

        setLoading(true);
        const result = await getGenders();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load genders.');
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchGenders();
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
            ? await updateGender(editingRecord.gender_id, payload)
            : await createGender(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Gender saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchGenders();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save gender.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteGender(deletingRecord.gender_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'Gender deleted successfully.');
            fetchGenders();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete gender.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Gender Master"
                subtitle="Manage the list of genders used across the application."
                backRoute="/settings"
                columns={GENDER_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Gender"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No genders found. Add the first gender to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update Gender' : 'Add Gender'} drawerSize="xs">

                <GenderForm
                    initialValues={editingRecord}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete Gender" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingRecord?.gender_nm}</strong> ({deletingRecord?.gender_code})?
                    The record will be deactivated and comes back automatically if the same gender is added again.
                </p>

            </Modal>

        </div>
    );
}

export default Gender;
