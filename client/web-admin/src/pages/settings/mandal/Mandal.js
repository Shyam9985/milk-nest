import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import MandalForm from './MandalForm';
import { getMandals, getDistricts, createMandal, updateMandal, deleteMandal } from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const MANDAL_COLUMNS = [
    { label: 'Mandal/ULB Name', field: 'mandal_ulb_nm' },
    { label: 'Code', field: 'mandal_ulb_code' },
    { label: 'District', field: 'district_name' },
    { label: 'State', field: 'state_name' },
    { label: 'Type', field: 'is_ulb', renderCell: (value) => (value ? 'ULB' : 'Mandal') },
    { label: 'Created On', field: 'created_at', sortable: false },
    { label: 'Updated On', field: 'updated_at', sortable: false }
];

function Mandal() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [districtOptions, setDistrictOptions] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchMandals = async () => {

        setLoading(true);
        const result = await getMandals();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load mandals.');
        }

        setLoading(false);
    };

    // districts feed the parent dropdown in the form
    const fetchDistrictOptions = async () => {

        const result = await getDistricts();

        if (result?.success) {
            const options = (result?.data?.records || []).map((district) => ({
                value: district.district_id,
                label: `${district.district_name} (${district.state_name})`
            }));
            setDistrictOptions(options);
        } else {
            toast.error(result?.error || result?.message || 'Unable to load districts for the form.');
        }
    };

    useEffect(() => {
        fetchMandals();
        fetchDistrictOptions();
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
            ? await updateMandal(editingRecord.mandal_ulb_id, payload)
            : await createMandal(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Mandal/ULB saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchMandals();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save mandal/ULB.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteMandal(deletingRecord.mandal_ulb_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'Mandal/ULB deleted successfully.');
            fetchMandals();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete mandal/ULB.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Mandal / ULB Master"
                subtitle="Manage the mandals and urban local bodies mapped under each district."
                backRoute="/settings"
                columns={MANDAL_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Mandal/ULB"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No mandals/ULBs found. Add the first one to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update Mandal/ULB' : 'Add Mandal/ULB'} drawerSize="xs">

                <MandalForm
                    districtOptions={districtOptions}
                    initialValues={editingRecord}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete Mandal/ULB" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingRecord?.mandal_ulb_nm}</strong> ({deletingRecord?.mandal_ulb_code})?
                    Deletion is blocked while active villages are mapped to this mandal/ULB.
                </p>

            </Modal>

        </div>
    );
}

export default Mandal;
