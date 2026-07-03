import { useContext, useEffect, useRef, useState } from "react";
import { User, LogOut, ChevronDown, } from "lucide-react";

import AuthContext from "../../contexts/AuthContext";
import FontSizeContext from "../../contexts/FontSizeContext";
import { Theme } from "../../contexts/ThemeContext";

function Header() {
    const authCtx = useContext(AuthContext);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    /* ---------------- Close Profile Menu ---------------- */

    useEffect(() => {
        const closeMenu = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener("mousedown", closeMenu);

        return () => document.removeEventListener("mousedown", closeMenu);
    }, []);

    function handleLogOut() {
        setShowMenu(false);
        authCtx.handleLogOut();
    }
    return (
        <header className="relative h-16 overflow-visible shadow-md z-50">

            {/* Replace this image */}
            <img src="/images/header-banner.png" alt="" className="absolute inset-0 h-full w-full object-cover" />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/45" />

            {/* Header Content */}

            <div className="relative h-full flex items-center justify-between px-6">

                {/* ---------------- Left ---------------- */}
                <div className="flex items-center gap-3">
                    <img src="/images/logo.png" alt="MilkNest" className="w-10 h-10 rounded-lg bg-white p-1 object-contain" />

                    <div><h1 className="text-2xl font-bold text-white"> MilkNest </h1></div>

                </div>

                {/* ---------------- Right ---------------- */}

                <div className="flex items-center gap-4">

                    {/* Font Controls */}
                    <FontSizeContext />

                    {/* Theme */}
                    <Theme />

                    {/* Profile (Only when logged in) */}
                    {authCtx.isLogedIn && (

                        <div className="relative" ref={menuRef}>

                            <button onClick={() => setShowMenu(!showMenu)}
                                className="flex items-center gap-2 rounded-full border border-white/20
                                    bg-white/15 backdrop-blur-md px-2 py-1 text-white hover:bg-white/20 transition">

                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                    <User size={16} />
                                </div>

                                <ChevronDown size={16} className={`transition ${showMenu ? "rotate-180" : ""}`} />

                            </button>

                            {showMenu && (

                                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white dark:bg-slate-900 
                                shadow-2xl border overflow-hidden z-50">
                                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <User size={18} />
                                        Profile
                                    </button>

                                    <button
                                        onClick={handleLogOut}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50">
                                        <LogOut size={18} />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;