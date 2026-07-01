import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

function Modal({ isOpen, onClose, onSubmit, children, title = "Alert", buttonName = "Confirm", closeOnOverlay = true, closeOnEsc = true, }) {

    const [visible, setVisible] = useState(false);

    useEffect(() => {

        if (isOpen) {
            setVisible(true);
        } else {
            const timer = setTimeout(() => {
                setVisible(false);
            }, 350);

            return () => clearTimeout(timer);
        }

    }, [isOpen]);

    useEffect(() => {

        if (!closeOnEsc) return;

        const handleEsc = (e) => {
            if (e.key === "Escape") {
                onClose?.();
            }
        };

        window.addEventListener("keydown", handleEsc);

        return () => window.removeEventListener("keydown", handleEsc);

    }, [closeOnEsc, onClose]);

    if (!isOpen && !visible) return null;

    return createPortal(

        <div
            onClick={() => {
                if (closeOnOverlay) {
                    onClose?.();
                }
            }}
            className={`
                fixed inset-0 z-50
                flex items-center justify-center

                bg-black/40
                backdrop-blur-sm

                transition-all
                duration-300

                ${isOpen ? "opacity-100" : "opacity-0"}
            `}
        >

            <div

                onClick={(e) => e.stopPropagation()}

                className={`
                    w-auto
                    max-w-[80%]
                    min-w-[400px]

                    rounded-xl
                    bg-white
                    overflow-hidden
                    shadow-2xl

                    transform-gpu

                    transition-all
                    duration-500
                    ease-[cubic-bezier(.22,1,.36,1)]

                    ${isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-5"}
                `}
            >

                {/* Header */}

                <div
                    className={`
                        flex
                        justify-between
                        items-center

                        border-b
                        px-5
                        py-4

                        transition-all
                        duration-300
                        delay-100

                        ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}
                    `}
                >

                    <h3 className="text-lg font-semibold">
                        {title}
                    </h3>

                    <button onClick={onClose}
                        className="rounded px-3 py-1 bg-red-500 text-white transition-all duration-300 hover:bg-red-600 hover:rotate-90"                    >
                        ✕
                    </button>

                </div>

                {/* Body */}

                <div
                    className={`
                        p-5

                        transition-all
                        duration-300
                        delay-200

                        ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
                    `}
                >
                    {children}
                </div>

                {/* Footer */}

                <div
                    className={`
                        flex
                        justify-end
                        gap-2

                        border-t
                        px-5
                        py-4

                        transition-all
                        duration-300
                        delay-300

                        ${isOpen ? "opacity-100" : "opacity-0"}
                    `}
                >

                    <button
                        onClick={onSubmit}
                        className="
                            rounded
                            bg-blue-600
                            px-4
                            py-2
                            text-white

                            transition-all
                            duration-300

                            hover:bg-blue-700
                            hover:scale-105
                            active:scale-95
                        "
                    >
                        {buttonName}
                    </button>

                </div>

            </div>

        </div>,

        document.getElementById("modal-root")
    );
}

export default Modal;