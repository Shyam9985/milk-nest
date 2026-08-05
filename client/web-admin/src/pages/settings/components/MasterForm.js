import { useState, useEffect } from 'react';
import AuthInput from '../../../components/AuthInput';

function MasterForm({ fields = [], initialValues = null, submitting = false, submitLabel = 'Save', onSubmit, onCancel }) {

    const [values, setValues] = useState({});
    const [errors, setErrors] = useState({});

    // loads fresh values whenever the record being edited changes
    useEffect(() => {

        const initial = {};

        fields.forEach((field) => {
            initial[field.name] = field.type === 'checkbox'
                ? !!initialValues?.[field.name]
                : (initialValues?.[field.name] ?? '');
        });

        setValues(initial);
        setErrors({});

    }, [initialValues]);

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validate = () => {

        const nextErrors = {};

        fields.forEach((field) => {
            const raw = values[field.name];
            const value = typeof raw === 'string' ? raw.trim() : raw;

            if (field.required && (value === '' || value === null || value === undefined)) {
                nextErrors[field.name] = `${field.label} is required.`;
            } else if (field.minLength && String(value).length < field.minLength) {
                nextErrors[field.name] = `${field.label} must be at least ${field.minLength} characters.`;
            } else if (field.maxLength && String(value).length > field.maxLength) {
                nextErrors[field.name] = `${field.label} must not exceed ${field.maxLength} characters.`;
            }
        });

        setErrors(nextErrors);
        return !Object.keys(nextErrors).length;
    };

    const handleSubmit = (e) => {

        e.preventDefault();

        if (submitting || !validate()) return;

        const payload = {};
        fields.forEach((field) => {
            payload[field.name] = typeof values[field.name] === 'string' ? values[field.name].trim() : values[field.name];
        });

        onSubmit?.(payload);
    };

    return (

        <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">

            <div className="flex-1">

                {fields.map((field) => {

                    if (field.type === 'select') {
                        return (

                            <div className="mb-3" key={field.name}>

                                <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">
                                    {field.required ? `${field.label} *` : field.label}
                                </label>

                                <select name={field.name} value={values[field.name] ?? ''} onChange={handleChange} disabled={submitting}
                                    className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3
                                        text-[var(--input-text)] outline-none transition-colors focus:border-[var(--brand-primary)]">

                                    <option value="">{field.placeholder || `Select ${field.label}`}</option>

                                    {(field.options || []).map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}

                                </select>

                                {errors[field.name] && (
                                    <p className="mt-1 text-sm text-[var(--danger)]">
                                        {errors[field.name]}
                                    </p>
                                )}

                            </div>
                        );
                    }

                    if (field.type === 'checkbox') {
                        return (

                            <label key={field.name} className="mb-3 flex items-center gap-3 text-sm font-medium text-[var(--text-primary)]">

                                <input type="checkbox" name={field.name} checked={!!values[field.name]} onChange={handleChange}
                                    disabled={submitting} className="h-4 w-4 accent-[var(--brand-primary)]" />

                                {field.label}

                            </label>
                        );
                    }

                    return (
                        <AuthInput key={field.name} name={field.name} type={field.type || 'text'}
                            label={field.required ? `${field.label} *` : field.label}
                            value={values[field.name] ?? ''} error={errors[field.name]}
                            placeholder={field.placeholder} onChange={handleChange} disabled={submitting} />
                    );

                })}

            </div>

            <div className="mt-6 flex justify-end gap-3">

                <button type="button" onClick={onCancel} disabled={submitting}
                    className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-2 font-medium
                        text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--hover-bg)] active:scale-95">
                    Cancel
                </button>

                <button type="submit" disabled={submitting}
                    className="rounded-lg bg-[var(--btn-primary-bg)] px-4 py-2 font-medium text-[var(--btn-primary-text)]
                        shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-95
                        disabled:cursor-not-allowed disabled:opacity-60">
                    {submitting ? 'Saving...' : submitLabel}
                </button>

            </div>

        </form>
    );
}

export default MasterForm;
