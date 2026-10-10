import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Award, Beef, Building2, CalendarDays, Droplets, Gauge, TrendingUp } from "lucide-react";
import { DURATION, EASE_OUT, SPRING } from "../../config/motion";
import useMediaQuery from "../../hooks/useMediaQuery";
import { countOf, formatLitres, weekdayOf } from "../../lib/format";
import { usePublicStats } from "../../providers/PublicStatsProvider";
import LiveValue from "../ui/LiveValue";
import Skeleton from "../ui/Skeleton";
import TrendBars from "./TrendBars";

/*
 * The hero's "field of records": summary cards floating at different depths over the
 * page, like paper on a desk seen from above. It is real CSS 3D - every card has a
 * translateZ - so tilting the field with the pointer makes near cards travel further
 * than far ones, and scrolling pushes the whole field back into the distance.
 *
 * The cards are DOM, not a canvas: their text stays sharp at any size and they take the
 * chapter's tokens, so they restyle with the theme. Every figure is an aggregate from the
 * public stats api; the field never shows an individual animal, treatment or calving.
 */

/* The best day of the trend, or null when there is no trend yet. */
const bestDay = (stats) =>
  stats?.trend?.length
    ? stats.trend.reduce((best, point) => (point.total > best.total ? point : best))
    : null;

/*
 * What each kind of card says. `value` is the figure, `meta` the line under it; both
 * read the live stats. The chart kind is drawn separately below.
 */
const KINDS = {
  today: {
    icon: Droplets,
    title: "Milk today",
    value: (s) => `${formatLitres(s.milk_today)} L`,
    meta: () => "recorded so far",
  },
  herd: {
    icon: Beef,
    title: "Herd on record",
    value: (s) => countOf(s.active_cattle, "animal"),
    meta: (s) => `${countOf(s.dairy_farms, "farm")} · ${countOf(s.branches, "branch", "branches")}`,
  },
  month: {
    icon: CalendarDays,
    title: "Milk this month",
    value: (s) => `${formatLitres(s.milk_month)} L`,
    meta: () => "updated as entries come in",
  },
  bestDay: {
    icon: Award,
    title: "Best day · last 7",
    value: (s) => (bestDay(s) ? `${formatLitres(bestDay(s).total)} L` : "—"),
    meta: (s) => (bestDay(s) ? `on ${weekdayOf(bestDay(s).date)}` : ""),
  },
  daily: {
    icon: Gauge,
    title: "Daily average",
    value: (s) => `${formatLitres(s.milk_week / 7)} L`,
    meta: () => "per day, last 7 days",
  },
  branches: {
    icon: Building2,
    title: "Branches reporting",
    value: (s) => countOf(s.branches, "branch", "branches"),
    meta: (s) => `across ${countOf(s.dairy_farms, "dairy farm")}`,
  },
};

const TONE = {
  soft: "bg-surface-soft text-splash",
  strong: "bg-surface-strong text-ink-soft",
  grass: "bg-grass-100 text-grass-600 dark:bg-grass-500/15 dark:text-grass-300",
};

/** One figure from the live stats, with its loading and failure states. */
function Figure({ stats, status, render, skeleton = "h-5 w-16" }) {
  if (stats) {
    const text = render(stats);
    return <LiveValue value={text}>{text}</LiveValue>;
  }
  return status === "loading" ? <Skeleton className={skeleton} /> : "—";
}

/** The face of one card. */
function RecordCard({ record, stats, status }) {
  const tone = TONE[record.tone ?? "soft"];

  if (record.kind === "chart") {
    return (
      <>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Milk · last 7 days</p>
            <p className="text-lg font-extrabold text-ink">
              <Figure stats={stats} status={status} skeleton="h-5 w-20" render={(s) => `${formatLitres(s.milk_week)} L`} />
            </p>
          </div>
          <span className={`grid size-9 place-items-center rounded-tile ${tone}`}>
            <TrendingUp className="size-4.5" />
          </span>
        </div>
        <TrendBars trend={stats?.trend} startDelay={1.4} />
      </>
    );
  }

  const kind = KINDS[record.kind];
  if (!kind) return null;
  const Icon = kind.icon;

  return (
    <div className="flex items-start gap-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-tile ${tone}`}>
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
          {record.title ?? kind.title}
        </span>
        <span className="block text-lg font-extrabold leading-tight text-ink">
          <Figure stats={stats} status={status} render={kind.value} />
        </span>
        <span className="mt-0.5 block text-xs font-medium text-muted">
          {stats ? kind.meta(stats) : status === "loading" ? <Skeleton className="h-3 w-20" /> : "unavailable right now"}
        </span>
      </span>
    </div>
  );
}

/* Depth cue: the further back a card sits, the softer and fainter it is drawn. */
const depthStyle = (z) => {
  if (z >= -60) return {};
  const t = Math.min(1, (-60 - z) / 320); // 0 just behind the surface .. 1 at the back
  return { opacity: 1 - t * 0.35, filter: `blur(${(t * 1.6).toFixed(2)}px)` };
};

/** The field. `progress` is the hero's scroll progress (0 at the top, 1 when it has left). */
export default function CardField({ records, progress, className = "" }) {
  const reduceMotion = useReducedMotion();
  const wide = useMediaQuery("(min-width: 640px)");
  const fieldRef = useRef(null);
  const { stats, status } = usePublicStats();

  /* phones show only the records that have a mobile position, at that position */
  const shown = wide
    ? records
    : records.filter((record) => record.mobile).map((record) => ({ ...record, ...record.mobile, rotateY: 0, rotateX: 0 }));

  const pointerX = useSpring(useMotionValue(0), SPRING.drift);
  const pointerY = useSpring(useMotionValue(0), SPRING.drift);
  const rotateY = useTransform(pointerX, [-0.5, 0.5], [-10, 10]);
  const rotateX = useTransform(pointerY, [-0.5, 0.5], [7, -7]);

  /* on the way out, the whole desk slides away from the viewer and fades */
  const z = useTransform(progress, [0, 1], [0, -520]);
  const y = useTransform(progress, [0, 1], [0, 120]);
  const opacity = useTransform(progress, [0, 0.7], [1, 0]);

  const handlePointerMove = (event) => {
    if (reduceMotion || event.pointerType === "touch" || !fieldRef.current) return;
    const bounds = fieldRef.current.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      ref={fieldRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      className={`relative perspective-[1600px] ${className}`}
    >
      <motion.div
        style={reduceMotion ? undefined : { rotateX, rotateY, z, y, opacity }}
        className="absolute inset-0 transform-3d"
      >
        {shown.map((record, index) => (
          <motion.div
            key={record.id}
            initial={reduceMotion ? false : { opacity: 0, z: record.z - 700 }}
            animate={{ opacity: 1, z: record.z }}
            transition={{ duration: DURATION.slow, delay: 0.55 + index * 0.09, ease: EASE_OUT }}
            style={{
              left: `${record.x}%`,
              top: `${record.y}%`,
              width: record.width,
              rotateY: record.rotateY ?? 0,
              rotateX: record.rotateX ?? 0,
              ...depthStyle(record.z),
            }}
            className="absolute transform-3d"
          >
            <div
              style={{ animationDelay: `${(index % 4) * -1.7}s` }}
              className={`rounded-card border border-edge/70 bg-surface/90 p-3.5 shadow-glass backdrop-blur-xl sm:p-4 ${
                index % 3 === 0 ? "animate-float" : index % 3 === 1 ? "animate-float-slow" : "animate-float-delayed"
              }`}
            >
              <RecordCard record={record} stats={stats} status={status} />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
