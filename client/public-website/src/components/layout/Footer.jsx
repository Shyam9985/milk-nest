import { Link, useRoute } from "../../app/router";
import { navItems } from "../../config/chapters";
import { brand, contactDetails } from "../../config/site";
import { Particles, WaveDivider } from "../graphics/Backdrop";
import BrandMark from "../ui/BrandMark";
import Reveal from "../ui/Reveal";
import { socialLinks } from "../ui/SocialIcons";

/* The pages that are not chapters of the home page. Listed twice in the footer: in the
   Legal column and again beside the copyright line, where people look for them first. */
const LEGAL_LINKS = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms & Conditions", to: "/terms" },
];

function LegalLink({ item, path, className }) {
  return (
    <Link
      to={item.to}
      aria-current={path === item.to ? "page" : undefined}
      className={`transition-colors duration-300 hover:text-ink aria-[current=page]:text-ink ${className}`}
    >
      {item.label}
    </Link>
  );
}

const COLUMN_HEADING = "font-sans text-sm font-extrabold uppercase tracking-[0.16em] text-ink";
const COLUMN_LINK =
  "group inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors duration-300 hover:text-ink";
const LINK_DASH =
  "before:h-px before:w-3 before:bg-splash/60 before:transition-all before:duration-300 hover:before:w-5 hover:before:bg-splash";

export default function Footer() {
  const { path } = useRoute();
  const isHome = path === "/";

  return (
    <footer data-tone="ink" className="relative text-ink">
      <WaveDivider />

      <div className="relative overflow-hidden bg-page">
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
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.8fr_1fr]">
            {/* Brand */}
            <Reveal>
              <a href={isHome ? "#home" : "/"} aria-label={`${brand.name} — home`} className="group inline-block">
                {/* Logo glow */}
                <span className="relative inline-block">
                  <span
                    aria-hidden="true"
                    className="absolute -inset-3 rounded-3xl bg-splash/25 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <BrandMark tone="dark" className="relative" />
                </span>
              </a>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
                {brand.tagline} — cattle, milk, health and breeding in one living record, for a
                single farm or many branches.
              </p>
              <ul className="mt-5 flex gap-2.5">
                {socialLinks.map(({ name, Icon, href }) => (
                  <li key={name}>
                    <a
                      href={href}
                      aria-label={`${brand.name} on ${name} (coming soon)`}
                      className="grid size-10 place-items-center rounded-xl border border-line bg-surface/60 text-ink-soft transition-all duration-300 hover:-translate-y-1 hover:border-splash/60 hover:bg-splash/20 hover:text-ink"
                    >
                      <Icon />
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Quick links */}
            <Reveal delay={0.1}>
              <h3 className={COLUMN_HEADING}>Quick Links</h3>
              <ul className="mt-4 space-y-2.5">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <a href={isHome ? item.href : `/${item.href}`} className={`${COLUMN_LINK} ${LINK_DASH}`}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Legal */}
            <Reveal delay={0.15}>
              <h3 className={COLUMN_HEADING}>Legal</h3>
              <ul className="mt-4 space-y-2.5">
                {LEGAL_LINKS.map((item) => (
                  <li key={item.to}>
                    <LegalLink item={item} path={path} className={`${COLUMN_LINK} ${LINK_DASH}`} />
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Contact */}
            <Reveal delay={0.2}>
              <h3 className={COLUMN_HEADING}>Stay in Touch</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted">
                {contactDetails.map((detail) => (
                  <li key={detail.label}>
                    {detail.href ? (
                      <a href={detail.href} className="inline-flex items-center gap-2.5 transition-colors hover:text-ink">
                        <detail.icon className="size-4 text-splash" /> {detail.value}
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2.5">
                        <detail.icon className="size-4 text-splash" /> {detail.value}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* Bottom bar: copyright, the legal links again, and the sign-off */}
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs font-medium text-muted sm:flex-row">
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span>
                © {brand.copyrightYear} {brand.name}. All rights reserved.
              </span>
              {LEGAL_LINKS.map((item) => (
                <LegalLink key={item.to} item={item} path={path} className="underline-offset-4 hover:underline" />
              ))}
            </p>
            <p>{brand.madeBy}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
