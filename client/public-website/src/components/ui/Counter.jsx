import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

/**
 * Counts up to `value` the first time it scrolls into view, and glides to the new
 * figure whenever `value` changes afterwards (live numbers refresh while on screen).
 */
export default function Counter({ value, suffix = "", duration = 1.6, className }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.6 });

  const count = useMotionValue(reduceMotion ? value : 0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    /* No animation wanted: still show the latest figure, just without the count. */
    if (reduceMotion) {
      count.set(value);
      return undefined;
    }
    if (!inView) return undefined;
    const controls = animate(count, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [count, duration, inView, reduceMotion, value]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}
