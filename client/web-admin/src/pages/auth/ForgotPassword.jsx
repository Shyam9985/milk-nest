import { useState } from "react";
import AuthInput from "../../components/AuthInput";
import PasswordInput from "../../components/PasswordInput";
import AuthCard from "./AuthCard";
import { useNavigate } from "react-router-dom";
import { isStrongPassword, isValidEmail } from "../../utils/ValidateUtils";
import { useToast } from "../../contexts/MessageContext";
import * as authService from "../../services/auth.service";
import VerifyOtp from "./VerifyOTP";
import UpdatePassword from "./UpdatePassword";

function ForgotPasswordForm() {

    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [step, setStep] = useState("send");
    const [verifiedOtp, setVerifiedOtp] = useState("");

    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [otpResponse, setOtpResponse] = useState(null);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);

    const message = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validation = isValidEmail(email);

        if (!validation.status) {
            message.warning(validation.message);
            return;
        }

        try {
            setSendingOtp(true);
            const response = await authService.sendForgotPasswordEmail(email);
            if (response.success) {
                message.success(response.message);
                setOtpResponse(response.data);
                setOtpVerified(false);
                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                message.error(response.error || response.message || "Unable to send OTP.");
            }

        } catch (err) {
            message.error("Something went wrong.");

        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        if (otp.length !== 6) {
            message.warning("Please enter a valid 6 digit OTP.");
            return;
        }

        try {
            setVerifyingOtp(true);
            const response = await authService.verifyForgotPasswordOtp({ email: email, otp: otp, key: otpResponse?.message_key });
            if (response.success) {
                message.success(response.message || "OTP verified successfully.");
                setOtpVerified(true);
            } else {
                message.error(response.error || response.message || "Unable to verify OTP.");
            }
        } catch (err) {
            message.error("Something went wrong.");
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (!otpVerified) {
            return;
        }

        const passwordValidation = isStrongPassword(newPassword, { label: "New Password" });

        if (!passwordValidation.status) {
            message.warning(passwordValidation.message);
            return;
        }

        if (newPassword !== confirmPassword) {
            message.warning("Passwords do not match.");
            return;
        }

        try {
            setUpdatingPassword(true);
            const response = await authService.updatePassword({
                email,
                newPassword,
                otpKey: otpResponse?.message_key
            });

            if (response.success) {
                message.success(response.message || "Password updated successfully.");
                navigate("/login");
            } else {
                message.error(response.error || response.message || "Unable to update password.");
            }
        } catch (err) {
            message.error("Something went wrong.");
        } finally {
            setUpdatingPassword(false);
        }
    };

    const currentStep = otpVerified ? 3 : otpResponse ? 2 : 1;
    const stepTitle = otpVerified ? "Set New Password" : otpResponse ? "Verify OTP" : "Send OTP";
    const progressWidth = otpVerified ? "w-full" : otpResponse ? "w-2/3" : "w-1/3";
    const subtitle = otpVerified
        ? "Set a new password for your account."
        : otpResponse ? "Enter the OTP sent to your registered email." : "Enter your email to receive a verification code.";

    return (
        <div
            className="relative flex items-center justify-center min-h-[calc(100vh-4rem)] overflow-hidden bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/background-banner.png')" }}
        >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-blue-950/60 to-slate-900/60 backdrop-blur-sm"></div>

            <div className="relative z-10 w-full max-w-md px-4">

                <AuthCard
                    title="Forgot Password"
                    subtitle={subtitle}
                >

                    {/* Progress */}
                    <div className="mb-6">

                        <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                            <span>Step {currentStep} of 3</span>
                            <span>{stepTitle}</span>
                        </div>

                        <div className="h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">

                            <div
                                className={`h-full bg-[var(--brand-primary)] transition-all duration-500 ${progressWidth}`}
                            ></div>

                        </div>

                    </div>

                    <form onSubmit={otpVerified ? handleUpdatePassword : handleSubmit}>

                        {/* Email */}
                        <AuthInput
                            label="Email Address"
                            name="email"
                            type="email"
                            value={email}
                            error={error}
                            disabled={!!otpResponse}
                            placeholder="Enter your registered email"
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        {!otpResponse && (

                            <button
                                type="submit"
                                disabled={sendingOtp}
                                className="mt-2 w-full rounded-lg py-3 font-medium transition-all bg-[var(--btn-primary-bg)]
                            text-[var(--btn-primary-text)] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {sendingOtp ? "Sending OTP..." : "📧 Send OTP"}
                            </button>

                        )}

                        {otpResponse && (

                            <div className="mt-6 animate-in fade-in duration-300 ">

                                {/* Success Box */}

                                <div className="mb-5 rounded-lg border border-green-500/30 bg-green-500/10 p-4">

                                    <div className="flex items-start gap-3">

                                        <div className="text-2xl">
                                            ✅
                                        </div>
                                        <p className="font-semibold text-green-600">
                                            OTP Sent Successfully
                                        </p>
                                    </div>

                                </div>

                                {!otpVerified ? (
                                    <>
                                        {/* OTP */}

                                        <VerifyOtp email={email} messageKey={otpResponse.message_key}
                                            onVerified={(otp) => {
                                                setVerifiedOtp(otp);
                                                setStep("update");
                                            }}

                                            onResend={handleSubmit}

                                            onChangeEmail={() => {
                                                setOtpResponse(null);
                                                setStep("send");
                                            }}
                                        />

                                        {/* Links */}

                                        <div className="mt-4 flex justify-between text-sm">

                                            <button type="button" className="text-[var(--brand-primary)] hover:underline"
                                                onClick={() => {
                                                    setOtp("");
                                                    setOtpResponse(null);
                                                    setOtpVerified(false);
                                                    handleSubmit({ preventDefault: () => { } });
                                                }}>
                                                Resend OTP
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOtp("");
                                                    setOtpResponse(null);
                                                    setOtpVerified(false);
                                                }}
                                                className="text-[var(--brand-primary)] hover:underline ">
                                                Change Email
                                            </button>

                                        </div>
                                    </>
                                ) : (
                                    <UpdatePassword
                                        email={email}
                                        requestFor={'forgot-password'}
                                        messageKey={otpResponse.message_key}
                                        onSuccess={() => navigate("/login")}
                                    />
                                )}

                            </div>

                        )}

                        <div className="mt-8 text-center">

                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="text-sm font-medium text-[var(--brand-primary)] hover:underline">
                                ← Back to Login
                            </button>

                        </div>

                    </form>

                </AuthCard>

            </div>

        </div>
    );

}

export default ForgotPasswordForm;