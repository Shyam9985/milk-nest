import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { Check } from "lucide-react";
import { Blob } from "../../components/graphics/Backdrop";
import Chapter from "../../components/layout/Chapter";
import Reveal from "../../components/ui/Reveal";
import SectionHeading from "../../components/ui/SectionHeading";
import { EASE_OUT, SPRING, STAGGER } from "../../config/motion";
import { howItHelps } from "../../content/how-it-helps";
import useMediaQuery from "../../hooks/useMediaQuery";

/*
 * How far the connecting line must have drawn (0-1) before each step counts as reached.
 * On desktop the steps sit side by side along the curve, so the line reaches them at
 * about a sixth, a half and five sixths of its length. Stacked on smaller screens, the
 * line runs down the side and passes them roughly a third of the way apart.
 */
const DESKTOP_REACHED_AT = [0.13, 0.5, 0.87];
const STACKED_REACHED_AT = [0.04, 0.36, 0.66];

/** Curved connector across the three steps, drawn as the section scrolls in. */
function DesktopPath({ drawn }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 140"
      fill="none"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-10 hidden h-32 w-full lg:block"
    >
      <path
        d="M60 100 C 260 20, 420 20, 600 70 C 780 120, 940 120, 1140 40"
        stroke="var(--color-line-strong)"
        strokeWidth="2.5"
        strokeDasharray="8 10"
      />
      <motion.path
        d="M60 100 C 260 20, 420 20, 600 70 C 780 120, 940 120, 1140 40"
        stroke="url(#path-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ pathLength: drawn }}
      />
      <defs>
        <linearGradient id="path-gradient" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-navy-300)" />
          <stop offset="50%" stopColor="var(--color-splash)" />
          <stop offset="100%" stopColor="var(--color-navy-700)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * One step. Until the line reaches it, it waits dimmed and slightly lowered; once
 * reached, the icon pops, the card rises, and the checkmarks tick in one after another.
 * The moving parts are wrappers of their own: the icon tile and the card keep their CSS
 * hover transitions, which must not sit on an element framer-motion is also moving.
 */
function Step({ step, index, reached, reduceMotion }) {
  return (
    <Reveal as="li" delay={index * STAGGER.loose} className="relative">
      {/* initial={false} on each: start in the waiting pose, don't animate into it on mount */}
      <motion.div
        initial={false}
        animate={{ opacity: reached ? 1 : 0.45 }}
        transition={{ duration: 0.5 }}
        className="group relative flex gap-5 lg:flex-col lg:gap-0"
      >
        {/* Progress dot */}
        <div className="relative z-10 mt-1 lg:mx-auto lg:mt-0">
          <motion.div initial={false} animate={{ scale: reached ? 1 : 0.82 }} transition={SPRING.pop}>
            <span className="relative grid size-[3.7rem] place-items-center rounded-tile bg-linear-to-br from-navy-800 to-navy-600 text-white shadow-glow-navy transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:scale-105 lg:size-16 lg:rounded-card">
              <step.icon className="size-6 lg:size-7" />
              <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-splash text-[10px] font-extrabold text-white ring-2 ring-page">
                {index + 1}
              </span>
            </span>
          </motion.div>
          {reached && !reduceMotion ? (
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 animate-pulse-ring rounded-tile bg-splash/40 lg:rounded-card"
            />
          ) : null}
        </div>

        {/* Card */}
        <motion.div
          initial={false}
          animate={{ y: reached ? 0 : 14 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="flex-1 lg:mt-6"
        >
          <div
            className={`h-full rounded-card border bg-surface/75 p-6 shadow-glass backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-lift lg:text-center ${
              reached ? "border-splash/45" : "border-edge/70"
            }`}
          >
            <p className="text-eyebrow font-extrabold uppercase text-splash">Step {step.number}</p>
            <h3 className="mt-1.5 text-title">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            <ul className="mt-4 space-y-2 lg:inline-block lg:text-left">
              {step.points.map((point, pointIndex) => (
                <li key={point} className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                  <span className="grid size-4.5 shrink-0 place-items-center rounded-full bg-surface-strong text-ink-soft">
                    <motion.span
                      initial={false}
                      animate={{ scale: reached ? 1 : 0, opacity: reached ? 1 : 0 }}
                      transition={{ ...SPRING.pop, delay: reached ? 0.2 + pointIndex * 0.13 : 0 }}
                      className="grid place-items-center"
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </motion.span>
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </Reveal>
  );
}

/** Chapter 04: the three steps, lit one after another as the line reaches them. */
export default function HowItHelps() {
  const reduceMotion = useReducedMotion();
  const sideBySide = useMediaQuery("(min-width: 1024px)");
  const trackRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 75%", "end 55%"],
  });

  /* One eased value drives the line AND decides which steps are lit, so a step never
     lights up ahead of the line that is supposed to be reaching it. */
  const drawn = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });

  const reachedAt = sideBySide ? DESKTOP_REACHED_AT : STACKED_REACHED_AT;
  const countReached = (value) => reachedAt.filter((mark) => value >= mark).length;
  const [reachedCount, setReachedCount] = useState(0);

  useMotionValueEvent(drawn, "change", (value) => setReachedCount(countReached(value)));

  /* Also work it out when nothing is moving: on first render (the page may open already
     scrolled here) and when the layout flips between stacked and side by side. */
  useEffect(() => {
    setReachedCount(countReached(drawn.get()));
  }, [sideBySide]);

  return (
    <Chapter
      id="how-it-helps"
      backdrop={<Blob className="right-[-10rem] top-16 size-[24rem]" tone="bg-haze/50" />}
    >
      <SectionHeading title={howItHelps.headline} emphasis={howItHelps.emphasis} />

      <div ref={trackRef} className="relative mt-12 lg:mt-20">
        {reduceMotion ? null : <DesktopPath drawn={drawn} />}

        {/* Mobile/tablet vertical spine, and the part of it already travelled */}
        <div
          aria-hidden="true"
          className="absolute bottom-10 left-[1.85rem] top-4 w-0.5 bg-linear-to-b from-navy-300 via-splash to-navy-600 opacity-25 lg:hidden"
        />
        {reduceMotion ? null : (
          <motion.div
            aria-hidden="true"
            style={{ scaleY: drawn }}
            className="absolute bottom-10 left-[1.85rem] top-4 w-0.5 origin-top bg-linear-to-b from-navy-300 via-splash to-navy-600 lg:hidden"
          />
        )}

        <ol className="relative grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8">
          {howItHelps.steps.map((step, index) => (
            <Step
              key={step.title}
              step={step}
              index={index}
              reached={reduceMotion || index < reachedCount}
              reduceMotion={reduceMotion}
            />
          ))}
        </ol>
      </div>
    </Chapter>
  );
}
