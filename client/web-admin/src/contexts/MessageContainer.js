import AlertMessage from "../utils/AlertMessage";

function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3">
            {toasts.map((toast) => (
                <AlertMessage
                    key={toast.id}
                    show={true}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

export default ToastContainer;