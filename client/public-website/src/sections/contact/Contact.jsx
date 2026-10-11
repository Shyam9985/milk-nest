import { useReducer } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, CircleAlert, LoaderCircle, Send } from "lucide-react";
import bannerImage from "../../assets/banner-1.png";
import { Blob } from "../../components/graphics/Backdrop";
import Chapter from "../../components/layout/Chapter";
import Reveal from "../../components/ui/Reveal";
import SectionHeading from "../../components/ui/SectionHeading";
import { socialLinks } from "../../components/ui/SocialIcons";
import { contactDetails } from "../../config/site";
import { contact } from "../../content/contact";
import { apiRequest } from "../../lib/api";

/* maxLength mirrors the column sizes of enquiries_lst_t, so nothing typed here can be too long to store. */
const FIELDS = [
  { name: "name", label: "Your name", type: "text", autoComplete: "name", required: true, maxLength: 100 },
  { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel", required: true, maxLength: 16 },
  { name: "email", label: "Email address", type: "email", autoComplete: "email", required: true, maxLength: 254 },
  { name: "farm", label: "Farm / business name", type: "text", autoComplete: "organization", required: false, maxLength: 150 },
];

const MESSAGE_FIELD = {
  name: "message",
  label: "What do you want to manage?",
  required: true,
  maxLength: 2000,
};

/* The same rules the server applies (publicCtrl.js). These only save a round trip - the
   server checks everything again, because a request does not have to come from this form. */
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;
const PHONE_RE = /^[+()\-\s\d]{7,16}$/;

const validators = {
  name: (value) => (value.trim().length >= 2 ? "" : "Please enter your name."),
  phone: (value) =>
    PHONE_RE.test(value.trim()) && value.replace(/\D/g, "").length >= 7
      ? ""
      : "Please enter a valid phone number.",
  email: (value) => {
    if (!value.trim()) return "Please enter your email address.";
    return EMAIL_RE.test(value.trim()) ? "" : "Please enter a valid email address.";
  },
  farm: () => "",
  message: (value) => (value.trim().length >= 10 ? "" : "Tell us a little more (10+ characters)."),
};

const initialState = {
  values: { name: "", phone: "", email: "", farm: "", message: "" },
  errors: {},
  status: "idle", // idle -> submitting -> submitted (or back to idle on failure)
  serverError: "", // a failure that does not belong to one field
  successMessage: "",
};

/* Every change to the form's state, in one place. */
function formReducer(state, action) {
  switch (action.type) {
    case "FIELD_CHANGED":
      return {
        ...state,
        values: { ...state.values, [action.name]: action.value },
        errors: { ...state.errors, [action.name]: "" },
        serverError: "",
      };

    case "FIELD_VALIDATED":
      return { ...state, errors: { ...state.errors, [action.name]: action.error } };

    case "VALIDATION_FAILED":
      return { ...state, errors: action.errors };

    case "SUBMIT_STARTED":
      return { ...state, status: "submitting", serverError: "" };

    case "SUBMIT_SUCCEEDED":
      return { ...state, status: "submitted", successMessage: action.message };

    case "SUBMIT_FAILED":
      return {
        ...state,
        status: "idle",
        errors: { ...state.errors, ...action.fieldErrors },
        serverError: action.serverError,
      };

    case "RESET_FORM":
      return initialState;

    default:
      return state;
  }
}

/** Glass input with a floating label and shake-on-error validation. */
function FloatingField({ field, as = "input", value, error, onChange, onBlur, disabled }) {
  const Tag = as;
  const hasError = Boolean(error);

  return (
    <motion.div
      animate={hasError ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className={as === "textarea" ? "sm:col-span-2" : ""}
    >
      <div className="relative">
        <Tag
          id={`contact-${field.name}`}
          name={field.name}
          type={as === "input" ? field.type : undefined}
          rows={as === "textarea" ? 4 : undefined}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={field.autoComplete}
          required={field.required}
          maxLength={field.maxLength}
          disabled={disabled}
          placeholder=" "
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `contact-${field.name}-error` : undefined}
          className={`peer w-full rounded-2xl border bg-surface/70 px-4 pb-2.5 pt-6 text-base font-medium text-ink shadow-sm backdrop-blur transition-all duration-300 placeholder:text-transparent focus:bg-surface focus:outline-none focus:ring-2 disabled:opacity-60 ${
            hasError
              ? "border-red-300 focus:ring-red-200 dark:border-red-400/60 dark:focus:ring-red-400/30"
              : "border-line focus:border-splash focus:ring-line"
          } ${as === "textarea" ? "resize-none" : ""}`}
        />
        <label
          htmlFor={`contact-${field.name}`}
          className="pointer-events-none absolute left-4 top-1.5 text-xs font-semibold text-muted transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-medium peer-focus:top-1.5 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-splash"
        >
          {field.label}
          {field.required ? <span className="text-splash"> *</span> : null}
        </label>
      </div>
      <AnimatePresence>
        {hasError ? (
          <motion.p
            id={`contact-${field.name}-error`}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1.5 overflow-hidden pl-1 text-xs font-semibold text-red-500 dark:text-red-300"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Contact() {
  const reduceMotion = useReducedMotion();
  const [state, dispatch] = useReducer(formReducer, initialState);
  const { values, errors, status, serverError, successMessage } = state;
  const submitting = status === "submitting";

  const setField = (name) => (event) =>
    dispatch({ type: "FIELD_CHANGED", name, value: event.target.value });

  const validateField = (name) => () =>
    dispatch({ type: "FIELD_VALIDATED", name, error: validators[name](values[name]) });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = Object.fromEntries(
      Object.keys(validators).map((name) => [name, validators[name](values[name])])
    );
    if (Object.values(nextErrors).some(Boolean)) {
      dispatch({ type: "VALIDATION_FAILED", errors: nextErrors });
      return;
    }

    dispatch({ type: "SUBMIT_STARTED" });

    try {
      const response = await apiRequest("public/enquiries", {
        method: "POST",
        body: {
          full_name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          /* undefined is dropped from the JSON, so an empty optional field is simply not sent */
          farm_name: values.farm.trim() || undefined,
          message: values.message.trim(),
        },
      });
      dispatch({ type: "SUBMIT_SUCCEEDED", message: response.message });
    } catch (error) {
      const text = error.error || error.message || "Something went wrong. Please try again.";

      /* One enquiry per email address: the server says so, and the message belongs to that field. */
      if (error.statusKey === "DUPLICATE_RECORD") {
        dispatch({ type: "SUBMIT_FAILED", fieldErrors: { email: text }, serverError: "" });
      } else {
        dispatch({ type: "SUBMIT_FAILED", fieldErrors: {}, serverError: text });
      }
    }
  };

  return (
    <Chapter id="contact" backdrop={<Blob className="left-[-8rem] bottom-0 size-[24rem]" tone="bg-haze/50" />}>
      <div className="w-full">
        <SectionHeading title={contact.headline} emphasis={contact.emphasis} copy={contact.lead} />

        <div className="mt-12 grid grid-cols-1 gap-8 lg:mt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          {/* Glass form */}
          <Reveal from="right" className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-edge/70 bg-surface/60 p-6 shadow-glass backdrop-blur-2xl sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-haze-soft/60 blur-3xl"
              />

              <AnimatePresence mode="wait">
                {status === "submitted" ? (
                  <motion.div
                    key="success"
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    role="status"
                    className="flex min-h-[24rem] flex-col items-center justify-center gap-4 text-center"
                  >
                    <motion.span
                      initial={reduceMotion ? false : { scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.15 }}
                      className="grid size-20 place-items-center rounded-full bg-grass-100 text-grass-600 ring-8 ring-grass-50 dark:bg-grass-500/15 dark:text-grass-300 dark:ring-grass-500/10"
                    >
                      <CheckCircle2 className="size-10" />
                    </motion.span>
                    <h3 className="text-2xl font-extrabold">Enquiry sent!</h3>
                    <p className="max-w-sm text-sm leading-relaxed text-muted">
                      {successMessage ||
                        "We have received your enquiry and will get in touch with you shortly."}
                    </p>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "RESET_FORM" })}
                      className="mt-2 rounded-full border border-line-strong px-6 py-2.5 text-sm font-bold text-ink-soft transition-colors hover:border-splash hover:bg-surface-soft"
                    >
                      Back to the form
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
                    onSubmit={handleSubmit}
                    noValidate
                    aria-busy={submitting}
                    className="relative grid grid-cols-1 gap-4 sm:grid-cols-2"
                  >
                    {FIELDS.map((field) => (
                      <FloatingField
                        key={field.name}
                        field={field}
                        value={values[field.name]}
                        error={errors[field.name]}
                        onChange={setField(field.name)}
                        onBlur={validateField(field.name)}
                        disabled={submitting}
                      />
                    ))}
                    <FloatingField
                      as="textarea"
                      field={MESSAGE_FIELD}
                      value={values.message}
                      error={errors.message}
                      onChange={setField("message")}
                      onBlur={validateField("message")}
                      disabled={submitting}
                    />

                    {/* A failure that is not about one field: server validation, rate limit, no connection */}
                    <AnimatePresence>
                      {serverError ? (
                        <motion.p
                          role="alert"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden sm:col-span-2"
                        >
                          <span className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300">
                            <CircleAlert className="mt-0.5 size-4 shrink-0" />
                            {serverError}
                          </span>
                        </motion.p>
                      ) : null}
                    </AnimatePresence>

                    <motion.button
                      type="submit"
                      disabled={submitting}
                      whileTap={reduceMotion || submitting ? undefined : { scale: 0.97 }}
                      className="group mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-linear-to-r from-navy-800 via-navy-600 to-splash bg-[length:200%_auto] px-8 py-3.5 text-base font-bold text-white shadow-glow-navy transition-[background-position,transform] duration-500 hover:bg-right disabled:cursor-wait disabled:opacity-80 sm:col-span-2 sm:justify-self-start"
                    >
                      {submitting ? (
                        <>
                          Sending…
                          <LoaderCircle className="size-4.5 animate-spin" />
                        </>
                      ) : (
                        <>
                          Send Enquiry
                          <Send className="size-4.5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>

          {/* Right rail: visual + contact cards + socials */}
          <div className="flex flex-col gap-5">
            <Reveal from="left">
              <div className="group relative overflow-hidden rounded-3xl shadow-lift ring-1 ring-ink/10">
                <img
                  src={bannerImage}
                  alt="Milk Nest branding with dairy cows in a green pasture"
                  loading="lazy"
                  width="1983"
                  height="793"
                  className="aspect-[16/8] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-linear-to-t from-navy-950/50 via-transparent to-transparent"
                />
                <p className="absolute bottom-4 left-4 right-4 text-sm font-bold text-white">
                  {contact.bannerCaption}
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-4">
              {contactDetails.map((detail, index) => {
                const Wrapper = detail.href ? "a" : "div";
                return (
                  <Reveal key={detail.label} from="left" delay={0.1 + index * 0.09}>
                    <Wrapper
                      {...(detail.href ? { href: detail.href } : {})}
                      className={`flex items-center gap-4 rounded-2xl border border-edge/70 bg-surface/70 p-4 shadow-glass backdrop-blur-xl transition-all duration-300 ${
                        detail.href ? "hover:-translate-y-1 hover:shadow-lift" : ""
                      }`}
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-navy-700 to-navy-500 text-white shadow-glow-navy">
                        <detail.icon className="size-5" />
                      </span>
                      <span>
                        <span className="block text-xs font-bold uppercase tracking-wide text-muted">
                          {detail.label}
                        </span>
                        <span className="block text-base font-bold text-ink">{detail.value}</span>
                      </span>
                    </Wrapper>
                  </Reveal>
                );
              })}
            </div>

            <Reveal from="left" delay={0.35}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-muted">{contact.followLabel}</span>
                <span aria-hidden="true" className="h-px flex-1 bg-line" />
                <ul className="flex gap-2">
                  {socialLinks.map(({ name, Icon, href }) => (
                    <li key={name}>
                      <a
                        href={href}
                        aria-label={`Milk Nest on ${name} (coming soon)`}
                        className="grid size-10 place-items-center rounded-xl border border-line bg-surface/80 text-ink-soft transition-all duration-300 hover:-translate-y-1 hover:border-splash hover:bg-surface-soft hover:text-ink"
                      >
                        <Icon />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </Chapter>
  );
}
