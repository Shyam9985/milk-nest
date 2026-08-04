import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

const SPRING = { stiffness: 260, damping: 18, mass: 0.5 };

/**
 * Anchor/button that leans toward the cursor. Purely decorative — the element
 * stays a normal link so keyboard and screen-reader behaviour is untouched.
 */
export default function MagneticButton({
  as = "a",
  strength = 0.28,
  className = "",
  children,
  ...rest
}) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const Tag = motion[as] ?? motion.a;

  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);

  const handlePointerMove = (event) => {
    if (reduceMotion || event.pointerType === "touch" || !ref.current) return;
    const bounds = ref.current.getBoundingClientRect();
    x.set((event.clientX - (bounds.left + bounds.width / 2)) * strength);
    y.set((event.clientY - (bounds.top + bounds.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <Tag
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onBlur={reset}
      style={reduceMotion ? undefined : { x, y }}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}
