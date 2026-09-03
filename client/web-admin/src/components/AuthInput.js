function AuthInput({ label, name, type = "text", value, error, placeholder, onChange, disabled = false, readOnly = false, autoComplete, min }) {

    return (

        <div className="mb-3">

            <label
                className="block mb-2 text-sm font-medium text-[var(--text-primary)]"
            >
                {label}
            </label>

            <input
                name={name}
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                disabled={disabled}
                readOnly={readOnly}
                autoComplete={autoComplete}
                min={min}
                className={`w-full rounded-lg border border-[var(--input-border)] px-4 py-3 text-[var(--input-text)]
                    placeholder:text-[var(--input-placeholder)] outline-none transition-colors
                    ${readOnly ? "bg-[var(--bg-secondary)]" : "bg-[var(--input-bg)]"}
                    ${disabled ? "cursor-not-allowed opacity-60" : readOnly ? "cursor-default" : "focus:border-[var(--brand-primary)]"}`}
            />

            {error && (
                <p className="mt-1 text-sm text-[var(--danger)]">
                    {error}
                </p>
            )}

        </div>

    );

}

export default AuthInput;