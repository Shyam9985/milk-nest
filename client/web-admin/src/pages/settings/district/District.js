import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import DistrictForm from './DistrictForm';
import { getDistricts, getStates, createDistrict, updateDistrict, deleteDistrict } from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const DISTRICT_COLUMNS = [
    { label: 'District Name', field: 'district_name' },
    { label: 'District Code', field: 'district_code' },
    { label: 'State', field: 'state_name' },
    { label: 'Created On', field: 'created_at', sortable: false },
    { label: 'Updated On', field: 'updated_at', sortable: false }
];

function District() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [stateOptions, setStateOptions] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchDistricts = async () => {

        setLoading(true);
        const result = await getDistricts();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load districts.');
        }

        setLoading(false);
    };

    // states are fetched once, the first time the drawer opens - not on page load
    const ensureStateOptions = async () => {

        if (stateOptions.length) return;

        const result = await getStates();

        if (result?.success) {
            const options = (result?.data?.records || []).map((state) => ({
                value: state.state_id,
                label: `${state.state_name} (${state.state_code})`
            }));
            setStateOptions(options);
        } else {
            toast.error(result?.error || result?.message || 'Unable to load states for the form.');
        }
    };

    useEffect(() => {
        fetchDistricts();
    }, []);

    const openAddDrawer = () => {
        ensureStateOptions();
        setEditingRecord(null);
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (record) => {
        ensureStateOptions();
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
            ? await updateDistrict(editingRecord.district_id, payload)
            : await createDistrict(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'District saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchDistricts();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save district.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteDistrict(deletingRecord.district_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'District deleted successfully.');
            fetchDistricts();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete district.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="District Master"
                subtitle="Manage the districts mapped under each state."
                backRoute="/settings"
                columns={DISTRICT_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add District"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No districts found. Add the first district to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update District' : 'Add District'} drawerSize="xs">

                <DistrictForm
                    stateOptions={stateOptions}
                    initialValues={editingRecord}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete District" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingRecord?.district_name}</strong> ({deletingRecord?.district_code})?
                    Deletion is blocked while active mandals/villages are mapped to this district.
                </p>

            </Modal>

        </div>
    );
}

export default District;
