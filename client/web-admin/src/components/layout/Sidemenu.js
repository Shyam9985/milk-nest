import { LayoutDashboard, Users, Package, ShoppingCart, Settings, PanelLeftClose, PanelLeftOpen, } from "lucide-react";
import { useState } from "react";

function Sidemenu({ collapsed, onToggle }) {

    const [selected, setSelected] = useState("Dashboard");

    const menus = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
        },
        {
            label: "Users",
            icon: Users,
        },
        {
            label: "Products",
            icon: Package,
        },
        {
            label: "Orders",
            icon: ShoppingCart,
        },
        {
            label: "Settings",
            icon: Settings,
        },
    ];

    return (
        <aside className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300 ease-in-out 
        bg-[var(--bg-primary)] border-r border-[var(--border-primary)] flex flex-col shadow-sm`}     >

            {/* Logo */}

            <div className="h-16 border-b border-[var(--border-primary)] flex items-center justify-between px-3">

                {!collapsed && (
                    <div className="flex items-center gap-3">
                        <img src="/images/logo.png" alt="MilkNest" className="w-9 h-9 rounded-lg object-cover" />
                        <div>
                            <p className="font-semibold text-[var(--text-primary)]">
                                MilkNest
                            </p>

                            <p className="text-xs text-[var(--text-secondary)]">
                                Admin Portal
                            </p>

                        </div>

                    </div>
                )}

                <button onClick={onToggle}
                    className="rounded-lg p-2 text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition"                >
                    {collapsed ? (
                        <PanelLeftOpen size={18} />
                    ) : (
                        <PanelLeftClose size={18} />
                    )}
                </button>

            </div>

            {/* Navigation */}

            <nav className="flex-1 p-2 space-y-1">

                {menus.map((menu) => {

                    const Icon = menu.icon;
                    const active = selected === menu.label;

                    return (

                        <div key={menu.label} className="relative group">

                            <button onClick={() => setSelected(menu.label)}
                                className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200
                                ${active ? "bg-[var(--brand-tertiary)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"}
                        `}
                            >

                                {/* Left Indicator */}

                                {active && (
                                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[var(--brand-primary)]" />
                                )}

                                <Icon size={20} className="shrink-0" />

                                {!collapsed && (
                                    <span className="font-medium">
                                        {menu.label}
                                    </span>
                                )}

                            </button>

                            {/* Tooltip */}

                            {collapsed && (

                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 opacity-0 group-hover:opacity-100 pointer-events-none transition
                                whitespace-nowrap rounded-md bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border-primary)]
                                text-sm px-3 py-1.5 shadow-lg z-50">
                                    {menu.label}
                                </div>
                            )}

                        </div>

                    );

                })}

            </nav>

            {/* Bottom */}

            <div className="border-t border-[var(--border-primary)] p-3">

                {!collapsed ? (
                    <div className="text-xs text-[var(--text-secondary)] text-center">
                        MilkNest Admin v1.0
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <Settings size={18} className="text-[var(--text-tertiary)]" />
                    </div>
                )}

            </div>

        </aside>
    );
}

export default Sidemenu;