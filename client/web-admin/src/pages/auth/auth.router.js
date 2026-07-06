import { lazy } from "react";

import Login from "../../pages/auth/LoginForm";
import Register from "../../pages/auth/RegisterForm";
import ForgotPassword from "../../pages/auth/ForgotPassword";

export default [
    { path: "/login", component: Login, lazy: true },
    { path: "/register", component: Register, lazy: true },
    { path: "/forgot-password", component: ForgotPassword, lazy: true },
];