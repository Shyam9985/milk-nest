import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import AuthContext from "../contexts/AuthContext";

function UnderDevelopment({
    title = "Under Development",
    subtitle = "This Feature Isn't Available Yet",
    description = "We're actively working on this feature to provide you with a better experience. It will be available in a future update.",
    buttonLabel,
    redirectTo,
    backRoute
}) {

    const authCtx = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const landingUrl = localStorage.getItem("landing-url");
    const fallbackRoute = backRoute || redirectTo || (authCtx.isLoggedIn ? (landingUrl || "/dashboard") : "/login");
    const resolvedButtonLabel = buttonLabel || "Go Back";

    // location.key is "default" only on the first entry of the session (deep link / fresh tab),
    // where navigate(-1) would leave the app
    const handleBack = () => {
        if (location.key !== "default") navigate(-1);
        else navigate(fallbackRoute, { replace: true });
    };

    return (

        <div className="relative flex items-center justify-center overflow-hidden bg-[var(--bg-primary)] p-12">

            {/* Background */}

            <div className="absolute inset-0 from-slate-100 via-blue-50 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800"></div>

            {/* Blur Overlay */}

            <div className="absolute inset-0 backdrop-blur-[2px]"></div>

            {/* Card */}

            <div className="relative z-10 w-full max-w-md rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-2xl px-8 py-10 text-center">

                {/* Logo */}

                <img
                    src="/images/logo.png"
                    alt="MilkNest"
                    className="mx-auto mb-5 h-16 w-16 object-contain rounded-full"
                />

                {/* Icon */}

                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-tertiary)]">

                    <Construction size={42} className="text-[var(--brand-primary)]" />

                </div>

                {/* Title */}

                <h1 className="text-4xl font-bold text-[var(--text-primary)]">
                    {title}
                </h1>

                {/* Subtitle */}

                <h2 className="mt-3 text-xl font-semibold text-[var(--text-primary)]">
                    {subtitle}
                </h2>

                {/* Description */}

                <p className="mt-4 leading-7 text-[var(--text-secondary)]">

                    {description}

                </p>

                {/* Button */}

                <button
                    type="button"
                    onClick={handleBack}
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--btn-primary-bg)]
                    px-5 py-3 text-[var(--btn-primary-text)] transition hover:opacity-90">

                    <ArrowLeft size={18} />

                    {resolvedButtonLabel}

                </button>

            </div>

        </div>

    );

}

export default UnderDevelopment;