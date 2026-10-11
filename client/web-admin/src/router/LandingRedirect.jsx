import { Navigate } from "react-router-dom";

// the app root has no page of its own: a logged in user opening "/" is sent to the
// landing url their role carries (stored at login), with the dashboard as the fallback
function LandingRedirect() {
    const landingUrl = localStorage.getItem('landing-url');
    return <Navigate to={landingUrl || "/dashboard"} replace />;
}

export default LandingRedirect;
