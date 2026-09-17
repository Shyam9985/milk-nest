import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import CattleTypeForm from './CattleTypeForm';
import { getCattleTypeList, createCattleType, updateCattleType, deleteCattleType } from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const CATTLE_TYPE_COLUMNS = [
    { label: 'Cattle Type', field: 'cattle_type_name', minWidth: 180 },
    { label: 'Description', field: 'description', minWidth: 300 },
    { label: 'Created On', field: 'created_at', sortable: false, minWidth: 175 },
    { label: 'Updated On', field: 'updated_at', sortable: false, minWidth: 175 }
];

function CattleType() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchCattleTypes = async () => {

        setLoading(true);
        const result = await getCattleTypeList();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load cattle types.');
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchCattleTypes();
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
            ? await updateCattleType(editingRecord.cattle_type_id, payload)
            : await createCattleType(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Cattle type saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchCattleTypes();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save cattle type.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteCattleType(deletingRecord.cattle_type_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'Cattle type deleted successfully.');
            fetchCattleTypes();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete cattle type.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Cattle Type Master"
                subtitle="The kinds of cattle the farms keep, e.g. Cow or Buffalo. Breeds and cattle are recorded under a type."
                backRoute="/settings"
                columns={CATTLE_TYPE_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Cattle Type"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No cattle types found. Add the first cattle type to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update Cattle Type' : 'Add Cattle Type'} drawerSize="xs">

                <CattleTypeForm
                    initialValues={editingRecord}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete Cattle Type" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingRecord?.cattle_type_name}</strong>?
                    Types with active breeds or cattle recorded under them cannot be deleted.
                    The record is deactivated and comes back automatically if the same type is added again.
                </p>

            </Modal>

        </div>
    );
}

export default CattleType;
