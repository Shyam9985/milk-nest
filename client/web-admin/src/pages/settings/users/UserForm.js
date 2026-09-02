import MasterForm from '../components/MasterForm';

function UserForm({ initialValues = null, roleOptions = [], submitting = false, onSubmit, onCancel }) {

    const fields = [
        { name: 'first_nm', label: 'First Name', type: 'text', maxLength: 200, placeholder: 'e.g. Shyam' },
        { name: 'last_nm', label: 'Last Name', type: 'text', maxLength: 150, placeholder: 'e.g. Dasari' },
        { name: 'email', label: 'Email (login name)', type: 'email', required: true, maxLength: 200, placeholder: 'e.g. user@milknest.com' },
        { name: 'mobile_no', label: 'Mobile Number', type: 'text', maxLength: 20, placeholder: 'e.g. 9876543210' },
        { name: 'role_id', label: 'Role', type: 'select', required: true, options: roleOptions, placeholder: 'Select Role' }
    ];

    // password is captured only while creating; changes go through the forgot password flow
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
