import { useState } from "react";
import { CheckCircle2, Mail, MapPin, Phone, Send } from "lucide-react";
import { navItems } from "../data/content";
import { CurveDivider, Particles } from "./ui/Backdrop";
import BrandMark from "./ui/BrandMark";
import Reveal from "./ui/Reveal";
import { socialLinks } from "./ui/SocialIcons";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
    /* Newsletter backend does not exist yet — acknowledge locally. */
    setSubscribed(true);
  };

  return (
    <footer className="relative">
      <CurveDivider />

      <div className="relative overflow-hidden bg-linear-to-b from-navy-950 via-navy-900 to-navy-950 text-navy-100">
        <Particles />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/4 size-96 rounded-full bg-splash/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-1/5 size-80 rounded-full bg-splash/10 blur-3xl"
        />

        <div className="mx-auto w-full max-w-site px-4 pb-10 pt-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1fr]">
            {/* Brand */}
            <Reveal>
              <a href="#home" aria-label="Milk Nest — home" className="group inline-block">
                {/* Logo glow */}
                <span className="relative inline-block">
                  <span
                    aria-hidden="true"
                    className="absolute -inset-3 rounded-3xl bg-splash/25 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <BrandMark tone="dark" className="relative" />
                </span>
              </a>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-300">
                Smart dairy farm management — cattle, milk, money, and people in one clear
                operating view, for single farms and multi-branch operations.
              </p>
              <ul className="mt-5 flex gap-2.5">
                {socialLinks.map(({ name, Icon, href }) => (
                  <li key={name}>
                    <a
                      href={href}
                      aria-label={`Milk Nest on ${name} (coming soon)`}
                      className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-navy-200 transition-all duration-300 hover:-translate-y-1 hover:border-splash/60 hover:bg-splash/20 hover:text-white"
                    >
                      <Icon />
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Quick links */}
            <Reveal delay={0.1}>
              <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-white">
                Quick Links
              </h3>
              <ul className="mt-4 space-y-2.5">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      className="group inline-flex items-center gap-2 text-sm font-medium text-navy-300 transition-colors duration-300 hover:text-white"
                    >
                      <span
                        aria-hidden="true"
                        className="h-px w-3 bg-splash/60 transition-all duration-300 group-hover:w-5 group-hover:bg-splash"
                      />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Contact + newsletter */}
            <Reveal delay={0.2}>
              <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-white">
                Stay in Touch
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-navy-300">
                <li>
                  <a href="tel:+919985453023" className="inline-flex items-center gap-2.5 transition-colors hover:text-white">
                    <Phone className="size-4 text-splash" /> +91 99854 53023
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@milknest.example" className="inline-flex items-center gap-2.5 transition-colors hover:text-white">
                    <Mail className="size-4 text-splash" /> hello@milknest.example
                  </a>
                </li>
                <li className="inline-flex items-center gap-2.5">
                  <MapPin className="size-4 text-splash" /> Andhra Pradesh, India
                </li>
              </ul>

              {subscribed ? (
                <p role="status" className="mt-5 flex items-center gap-2 rounded-2xl border border-grass-500/30 bg-grass-500/10 px-4 py-3 text-sm font-semibold text-grass-300">
                  <CheckCircle2 className="size-4.5 shrink-0" />
                  You're on the list — farm insights coming your way.
                </p>
              ) : (
                <form onSubmit={handleSubscribe} className="mt-5">
                  <label htmlFor="newsletter-email" className="text-xs font-semibold text-navy-300">
                    Get product updates and dairy insights
                  </label>
                  <div className="mt-2 flex overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur transition-colors focus-within:border-splash/70">
                    <input
                      id="newsletter-email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="min-h-11 w-full bg-transparent px-4 text-sm font-medium text-white placeholder:text-navy-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      aria-label="Subscribe to the newsletter"
                      className="group grid min-h-11 w-12 shrink-0 place-items-center bg-linear-to-r from-navy-600 to-splash text-white transition-all duration-300 hover:from-navy-500 hover:to-navy-400"
                    >
                      <Send className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>
                </form>
              )}
            </Reveal>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs font-medium text-navy-400 sm:flex-row">
            <p>© 2026 Milk Nest. All rights reserved.</p>
            <p>
              Made with <span aria-hidden="true">🌱</span>
              <span className="sr-only">care</span> for dairy farmers.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
