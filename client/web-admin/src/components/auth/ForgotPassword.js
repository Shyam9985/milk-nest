import { useState } from "react";
import AuthInput from "./AuthInput";

function ForgotPasswordForm({ onBack }) {

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e) => {

        e.preventDefault();

        if (!email.trim()) {

            setError("Email is required.");

            return;

        }

        setError("");

        console.log({
            email
        });

    };

    return (

        <form onSubmit={handleSubmit}>

            <AuthInput
                label="Email"
                name="email"
                type="email"
                value={email}
                error={error}
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
            />

            <button
                type="submit"
                className="w-full rounded-lg py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
            >
                Send OTP
            </button>

            <div className="mt-6 text-center">

                <button
                    type="button"
                    onClick={onBack}
                    className="text-[var(--brand-primary)] hover:underline"
                >
                    Back to Login
                </button>

            </div>

        </form>

    );

}

export default ForgotPasswordForm;