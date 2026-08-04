import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Send } from "lucide-react";
import bannerImage from "../assets/banner-1.png";
import { contactDetails } from "../data/content";
import { Blob, MeshBackdrop } from "./ui/Backdrop";
import Reveal from "./ui/Reveal";
import { socialLinks } from "./ui/SocialIcons";
import { SectionHeading } from "./Services";

const FIELDS = [
  { name: "name", label: "Your name", type: "text", autoComplete: "name", required: true },
  { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel", required: true },
  { name: "email", label: "Email address", type: "email", autoComplete: "email", required: false },
  { name: "farm", label: "Farm / business name", type: "text", autoComplete: "organization", required: false },
];

const validators = {
  name: (value) => (value.trim().length >= 2 ? "" : "Please enter your name."),
  phone: (value) =>
    /^[+()\-\s\d]{7,16}$/.test(value.trim()) ? "" : "Please enter a valid phone number.",
  email: (value) =>
    !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
      ? ""
      : "Please enter a valid email address.",
  farm: () => "",
  message: (value) => (value.trim().length >= 10 ? "" : "Tell us a little more (10+ characters)."),
};

/** Glass input with a floating label and shake-on-error validation. */
function FloatingField({ field, as = "input", value, error, onChange, onBlur }) {
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
          placeholder=" "
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `contact-${field.name}-error` : undefined}
          className={`peer w-full rounded-2xl border bg-white/70 px-4 pb-2.5 pt-6 text-base font-medium text-navy-900 shadow-sm backdrop-blur transition-all duration-300 placeholder:text-transparent focus:bg-white focus:outline-none focus:ring-2 ${
            hasError
              ? "border-red-300 focus:ring-red-200"
              : "border-navy-100 focus:border-splash focus:ring-navy-100"
          } ${as === "textarea" ? "resize-none" : ""}`}
        />
        <label
          htmlFor={`contact-${field.name}`}
          className="pointer-events-none absolute left-4 top-1.5 text-xs font-semibold text-muted transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-medium peer-focus:top-1.5 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-navy-600"
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
            className="mt-1.5 overflow-hidden pl-1 text-xs font-semibold text-red-500"
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
  const [values, setValues] = useState({ name: "", phone: "", email: "", farm: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const setField = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validateField = (name) => () =>
    setErrors((current) => ({ ...current, [name]: validators[name](values[name]) }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = Object.fromEntries(
      Object.keys(validators).map((name) => [name, validators[name](values[name])])
    );
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    /* No inquiry API exists yet — surface the success state locally. */
    setSubmitted(true);
  };

  return (
    <section id="contact" className="relative scroll-mt-24 overflow-hidden py-20 sm:py-24 lg:py-28">
      <MeshBackdrop />
      <Blob className="left-[-8rem] bottom-0 size-[24rem]" tone="bg-navy-100/50" />

      <div className="mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Contact Us"
          title="Start a conversation about your dairy farm"
          copy="Reach out for a demo, pricing, or a walkthrough of how Milk Nest fits your farm."
        />

        <div className="mt-12 grid grid-cols-1 gap-8 lg:mt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          {/* Glass form */}
          <Reveal from="right" className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 p-6 shadow-glass backdrop-blur-2xl sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-navy-100/60 blur-3xl"
              />

              <AnimatePresence mode="wait">
                {submitted ? (
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
                      className="grid size-20 place-items-center rounded-full bg-grass-100 text-grass-600 ring-8 ring-grass-50"
                    >
                      <CheckCircle2 className="size-10" />
                    </motion.span>
                    <h3 className="text-2xl font-extrabold">Inquiry sent!</h3>
                    <p className="max-w-sm text-sm leading-relaxed text-muted">
                      Thanks, {values.name.split(" ")[0] || "friend"} — we received your message
                      and will reach out on {values.phone} shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setValues({ name: "", phone: "", email: "", farm: "", message: "" });
                      }}
                      className="mt-2 rounded-full border border-navy-200 px-6 py-2.5 text-sm font-bold text-navy-800 transition-colors hover:border-splash hover:bg-navy-50"
                    >
                      Send another inquiry
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
                    onSubmit={handleSubmit}
                    noValidate
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
                      />
                    ))}
                    <FloatingField
                      as="textarea"
                      field={{ name: "message", label: "What do you want to manage?", required: true }}
                      value={values.message}
                      error={errors.message}
                      onChange={setField("message")}
                      onBlur={validateField("message")}
                    />

                    <motion.button
                      type="submit"
                      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                      className="group mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-linear-to-r from-navy-800 via-navy-600 to-splash bg-[length:200%_auto] px-8 py-3.5 text-base font-bold text-white shadow-glow-navy transition-[background-position,transform] duration-500 hover:bg-right sm:col-span-2 sm:justify-self-start"
                    >
                      Send Inquiry
                      <Send className="size-4.5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>

          {/* Right rail: visual + contact cards + socials */}
          <div className="flex flex-col gap-5">
            <Reveal from="left">
              <div className="group relative overflow-hidden rounded-3xl shadow-lift ring-1 ring-navy-900/10">
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
                  Serving dairy farms across Andhra Pradesh and beyond.
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
                      className={`flex items-center gap-4 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-glass backdrop-blur-xl transition-all duration-300 ${
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
                        <span className="block text-base font-bold text-navy-900">{detail.value}</span>
                      </span>
                    </Wrapper>
                  </Reveal>
                );
              })}
            </div>

            <Reveal from="left" delay={0.35}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-muted">Follow us</span>
                <span aria-hidden="true" className="h-px flex-1 bg-navy-100" />
                <ul className="flex gap-2">
                  {socialLinks.map(({ name, Icon, href }) => (
                    <li key={name}>
                      <a
                        href={href}
                        aria-label={`Milk Nest on ${name} (coming soon)`}
                        className="grid size-10 place-items-center rounded-xl border border-navy-100 bg-white/80 text-navy-700 transition-all duration-300 hover:-translate-y-1 hover:border-splash hover:bg-navy-50 hover:text-navy-800"
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
    </section>
  );
}
