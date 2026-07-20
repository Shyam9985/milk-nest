import { useState } from "react";
import AuthInput from "../../components/AuthInput";
import { useToast } from "../../contexts/MessageContext";
import * as authService from "../../services/auth.service";

function VerifyOtp({ email, messageKey, onVerified, onResend, onChangeEmail }) {

    const toast = useToast();

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleVerifyOtp() {

        if (otp.length !== 6) {

            toast.warning("Please enter a valid 6 digit OTP.");

            return;

        }

        try {

            setLoading(true);

            const response = await authService.verifyForgotPasswordOtp({

                email,

                otp,

                key: messageKey

            });

            if (response.success) {

                toast.success(response.message);

                onVerified(otp);

            } else {

                toast.error(response.error || response.message);

            }

        } catch {

            toast.error("Something went wrong.");

        } finally {

            setLoading(false);

        }

    }

    return (

        <div className="space-y-4">

            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">

                <p className="font-semibold text-green-600">

                    OTP Sent Successfully

                </p>

                <p className="text-sm text-[var(--text-secondary)] mt-1">

                    Enter the OTP sent to

                </p>

                <p className="font-medium break-all">

                    {email}

                </p>

            </div>

            <AuthInput
                label="Verification Code"
                name="otp"
                value={otp}
                type="text"
                placeholder="Enter 6 digit OTP"
                onChange={(e) =>
                    setOtp(
                        e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6)
                    )
                }
            />

            <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full rounded-lg py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] disabled:opacity-60"
            >
                {loading
                    ? "Verifying..."
                    : "Verify OTP"}
            </button>

            <div className="flex justify-between text-sm">

                <button
                    type="button"
                    onClick={onResend}
                    className="text-[var(--brand-primary)] hover:underline"
                >
                    Resend OTP
                </button>

                <button
                    type="button"
                    onClick={onChangeEmail}
                    className="text-[var(--brand-primary)] hover:underline"
                >
                    Change Email
                </button>

            </div>

        </div>

    );

}

export default VerifyOtp;