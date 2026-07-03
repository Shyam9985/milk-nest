import { useState } from "react";
import AuthInput from "./AuthInput";
import PasswordInput from "./PasswordInput";

function LoginForm({ onForgotPassword, onRegister }) {

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

    };

    return (

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

    );

}

export default LoginForm;