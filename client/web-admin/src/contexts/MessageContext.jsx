import { createContext, useContext, useEffect, useState } from "react";
import ToastContainer from "./MessageContainer";

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = (id) => {
        setToasts(prev => {
            const next = prev.filter(t => t.id !== id);
            return next;
        });
    };

    const addToast = (message, type, duration = 1000) => {
        setToasts((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                message,
                type,
                duration
            }
        ]);
    };

    const toast = {
        success: (message, duration = 1000) =>
            addToast(message, "success", duration),

        error: (message, duration = 1500) =>
            addToast(message, "error", duration),

        warning: (message, duration = 1000) =>
            addToast(message, "warning", duration),

        info: (message, duration = 1000) =>
            addToast(message, "info", duration)
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}

            <ToastContainer
                toasts={toasts}
                removeToast={removeToast}
            />
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used inside ToastProvider");
    }

    return context;
};