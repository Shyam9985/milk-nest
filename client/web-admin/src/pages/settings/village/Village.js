import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import VillageForm from './VillageForm';
import { getVillages, getDistricts, getMandals, createVillage, updateVillage, deleteVillage } from '../../../services/settings.service';
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
    const [districtOptions, setDistrictOptions] = useState([]);
    const [mandalOptions, setMandalOptions] = useState([]);
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

    // districts and mandals feed the cascading parent dropdowns in the form
    const fetchParentOptions = async () => {

        const [districtRes, mandalRes] = await Promise.all([getDistricts(), getMandals()]);

        if (districtRes?.success) {
            setDistrictOptions((districtRes?.data?.records || []).map((district) => ({
                value: district.district_id,
                label: `${district.district_name} (${district.state_name})`
            })));
        } else {
            toast.error(districtRes?.error || districtRes?.message || 'Unable to load districts for the form.');
        }

        if (mandalRes?.success) {
            // parentValue ties each mandal to its district so the form can cascade
            setMandalOptions((mandalRes?.data?.records || []).map((mandal) => ({
                value: mandal.mandal_ulb_id,
                label: mandal.mandal_ulb_nm,
                parentValue: mandal.district_id
            })));
        } else {
            toast.error(mandalRes?.error || mandalRes?.message || 'Unable to load mandals for the form.');
        }
    };

    useEffect(() => {
        fetchVillages();
        fetchParentOptions();
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
                    districtOptions={districtOptions}
                    mandalOptions={mandalOptions}
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
