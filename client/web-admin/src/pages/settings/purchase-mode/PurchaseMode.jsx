import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import PurchaseModeForm from './PurchaseModeForm';
import { getPurchaseModeList, createPurchaseMode, updatePurchaseMode, deletePurchaseMode } from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const PURCHASE_MODE_COLUMNS = [
    { label: 'Display Name', field: 'purchase_mode_name', minWidth: 200 },
    { label: 'Key', field: 'purchase_mode_key', minWidth: 150 },
    { label: 'Description', field: 'description', minWidth: 300 },
    { label: 'Created On', field: 'created_at', sortable: false, minWidth: 175 },
    { label: 'Updated On', field: 'updated_at', sortable: false, minWidth: 175 }
];

function PurchaseMode() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchPurchaseModes = async () => {

        setLoading(true);
        const result = await getPurchaseModeList();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load purchase modes.');
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchPurchaseModes();
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
            ? await updatePurchaseMode(editingRecord.purchase_mode_id, payload)
            : await createPurchaseMode(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Purchase mode saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchPurchaseModes();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save purchase mode.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deletePurchaseMode(deletingRecord.purchase_mode_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'Purchase mode deleted successfully.');
            fetchPurchaseModes();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete purchase mode.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Purchase Mode Master"
                subtitle="How cattle come to the farm - bought outright, in partnership, cared for on a monthly payment, or born here."
                backRoute="/settings"
                columns={PURCHASE_MODE_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Purchase Mode"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No purchase modes found. Add the first mode to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update Purchase Mode' : 'Add Purchase Mode'} drawerSize="xs">

                <PurchaseModeForm
                    initialValues={editingRecord}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete Purchase Mode" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingRecord?.purchase_mode_name}</strong>?
                    Modes used by a cattle ownership record cannot be deleted.
                    The record is deactivated and comes back automatically if the same key is added again.
                </p>

            </Modal>

        </div>
    );
}

export default PurchaseMode;
