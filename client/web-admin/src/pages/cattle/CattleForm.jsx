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
    purchaseModeOptions = [], loadBranchOptions, loadBreedOptions, submitting = false, onSubmit, onCancel }) {

    const isEdit = !!initialValues;

    /*
     * Which ownership questions to ask comes from the purchase mode master, never from a key
     * comparison here: a mode carries needs_counterparty, needs_share_pct, amount_source and the
     * label for the other party, so adding a mode under Settings changes this form automatically.
     */
    const modeOf = (id) => purchaseModeOptions.find((o) => String(o.value) === String(id));
    const needsCounterparty = (values) => !!modeOf(values.purchase_mode_id)?.needs_counterparty;
    const needsShare = (values) => !!modeOf(values.purchase_mode_id)?.needs_share_pct;
    const isRecurring = (values) => modeOf(values.purchase_mode_id)?.amount_source === 'recurring';

    // the price fields only apply when the amount IS the purchase cost
    const isBought = (values) => {
        const mode = modeOf(values.purchase_mode_id);
        return !mode || mode.amount_source === 'purchase_cost';
    };

    // 'Partner', 'Owner', 'Lessor' - whatever the master says this mode calls the other party
    const partyLabel = purchaseModeOptions.find((o) => o.counterparty_label)?.counterparty_label || 'Partner';

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
        { name: 'purchase_date', label: 'Purchase Date', type: 'date', max: today, showWhen: isBought },
        { name: 'purchase_cost', label: 'Purchase Cost', type: 'number', placeholder: 'e.g. 45000', showWhen: isBought },
        { name: 'remarks', label: 'Remarks', type: 'text', maxLength: 1000, placeholder: 'Anything worth noting about this animal' }
    ];

    /*
     * How the farm came to hold her. Asked only when the animal is first recorded: changing the
     * arrangement later is not an edit to the animal, it closes one ownership row and opens
     * another, which needs its own screen.
     */
    if (!isEdit) {
        CATTLE_FORM_FIELDS.push(
            {
                name: 'purchase_mode_id', label: 'Purchase Mode', type: 'select', required: true,
                options: purchaseModeOptions, placeholder: 'Select Purchase Mode', fullWidth: true,
                hint: 'How the farm holds this animal. The questions below follow from it.'
            },
            {
                name: 'partner_name', label: `${partyLabel} Name`, type: 'text', maxLength: 200, required: true,
                placeholder: 'The other party to this arrangement', showWhen: needsCounterparty
            },
            {
                name: 'partner_contact', label: `${partyLabel} Contact`, type: 'text', maxLength: 20,
                placeholder: 'Phone number', showWhen: needsCounterparty
            },
            {
                name: 'partner_share_pct', label: `${partyLabel} Share %`, type: 'number', min: 0, max: 100,
                placeholder: 'e.g. 50', showWhen: needsShare,
                hint: 'Their share of this animal, not the share held by the farm.'
            },
            {
                name: 'ownership_amount', label: 'Recurring Amount', type: 'number', min: 0, required: true,
                placeholder: 'e.g. 3000', showWhen: isRecurring,
                hint: 'Paid every period under this arrangement. Not a purchase price - the farm does not buy her.'
            },
            {
                name: 'ownership_from', label: 'Arrangement Start Date', type: 'date', max: today,
                showWhen: isRecurring, hint: 'When she came into the care of the farm. Defaults to today.'
            },
            {
                name: 'ownership_remarks', label: 'Ownership Remarks', type: 'text', maxLength: 1000,
                placeholder: 'e.g. verbal agreement, reviewed every season',
                showWhen: (values) => needsCounterparty(values) || isRecurring(values)
            }
        );
    }

    // the tag is generated on save and stays with the animal for life
    if (isEdit) {
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
