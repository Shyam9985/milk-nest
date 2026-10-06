import { motion, useReducedMotion } from "framer-motion";

const offsets = {
  up: { y: 32 },
  down: { y: -28 },
  left: { x: 44 },
  right: { x: -44 },
  scale: { scale: 0.92 },
  /* tipped back and rising, like a card being stood up on its bottom edge */
  flip: { y: 56, rotateX: -34, scale: 0.95 },
  none: {},
};

/* rotateX only reads as depth with a perspective; the hinge is the bottom edge. */
const flipStyle = { transformPerspective: 1100, transformOrigin: "50% 100%" };

/**
 * Scroll-triggered reveal. Falls back to a plain fade-free render when the
 * visitor has asked for reduced motion.
 */
export default function Reveal({
  as = "div",
  from = "up",
  delay = 0,
  duration = 0.7,
  amount = 0.2,
  once = true,
  className,
  children,
  ...rest
}) {
  const reduceMotion = useReducedMotion();
  const Tag = motion[as] ?? motion.div;

  if (reduceMotion) {
    const Plain = as;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }

  return (
    <Tag
      className={className}
      style={from === "flip" ? flipStyle : undefined}
      initial={{ opacity: 0, ...offsets[from] }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1, rotateX: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
