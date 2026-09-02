import MasterForm from '../components/MasterForm';

function PositionForm({ initialValues = null, roleOptions = [], hierarchyOptions = [], userOptions = [],
    stateOptions = [], dairyFarmOptions = [], loadDistrictOptions, loadMandalOptions, loadVillageOptions,
    submitting = false, onSubmit, onCancel }) {

    const POSITION_FORM_FIELDS = [
        { name: 'position_nm', label: 'Position Name', type: 'text', required: true, minLength: 2, maxLength: 250, placeholder: 'e.g. Farm Manager - Guntur' },
        { name: 'role_id', label: 'Role', type: 'select', required: true, options: roleOptions, placeholder: 'Select Role' },
        { name: 'hierarchy_id', label: 'Hierarchy', type: 'select', required: true, options: hierarchyOptions, placeholder: 'Select Hierarchy' },
        { name: 'user_id', label: 'Assigned User', type: 'select', options: userOptions, placeholder: 'Select User (optional)' },
        { name: 'location_ref_id', label: 'Dairy Farm', type: 'select', options: dairyFarmOptions, placeholder: 'Select Dairy Farm (optional)' },
        // location cascade: state (ui-only filter) -> district -> mandal + village; each child
        // list is fetched only after its parent is picked and stays locked until then
        { name: 'state_id', label: 'State', type: 'select', uiOnly: true, options: stateOptions, placeholder: 'Select State (optional)' },
        { name: 'district_id', label: 'District', type: 'select', dependsOn: 'state_id', loadOptions: loadDistrictOptions, placeholder: 'Select District (optional)' },
        { name: 'mandal_ulb_id', label: 'Mandal/ULB', type: 'select', dependsOn: 'district_id', loadOptions: loadMandalOptions, placeholder: 'Select Mandal/ULB (optional)' },
        { name: 'village_sachivalayam_id', label: 'Village/Sachivalayam', type: 'select', dependsOn: 'district_id', loadOptions: loadVillageOptions, placeholder: 'Select Village/Sachivalayam (optional)' },
        { name: 'start_date', label: 'Start Date', type: 'date' },
        { name: 'end_date', label: 'End Date', type: 'date' }
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
