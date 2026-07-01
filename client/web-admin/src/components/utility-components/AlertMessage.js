import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const styles = {

    success: {
        bg: "bg-green-500",
        icon: "✔"
    },

    error: {
        bg: "bg-red-500",
        icon: "✖"
    },

    warning: {
        bg: "bg-yellow-500",
        icon: "⚠"
    },

    info: {
        bg: "bg-blue-500",
        icon: "ℹ"
    }

};


function AlertMessage({ show, message, type = "success", duration = 1000, onClose, showCloseIcon = true }) {

    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(100);


    useEffect(() => {
        if (!show) return;

        setVisible(true);

        const hideTimer = setTimeout(() => {
            setVisible(false);

            setTimeout(() => {
                onClose?.();
            }, 350);

        }, duration);

        return () => clearTimeout(hideTimer);

    }, [show, duration, onClose]);

    if (!show)
        return null;

    let style = null;
    switch (type) {
        case 'info': style = styles.info; break;
        case 'error': style = styles.error; break;
        case 'warning': style = styles.warning; break;
        case 'success': style = styles.success; break;
        default: style = styles.info; break;
    }

    return createPortal(

        <div

            className={`
            fixed
            top-5
            right-5
            z-[9999]

            transform
            transition-all
            duration-300

            ${visible
                    ? "translate-y-0 opacity-100 scale-100"
                    : "-translate-y-5 opacity-0 scale-95"
                }
            `}
        >

            <div
                className={`relative overflow-hidden min-w-[350px] rounded-lg shadow-xl text-white px-5 py-4 ${style.bg}`}
            >

                <div className="flex justify-between items-center">

                    <div className="flex items-center gap-3">

                        <span className="text-xl">{style.icon}</span>

                        <span>{message}</span>

                    </div>

                    {showCloseIcon && (

                        <button
                            onClick={() => {
                                setVisible(false);
                                setTimeout(() => onClose?.(), 300);
                            }}
                        >
                            ✕
                        </button>

                    )}

                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 h-1 w-full bg-white/20">
                    <div
                        className="h-full bg-white origin-left"
                        style={{
                            animation: `toastProgress ${duration}ms linear forwards`
                        }}
                    />
                </div>
            </div>

        </div >,

        document.getElementById("modal-root")

    );

}

export default AlertMessage;