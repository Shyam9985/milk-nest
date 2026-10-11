import { useState } from "react";
import PasswordInput from "../../components/PasswordInput";
import { useToast } from "../../contexts/MessageContext";
import { isStrongPassword } from "../../utils/ValidateUtils";
import * as authService from "../../services/auth.service";

function UpdatePassword({ email, requestFor = 'forgot-password', messageKey, onSuccess }) {

    const toast = useToast();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpdatePassword = async () => {

        const validation = isStrongPassword(newPassword, {
            label: "New Password"
        });

        if (!validation.status) {
            toast.warning(validation.message);
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.warning("Passwords do not match.");
            return;
        }

        try {

            setLoading(true);

            const response = await authService.updatePassword({ email, newPassword, usedFor: requestFor, otpKey: messageKey });

            if (response.success) {

                toast.success(
                    response.message || "Password updated successfully."
                );

                onSuccess?.();

            } else {

                toast.error(
                    response.error || response.message || "Unable to update password."
                );

            }

        } catch {

            toast.error("Something went wrong.");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="space-y-4">

            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">

                <p className="font-semibold text-green-600">

                    OTP Verified

                </p>

                <p className="text-sm text-[var(--text-secondary)] mt-1">

                    Create a strong password for your account.

                </p>

            </div>

            <PasswordInput
                label="New Password"
                name="newPassword"
                value={newPassword}
                placeholder="Enter a strong password"
                onChange={(e) => setNewPassword(e.target.value)}
            />

            <PasswordInput
                label="Confirm Password"
                name="confirmPassword"
                value={confirmPassword}
                placeholder="Re-enter your password"
                onChange={(e) =>
                    setConfirmPassword(e.target.value)
                }
            />

            <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={loading}
                className="
                    w-full
                    rounded-lg
                    py-3
                    bg-[var(--btn-primary-bg)]
                    text-[var(--btn-primary-text)]
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                "
            >
                {loading
                    ? "Updating Password..."
                    : "🔐 Update Password"}
            </button>

        </div>

    );

}

export default UpdatePassword;