import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";


function PublicRouterGuard() {
    const authCtx = useContext(AuthContext);

    if (authCtx.isLogedIn) return <Navigate to="/dashboard" replace />;
    return <Outlet />
}

export default PublicRouterGuard;