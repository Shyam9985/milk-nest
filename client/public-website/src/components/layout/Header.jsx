import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link, useRoute } from "../../app/router";
import { chapterById, navItems } from "../../config/chapters";
import { EASE_OUT, SPRING } from "../../config/motion";
import useActiveSection from "../../hooks/useActiveSection";
import { lockScroll, unlockScroll } from "../../lib/smoothScroll";
import BrandMark from "../ui/BrandMark";
import FontScaleSwitch from "../ui/FontScaleSwitch";
import ThemeSwitch from "../ui/ThemeSwitch";

/* The document pages, offered at the foot of the phone menu. */
const LEGAL_LINKS = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms & Conditions", to: "/terms" },
];

/**
 * The fixed, floating header. It tucks away while scrolling down and returns on the
 * way up; it takes the tone of the chapter under it, so its glass and text always
 * match the page beneath; and on the document pages (privacy, terms) its menu links
 * point back to the home page's chapters.
 */
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const reduceMotion = useReducedMotion();
  const { path } = useRoute();
  const active = useActiveSection();

  const isHome = path === "/";
  const tone = isHome ? chapterById[active]?.tone : undefined;
  const hrefFor = (item) => (isHome ? item.href : `/${item.href}`);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 16);
      /* Tuck the navbar away while scrolling down, bring it back on scroll up. */
      if (Math.abs(y - lastY.current) > 6) {
        setHidden(y > 420 && y > lastY.current);
        lastY.current = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Lock page scroll while the mobile drawer is open (the smooth scroller has to be told too). */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (menuOpen) lockScroll();
    else unlockScroll();
    return () => {
      document.body.style.overflow = "";
      unlockScroll();
    };
  }, [menuOpen]);

  /* Close the drawer with Escape. */
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  /* Scrolling is released here, not only in the effect above: a menu link has to be able
     to scroll to its section in the same click that closes the menu. */
  const closeMenu = () => {
    unlockScroll();
    setMenuOpen(false);
  };

  const Brand = isHome ? "a" : Link;
  const brandProps = isHome ? { href: "#home" } : { to: "/" };

  return (
    <motion.header
      data-tone={tone}
      initial={reduceMotion ? false : { y: -80, opacity: 0 }}
      animate={{ y: hidden && !menuOpen ? -110 : 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 sm:px-5"
    >
      <div
        className={`mt-3 flex w-full max-w-site items-center justify-between gap-3 rounded-2xl border px-3 transition-all duration-500 sm:px-5 ${
          scrolled
            ? "border-edge/60 bg-surface/70 py-2 shadow-glass backdrop-blur-xl"
            : "border-transparent bg-transparent py-3.5"
        }`}
      >
        <Brand {...brandProps} onClick={closeMenu} aria-label="Milk Nest — home" className="group rounded-xl">
          <BrandMark />
        </Brand>

        {/* Desktop navigation */}
        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const isActive = isHome && active === item.id;
            return (
              <a
                key={item.id}
                href={hrefFor(item)}
                aria-current={isActive ? "page" : undefined}
                className={`group relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                  isActive ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ type: "spring", ...SPRING.snappy }}
                    className="absolute inset-0 -z-10 rounded-full bg-surface-soft ring-1 ring-line"
                  />
                ) : null}
                {item.label}
                {/* Underline hover animation for inactive items */}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-4 -bottom-px h-0.5 origin-left scale-x-0 rounded-full bg-linear-to-r from-navy-500 to-splash transition-transform duration-300 ${
                    isActive ? "" : "group-hover:scale-x-100"
                  }`}
                />
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Preferences (tablet and up; phones get them inside the drawer) */}
          <FontScaleSwitch className="hidden md:inline-flex" />
          <ThemeSwitch className="hidden sm:inline-flex" />

          {/* Animated hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="relative grid size-11 place-items-center rounded-xl border border-ink/10 bg-surface/80 backdrop-blur transition-colors hover:bg-surface lg:hidden"
          >
            <span className="relative block h-3.5 w-5">
              <span
                className={`absolute h-0.5 rounded-full bg-ink-soft transition-all duration-300 ${
                  menuOpen ? "left-1 top-1.5 w-3 rotate-45" : "left-0 top-0 w-full"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-0.5 w-full rounded-full bg-ink-soft transition-all duration-300 ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute h-0.5 rounded-full bg-ink-soft transition-all duration-300 ${
                  menuOpen ? "left-1 top-1.5 w-3 -rotate-45" : "left-0 top-3 w-full"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 -z-10 h-dvh cursor-default bg-navy-950/40 backdrop-blur-sm lg:hidden"
            />
            <motion.nav
              id="mobile-menu"
              aria-label="Mobile navigation"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="absolute inset-x-3 top-[4.75rem] overflow-hidden rounded-2xl border border-edge/60 bg-surface/85 p-3 shadow-lift backdrop-blur-2xl sm:inset-x-5 lg:hidden"
            >
              <ul className="flex flex-col">
                {navItems.map((item, index) => (
                  <motion.li
                    key={item.id}
                    initial={reduceMotion ? false : { opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + index * 0.05, duration: 0.35 }}
                  >
                    <a
                      href={hrefFor(item)}
                      onClick={closeMenu}
                      aria-current={isHome && active === item.id ? "page" : undefined}
                      className={`flex min-h-11 items-center justify-between rounded-xl px-4 py-3 text-base font-semibold transition-colors ${
                        isHome && active === item.id
                          ? "bg-surface-soft text-ink"
                          : "text-ink-soft hover:bg-surface-soft/60"
                      }`}
                    >
                      {item.label}
                      <ArrowRight className="size-4 text-splash" />
                    </a>
                  </motion.li>
                ))}
              </ul>

              {/* Preferences (phones; wider screens have them in the bar) */}
              <div className="mt-1 flex min-h-11 items-center justify-between rounded-xl px-4 py-2 sm:hidden">
                <span className="text-base font-semibold text-ink-soft">Theme</span>
                <ThemeSwitch />
              </div>
              <div className="flex min-h-11 items-center justify-between rounded-xl px-4 py-2 md:hidden">
                <span className="text-base font-semibold text-ink-soft">Text size</span>
                <FontScaleSwitch />
              </div>

              <a
                href={isHome ? "#contact" : "/#contact"}
                onClick={closeMenu}
                className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-navy-800 to-splash px-4 py-3 text-base font-bold text-white shadow-glow-navy"
              >
                Contact Us
                <ArrowRight className="size-4" />
              </a>

              {/* The document pages, so they can be reached from the menu as well as the footer */}
              <div className="mt-3 flex items-center justify-center gap-4 border-t border-line pt-3 text-xs font-semibold text-muted">
                {LEGAL_LINKS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMenu}
                    aria-current={path === item.to ? "page" : undefined}
                    className="transition-colors hover:text-ink aria-[current=page]:text-ink"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
