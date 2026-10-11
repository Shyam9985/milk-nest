import { useEffect, useState } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import SideDrawer from '../../../utils/SideDrawer';
import Modal from '../../../utils/ModelComponent';
import CattleBreedForm from './CattleBreedForm';
import {
    getCattleBreedList, getCattleBreedTypeOptions,
    createCattleBreed, updateCattleBreed, deleteCattleBreed
} from '../../../services/settings.service';
import { useToast } from '../../../contexts/MessageContext';

const CATTLE_BREED_COLUMNS = [
    { label: 'Breed', field: 'breed_name', minWidth: 180 },
    { label: 'Cattle Type', field: 'cattle_type_name', minWidth: 160 },
    { label: 'Description', field: 'description', minWidth: 300 },
    { label: 'Created On', field: 'created_at', sortable: false, minWidth: 175 },
    { label: 'Updated On', field: 'updated_at', sortable: false, minWidth: 175 }
];

function CattleBreed() {

    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [cattleTypeOptions, setCattleTypeOptions] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deletingRecord, setDeletingRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchBreeds = async () => {

        setLoading(true);
        const result = await getCattleBreedList();

        if (result?.success) {
            setRecords(result?.data?.records || []);
            setPermissions(result?.data?.permissions || {});
        } else {
            toast.error(result?.error || result?.message || 'Unable to load breeds.');
        }

        setLoading(false);
    };

    // cattle types are fetched once, the first time the drawer opens - not on page load.
    // the feed sits under the breed permission, so managing breeds needs no cattle type rights
    const ensureCattleTypeOptions = async () => {

        if (cattleTypeOptions.length) return;

        const result = await getCattleBreedTypeOptions();

        if (result?.success) {
            setCattleTypeOptions((result?.data?.records || []).map((type) => ({
                value: type.cattle_type_id,
                label: type.cattle_type_name
            })));
        } else {
            toast.error(result?.error || result?.message || 'Unable to load cattle types for the form.');
        }
    };

    useEffect(() => {
        fetchBreeds();
    }, []);

    const openAddDrawer = () => {
        ensureCattleTypeOptions();
        setEditingRecord(null);
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (record) => {
        ensureCattleTypeOptions();
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
            ? await updateCattleBreed(editingRecord.breed_id, payload)
            : await createCattleBreed(payload);

        setSubmitting(false);

        if (result?.success) {
            toast.success(result?.message || 'Breed saved successfully.');
            setIsDrawerOpen(false);
            setEditingRecord(null);
            fetchBreeds();
        } else {
            toast.error(result?.error || result?.message || 'Unable to save breed.');
        }
    };

    const handleDelete = async () => {

        if (!deletingRecord) return;

        const result = await deleteCattleBreed(deletingRecord.breed_id);
        setDeletingRecord(null);

        if (result?.success) {
            toast.success(result?.message || 'Breed deleted successfully.');
            fetchBreeds();
        } else {
            toast.error(result?.error || result?.message || 'Unable to delete breed.');
        }
    };

    return (

        <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>

            <DataGrid
                title="Cattle Breed Master"
                subtitle="Breeds belong to a cattle type. Breed names are unique within their type."
                backRoute="/settings"
                columns={CATTLE_BREED_COLUMNS}
                rows={records}
                loading={loading}
                permissions={permissions}
                addLabel="Add Breed"
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={(record) => setDeletingRecord(record)}
                config={{ emptyMessage: 'No breeds found. Add a cattle type first, then its breeds.' }}
            />

            <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer}
                title={editingRecord ? 'Update Breed' : 'Add Breed'} drawerSize="xs">

                <CattleBreedForm
                    initialValues={editingRecord}
                    cattleTypeOptions={cattleTypeOptions}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={closeDrawer}
                />

            </SideDrawer>

            <Modal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onSubmit={handleDelete}
                title="Delete Breed" primaryButtonName="Delete" secondaryButtonName="Cancel">

                <p>
                    Are you sure you want to delete <strong>{deletingRecord?.breed_name}</strong> ({deletingRecord?.cattle_type_name})?
                    Breeds with active cattle recorded under them cannot be deleted.
                </p>

            </Modal>

        </div>
    );
}

export default CattleBreed;
