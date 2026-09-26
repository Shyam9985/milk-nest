import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import VillageForm from './VillageForm';
import { getVillages, getDistricts, getMandals, getStates, createVillage, updateVillage, deleteVillage } from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const VILLAGE_COLUMNS = [
    { label: 'Village/Sachivalayam', field: 'village_sachivalayam_nm' },
    { label: 'Code', field: 'village_sachivalayam_code' },
    { label: 'District', field: 'district_name' },
    { label: 'Mandal/ULB', field: 'mandal_ulb_nm' },
    { label: 'Type', field: 'is_sachivalayam', renderCell: (value) => (value ? 'Sachivalayam' : 'Village') },
    { label: 'Created On', field: 'created_at', sortable: false },
    { label: 'Updated On', field: 'updated_at', sortable: false }
];

function Village() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [stateOptions, setStateOptions] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchVillages = async () => {

        setLoading(true);
        const result = await getVillages();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load villages.');
        }

        setLoading(false);
    };

    // states are fetched once, the first time the drawer opens - not on page load
    const ensureStateOptions = async () => {

        if (stateOptions.length) return;

        const result = await getStates();

        if (result?.success) {
            setStateOptions((result?.data?.records || []).map((state) => ({
                value: state.state_id,
                label: `${state.state_name} (${state.state_code})`
            })));
        } else {
            toast.error(result?.error || result?.message || 'Unable to load states for the form.');
        }
    };

    // called by the form whenever a state is picked; fetches only that state's districts
    const loadDistrictOptions = async (stateId) => {

        const result = await getDistricts({ state_id: stateId });

        if (result?.success) {
            return (result?.data?.records || []).map((district) => ({
                value: district.district_id,
                label: district.district_name
            }));
        }

        toast.error(result?.error || result?.message || 'Unable to load districts for the form.');
        return [];
    };

    // called by the form whenever a district is picked; fetches only that district's mandals
    const loadMandalOptions = async (districtId) => {

        const result = await getMandals({ district_id: districtId });

        if (result?.success) {
            return (result?.data?.records || []).map((mandal) => ({
                value: mandal.mandal_ulb_id,
                label: mandal.mandal_ulb_nm
            }));
        }

        toast.error(result?.error || result?.message || 'Unable to load mandals for the form.');
        return [];
    };

    useEffect(() => {
        fetchVillages();
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
            ? await updateVillage(editingRecord.village_sachivalayam_id, payload)
            : await createVillage(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Village/Sachivalayam saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchVillages();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save village/sachivalayam.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteVillage(deletingRecord.village_sachivalayam_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'Village/Sachivalayam deleted successfully.');
            fetchVillages();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete village/sachivalayam.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Village / Sachivalayam Master"
                subtitle="Manage the villages and sachivalayams mapped under districts and mandals."
                backRoute="/settings"
                columns={VILLAGE_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Village"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No villages found. Add the first village to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update Village/Sachivalayam' : 'Add Village/Sachivalayam'} drawerSize="xs">

                <VillageForm
                    stateOptions={stateOptions}
                    loadDistrictOptions={loadDistrictOptions}
                    loadMandalOptions={loadMandalOptions}
                    initialValues={editingRecord}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete Village/Sachivalayam" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingRecord?.village_sachivalayam_nm}</strong> ({deletingRecord?.village_sachivalayam_code})?
                    The record will be deactivated and comes back automatically if the same village is added again.
                </p>

            </Modal>

        </div>
    );
}

export default Village;
