import { useEffect, useState } from "react";
import { useToast } from "../../contexts/MessageContext";
import { resetPasswordMail } from "../../services/auth.service";
import { getProfile } from "../../services/profile.service";
import VerifyOtp from "../auth/VerifyOTP";
import UpdatePassword from "../auth/UpdatePassword";
import { getProfilePhoto } from "../../services/files.service";
import FileUpload from "../../utils/FileUpload";
import Modal from "../../utils/ModelComponent";

function Profile() {
  const toast = useToast();

  const [user, setUser] = useState({});

  // fresh profile from the server — localStorage only reflects the last login
  useEffect(() => {
    (async () => {
      const response = await getProfile();

      if (response.success) {
        setUser(response.data);

        // profile data says a photo exists; fetch its bytes and show them
        if (response.data.profile_photo) {
          const blob = await getProfilePhoto();
          if (blob) setPhotoUrl(URL.createObjectURL(blob));
        }
      } else {
        toast.error(response.error || response.message);
      }
    })();
  }, []);

  const [step, setStep] = useState("send");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [messageKey, setMessageKey] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);

  // the uploaded File is still in the browser — preview it locally, no re-fetch needed
  const handlePhotoUploaded = (record, file) => {
    setPhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev); // free the previous preview's memory
      return URL.createObjectURL(file);
    });

    setShowFileUpload(false); // close the modal on success
  };

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

  function handleProfileUpdate() {
    console.log("Profile update clicked");
  }

  return (
    <div className="space-y-6">
      {/* ---------------- Profile ---------------- */}

      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)]">
        <div className="flex flex-col items-center border-b border-[var(--border-primary)] py-8">
          {/* Profile Avatar */}
          <button
            type="button"
            onClick={() => setShowFileUpload((prev) => !prev)}
            className="group relative h-28 w-28 overflow-hidden rounded-full bg-[var(--brand-primary)] text-white shadow-sm
            focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
          >
            {/* Photo when uploaded, initials otherwise */}
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile"
                className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-40"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-4xl font-bold
                transition-opacity duration-200 group-hover:opacity-40"
              >
                {user.first_nm?.charAt(0)}
                {user.last_nm?.charAt(0)}
              </div>
            )}

            {/* Hover Overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity
               duration-200 group-hover:opacity-100"
            >
              {/* Camera / Edit Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-7 w-7"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"
                />

                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </div>
          </button>

          {/* User Information */}
          <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
            {user.first_nm} {user.last_nm}
          </h2>

          <p className="text-[var(--text-secondary)]">{user.role?.role_nm}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-x-8 p-6">
          <Field label="Username" value={user.user_nm} />

          <Field label="Email" value={user.email} />

          <Field label="Mobile" value={user.mobile_no} />

          <Field label="Role" value={user.role?.role_nm} />

          <Field label="Position" value={user.hierarchy?.position_nm} />

          <Field label="Last Login" value={user.last_login} />
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
            className="w-full rounded-lg py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {" "}
            {sendingOtp ? "Sending OTP..." : "Send OTP"}
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
            requestFor={"reset-password"}
            messageKey={messageKey}
            onSuccess={() => {
              setStep("send");

              setMessageKey("");
            }}
          />
        )}
      </div>

      {/* ---------------- File Upload Modal ---------------- */}

      <Modal
        isOpen={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        onSubmit={() => setShowFileUpload(false)}
        title="Profile Photo"
        primaryButtonName="Close"
        showSecondaryButton={false}
      >
        <FileUpload
          description="Upload a photo to personalize your profile"
          supportedTypes="JPG, PNG, WEBP"
          maxSize="10 MB"
          onUploaded={handlePhotoUploaded}
        />
      </Modal>
    </div>
  );
}

export default Profile;
