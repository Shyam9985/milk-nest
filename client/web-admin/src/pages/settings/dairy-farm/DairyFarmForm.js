import MasterForm from '../components/MasterForm';

function DairyFarmForm({ initialValues = null, stateOptions = [], loadDistrictOptions, loadMandalOptions, loadVillageOptions,
    submitting = false, onSubmit, onCancel }) {

    // farm and branch codes are generated server-side; every farm owns exactly one main branch,
    // captured here so a farm record is meaningful on its own
    const DAIRY_FARM_FORM_FIELDS = [
        { name: 'dairy_farm_name', label: 'Dairy Farm Name', type: 'text', required: true, minLength: 2, maxLength: 255, placeholder: 'e.g. MilkNest Dairy Farm' },
        { name: 'contact_number', label: 'Contact Number', type: 'text', maxLength: 20, placeholder: 'e.g. 9876543210' },
        { name: 'email', label: 'Email', type: 'email', maxLength: 255, placeholder: 'e.g. contact@milknest.com' },
        // main branch section - full location cascade is mandatory (NOT NULL columns in branches_lst_t)
        { name: 'main_branch_name', label: 'Main Branch Name', type: 'text', required: true, minLength: 2, maxLength: 255, placeholder: 'e.g. Head Office Branch' },
        { name: 'state_id', label: 'State', type: 'select', required: true, options: stateOptions, placeholder: 'Select State' },
        { name: 'district_id', label: 'District', type: 'select', required: true, dependsOn: 'state_id', loadOptions: loadDistrictOptions, placeholder: 'Select District' },
        { name: 'mandal_ulb_id', label: 'Mandal/ULB', type: 'select', required: true, dependsOn: 'district_id', loadOptions: loadMandalOptions, placeholder: 'Select Mandal/ULB' },
        { name: 'village_sachivalayam_id', label: 'Village/Sachivalayam', type: 'select', required: true, dependsOn: 'district_id', loadOptions: loadVillageOptions, placeholder: 'Select Village/Sachivalayam' },
        // composed from the chosen location; the server rebuilds it authoritatively on save
        {
            name: 'address', label: 'Address (auto-filled from location)', type: 'text', readOnly: true,
            placeholder: 'Fills in after the location is selected',
            deriveValue: (_values, labelOf) => [
                labelOf('village_sachivalayam_id'), labelOf('mandal_ulb_id'), labelOf('district_id'), labelOf('state_id')
            ].filter(Boolean).join(', ')
        }
    ];

    return (
        <MasterForm
            fields={DAIRY_FARM_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default DairyFarmForm;
