import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DURATION, EASE_OUT } from "../../config/motion";

/**
 * A live figure. When a refresh brings a different value, the new one slides up into
 * place, so a change on screen is noticed instead of silently swapped. The first value
 * it is given just appears - there is nothing it changed from.
 */
export default function LiveValue({ value, children }) {
  const reduceMotion = useReducedMotion();
  const hasShownFirst = useRef(false);

  useEffect(() => {
    hasShownFirst.current = true;
  }, []);

  if (reduceMotion) return children;

  return (
    <motion.span
      key={value}
      initial={hasShownFirst.current ? { opacity: 0, y: 8, filter: "blur(4px)" } : false}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
}
