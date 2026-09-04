import MasterForm from '../components/MasterForm';

function BranchForm({ initialValues = null, farmOptions = [], stateOptions = [],
    loadDistrictOptions, loadMandalOptions, loadVillageOptions,
    submitting = false, onSubmit, onCancel }) {

    // sub branches only - the main branch is created and managed with the dairy farm itself.
    // the branch code is generated server-side under the farm's code
    const BRANCH_FORM_FIELDS = [
        { name: 'dairy_farm_id', label: 'Dairy Farm', type: 'select', required: true, options: farmOptions, placeholder: 'Select Dairy Farm' },
        { name: 'branch_name', label: 'Branch Name', type: 'text', required: true, minLength: 2, maxLength: 255, placeholder: 'e.g. Guntur Branch' },
        { name: 'state_id', label: 'State', type: 'select', required: true, options: stateOptions, placeholder: 'Select State' },
        { name: 'district_id', label: 'District', type: 'select', required: true, dependsOn: 'state_id', loadOptions: loadDistrictOptions, placeholder: 'Select District' },
        { name: 'mandal_ulb_id', label: 'Mandal/ULB', type: 'select', required: true, dependsOn: 'district_id', loadOptions: loadMandalOptions, placeholder: 'Select Mandal/ULB' },
        { name: 'village_sachivalayam_id', label: 'Village/Sachivalayam', type: 'select', required: true, dependsOn: 'district_id', loadOptions: loadVillageOptions, placeholder: 'Select Village/Sachivalayam' },
        { name: 'contact_number', label: 'Contact Number', type: 'text', maxLength: 20, placeholder: 'e.g. 9876543210' },
        { name: 'email', label: 'Email', type: 'email', maxLength: 255, placeholder: 'e.g. branch@milknest.com' },
        // one main branch per farm: checking this promotes the branch and demotes the current main
        { name: 'is_main_branch', label: 'Is Main Branch (only one per farm)', type: 'checkbox' },
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
            fields={BRANCH_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default BranchForm;
