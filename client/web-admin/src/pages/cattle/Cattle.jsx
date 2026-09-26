import { useEffect, useState } from 'react';
import DataGrid from '../../components/table/DataGrid';
import { getCattleList } from '../../services/settings.service';
import { useToast } from '../../contexts/MessageContext';
import EntityLink from '../profiles/components/EntityLink';
import ProfileDrawer from '../profiles/ProfileDrawer';
import useProfileDrawer from '../profiles/useProfileDrawer';

/*
 * The herd register as a main-menu screen: every active animal in the user's scope with
 * its complete details, read-only. Codes, branches and farms open their profiles in a
 * side drawer. Adding or editing animals stays under Settings -> Cattle Management, so
 * this screen has one job: looking things up.
 */
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
    { label: 'Date of Birth', field: 'date_of_birth', sortable: false, minWidth: 130 },
    { label: 'Weight (kg)', field: 'weight', minWidth: 110 },
    { label: 'Colour', field: 'color', minWidth: 130 },
    { label: 'Health Status', field: 'health_status', minWidth: 150 },
    { label: 'Purchase Date', field: 'purchase_date', sortable: false, minWidth: 130 },
    { label: 'Purchase Cost', field: 'purchase_cost', minWidth: 130 },
    { label: 'Remarks', field: 'remarks', minWidth: 200 },
    { label: 'Registered On', field: 'created_at', sortable: false, minWidth: 175 }
];

function Cattle() {

    const toast = useToast();
    const profileDrawer = useProfileDrawer();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const result = await getCattleList();
            if (result?.success) {
                setRecords(result?.data?.records || []);
            } else {
                toast.error(result?.error || result?.message || 'Unable to load cattle.');
            }
            setLoading(false);
        })();
    }, []);

    return (
        <>
            <DataGrid
                title="Cattle"
                subtitle="Every animal in your scope with its complete details. Click a code to open its profile."
                columns={buildColumns(profileDrawer.open)}
                rows={records}
                loading={loading}
                config={{ exportFileName: 'cattle-register' }}
            />

            <ProfileDrawer {...profileDrawer.props} />
        </>
    );
}

export default Cattle;
