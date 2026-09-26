import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import CattleForm from './CattleForm';
import {
    getCattleList, getCattleFormOptions, getCattleBranchOptions, getCattleBreedOptions,
    createCattle, updateCattle, deleteCattle
} from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const CATTLE_COLUMNS = [
    { label: 'Cattle Code', field: 'cattle_unique_code', minWidth: 170 },
    { label: 'Cattle Type', field: 'cattle_type_name', minWidth: 140 },
    { label: 'Breed', field: 'breed_name', minWidth: 150 },
    { label: 'Gender', field: 'gender_nm', minWidth: 110 },
    { label: 'Dairy Farm', field: 'dairy_farm_name', minWidth: 180 },
    { label: 'Branch', field: 'branch_name', minWidth: 170 },
    { label: 'Date of Birth', field: 'date_of_birth', sortable: false, minWidth: 130 },
    { label: 'Weight (kg)', field: 'weight', minWidth: 120 },
    { label: 'Colour', field: 'color', minWidth: 140 },
    { label: 'Health Status', field: 'health_status', minWidth: 160 },
    { label: 'Purchase Date', field: 'purchase_date', sortable: false, minWidth: 140 },
    { label: 'Purchase Cost', field: 'purchase_cost', minWidth: 140 },
    { label: 'Created On', field: 'created_at', sortable: false, minWidth: 175 }
];

function CattleManagement() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [dairyFarmOptions, setDairyFarmOptions] = useState([]);
    const [cattleTypeOptions, setCattleTypeOptions] = useState([]);
    const [genderOptions, setGenderOptions] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchCattle = async () => {

        setLoading(true);
        const result = await getCattleList();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load cattle.');
        }

        setLoading(false);
    };

    // the static dropdown lists arrive in one call, the first time the drawer opens
    const ensureFormOptions = async () => {

        if (dairyFarmOptions.length && cattleTypeOptions.length) return;

        const result = await getCattleFormOptions();

        if (result?.success) {
            setDairyFarmOptions((result?.data?.dairy_farms || []).map((farm) => ({
                value: farm.dairy_farm_id,
                label: `${farm.dairy_farm_name} (${farm.dairy_farm_code})`
            })));
            setCattleTypeOptions((result?.data?.cattle_types || []).map((type) => ({
                value: type.cattle_type_id,
                label: type.cattle_type_name
            })));
            setGenderOptions((result?.data?.genders || []).map((gender) => ({
                value: gender.gender_id,
                label: gender.gender_nm
            })));
        } else {
            toast.error(result?.error || result?.message || 'Unable to load options for the form.');
        }
    };

    // called by the form when a dairy farm is picked; only that farm's branches
    const loadBranchOptions = async (dairyFarmId) => {

        const result = await getCattleBranchOptions({ dairy_farm_id: dairyFarmId });

        if (result?.success) {
            return (result?.data?.records || []).map((branch) => ({
                value: branch.branch_id,
                label: `${branch.branch_name}${branch.is_main_branch ? ' (Main)' : ''}`
            }));
        }

        toast.error(result?.error || result?.message || 'Unable to load branches for the form.');
        return [];
    };

    // called by the form when a cattle type is picked; only that type's breeds
    const loadBreedOptions = async (cattleTypeId) => {

        const result = await getCattleBreedOptions({ cattle_type_id: cattleTypeId });

        if (result?.success) {
            return (result?.data?.records || []).map((breed) => ({
                value: breed.breed_id,
                label: breed.breed_name
            }));
        }

        toast.error(result?.error || result?.message || 'Unable to load breeds for the form.');
        return [];
    };

    useEffect(() => {
        fetchCattle();
    }, []);

    const openAddDrawer = () => {
        ensureFormOptions();
        setEditingRecord(null);
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (record) => {
        ensureFormOptions();
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
            ? await updateCattle(editingRecord.cattle_id, payload)
            : await createCattle(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Cattle saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchCattle();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save cattle.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteCattle(deletingRecord.cattle_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'Cattle removed successfully.');
            fetchCattle();
        } else {
            toast.error(result?.error || result?.message || 'Unable to remove cattle.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Cattle Management"
                subtitle="Every animal recorded against a branch. Codes are generated from the branch code."
                backRoute="/settings"
                columns={CATTLE_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Cattle"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No cattle recorded yet. Add the first animal to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update Cattle' : 'Add Cattle'} drawerSize="xs">

                <CattleForm
                    initialValues={editingRecord}
                    dairyFarmOptions={dairyFarmOptions}
                    cattleTypeOptions={cattleTypeOptions}
                    genderOptions={genderOptions}
                    loadBranchOptions={loadBranchOptions}
                    loadBreedOptions={loadBreedOptions}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Remove Cattle" primaryButtonName="Remove" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to remove <strong>{deletingRecord?.cattle_unique_code}</strong>
                    {deletingRecord?.breed_name ? ` (${deletingRecord.breed_name})` : ''}?
                    The record is deactivated rather than erased, so its history stays intact.
                </p>

            </Modal>

        </div>
    );
}

export default CattleManagement;
