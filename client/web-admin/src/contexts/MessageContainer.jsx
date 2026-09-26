import { createPortal } from "react-dom";
import AlertMessage from "../utils/AlertMessage";

function ToastContainer({ toasts, removeToast }) {
    return (
        createPortal(<div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 transform transition-all duration-300 ease-out">
            {toasts.map((toast) => (
                <AlertMessage
                    key={toast.id}
                    id={toast.id}
                    show={true}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={removeToast}
                />
            ))}
        </div>, document.getElementById('toast-root'))
    );
}

export default ToastContainer;