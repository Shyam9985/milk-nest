import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import PositionForm from './PositionForm';
import {
    getPositions, getPositionRoles, getPositionHierarchies, getPositionUsers,
    getStates, getDistricts, getMandals, getVillages, getDairyFarms,
    createPosition, updatePosition, deletePosition
} from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

// minWidth (px) keeps the wide grid readable - the container scrolls horizontally instead of wrapping cells
const POSITION_COLUMNS = [
    { label: 'Position Name', field: 'position_nm', minWidth: 200 },
    { label: 'Role', field: 'role_nm', minWidth: 140 },
    { label: 'Hierarchy', field: 'hierarchy_nm', minWidth: 150 },
    { label: 'Assigned User', field: 'assigned_user', minWidth: 180 },
    { label: 'Dairy Farm', field: 'dairy_farm_name', minWidth: 160 },
    { label: 'State', field: 'state_name', minWidth: 130 },
    { label: 'District', field: 'district_name', minWidth: 140 },
    { label: 'Mandal/ULB', field: 'mandal_ulb_nm', minWidth: 150 },
    { label: 'Village/Sachivalayam', field: 'village_sachivalayam_nm', minWidth: 180 },
    { label: 'Start Date', field: 'start_date', sortable: false, minWidth: 110 },
    { label: 'End Date', field: 'end_date', sortable: false, minWidth: 110 },
    { label: 'Created On', field: 'created_at', sortable: false, minWidth: 175 },
    { label: 'Updated On', field: 'updated_at', sortable: false, minWidth: 175 }
];

function Position() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [hierarchyOptions, setHierarchyOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [stateOptions, setStateOptions] = useState([]);
    const [dairyFarmOptions, setDairyFarmOptions] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchPositions = async () => {

        setLoading(true);
        const result = await getPositions();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load positions.');
        }

        setLoading(false);
    };

    // dropdown data is fetched once, the first time the drawer opens - not on page load
    const ensureFormOptions = async () => {

        if (roleOptions.length && hierarchyOptions.length && userOptions.length
            && stateOptions.length && dairyFarmOptions.length) return;

        const [roles, hierarchies, users, states, dairyFarms] = await Promise.all([
            getPositionRoles(), getPositionHierarchies(), getPositionUsers(), getStates(), getDairyFarms()
        ]);

        if (roles?.success) {
            setRoleOptions((roles?.data?.records || []).map((role) => ({
                value: role.role_id,
                label: role.role_nm
            })));
        } else {
            toast.error(roles?.error || roles?.message || 'Unable to load roles for the form.');
        }

        if (hierarchies?.success) {
            setHierarchyOptions((hierarchies?.data?.records || []).map((hierarchy) => ({
                value: hierarchy.hierarchy_id,
                label: `${hierarchy.hierarchy_nm} (${hierarchy.level_type})`
            })));
        } else {
            toast.error(hierarchies?.error || hierarchies?.message || 'Unable to load hierarchies for the form.');
        }

        if (users?.success) {
            setUserOptions((users?.data?.records || []).map((user) => ({
                value: user.user_id,
                label: `${[user.first_nm, user.last_nm].filter(Boolean).join(' ') || user.user_nm} (${user.user_nm})`
            })));
        } else {
            toast.error(users?.error || users?.message || 'Unable to load users for the form.');
        }

        if (states?.success) {
            setStateOptions((states?.data?.records || []).map((state) => ({
                value: state.state_id,
                label: `${state.state_name} (${state.state_code})`
            })));
        } else {
            toast.error(states?.error || states?.message || 'Unable to load states for the form.');
        }

        if (dairyFarms?.success) {
            setDairyFarmOptions((dairyFarms?.data?.records || []).map((dairyFarm) => ({
                value: dairyFarm.dairy_farm_id,
                label: `${dairyFarm.dairy_farm_name} (${dairyFarm.dairy_farm_code})`
            })));
        } else {
            toast.error(dairyFarms?.error || dairyFarms?.message || 'Unable to load dairy farms for the form.');
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
        fetchPositions();
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
            ? await updatePosition(editingRecord.position_id, payload)
            : await createPosition(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Position saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchPositions();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save position.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deletePosition(deletingRecord.position_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'Position deleted successfully.');
            fetchPositions();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete position.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Position Master"
                subtitle="Define positions and assign users to them. Users log in through their active position."
                backRoute="/settings"
                columns={POSITION_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Position"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No positions found. Add the first position to get started.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update Position' : 'Add Position'} drawerSize="xs">

                <PositionForm
                    initialValues={editingRecord}
                    roleOptions={roleOptions}
                    hierarchyOptions={hierarchyOptions}
                    userOptions={userOptions}
                    stateOptions={stateOptions}
                    dairyFarmOptions={dairyFarmOptions}
                    loadDistrictOptions={loadDistrictOptions}
                    loadMandalOptions={loadMandalOptions}
                    loadVillageOptions={loadVillageOptions}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete Position" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingRecord?.position_nm}</strong>?
                    The record will be deactivated and comes back automatically if the same position is added again.
                    Positions with a user assigned to them cannot be deleted.
                </p>

            </Modal>

        </div>
    );
}

export default Position;
