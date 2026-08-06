import { useState, useEffect, useRef } from 'react';
import AuthInput from '../../../components/AuthInput';
import SearchDropdown from '../../../components/SearchDropdown';

function MasterForm({ fields = [], initialValues = null, submitting = false, submitLabel = 'Save', onSubmit, onCancel }) {

    const [values, setValues] = useState({});
    const [errors, setErrors] = useState({});

    // options fetched on demand for dependent dropdowns, keyed by field name
    const [dynamicOptions, setDynamicOptions] = useState({});
    const [loadingOptions, setLoadingOptions] = useState({});

    // latest values, readable inside async callbacks without re-subscribing
    const valuesRef = useRef(values);
    valuesRef.current = values;

    // a change in any parent value triggers the dependent field's loader
    const parentKey = fields
        .filter((field) => field.dependsOn)
        .map((field) => `${field.dependsOn}:${values[field.dependsOn] ?? ''}`)
        .join('|');

    useEffect(() => {

        fields.forEach((field) => {

            if (typeof field.loadOptions !== 'function' || !field.dependsOn) return;

            const parentValue = values[field.dependsOn];

            // no parent chosen -> nothing to offer
            if (!parentValue) {
                setDynamicOptions((prev) => ({ ...prev, [field.name]: [] }));
                return;
            }

            setLoadingOptions((prev) => ({ ...prev, [field.name]: true }));

            Promise.resolve(field.loadOptions(parentValue))
                .then((options) => {
                    // ignore the response when the parent changed again while this request was running
                    if (String(valuesRef.current[field.dependsOn]) !== String(parentValue)) return;
                    setDynamicOptions((prev) => ({ ...prev, [field.name]: options || [] }));
                })
                .finally(() => {
                    setLoadingOptions((prev) => ({ ...prev, [field.name]: false }));
                });
        });

    }, [parentKey]);

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

    // clears every field depending on the changed one, walking the whole chain (state -> district -> mandal)
    const clearDependents = (changedName, next) => {
        fields.forEach((field) => {
            if (field.dependsOn === changedName) {
                next[field.name] = '';
                clearDependents(field.name, next);
            }
        });
    };

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;

        setValues((prev) => {
            const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
            clearDependents(name, next);
            return next;
        });
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
            // ui-only helper fields (e.g. the state filter above district) never reach the backend
            if (field.uiOnly) return;
            payload[field.name] = typeof values[field.name] === 'string' ? values[field.name].trim() : values[field.name];
        });

        onSubmit?.(payload);
    };

    return (

        <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">

            <div className="flex-1">

                {fields.map((field) => {

                    if (field.type === 'select') {

                        const isDynamic = typeof field.loadOptions === 'function';
                        const isLoading = !!loadingOptions[field.name];

                        // dynamic fields fetch their options when the parent is picked;
                        // static dependent fields filter the provided list by the chosen parent value
                        let options;
                        if (isDynamic) {
                            options = dynamicOptions[field.name] || [];
                        } else if (field.dependsOn) {
                            options = (field.options || []).filter((option) => String(option.parentValue) === String(values[field.dependsOn]));
                        } else {
                            options = field.options || [];
                        }

                        const isLocked = submitting || isLoading || (!!field.dependsOn && !values[field.dependsOn]);

                        return (
                            <SearchDropdown key={field.name} name={field.name} label={field.label}
                                value={values[field.name] ?? ''} options={options} onChange={handleChange}
                                placeholder={isLoading ? 'Loading...' : (field.placeholder || `Select ${field.label}`)}
                                disabled={isLocked} required={!!field.required} error={errors[field.name]} />
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
