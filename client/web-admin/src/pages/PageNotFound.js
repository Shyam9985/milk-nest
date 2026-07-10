import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import AuthContext from "../contexts/AuthContext";

function PageNotFound() {

    const authCtx = useContext(AuthContext);

    const redirectUrl = authCtx.isLogedIn ? "/" : "/login";

    return (

        <div className="relative flex items-center justify-center h-[calc(100vh-4rem)] overflow-hidden bg-[var(--bg-primary)]">

            {/* Background Gradient */}

            <div className="absolute inset-0 from-slate-100 via-blue-50 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800"></div>

            {/* Blur Overlay */}

            <div className="absolute inset-0 backdrop-blur-[2px]"></div>

            {/* Card */}

            <div
                className="
                    relative
                    z-10

                    w-full
                    max-w-md

                    rounded-3xl

                    border
                    border-[var(--card-border)]

                    bg-[var(--card-bg)]

                    shadow-2xl

                    px-8
                    py-10

                    text-center
                "
            >

                {/* Logo */}

                <img
                    src="/images/logo.png"
                    alt="MilkNest"
                    className="mx-auto mb-5 h-16 w-16 object-contain"
                />

                {/* Icon */}

                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-tertiary)]">

                    <AlertTriangle
                        size={42}
                        className="text-[var(--brand-primary)]"
                    />

                </div>

                {/* 404 */}

                <h1 className="text-7xl font-bold text-[var(--text-primary)]">
                    404
                </h1>

                {/* Title */}

                <h2 className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">
                    Page Not Found
                </h2>

                {/* Description */}

                <p className="mt-3 text-[var(--text-secondary)] leading-7">

                    Sorry, the page you're looking for doesn't exist or has been moved.

                </p>

                {/* Button */}

                <NavLink
                    to={redirectUrl}
                    className="
                        mt-8

                        inline-flex
                        items-center
                        justify-center
                        gap-2

                        w-full

                        rounded-lg

                        bg-[var(--btn-primary-bg)]

                        px-5
                        py-3

                        text-[var(--btn-primary-text)]

                        transition

                        hover:opacity-90
                    "
                >

                    <ArrowLeft size={18} />

                    {authCtx.isLogedIn
                        ? "Back to Dashboard"
                        : "Back to Login"}

                </NavLink>

            </div>

        </div>

    );

}

export default PageNotFound;