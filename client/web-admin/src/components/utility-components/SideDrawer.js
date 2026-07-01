import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

function SideDrawer({
    isOpen,
    onClose,
    children,
    title = "Drawer",
    width = "400px",
    direction = "right",
}) {

    const [visible, setVisible] = useState(false);

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
            style: { width }
        },

        left: {
            wrapper: "justify-start",
            class: isOpen ? "translate-x-0" : "-translate-x-full",
            style: { width }
        },

        top: {
            wrapper: "items-start",
            class: isOpen ? "translate-y-0" : "-translate-y-full",
            style: { height: width, width: "100%" }
        },

        bottom: {
            wrapper: "items-end",
            class: isOpen ? "translate-y-0" : "translate-y-full",
            style: { height: width, width: "100%" }
        }

    };

    const current = positions[direction] || positions.right;

    return createPortal(

        <div
            className={`fixed inset-0 z-50 flex ${current.wrapper}
            bg-black/50
            transition-opacity
            duration-300
            ${isOpen ? "opacity-100" : "opacity-0"}`}
            onClick={onClose}
        >

            <div

                onClick={(e) => e.stopPropagation()}
                style={current.style}

                className={`
                    bg-white
                    shadow-xl
                    transition-transform
                    duration-300
                    ease-in-out
                    ${current.class}
                    h-full
                `}
            >

                <div className="flex justify-between items-center border-b px-5 py-4">

                    <h3 className="text-lg font-semibold">

                        {title}

                    </h3>

                    <button
                        onClick={onClose}
                        className="text-xl hover:text-red-500"
                    >
                        ✕

                    </button>

                </div>

                <div className="p-5 overflow-auto h-[calc(100%-70px)]">

                    {children}

                </div>

            </div>

        </div>,

        document.getElementById("modal-root")
    );
}

export default SideDrawer;