import MasterForm from '../components/MasterForm';

function VillageForm({ stateOptions = [], loadDistrictOptions, loadMandalOptions, initialValues = null, submitting = false, onSubmit, onCancel }) {

    const fields = [
        // full cascade: state (ui-only filter) -> district -> mandal; each child list is
        // fetched only after its parent is picked and stays locked until then
        { name: 'state_id', label: 'State', type: 'select', required: true, uiOnly: true, options: stateOptions, placeholder: 'Select State' },
        { name: 'district_id', label: 'District', type: 'select', required: true, dependsOn: 'state_id', loadOptions: loadDistrictOptions, placeholder: 'Select District' },
        { name: 'mandal_ulb_id', label: 'Mandal/ULB', type: 'select', dependsOn: 'district_id', loadOptions: loadMandalOptions, placeholder: 'Select Mandal/ULB (optional)' },
        { name: 'village_sachivalayam_nm', label: 'Village/Sachivalayam Name', type: 'text', required: true, minLength: 2, maxLength: 250, placeholder: 'e.g. Kolakaluru' },
        { name: 'village_sachivalayam_code', label: 'Village/Sachivalayam Code', type: 'text', required: true, maxLength: 20, placeholder: 'e.g. KLK' },
        { name: 'is_sachivalayam', label: 'Is Sachivalayam', type: 'checkbox' }
    ];

    return (
        <MasterForm
            fields={fields}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default VillageForm;
