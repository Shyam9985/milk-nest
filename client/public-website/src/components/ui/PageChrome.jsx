import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { ArrowUp } from "lucide-react";
import { navItems } from "../../data/content";
import useActiveSection from "../../hooks/useActiveSection";

/** Thin gradient bar along the top edge showing reading progress. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-linear-to-r from-navy-700 via-splash to-navy-400"
    />
  );
}

/** Faint blue halo that follows the cursor. Desktop fine-pointers only. */
export function CursorSpotlight() {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  const x = useMotionValue(-600);
  const y = useMotionValue(-600);
  const background = useMotionTemplate`radial-gradient(360px circle at ${x}px ${y}px, rgb(79 143 209 / 0.07), transparent 70%)`;

  useEffect(() => {
    if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return undefined;
    setEnabled(true);
    const onMove = (event) => {
      x.set(event.clientX);
      y.set(event.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduceMotion, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ background }}
      className="pointer-events-none fixed inset-0 z-30"
    />
  );
}

/** Right-edge dot navigation for wide screens. */
export function DotNav() {
  const active = useActiveSection();

  return (
    <nav
      aria-label="Section navigation"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 xl:flex"
    >
      {navItems.map((item) => {
        const isActive = active === item.id;
        return (
          <a
            key={item.id}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "true" : undefined}
            className="group relative grid size-5 place-items-center"
          >
            <span
              className={`rounded-full transition-all duration-400 ${
                isActive
                  ? "size-2.5 bg-splash ring-4 ring-splash/20"
                  : "size-2 bg-navy-200 group-hover:bg-navy-400"
              }`}
            />
            <span className="pointer-events-none absolute right-7 whitespace-nowrap rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {item.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}

/** Floating back-to-top button, shown after the hero. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          aria-label="Back to top"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.8 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={() =>
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
          }
          className="group fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full border border-white/70 bg-white/80 text-navy-800 shadow-glass backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-navy-800 hover:text-white hover:shadow-glow-navy"
        >
          <ArrowUp className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
