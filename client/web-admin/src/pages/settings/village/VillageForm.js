import MasterForm from '../components/MasterForm';

function VillageForm({ districtOptions = [], mandalOptions = [], initialValues = null, submitting = false, onSubmit, onCancel }) {

    const fields = [
        { name: 'district_id', label: 'District', type: 'select', required: true, options: districtOptions, placeholder: 'Select District' },
        // mandal list cascades from the chosen district; stays locked until a district is picked
        { name: 'mandal_ulb_id', label: 'Mandal/ULB', type: 'select', dependsOn: 'district_id', options: mandalOptions, placeholder: 'Select Mandal/ULB (optional)' },
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
