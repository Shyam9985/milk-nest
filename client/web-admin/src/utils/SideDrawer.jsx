import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

/*
 * Drawer widths, from md upwards. Below md the drawer is full width - a form squeezed into a
 * sliver of a phone screen is unusable - and from md up it never goes below half the viewport,
 * which is the floor 'xs' now sits at. The keys are kept so existing callers still work; 'xs'
 * and 'sm' simply both land on that floor.
 */
const drawerSizes = {
    xs: "md:w-[50vw]",
    sm: "md:w-[50vw]",
    md: "md:w-[65vw]",
    lg: "md:w-[75vw]",
    xl: "md:w-[85vw]",
    full: "md:w-[100vw]",
};

function SideDrawer({ isOpen, onClose, children, title = "Drawer", drawerSize = "lg", direction = "right", }) {

    const [visible, setVisible] = useState(false);
    const isHorizontal = direction === "left" || direction === "right";

    useEffect(() => {

        if (isOpen) {

            setVisible(true);

        } else {

            setTimeout(() => {

                setVisible(false);

            }, 300);

        }

    }, [isOpen]);

    useEffect(() => {

        const handleEsc = (e) => {

            if (e.key === "Escape")
                onClose?.();

        };

        window.addEventListener("keydown", handleEsc);

        return () => window.removeEventListener("keydown", handleEsc);

    }, []);

    if (!isOpen && !visible)
        return null;


    const positions = {
        right: {
            wrapper: "justify-end",
            class: isOpen ? "translate-x-0" : "translate-x-full",
        },

        left: {
            wrapper: "justify-start",
            class: isOpen ? "translate-x-0" : "-translate-x-full",
        },

        top: {
            wrapper: "items-start",
            class: isOpen ? "translate-y-0" : "-translate-y-full",
        },

        bottom: {
            wrapper: "items-end",
            class: isOpen ? "translate-y-0" : "translate-y-full",
        }
    };
    const current = positions[direction] || positions.right;

    return createPortal(

        <div
            className={`fixed inset-0 z-50 flex ${current.wrapper} bg-black/50 transition-opacity
            duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`} onClick={onClose}>

            <div onClick={(e) => e.stopPropagation()}

                className={`bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-2xl transition-all duration-300 ease-in-out 
                    ${current.class} ${isHorizontal ? `w-full h-full md:min-w-[50vw] ${drawerSizes[drawerSize] || drawerSizes.lg}` : "w-full"}
                    ${direction === "left" || direction === "right" ? "w-full sm:w-auto h-full" : "w-full"}
                     ${direction === "right" ? "border-l border-[var(--border-primary)]" :
                        direction === "left" ? "border-r border-[var(--border-primary)]" :
                            direction === "top" ? "border-b border-[var(--border-primary)]" :
                                "border-t border-[var(--border-primary)]"}`}
            >

                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                    <h3 className="text-lg font-semibold">

                        {title}

                    </h3>

                    <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg
                        text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--danger)] transition-colors">
                        ✕

                    </button>

                </div>

                <div className="h-[calc(100%-73px)] overflow-y-auto bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">
                    {children}

                </div>

            </div>

        </div>,

        document.getElementById("modal-root")
    );
}

export default SideDrawer;