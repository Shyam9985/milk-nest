import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  Beef,
  Building2,
  ChevronDown,
  Droplets,
  Milk,
  TrendingUp,
} from "lucide-react";
import heroImage from "../assets/dairy-hero.png";
import { formatLitres, usePublicStats } from "../contexts/PublicStatsContext";
import { trustBadges } from "../data/content";
import { GridOverlay, MeshBackdrop, Particles } from "./ui/Backdrop";
import MagneticButton from "./ui/MagneticButton";

const EASE = [0.16, 1, 0.3, 1];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

const toneStyles = {
  soft: "bg-surface-soft text-splash",
  strong: "bg-surface-strong text-ink-soft",
};

/* The badge on the photo says what the numbers around it really are. */
const LIVE_BADGE = {
  ready: { label: "Live farm data", dot: "bg-grass-400", pulse: true },
  loading: { label: "Connecting to live data", dot: "bg-white/70", pulse: true },
  error: { label: "Live data unavailable", dot: "bg-white/50", pulse: false },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* "2026-10-05" -> "Mon". Built from its parts on purpose: new Date("2026-10-05") is
   midnight UTC, which is still the day before in any timezone behind UTC. */
const weekdayOf = (date) => {
  const [year, month, day] = date.split("-").map(Number);
  return WEEKDAYS[new Date(year, month - 1, day).getDay()];
};

const countOf = (value, singular, plural = `${singular}s`) =>
  `${Number(value).toLocaleString()} ${Number(value) === 1 ? singular : plural}`;

/* The three floating cards, written from the live totals (meta is null until they arrive). */
const buildHighlights = (stats) => [
  {
    icon: Milk,
    title: "Milk today",
    meta: stats ? `${formatLitres(stats.milk_today)} L so far` : null,
    tone: "soft",
  },
  {
    icon: Beef,
    title: "Herd on record",
    meta: stats ? countOf(stats.active_cattle, "active animal") : null,
    tone: "strong",
  },
  {
    icon: Building2,
    title: "Farms connected",
    meta: stats
      ? `${countOf(stats.dairy_farms, "farm")} · ${countOf(stats.branches, "branch", "branches")}`
      : null,
    tone: "soft",
  },
];

/** Grey bar that stands in for a figure while it loads. */
function Skeleton({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-pulse rounded bg-haze-soft align-middle ${className}`}
    />
  );
}

const HEADLINE = [
  { text: "Run your dairy farm", gradient: false },
  { text: "with clarity,", gradient: true },
  { text: "not notebooks.", gradient: false },
];

/** Headline revealed word by word; plain text under reduced motion. */
function AnimatedHeadline({ reduceMotion }) {
  const className =
    "mt-5 text-4xl leading-[1.05] font-extrabold sm:text-5xl lg:text-6xl xl:text-[4.25rem]";

  if (reduceMotion) {
    return (
      <h1 className={className}>
        {HEADLINE.map((segment) => (
          <span
            key={segment.text}
            className={
              segment.gradient
                ? "text-gradient bg-linear-to-r from-ink-soft via-splash to-navy-400"
                : undefined
            }
          >
            {segment.text}{" "}
          </span>
        ))}
      </h1>
    );
  }

  let wordIndex = 0;
  return (
    /* Words are margin-spaced spans, so expose the real sentence to AT. */
    <h1 className={className} aria-label={HEADLINE.map((s) => s.text).join(" ")}>
      {HEADLINE.map((segment) =>
        segment.text.split(" ").map((word) => {
          const delay = 0.3 + wordIndex * 0.07;
          wordIndex += 1;
          return (
            <motion.span
              key={`${segment.text}-${word}`}
              aria-hidden="true"
              initial={{ opacity: 0, y: "0.55em", rotateX: -40 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.7, delay, ease: EASE }}
              className={`mr-[0.24em] inline-block will-change-transform ${
                segment.gradient
                  ? "text-gradient animate-aurora bg-linear-to-r from-ink-soft via-splash to-navy-400 bg-[length:200%_auto]"
                  : ""
              }`}
            >
              {word}
            </motion.span>
          );
        })
      )}
    </h1>
  );
}

/* Bar heights shown while the real trend is loading (or could not be loaded). */
const PLACEHOLDER_BARS = [46, 62, 54, 74, 66, 84, 70];

/**
 * Mini bar chart inside the floating dashboard card: litres recorded per day, one bar
 * per day of `trend` ([{ date: "YYYY-MM-DD", total }]). The best day is highlighted.
 */
function DashboardChart({ trend }) {
  if (!trend?.length) {
    return (
      <div aria-hidden="true">
        <div className="flex h-14 items-end gap-1.5 sm:h-24 sm:gap-2">
          {PLACEHOLDER_BARS.map((height, index) => (
            <span
              key={index}
              style={{ height: `${height}%` }}
              className="flex-1 animate-pulse rounded-t-md bg-haze-soft"
            />
          ))}
        </div>
        {/* keeps the card the same height as when the day labels are there */}
        <div className="mt-1.5 h-[13.5px] sm:h-[15px]" />
      </div>
    );
  }

  /* `|| 1` keeps a week with nothing recorded from dividing by zero. */
  const max = Math.max(...trend.map((point) => point.total)) || 1;
  const peakIndex = trend.reduce(
    (best, point, index) => (point.total > trend[best].total ? index : best),
    0
  );
  const summary = trend
    .map((point) => `${weekdayOf(point.date)} ${formatLitres(point.total)} litres`)
    .join(", ");

  return (
    <div
      role="img"
      aria-label={`Milk recorded per day over the last ${trend.length} days: ${summary}`}
    >
      <div className="flex h-14 items-end gap-1.5 sm:h-24 sm:gap-2">
        {trend.map((point, index) => (
          <motion.span
            key={point.date}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.9 + index * 0.08, duration: 0.7, ease: EASE }}
            /* a day with no entries still gets a sliver, so the week reads as seven days */
            style={{ height: `${Math.max((point.total / max) * 100, 4)}%` }}
            className={`flex-1 origin-bottom rounded-t-md transition-[height] duration-700 ${
              index === peakIndex && point.total > 0
                ? "bg-linear-to-t from-navy-600 to-splash"
                : "bg-linear-to-t from-haze to-haze-soft"
            }`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 sm:gap-2">
        {trend.map((point) => (
          <span
            key={point.date}
            className="flex-1 text-center text-[9px] font-semibold text-muted sm:text-[10px]"
          >
            {weekdayOf(point.date)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** The 3D floating scene: photo card + dashboard + notification cards. */
function HeroScene() {
  const reduceMotion = useReducedMotion();
  const sceneRef = useRef(null);
  const { stats, status } = usePublicStats();
  const badge = LIVE_BADGE[status];
  const highlights = buildHighlights(stats);

  const pointerX = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const pointerY = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });

  const rotateY = useTransform(pointerX, [-0.5, 0.5], [-7, 7]);
  const rotateX = useTransform(pointerY, [-0.5, 0.5], [5, -5]);
  const shiftNear = useTransform(pointerX, [-0.5, 0.5], [14, -14]);
  const shiftFar = useTransform(pointerX, [-0.5, 0.5], [-10, 10]);

  const handlePointerMove = (event) => {
    if (reduceMotion || event.pointerType === "touch" || !sceneRef.current) return;
    const bounds = sceneRef.current.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      ref={sceneRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      className="relative mx-auto w-full max-w-xl perspective-distant lg:max-w-none"
    >
      <motion.div
        style={reduceMotion ? undefined : { rotateX, rotateY }}
        className="relative transform-3d"
      >
        {/* Base photo card */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 40, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.35, ease: EASE }}
          className="relative overflow-hidden rounded-3xl shadow-lift ring-1 ring-ink/10"
        >
          <img
            src={heroImage}
            alt="Farmer carrying milk cans through a modern dairy cattle shed at sunrise"
            width="1823"
            height="863"
            fetchPriority="high"
            className="aspect-[16/10] w-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-navy-950/45 via-transparent to-transparent" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 animate-sheen bg-linear-to-r from-transparent via-white/10 to-transparent" />

          {/* Live badge on the photo */}
          <div
            role="status"
            className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md sm:bottom-4 sm:left-4"
          >
            <span className="relative flex size-2">
              {badge.pulse ? (
                <span className={`absolute inset-0 animate-pulse-ring rounded-full ${badge.dot}`} />
              ) : null}
              <span className={`relative size-2 rounded-full ${badge.dot}`} />
            </span>
            {badge.label}
          </div>
        </motion.div>

        {/* Animated connection lines between the photo and floating cards */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 300"
          className="pointer-events-none absolute inset-0 hidden size-full sm:block"
        >
          <motion.path
            d="M330 60 C 300 110, 320 150, 348 180"
            fill="none"
            stroke="url(#hero-line)"
            strokeWidth="1.5"
            strokeDasharray="5 7"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ duration: 1.4, delay: 1.2, ease: "easeOut" }}
          />
          <motion.path
            d="M70 240 C 110 250, 160 240, 205 210"
            fill="none"
            stroke="url(#hero-line)"
            strokeWidth="1.5"
            strokeDasharray="5 7"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ duration: 1.4, delay: 1.45, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="hero-line" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-navy-300)" />
              <stop offset="100%" stopColor="var(--color-splash)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating analytics dashboard */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
          style={reduceMotion ? undefined : { x: shiftNear, translateZ: 70 }}
          className="absolute -bottom-12 -left-1 w-52 animate-float rounded-2xl border border-edge/70 bg-surface/85 p-3.5 shadow-glass backdrop-blur-xl sm:-bottom-10 sm:-left-8 sm:w-72 sm:p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Milk · last 7 days
              </p>
              <p className="text-lg font-extrabold text-ink">
                {stats ? (
                  `${formatLitres(stats.milk_week)} L`
                ) : status === "loading" ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  "—"
                )}
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-surface-soft text-splash">
              <TrendingUp className="size-4.5" />
            </span>
          </div>
          <DashboardChart trend={stats?.trend} />
        </motion.div>

        {/* Floating highlight cards */}
        <div className="absolute -right-1 -top-5 flex w-44 flex-col gap-2 sm:-right-6 sm:-top-8 sm:w-56 sm:gap-2.5">
          {highlights.map((note, index) => (
            <motion.div
              key={note.title}
              initial={reduceMotion ? false : { opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.9 + index * 0.18, ease: EASE }}
              style={reduceMotion ? undefined : { x: shiftFar, translateZ: 50 - index * 15 }}
              className={`flex items-center gap-2.5 rounded-xl border border-edge/70 bg-surface/85 p-2.5 shadow-glass backdrop-blur-xl ${
                index === 1 ? "animate-float-delayed" : "animate-float-slow"
              } ${index === 2 ? "hidden sm:flex" : ""}`}
            >
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${toneStyles[note.tone]}`}>
                <note.icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold text-ink">{note.title}</span>
                <span className="block truncate text-[11px] font-medium text-muted">
                  {note.meta ??
                    (status === "loading" ? <Skeleton className="h-3 w-20" /> : "Unavailable right now")}
                </span>
              </span>
            </motion.div>
          ))}
        </div>

        {/* Droplet accent */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 1.5, ease: EASE }}
          style={reduceMotion ? undefined : { translateZ: 90 }}
          className="absolute -left-4 top-8 hidden animate-float-delayed rounded-2xl border border-edge/70 bg-surface/85 p-3 shadow-glass backdrop-blur-xl sm:block"
        >
          <Droplets className="size-6 text-splash" />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 45]);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative overflow-hidden pb-24 pt-28 sm:pb-28 sm:pt-32 lg:pb-32 lg:pt-40"
    >
      <MeshBackdrop />
      <GridOverlay />
      <Particles />

      {/* Light rays */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[30rem] w-[52rem] -translate-x-1/2 rotate-[8deg] bg-[conic-gradient(from_190deg_at_50%_0%,transparent_42%,rgb(79_143_209/0.14)_48%,transparent_52%,rgb(29_60_123/0.12)_58%,transparent_64%)] blur-2xl"
      />

      <div className="mx-auto grid w-full max-w-site grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-8">
        {/* Copy — below the visual on mobile, left on desktop */}
        <motion.div
          variants={stagger}
          initial={reduceMotion ? false : "hidden"}
          animate="show"
          style={reduceMotion ? undefined : { y: copyY }}
          className="order-2 text-center lg:order-1 lg:text-left"
        >
          <motion.p
            variants={fadeUp}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-ink-soft backdrop-blur lg:mx-0"
          >
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-splash" />
              <span className="relative size-2 rounded-full bg-splash" />
            </span>
            Smart dairy farm management
          </motion.p>

          <AnimatedHeadline reduceMotion={reduceMotion} />

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg lg:mx-0"
          >
            Milk Nest brings cattle records, milk production, health treatments, and breeding
            into one clear view — for single farms and multi-branch operations.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <MagneticButton
              href="#contact"
              className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-navy-800 via-navy-600 to-splash bg-[length:200%_auto] px-8 py-3.5 text-base font-bold text-white shadow-glow-navy transition-[background-position] duration-500 hover:bg-right sm:w-auto"
            >
              Contact Us
              <ArrowRight className="size-4.5 transition-transform duration-300 group-hover:translate-x-1" />
            </MagneticButton>
            <MagneticButton
              href="#services"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-surface/70 px-8 py-3.5 text-base font-bold text-ink-soft backdrop-blur transition-colors duration-300 hover:border-splash hover:bg-surface-soft sm:w-auto"
            >
              View Services
            </MagneticButton>
          </motion.div>

          {/* Trust badges */}
          <motion.ul
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 lg:justify-start"
          >
            {trustBadges.map((badge) => (
              <li
                key={badge.label}
                className="flex items-center gap-2 text-sm font-semibold text-muted"
              >
                <badge.icon className="size-4.5 text-splash" />
                {badge.label}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* 3D scene — first on mobile per the wireframe plan */}
        <motion.div
          style={reduceMotion ? undefined : { y: sceneY }}
          className="order-1 px-2 pb-8 pt-6 sm:px-6 sm:pb-6 lg:order-2 lg:px-0 lg:py-0"
        >
          <HeroScene />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#services"
        aria-label="Scroll to services"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-muted transition-colors hover:text-ink lg:flex"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Scroll</span>
        <ChevronDown className="size-4 animate-bounce" />
      </motion.a>
    </section>
  );
}
