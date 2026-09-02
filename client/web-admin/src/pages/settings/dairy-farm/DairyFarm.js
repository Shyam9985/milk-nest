import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import DairyFarmForm from './DairyFarmForm';
import {
    getDairyFarms, getStates, getDistricts, getMandals, getVillages,
    createDairyFarm, updateDairyFarm, deleteDairyFarm
} from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const DAIRY_FARM_COLUMNS = [
    { label: 'Farm Name', field: 'dairy_farm_name', minWidth: 190 },
    { label: 'Farm Code', field: 'dairy_farm_code', minWidth: 130 },
    { label: 'Main Branch', field: 'main_branch_name', minWidth: 180 },
    { label: 'Branch Code', field: 'main_branch_code', minWidth: 140 },
    { label: 'State', field: 'state_name', minWidth: 130 },
    { label: 'District', field: 'district_name', minWidth: 140 },
    { label: 'Mandal/ULB', field: 'mandal_ulb_nm', minWidth: 150 },
    { label: 'Village/Sachivalayam', field: 'village_sachivalayam_nm', minWidth: 180 },
    { label: 'Contact Number', field: 'contact_number', minWidth: 140 },
    { label: 'Email', field: 'email', minWidth: 200 },
    { label: 'Created On', field: 'created_at', sortable: false, minWidth: 175 },
    { label: 'Updated On', field: 'updated_at', sortable: false, minWidth: 175 }
];

function DairyFarm() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [stateOptions, setStateOptions] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchDairyFarms = async () => {

        setLoading(true);
        const result = await getDairyFarms();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load dairy farms.');
        }

        setLoading(false);
    };

    // states are fetched once, the first time the drawer opens - not on page load
    const ensureStateOptions = async () => {

        if (stateOptions.length) return;

        const result = await getStates();

        if (result?.success) {
            // plain names here - the state label also feeds the auto-composed address
            setStateOptions((result?.data?.records || []).map((state) => ({
                value: state.state_id,
                label: state.state_name
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

    // called by the form whenever a district is picked; fetches only that district's villages
    const loadVillageOptions = async (districtId) => {

        const result = await getVillages({ district_id: districtId });

        if (result?.success) {
            return (result?.data?.records || []).map((village) => ({
                value: village.village_sachivalayam_id,
                label: village.village_sachivalayam_nm
            }));
        }

        toast.error(result?.error || result?.message || 'Unable to load villages for the form.');
        return [];
    };

    useEffect(() => {
        fetchDairyFarms();
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
            ? await updateDairyFarm(editingRecord.dairy_farm_id, payload)
            : await createDairyFarm(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Dairy farm saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchDairyFarms();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save dairy farm.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteDairyFarm(deletingRecord.dairy_farm_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'Dairy farm deleted successfully.');
            fetchDairyFarms();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete dairy farm.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Dairy Farm Master"
                subtitle="Manage dairy farms and their main branches. Every farm has exactly one main branch."
                backRoute="/settings"
                columns={DAIRY_FARM_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Dairy Farm"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No dairy farms found. Add the first dairy farm to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update Dairy Farm' : 'Add Dairy Farm'} drawerSize="xs">

                <DairyFarmForm
                    initialValues={editingRecord}
                    stateOptions={stateOptions}
                    loadDistrictOptions={loadDistrictOptions}
                    loadMandalOptions={loadMandalOptions}
                    loadVillageOptions={loadVillageOptions}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete Dairy Farm" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingRecord?.dairy_farm_name}</strong> ({deletingRecord?.dairy_farm_code})?
                    The record will be deactivated and comes back automatically if the same dairy farm is added again.
                </p>

            </Modal>

        </div>
    );
}

export default DairyFarm;
