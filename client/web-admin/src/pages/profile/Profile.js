import { useMemo, useState } from "react";
import { useToast } from "../../contexts/MessageContext";
import { resetPasswordMail } from "../../services/auth.service";
import VerifyOtp from "../auth/VerifyOTP";
import UpdatePassword from "../auth/UpdatePassword";

function Profile() {

    const toast = useToast();

    const user = useMemo(() => {

        try {

            return JSON.parse(localStorage.getItem("user-data")) || {};

        } catch {

            return {};

        }

    }, []);

    const [step, setStep] = useState("send");

    const [sendingOtp, setSendingOtp] = useState(false);

    const [messageKey, setMessageKey] = useState("");

    const handleSendOtp = async () => {

        try {

            setSendingOtp(true);

            const response = await resetPasswordMail(user.email);

            if (response.success) {

                toast.success(response.message);

                setMessageKey(response.data.message_key);

                setStep("verify");

            } else {

                toast.error(response.error || response.message);

            }

        } catch {

            toast.error("Unable to send OTP.");

        } finally {

            setSendingOtp(false);

        }

    };

    const Field = ({ label, value }) => (

        <div className="flex items-start gap-3 py-3 border-b border-[var(--border-primary)]">

            <p className="min-w-28 font-medium text-[var(--text-secondary)]">

                {label}

            </p>

            <span>:</span>

            <span className="text-[var(--text-primary)] break-all">

                {value || "-"}

            </span>

        </div>

    );

    return (

        <div className="space-y-6">

            {/* ---------------- Profile ---------------- */}

            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)]">

                <div className="flex flex-col items-center py-8 border-b border-[var(--border-primary)]">

                    <div
                        className="
                            h-20
                            w-20
                            rounded-full
                            bg-[var(--brand-primary)]
                            text-white
                            flex
                            items-center
                            justify-center
                            text-3xl
                            font-bold
                        "
                    >

                        {user.first_nm?.charAt(0)}
                        {user.last_nm?.charAt(0)}

                    </div>

                    <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">

                        {user.first_nm} {user.last_nm}

                    </h2>

                    <p className="text-[var(--text-secondary)]">

                        {user.role?.role_nm}

                    </p>

                </div>

                <div className="grid md:grid-cols-2 gap-x-8 p-6">

                    <Field
                        label="Username"
                        value={user.user_nm}
                    />

                    <Field
                        label="Email"
                        value={user.email}
                    />

                    <Field
                        label="Mobile"
                        value={user.mobile_no}
                    />

                    <Field
                        label="Role"
                        value={user.role?.role_nm}
                    />

                    <Field
                        label="Position"
                        value={user.hierarchy?.position_nm}
                    />

                    <Field
                        label="Last Login"
                        value={user.last_login}
                    />

                </div>

            </div>

            {/* ---------------- Reset Password ---------------- */}

            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6">

                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-5">

                    Reset Password

                </h3>

                {step === "send" && (

                    <button
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
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
                        {sendingOtp
                            ? "Sending OTP..."
                            : "Send OTP"}
                    </button>

                )}

                {step === "verify" && (

                    <VerifyOtp
                        email={user.email}
                        messageKey={messageKey}
                        onVerified={() => setStep("update")}
                        onResend={handleSendOtp}
                        onChangeEmail={() => {

                            setStep("send");

                            setMessageKey("");

                        }}
                    />

                )}

                {step === "update" && (

                    <UpdatePassword
                        email={user.email}
                        requestFor={'reset-password'}
                        messageKey={messageKey}
                        onSuccess={() => {

                            setStep("send");

                            setMessageKey("");

                        }}
                    />

                )}

            </div>

        </div>

    );

}

export default Profile;