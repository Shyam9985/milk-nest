import { useContext, useState } from "react";
import AuthInput from "./AuthInput";
import PasswordInput from "./PasswordInput";
import AuthContext from "../../contexts/AuthContext";
import AuthCard from "./AuthCard";
import { Navigate, useNavigate } from "react-router-dom";

function LoginForm() {
    const authCtx = useContext(AuthContext);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [errors, setErrors] = useState({});

    const handleChange = ({ target }) => {

        setForm(prev => ({
            ...prev,
            [target.name]: target.value
        }));

    };

    const handleSubmit = (e) => {

        e.preventDefault();

        const validationErrors = {};

        if (!form.email.trim())
            validationErrors.email = "Email is required.";

        if (!form.password.trim())
            validationErrors.password = "Password is required.";

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length)
            return;

        console.log(form);
        localStorage.setItem("user", JSON.stringify(form));
        authCtx.handleLogin()

    };

    const onForgotPassword = () => {
        console.log("Forgot Password clicked");
        navigate("/forgot-password");
    }

    const onRegister = () => {
        console.log("Register clicked");
        navigate("/register");
        
    }

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
                            value={form.email}
                            error={errors.email}
                            placeholder="Enter your email"
                            onChange={handleChange}
                        />

                        <PasswordInput
                            label="Password"
                            name="password"
                            value={form.password}
                            error={errors.password}
                            onChange={handleChange}
                        />

                        <div className="flex justify-end mb-5">

                            <button
                                type="button"
                                onClick={onForgotPassword}
                                className="text-sm text-[var(--brand-primary)] hover:underline"
                            >
                                Forgot Password?
                            </button>

                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
                        >
                            Login
                        </button>

                        <p className="mt-6 text-center text-[var(--text-secondary)]">

                            Don't have an account?{" "}

                            <button
                                type="button"
                                onClick={onRegister}
                                className="text-[var(--brand-primary)] hover:underline"
                            >
                                Register
                            </button>

                        </p>

                    </form>
                </AuthCard>
            </div>

        </div>
    );

}

export default LoginForm;