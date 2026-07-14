import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";


function PublicRouterGuard() {
    const authCtx = useContext(AuthContext);
    const landingUrl = localStorage.getItem('landing-url');

    if (authCtx.isLogedIn) return <Navigate to={landingUrl} replace />;
    return <Outlet />
}

export default PublicRouterGuard;