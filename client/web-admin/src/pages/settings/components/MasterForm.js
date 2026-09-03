import { useEffect, useReducer, useRef } from 'react';
import AuthInput from '../../../components/AuthInput';
import PasswordInput from '../../../components/PasswordInput';
import SearchDropdown from '../../../components/SearchDropdown';

/*
 * All form state lives in one reducer: field values, validation errors and the
 * option lists fetched for dependent dropdowns change together, so a single
 * dispatch per event keeps every transition in one predictable place.
 */
const initialFormState = { values: {}, errors: {}, dynamicOptions: {}, loadingOptions: {} };

// clears every field depending on the changed one, walking the whole chain (state -> district -> mandal)
const clearDependents = (fields, changedName, nextValues) => {
    fields.forEach((field) => {
        if (field.dependsOn === changedName) {
            nextValues[field.name] = '';
            clearDependents(fields, field.name, nextValues);
        }
    });
};

// finds a select field's currently chosen option object (static or dynamically loaded options)
const resolveOption = (field, value, dynamicOptions) => {
    if (!field || value === '' || value === null || value === undefined) return null;
    const options = typeof field.loadOptions === 'function' ? (dynamicOptions[field.name] || []) : (field.options || []);
    return options.find((option) => String(option.value) === String(value)) || null;
};

const resolveOptionLabel = (field, value, dynamicOptions) => resolveOption(field, value, dynamicOptions)?.label ?? '';

// recomputes read-only derived fields (e.g. an address composed from the chosen location);
// a field opts in with deriveValue(values, labelOf) in its definition
const applyDerivedFields = (fields, values, dynamicOptions) => {
    fields.forEach((field) => {
        if (typeof field.deriveValue !== 'function') return;
        const labelOf = (name) => resolveOptionLabel(fields.find((f) => f.name === name), values[name], dynamicOptions);
        values[field.name] = field.deriveValue(values, labelOf);
    });
};

function formReducer(state, action) {
    switch (action.type) {

        // fresh values whenever the record being edited changes; loaded options survive
        case 'RESET_FORM':
            return { ...state, values: action.values, errors: {} };

        case 'FIELD_CHANGED': {
            const values = { ...state.values, [action.name]: action.value };
            clearDependents(action.fields, action.name, values);

            // a select can push values into sibling fields from its chosen option's extra
            // data (e.g. picking a branch fills the location) - applied after clearDependents
            // so the pushed values survive the dependency reset
            const changedField = action.fields.find((field) => field.name === action.name);
            if (typeof changedField?.onSelectFill === 'function') {
                const option = resolveOption(changedField, action.value, state.dynamicOptions);
                if (option) Object.assign(values, changedField.onSelectFill(option) || {});
            }

            applyDerivedFields(action.fields, values, state.dynamicOptions);
            return { ...state, values, errors: { ...state.errors, [action.name]: '' } };
        }

        case 'VALIDATION_FAILED':
            return { ...state, errors: action.errors };

        case 'OPTIONS_LOADING':
            return { ...state, loadingOptions: { ...state.loadingOptions, [action.name]: true } };

        case 'OPTIONS_LOADED': {
            // freshly arrived labels may complete a derived field (relevant when editing a record)
            const dynamicOptions = { ...state.dynamicOptions, [action.name]: action.options };
            const values = { ...state.values };
            applyDerivedFields(action.fields, values, dynamicOptions);
            return {
                ...state,
                values,
                dynamicOptions,
                loadingOptions: { ...state.loadingOptions, [action.name]: false }
            };
        }

        // the response was stale (parent changed while loading) or failed - just stop the spinner
        case 'OPTIONS_IDLE':
            return { ...state, loadingOptions: { ...state.loadingOptions, [action.name]: false } };

        default:
            return state;
    }
}

function MasterForm({ fields = [], initialValues = null, submitting = false, submitLabel = 'Save', onSubmit, onCancel }) {

    const [formState, dispatch] = useReducer(formReducer, initialFormState);
    const { values, errors, dynamicOptions, loadingOptions } = formState;

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
                dispatch({ type: 'OPTIONS_LOADED', name: field.name, options: [], fields });
                return;
            }

            dispatch({ type: 'OPTIONS_LOADING', name: field.name });

            Promise.resolve(field.loadOptions(parentValue))
                .then((options) => {
                    // ignore the response when the parent changed again while this request was running
                    if (String(valuesRef.current[field.dependsOn]) !== String(parentValue)) {
                        dispatch({ type: 'OPTIONS_IDLE', name: field.name });
                        return;
                    }
                    dispatch({ type: 'OPTIONS_LOADED', name: field.name, options: options || [], fields });
                })
                .catch(() => dispatch({ type: 'OPTIONS_IDLE', name: field.name }));
        });

    }, [parentKey]);

    // loads fresh values whenever the record being edited changes
    useEffect(() => {

        const initial = {};

        fields.forEach((field) => {
            initial[field.name] = field.type === 'checkbox'
                ? !!initialValues?.[field.name]
                : (initialValues?.[field.name] ?? field.defaultValue ?? '');
        });

        dispatch({ type: 'RESET_FORM', values: initial });

    }, [initialValues]);

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        dispatch({ type: 'FIELD_CHANGED', name, value: type === 'checkbox' ? checked : value, fields });
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

        dispatch({ type: 'VALIDATION_FAILED', errors: nextErrors });
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

                    if (field.type === 'password') {
                        return (
                            <PasswordInput key={field.name} name={field.name}
                                label={field.required ? `${field.label} *` : field.label}
                                value={values[field.name] ?? ''} error={errors[field.name]}
                                placeholder={field.placeholder} onChange={handleChange} disabled={submitting} />
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
                            placeholder={field.placeholder} onChange={handleChange}
                            disabled={submitting} readOnly={!!field.readOnly} autoComplete={field.autoComplete}
                            min={field.min} />
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
