import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import DataGrid from '../../components/table/DataGrid';
import SideDrawer from '../../utils/SideDrawer';
import Modal from '../../utils/ModelComponent';
import CattleForm from './CattleForm';
import {
    getCattleList, getCattleFormOptions, getCattleBranchOptions, getCattleBreedOptions,
    createCattle, updateCattle, deleteCattle
} from '../../services/cattle.service';
import { useToast } from '../../contexts/MessageContext';
import EntityLink from '../profiles/components/EntityLink';
import ProfileDrawer from '../profiles/ProfileDrawer';
import useProfileDrawer from '../profiles/useProfileDrawer';

/*
 * The herd register: every active animal in the user's scope, and the place they are added,
 * corrected and retired.
 *
 * This used to be split in two - a read-only list here and the same grid again under
 * Settings -> Cattle Management. Cattle are operational data, not configuration, so the two were
 * merged into this one screen. The split also hid the feature: the settings tile was mapped to
 * the Branch Incharge alone, so a Super User with full cattle permissions had no way to reach it.
 *
 * Add, edit and delete appear only where the user's permissions allow them; the grid reads the
 * same flags the API enforces, so the screen and the server can never disagree about who may do
 * what. Codes, branches and farms still open their profiles in a side drawer.
 */
// mirrors MILK_BLOCK_LABEL on the server, so a blocked animal reads the same in both places
const MILK_BLOCK_LABEL = {
    sold: 'Not in herd', dead: 'Dead', male: 'Male', calf: 'Too young',
    under_treatment: 'Milk on hold', pregnant_dry: 'Dried off', manual: 'Marked dry'
};

const chip = (Icon, text, color, sub) => (
    <>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium" style={{ color }}>
            <Icon size={13} /> {text}
        </span>
        {sub && <p className="whitespace-nowrap text-xs text-[var(--text-tertiary)]">{sub}</p>}
    </>
);

const muted = (text) => <span className="text-xs text-[var(--text-tertiary)]">{text}</span>;

/*
 * The three derived columns below are DISPLAY ONLY. Acting on a pregnancy or an illness happens in
 * the Breeding and Health registers, which own those rows and the rules that read them.
 */
const describeMilk = (row) => (Number(row.can_produce_milk) === 1
    ? chip(Icons.Milk, 'In milk', 'var(--success)')
    : chip(Icons.MilkOff, MILK_BLOCK_LABEL[row.milk_block_reason] || 'Not milked', 'var(--text-tertiary)'));

const describeBreeding = (row) => {
    if (!row.pregnancy_id) return muted('-');

    if (row.actual_dry_off_date) {
        return chip(Icons.MoonStar, 'Dry', 'var(--info)', `calving ${row.expected_calving_date || '-'}`);
    }
    if (Number(row.dry_off_due)) {
        return chip(Icons.TriangleAlert, 'Dry-off due', 'var(--warning)', `${row.days_pregnant}d pregnant`);
    }
    return chip(Icons.Baby, 'Pregnant', 'var(--text-secondary)',
        `${row.days_pregnant}d · calving ${row.expected_calving_date || '-'}`);
};

const describeHealth = (row) => {
    const open = Number(row.open_treatments) || 0;

    if (!open) return muted('Nothing on record');

    return chip(Icons.Stethoscope, row.open_illness || 'Under treatment', 'var(--danger)',
        row.milk_withdrawal_until
            ? `milk held to ${row.milk_withdrawal_until}`
            : (open > 1 ? `${open} open episodes` : 'open episode'));
};

const buildColumns = (openProfile) => [
    {
        label: 'Cattle Code', field: 'cattle_unique_code', minWidth: 170,
        renderCell: (value, row) => <EntityLink type="cattle" id={row.cattle_id} onNavigate={openProfile}>{value}</EntityLink>
    },
    { label: 'Cattle Type', field: 'cattle_type_name', minWidth: 130 },
    { label: 'Breed', field: 'breed_name', minWidth: 150 },
    { label: 'Gender', field: 'gender_nm', minWidth: 100 },
    {
        label: 'Dairy Farm', field: 'dairy_farm_name', minWidth: 180,
        renderCell: (value, row) => <EntityLink type="dairy-farm" id={row.dairy_farm_id} onNavigate={openProfile}>{value}</EntityLink>
    },
    {
        label: 'Branch', field: 'branch_name', minWidth: 170,
        renderCell: (value, row) => <EntityLink type="branch" id={row.branch_id} onNavigate={openProfile}>{value}</EntityLink>
    },
    { label: 'Milk', field: 'can_produce_milk', minWidth: 140, renderCell: (value, row) => describeMilk(row) },
    { label: 'Breeding', field: 'pregnancy_id', minWidth: 165, sortable: false, renderCell: (value, row) => describeBreeding(row) },
    { label: 'Health', field: 'open_treatments', minWidth: 175, sortable: false, renderCell: (value, row) => describeHealth(row) },
    { label: 'Date of Birth', field: 'date_of_birth', sortable: false, minWidth: 130 },
    { label: 'Weight (kg)', field: 'weight', minWidth: 110 },
    { label: 'Colour', field: 'color', minWidth: 130 },
    { label: 'Purchase Date', field: 'purchase_date', sortable: false, minWidth: 130 },
    { label: 'Purchase Cost', field: 'purchase_cost', minWidth: 130 },
    { label: 'Remarks', field: 'remarks', minWidth: 200 },
    { label: 'Registered On', field: 'created_at', sortable: false, minWidth: 175 }
];

function Cattle() {

    const toast = useToast();
    const profileDrawer = useProfileDrawer();
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
                title="Cattle"
                subtitle="Every animal in your scope. Click a code to open its profile."
                columns={buildColumns(profileDrawer.open)}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Cattle"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{
                    exportFileName: 'cattle-register',
                    emptyMessage: 'No cattle recorded yet. Add the first animal to get started.'
                }}
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

            <ProfileDrawer {...profileDrawer.props} />

        </div>
    );
}

export default Cattle;
