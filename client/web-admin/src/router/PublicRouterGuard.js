import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";


function PublicRouterGuard() {
    const authCtx = useContext(AuthContext);
    const location = useLocation();
    const landingUrl = localStorage.getItem('landing-url');

    // "from" is set by ProtectedRouterGuard when it bounces an unauthenticated user to /login
    const from = location.state?.from?.pathname;

    if (authCtx.isLoggedIn) return <Navigate to={from || landingUrl || "/dashboard"} replace />;
    return <Outlet />
}

export default PublicRouterGuard;