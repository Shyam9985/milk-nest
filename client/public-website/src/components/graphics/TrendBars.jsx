import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "../../config/motion";
import { formatLitres, weekdayOf } from "../../lib/format";

/* Bar heights shown while the real trend is loading (or could not be loaded). */
const PLACEHOLDER_BARS = [46, 62, 54, 74, 66, 84, 70];

/**
 * Mini bar chart of litres recorded per day, one bar per entry of `trend`
 * ([{ date: "YYYY-MM-DD", total }]). The best day is highlighted. Pointing at (or
 * tapping) a bar shows that day's figure and dims the others - a pointer-only extra,
 * since every value is already in the chart's text description.
 */
export default function TrendBars({ trend, startDelay = 0.4, className = "" }) {
  const [activeIndex, setActiveIndex] = useState(null);

  if (!trend?.length) {
    return (
      <div aria-hidden="true" className={className}>
        <div className="flex h-16 items-end gap-1.5 sm:h-20 sm:gap-2">
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
      className={className}
    >
      <div
        className="flex h-16 items-end gap-1.5 sm:h-20 sm:gap-2"
        onPointerLeave={() => setActiveIndex(null)}
      >
        {trend.map((point, index) => {
          /* a day with no entries still gets a sliver, so the week reads as seven days */
          const height = Math.max((point.total / max) * 100, 4);
          const dimmed = activeIndex !== null && activeIndex !== index;

          return (
            <div
              key={point.date}
              className="relative flex h-full flex-1 items-end"
              onPointerEnter={() => setActiveIndex(index)}
              onPointerDown={() => setActiveIndex(index)}
            >
              <AnimatePresence>
                {activeIndex === index ? (
                  <motion.span
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    /* just above the bar, but never outside the chart area */
                    style={{ bottom: `min(calc(${height}% + 4px), calc(100% - 18px))` }}
                    className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold leading-tight text-page shadow-lg"
                  >
                    {formatLitres(point.total)} L
                  </motion.span>
                ) : null}
              </AnimatePresence>
              <motion.span
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: startDelay + index * 0.08, duration: 0.7, ease: EASE_OUT }}
                style={{ height: `${height}%` }}
                className={`w-full origin-bottom rounded-t-md transition-[height,opacity] duration-500 ${
                  index === peakIndex && point.total > 0
                    ? "bg-linear-to-t from-navy-600 to-splash"
                    : "bg-linear-to-t from-haze to-haze-soft"
                } ${dimmed ? "opacity-40" : ""}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5 sm:gap-2">
        {trend.map((point, index) => (
          <span
            key={point.date}
            className={`flex-1 text-center text-[9px] font-semibold transition-colors duration-300 sm:text-[10px] ${
              activeIndex === index ? "text-ink" : "text-muted"
            }`}
          >
            {weekdayOf(point.date)}
          </span>
        ))}
      </div>
    </div>
  );
}
