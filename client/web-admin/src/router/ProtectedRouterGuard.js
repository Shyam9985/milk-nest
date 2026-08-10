import { useContext } from "react";
import AuthContext from "../contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";


function ProtectedRouterGuard() {
    const authCtx = useContext(AuthContext);
    const location = useLocation();

    if (!authCtx.isLoggedIn) return <Navigate to="/login" replace state={{ from: location }} />;
    return <Outlet />
}

export default ProtectedRouterGuard;