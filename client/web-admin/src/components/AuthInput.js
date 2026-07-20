function AuthInput({ label, name, type = "text", value, error, placeholder, onChange, disabled = false }) {

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
                className={`w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--input-text)]
                    placeholder:text-[var(--input-placeholder)] outline-none transition-colors 
                    ${disabled ? "cursor-not-allowed opacity-60" : "focus:border-[var(--brand-primary)]"}`}
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