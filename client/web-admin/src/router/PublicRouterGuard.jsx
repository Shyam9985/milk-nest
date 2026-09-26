import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";

// a logged in user never sees the public pages: every login goes to the role's landing
// url (stored at login), with the dashboard as the fallback. There is deliberately no
// "return to where you were" - it made logout-then-login land back on the old page
function PublicRouterGuard() {
    const authCtx = useContext(AuthContext);
    const landingUrl = localStorage.getItem('landing-url');

    if (authCtx.isLoggedIn) return <Navigate to={landingUrl || "/dashboard"} replace />;
    return <Outlet />
}

export default PublicRouterGuard;
