import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// how long each type stays on screen (ms). errors and warnings stay longest so the
// reason can be read; the progress bar at the bottom runs over the same time
const DISPLAY_TIME = { success: 3000, info: 4000, warning: 5000, error: 6000 };

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


function AlertMessage({ id, show, message, type = "success", duration = 1000, onClose, showCloseIcon = true }) {

    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(100);

    duration = DISPLAY_TIME[type] || DISPLAY_TIME.info;

    useEffect(() => {
        if (!show) return;

        setVisible(true);

        const hideTimer = setTimeout(() => {
            setVisible(false);

            setTimeout(() => {
                onClose?.(id);
            }, 350);

        }, duration);

        return () => clearTimeout(hideTimer);

    }, [show, duration]);

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

    return <div className={`transform transition-all duration-300
            ${visible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-5 opacity-0 scale-95"}
            `}
    >

        <div className={`relative overflow-hidden min-w-[20rem] rounded-lg shadow-xl text-white px-5 py-4 ${style.bg}`}>

            <div className="flex justify-between items-center">

                <div className="flex items-center gap-3">
                    <span>{message}</span>
                </div>

                {showCloseIcon && (

                    <button onClick={() => { setVisible(false); setTimeout(() => onClose?.(), 300); }}>
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

    </div >
}

export default AlertMessage;