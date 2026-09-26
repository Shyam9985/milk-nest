import MasterForm from '../components/MasterForm';

function UserForm({ initialValues = null, genderOptions = [], submitting = false, onSubmit, onCancel }) {

    // no role field here: the role is granted by assigning the user a position
    const fields = [
        { name: 'first_nm', label: 'First Name', type: 'text', maxLength: 200, placeholder: 'e.g. Shyam' },
        { name: 'last_nm', label: 'Last Name', type: 'text', maxLength: 150, placeholder: 'e.g. Dasari' },
        // autoComplete 'off' keeps the browser from filling the admin's own saved login here
        { name: 'email', label: 'Email (login name)', type: 'email', required: true, maxLength: 200, placeholder: 'e.g. user@milknest.com', autoComplete: 'off' },
        { name: 'mobile_no', label: 'Mobile Number', type: 'text', maxLength: 20, placeholder: 'e.g. 9876543210' },
        { name: 'gender_id', label: 'Gender', type: 'select', options: genderOptions, placeholder: 'Select Gender (optional)' }
    ];

    // password is captured only while creating; changes go through the forgot password flow.
    // it renders with a show/hide toggle and 'new-password' autocomplete, so it starts empty
    if (!initialValues) {
        fields.push({
            name: 'password', label: 'Password', type: 'password', required: true, minLength: 8,
            placeholder: 'Min 8 chars with upper, lower, number and symbol'
        });
    }

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

export default UserForm;
