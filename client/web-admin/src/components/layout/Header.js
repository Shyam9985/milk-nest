import { useContext, useEffect, useRef, useState } from "react";
import { User, LogOut, ChevronDown, Type, Sun, } from "lucide-react";

import AuthContext from "../../contexts/AuthContext";
import FontSizeContext from "../../contexts/FontSizeContext";
import { Theme } from "../../contexts/ThemeContext";
import { handleLogout } from "../../services/auth.service";
import { useToast } from "../../contexts/MessageContext";
import SideDrawer from "../../utils/SideDrawer";
import Profile from "../../pages/profile/Profile";
import Modal from "../../utils/ModelComponent";

function Header() {
    const authCtx = useContext(AuthContext);
    const [showMenu, setShowMenu] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const menuRef = useRef(null);
    const message = useToast();

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

    async function confirmLogout() {

        const result = await handleLogout();

        if (result.success) {
            message.success("Logged out successfully!");
            authCtx.handleLogOut();
        } else {
            message.error(
                result?.error ||
                result?.message ||
                "Error logging out the user.",
                1500
            );
        }

        setShowLogoutModal(false);
    }

    const handleProfileClick = (e) => {
        e.stopPropagation();
        setShowMenu(false);
        setShowProfile(true);
    };
    return (
        <>
            <header className="relative h-16 overflow-visible shadow-md z-50 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] transition-colors duration-300">

                {/* Background Image */}
                <img
                    src="/images/header-banner.png"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />

                {/* Theme Overlay */}
                <div className="absolute inset-0 bg-black/45" />

                {/* Header Content */}

                <div className="relative h-full flex items-center justify-between px-6">

                    {/* ---------------- Left ---------------- */}

                    <div className="flex items-center gap-3">

                        <img
                            src="/images/logo.png"
                            alt="MilkNest"
                            className="w-10 h-10 rounded-lg bg-[var(--card-bg)] p-1 object-contain border border-[var(--border-primary)]"
                        />

                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                MilkNest
                            </h1>
                        </div>

                    </div>

                    {/* ---------------- Right ---------------- */}

                    <div className="flex items-center gap-4">

                        {/* Desktop Controls */}
                        <div className="hidden sm:flex items-center gap-4">
                            <FontSizeContext />
                            <Theme />
                        </div>

                        {/* Profile */}
                        {authCtx.isLogedIn && (

                            <div className="relative" ref={menuRef}>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(!showMenu);
                                    }}
                                    className="flex items-center gap-2 rounded-full border border-white/20 bg-white/15 backdrop-blur-md px-2 py-1 text-white hover:bg-white/20 transition"
                                >

                                    <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center">
                                        <User size={16} />
                                    </div>

                                    <ChevronDown
                                        size={16}
                                        className={`transition ${showMenu ? "rotate-180" : ""}`}
                                    />

                                </button>

                                {showMenu && (

                                    <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl overflow-hidden z-50">

                                        {/* Mobile Only */}
                                        <div className="sm:hidden border-b border-[var(--border-primary)]">

                                            <div className="flex items-center justify-between px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Type size={18} />
                                                    <span className="text-sm font-medium">
                                                        Font Size
                                                    </span>
                                                </div>

                                                <FontSizeContext mobile />
                                            </div>

                                            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-primary)]">
                                                <div className="flex items-center gap-3">
                                                    <Sun size={18} />
                                                    <span className="text-sm font-medium">
                                                        Theme
                                                    </span>
                                                </div>

                                                <Theme mobile />
                                            </div>

                                        </div>

                                        {/* Profile */}
                                        <button
                                            className="w-full flex items-center gap-3 px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors border-b border-[var(--border-primary)]"
                                            onClick={(e) => handleProfileClick(e)}
                                        >
                                            <User size={18} />
                                            Profile
                                        </button>

                                        {/* Logout */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMenu(false);
                                                setShowLogoutModal(true);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-[var(--danger)] hover:bg-red-50 transition-colors"
                                        >
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
            <SideDrawer
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                title="My Profile"
                drawerSize='lg'
            >
                <Profile />
            </SideDrawer>
            <Modal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onSubmit={confirmLogout}
                title="Confirm Logout"
                buttonName="Logout"
            >
                <div className="space-y-3">
                    <p className="text-[var(--text-primary)]">
                        Are you sure you want to logout?
                    </p>

                    <p className="text-sm text-[var(--text-secondary)]">
                        You will need to sign in again to access MilkNest.
                    </p>
                </div>
            </Modal>
        </>
    );
}

export default Header;