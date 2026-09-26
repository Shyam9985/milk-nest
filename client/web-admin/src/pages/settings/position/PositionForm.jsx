import MasterForm from '../components/MasterForm';

// dairy farm and branch options carry their location ids, pushed into the
// location fields whenever one of them is picked
const fillLocationFromOption = (option) => ({
    state_id: option.state_id ?? '',
    district_id: option.district_id ?? '',
    mandal_ulb_id: option.mandal_ulb_id ?? '',
    village_sachivalayam_id: option.village_sachivalayam_id ?? ''
});

function PositionForm({ initialValues = null, roleOptions = [], hierarchyOptions = [], userOptions = [],
    stateOptions = [], dairyFarmOptions = [], loadDistrictOptions, loadMandalOptions, loadVillageOptions, loadBranchOptions,
    submitting = false, onSubmit, onCancel }) {

    // local YYYY-MM-DD; expiry dates before today would lock the assigned user out
    const today = new Date().toLocaleDateString('en-CA');

    // new positions default to a 100-year validity
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 100);
    const defaultEndDate = defaultExpiry.toLocaleDateString('en-CA');

    const POSITION_FORM_FIELDS = [
        { name: 'position_nm', label: 'Position Name', type: 'text', required: true, minLength: 2, maxLength: 250, placeholder: 'e.g. Farm Manager - Guntur' },
        { name: 'role_id', label: 'Role', type: 'select', required: true, options: roleOptions, placeholder: 'Select Role' },
        { name: 'hierarchy_id', label: 'Hierarchy', type: 'select', required: true, options: hierarchyOptions, placeholder: 'Select Hierarchy' },
        { name: 'user_id', label: 'Assigned User', type: 'select', options: userOptions, placeholder: 'Select User (optional)' },
        // both are persisted: dairy_farm_id on its own column, the branch in location_ref_id.
        // picking either pre-fills the location fields below
        { name: 'dairy_farm_id', label: 'Dairy Farm', type: 'select', options: dairyFarmOptions, placeholder: 'Select Dairy Farm (optional)', onSelectFill: fillLocationFromOption },
        { name: 'location_ref_id', label: 'Branch', type: 'select', dependsOn: 'dairy_farm_id', loadOptions: loadBranchOptions, placeholder: 'Select Branch (optional)', onSelectFill: fillLocationFromOption },
        // location cascade: auto-filled from the farm/branch above, still adjustable by hand
        { name: 'state_id', label: 'State', type: 'select', uiOnly: true, options: stateOptions, placeholder: 'Select State (optional)' },
        { name: 'district_id', label: 'District', type: 'select', dependsOn: 'state_id', loadOptions: loadDistrictOptions, placeholder: 'Select District (optional)' },
        { name: 'mandal_ulb_id', label: 'Mandal/ULB', type: 'select', dependsOn: 'district_id', loadOptions: loadMandalOptions, placeholder: 'Select Mandal/ULB (optional)' },
        { name: 'village_sachivalayam_id', label: 'Village/Sachivalayam', type: 'select', dependsOn: 'district_id', loadOptions: loadVillageOptions, placeholder: 'Select Village/Sachivalayam (optional)' },
        { name: 'start_date', label: 'Start Date', type: 'date', defaultValue: today },
        { name: 'end_date', label: 'End Date', type: 'date', min: today, defaultValue: defaultEndDate }
    ];

    return (
        <MasterForm
            fields={POSITION_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default PositionForm;
