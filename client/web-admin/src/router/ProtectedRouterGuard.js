import { useContext } from "react";
import AuthContext from "../contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";


function ProtectedRouterGuard() {
    const authCtx = useContext(AuthContext);

    if (!authCtx.isLogedIn) return < Navigate to="/login" replace />;
    return <Outlet />
}

export default ProtectedRouterGuard;