import { useReducer } from "react";
import AuthInput from "./AuthInput";
import PasswordInput from "./PasswordInput";

const initialState = {
    values: {
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        password: ""
    },
    errors: {}
};

function reducer(state, action) {

    switch (action.type) {

        case "CHANGE_FIELD":
            return {
                ...state,
                values: {
                    ...state.values,
                    [action.name]: action.value
                }
            };

        case "SET_ERRORS":
            return {
                ...state,
                errors: action.errors
            };

        default:
            return state;
    }
}

function RegisterForm({ onLogin }) {

    const [state, dispatch] = useReducer(reducer, initialState);

    const handleChange = ({ target }) => {
        dispatch({ type: "CHANGE_FIELD", name: target.name, value: target.value });
    };

    const handleSubmit = (e) => {

        e.preventDefault();

        const errors = {};

        Object.entries(state.values).forEach(([key, value]) => {

            if (!value.trim()) errors[key] = `${key} is required`;

        });

        dispatch({ type: "SET_ERRORS", errors });

        if (Object.keys(errors).length) return;
        console.log(state.values);

    };

    return (

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1"        >

            {/* First & Last Name */}

            <div className="grid grid-cols-2 gap-4">

                <AuthInput
                    label="First Name"
                    name="firstName"
                    value={state.values.firstName}
                    error={state.errors.firstName}
                    placeholder="First Name"
                    onChange={handleChange}
                />

                <AuthInput
                    label="Last Name"
                    name="lastName"
                    value={state.values.lastName}
                    error={state.errors.lastName}
                    placeholder="Last Name"
                    onChange={handleChange}
                />

            </div>

            <AuthInput
                label="Email"
                name="email"
                type="email"
                value={state.values.email}
                error={state.errors.email}
                placeholder="Enter email"
                onChange={handleChange}
            />

            <AuthInput
                label="Mobile"
                name="mobile"
                type="tel"
                value={state.values.mobile}
                error={state.errors.mobile}
                placeholder="Enter mobile number"
                onChange={handleChange}
            />

            <PasswordInput
                label="Password"
                name="password"
                value={state.values.password}
                error={state.errors.password}
                placeholder="Enter password"
                onChange={handleChange}
            />

            <button
                type="submit"
                className="
                    w-full
                    rounded-lg
                    py-3
                    bg-[var(--btn-primary-bg)]
                    text-[var(--btn-primary-text)]
                    hover:opacity-90
                    transition
                "
            >
                Create Account
            </button>

            <div className="text-center text-sm text-[var(--text-secondary)]">

                Already have an account?{" "}

                <button
                    type="button"
                    onClick={onLogin}
                    className="font-medium text-[var(--brand-primary)] hover:underline"
                >
                    Login
                </button>

            </div>

        </form>
    );
}

export default RegisterForm;