import MasterForm from '../settings/components/MasterForm';

/*
 * There is no health field here on purpose. An animal's health is DERIVED from her open treatment
 * episodes in the Health register - that is where the illness, the medicines, the cost and the milk
 * withdrawal already live. A stored copy on the cattle row went stale immediately: two animals read
 * 'Under Treatment' with no treatment on record, while the one actually on Milk Fever read blank.
 *
 * Anything that is not an illness - a poor doer, a difficult temperament - goes in Remarks.
 */
function CattleForm({ initialValues = null, dairyFarmOptions = [], cattleTypeOptions = [], genderOptions = [],
    loadBranchOptions, loadBreedOptions, submitting = false, onSubmit, onCancel }) {

    // local YYYY-MM-DD: birth and purchase dates can never be in the future
    const today = new Date().toLocaleDateString('en-CA');

    const CATTLE_FORM_FIELDS = [
        // the dairy farm only filters the branch list; the BRANCH is what the animal belongs to
        { name: 'dairy_farm_id', label: 'Dairy Farm', type: 'select', required: true, uiOnly: true, options: dairyFarmOptions, placeholder: 'Select Dairy Farm' },
        { name: 'branch_id', label: 'Branch', type: 'select', required: true, dependsOn: 'dairy_farm_id', loadOptions: loadBranchOptions, placeholder: 'Select Branch' },
        { name: 'cattle_type_id', label: 'Cattle Type', type: 'select', required: true, options: cattleTypeOptions, placeholder: 'Select Cattle Type' },
        { name: 'breed_id', label: 'Breed', type: 'select', required: true, dependsOn: 'cattle_type_id', loadOptions: loadBreedOptions, placeholder: 'Select Breed' },
        { name: 'gender_id', label: 'Gender', type: 'select', options: genderOptions, placeholder: 'Select Gender (optional)' },
        { name: 'date_of_birth', label: 'Date of Birth', type: 'date', max: today },
        { name: 'weight', label: 'Weight (kg)', type: 'number', placeholder: 'e.g. 420.50' },
        { name: 'color', label: 'Colour', type: 'text', maxLength: 100, placeholder: 'e.g. White with black patches' },
        { name: 'purchase_date', label: 'Purchase Date', type: 'date', max: today },
        { name: 'purchase_cost', label: 'Purchase Cost', type: 'number', placeholder: 'e.g. 45000' },
        { name: 'remarks', label: 'Remarks', type: 'text', maxLength: 1000, placeholder: 'Anything worth noting about this animal' }
    ];

    // the tag is generated on save and stays with the animal for life
    if (initialValues) {
        CATTLE_FORM_FIELDS.unshift({
            name: 'cattle_unique_code', label: 'Cattle Code (generated)', type: 'text', readOnly: true
        });
    }

    return (
        <MasterForm
            fields={CATTLE_FORM_FIELDS}
            initialValues={initialValues}
            submitting={submitting}
            submitLabel={initialValues ? 'Update' : 'Save'}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
}

export default CattleForm;
