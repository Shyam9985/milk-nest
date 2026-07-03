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
        <aside
            className={` ${collapsed ? "w-12" : "w-64"} transition-all duration-300 ease-in-out bg-white dark:bg-slate-950 border-r
                border-slate-200 dark:border-slate-800 flex flex-col shadow-sm`}>
            {/* Logo */}

            <div className="h-16 border-b flex items-center justify-between px-3">

                {!collapsed && (
                    <div className="flex items-center gap-3">

                        <img
                            src="/images/logo.png"
                            alt="MilkNest"
                            className="w-9 h-9 rounded-lg object-cover"
                        />

                        <div>
                            <p className="font-semibold text-slate-800 dark:text-white">
                                MilkNest
                            </p>

                            <p className="text-xs text-slate-500">
                                Admin Portal
                            </p>
                        </div>

                    </div>
                )}

                <button
                    onClick={onToggle}
                    className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
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

                        <div
                            key={menu.label}
                            className="relative group"
                        >

                            <button
                                onClick={() => setSelected(menu.label)}
                                className={`
                                    w-full
                                    flex
                                    items-center
                                    gap-3
                                    rounded-xl
                                    px-3
                                    py-3
                                    transition-all
                                    duration-200

                                    ${active
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    }
                                `}
                            >

                                {/* Left Indicator */}

                                {active && (
                                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-blue-600" />
                                )}

                                <Icon
                                    size={20}
                                    className="shrink-0"
                                />

                                {!collapsed && (
                                    <span className="font-medium">
                                        {menu.label}
                                    </span>
                                )}

                            </button>

                            {/* Tooltip */}

                            {collapsed && (

                                <div
                                    className="
                                        absolute
                                        left-full
                                        top-1/2
                                        -translate-y-1/2
                                        ml-3
                                        opacity-0
                                        group-hover:opacity-100
                                        pointer-events-none
                                        transition
                                        whitespace-nowrap
                                        rounded-md
                                        bg-slate-900
                                        text-white
                                        text-sm
                                        px-3
                                        py-1.5
                                        shadow-lg
                                        z-50
                                    "
                                >
                                    {menu.label}
                                </div>

                            )}

                        </div>

                    );

                })}

            </nav>

            {/* Bottom */}

            <div className="border-t p-3">

                {!collapsed ? (
                    <div className="text-xs text-slate-500 text-center">
                        MilkNest Admin v1.0
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <Settings size={18} className="text-slate-400" />
                    </div>
                )}

            </div>

        </aside>
    );
}

export default Sidemenu;