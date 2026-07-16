import { useState } from "react";
import AuthInput from "../../components/AuthInput";
import AuthCard from "./AuthCard";
import { useNavigate } from "react-router-dom";

function ForgotPasswordForm({ onBack }) {

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {

        e.preventDefault();

        if (!email.trim()) {

            setError("Email is required.");

            return;
        }

        setError("");
    };

    return (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)] overflow-hidden bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/background-banner.png')" }}>

            <div
                className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-blue-950/55 to-slate-900/45 backdrop-blur-[1px]"
            ></div>

            <div className="z-50">
                <AuthCard
                    title={screen === "login" ? "Welcome Back" : screen === "forgot" ? "Forgot Password" : "Create Account"}
                    subtitle={screen === "login" ? "Login to continue" : screen === "forgot" ? "Enter your email to receive OTP." : "Fill the details below."}
                >

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
                                onClick={() => { navigate('/login') }}
                                className="text-[var(--brand-primary)] hover:underline"
                            >
                                Back to Login
                            </button>

                        </div>

                    </form>

                </AuthCard>
            </div>

        </div>

    );

}

export default ForgotPasswordForm;