import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { navItems } from "../data/content";
import useActiveSection from "../hooks/useActiveSection";
import BrandMark from "./ui/BrandMark";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const active = useActiveSection();
  const reduceMotion = useReducedMotion();

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

  /* Lock body scroll while the mobile drawer is open. */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
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

  const closeMenu = () => setMenuOpen(false);

  return (
    <motion.header
      initial={reduceMotion ? false : { y: -80, opacity: 0 }}
      animate={{ y: hidden && !menuOpen ? -110 : 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 sm:px-5"
    >
      <div
        className={`mt-3 flex w-full max-w-site items-center justify-between gap-3 rounded-2xl border px-3 transition-all duration-500 sm:px-5 ${
          scrolled
            ? "border-white/60 bg-white/70 py-2 shadow-glass backdrop-blur-xl"
            : "border-transparent bg-transparent py-3.5"
        }`}
      >
        <a
          href="#home"
          onClick={closeMenu}
          aria-label="Milk Nest — home"
          className="group rounded-xl"
        >
          <BrandMark />
        </a>

        {/* Desktop navigation */}
        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                  isActive ? "text-navy-800" : "text-muted hover:text-navy-800"
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute inset-0 -z-10 rounded-full bg-navy-50 ring-1 ring-navy-100"
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
          {/* Gradient CTA (desktop / tablet) */}
          <a
            href="#contact"
            className="group relative hidden items-center gap-2 overflow-hidden rounded-full bg-linear-to-r from-navy-800 via-navy-600 to-splash bg-[length:200%_auto] px-5 py-2.5 text-sm font-bold text-white shadow-glow-navy transition-[background-position,transform] duration-500 hover:bg-right hover:-translate-y-0.5 sm:inline-flex"
          >
            Contact Us
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>

          {/* Animated hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="relative grid size-11 place-items-center rounded-xl border border-navy-900/10 bg-white/80 backdrop-blur transition-colors hover:bg-white lg:hidden"
          >
            <span className="relative block h-3.5 w-5">
              <span
                className={`absolute h-0.5 rounded-full bg-navy-800 transition-all duration-300 ${
                  menuOpen ? "left-1 top-1.5 w-3 rotate-45" : "left-0 top-0 w-full"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-0.5 w-full rounded-full bg-navy-800 transition-all duration-300 ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute h-0.5 rounded-full bg-navy-800 transition-all duration-300 ${
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
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-3 top-[4.75rem] overflow-hidden rounded-2xl border border-white/60 bg-white/85 p-3 shadow-lift backdrop-blur-2xl sm:inset-x-5 lg:hidden"
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
                      href={item.href}
                      onClick={closeMenu}
                      aria-current={active === item.id ? "page" : undefined}
                      className={`flex min-h-11 items-center justify-between rounded-xl px-4 py-3 text-base font-semibold transition-colors ${
                        active === item.id
                          ? "bg-navy-50 text-navy-900"
                          : "text-navy-800 hover:bg-navy-50/60"
                      }`}
                    >
                      {item.label}
                      <ArrowRight className="size-4 text-splash" />
                    </a>
                  </motion.li>
                ))}
              </ul>
              <a
                href="#contact"
                onClick={closeMenu}
                className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-navy-800 to-splash px-4 py-3 text-base font-bold text-white shadow-glow-navy"
              >
                Contact Us
                <ArrowRight className="size-4" />
              </a>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
