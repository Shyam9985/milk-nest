import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function PasswordInput({
    label,
    name,
    value,
    error,
    placeholder = "Enter password",
    onChange,
    disabled = false,
    // 'new-password' tells the browser this is a fresh credential, so it never auto-fills saved logins
    autoComplete = "new-password"
}) {

    const [showPassword, setShowPassword] = useState(false);

    return (

        <div className="mb-5">

            <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">
                {label}
            </label>

            <div className="relative">

                <input
                    name={name}
                    type={showPassword ? "text" : "password"}
                    value={value}
                    placeholder={placeholder}
                    onChange={onChange}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    className="
                        w-full
                        rounded-lg
                        border
                        border-[var(--input-border)]
                        bg-[var(--input-bg)]
                        px-4
                        py-3
                        pr-12
                        text-[var(--input-text)]
                        placeholder:text-[var(--input-placeholder)]
                        outline-none
                        focus:border-[var(--brand-primary)]
                        transition-colors
                    "
                />

                <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>

            </div>

            {error && (
                <p className="mt-1 text-sm text-[var(--danger)]">
                    {error}
                </p>
            )}

        </div>

    );

}

export default PasswordInput;