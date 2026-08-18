import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

function Modal({ isOpen, onClose, onSubmit, children, title = "Alert", primaryButtonName = "Confirm",
    secondaryButtonName = "Cancel", showPrimaryButton = true, showSecondaryButton = true, showCloseButton = true,
    closeOnOverlay = true, closeOnEsc = true,
}) {

    const [visible, setVisible] = useState(false);

    /* ---------------- Visibility ---------------- */

    useEffect(() => {

        if (isOpen) {

            setVisible(true);
            document.body.style.overflow = "hidden";

        } else {

            const timer = setTimeout(() => {
                setVisible(false);
            }, 350);

            document.body.style.overflow = "";

            return () => clearTimeout(timer);

        }

        return () => {
            document.body.style.overflow = "";
        };

    }, [isOpen]);

    /* ---------------- ESC ---------------- */

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

    if (!isOpen && !visible)
        return null;

    return createPortal(

        <div
            onClick={() => {

                if (closeOnOverlay) {
                    onClose?.();
                }

            }}

            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300
            ${isOpen ? "opacity-100" : "opacity-0"}            `}        >

            <div

                onClick={(e) => e.stopPropagation()}

                className={`max-w-lg md:max-w-2xl overflow-hidden rounded-2xl border border-[var(--border-primary)]
                    bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-2xl transform-gpu transition-all duration-300
                    ${isOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-95 opacity-0"}`}
            >

                {/* Header */}

                <div
                    className={`flex items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-6 py-4`}>

                    <h2 className="text-lg font-semibold">
                        {title}
                    </h2>

                    {showCloseButton && (

                        <button onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)]
                                hover:bg-[var(--hover-bg)] hover:text-[var(--danger)] transition-all duration-200 hover:rotate-90">
                            ✕
                        </button>

                    )}

                </div>

                {/* Body */}

                <div className="max-h-[65vh] overflow-y-auto p-6">

                    {children}

                </div>

                {/* Footer */}

                {(showPrimaryButton || showSecondaryButton) && (

                    <div className="flex justify-end gap-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] px-6 py-4">
                        {showSecondaryButton && (

                            <button onClick={onClose}
                                className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-2 text-[var(--text-primary)]
                                font-medium transition-all duration-200 hover:bg-[var(--hover-bg)] active:scale-95 " >
                                {secondaryButtonName}
                            </button>

                        )}

                        {showPrimaryButton && (

                            <button onClick={onSubmit}
                                className="rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] px-4 py-2 font-medium
                                    shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-95">
                                {primaryButtonName}
                            </button>

                        )}

                    </div>

                )}

            </div>

        </div>,

        document.getElementById("modal-root")

    );

}

export default Modal;