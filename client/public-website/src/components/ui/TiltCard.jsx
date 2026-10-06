import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

const SPRING = { stiffness: 220, damping: 22, mass: 0.6 };

/**
 * Glass card with pointer-driven 3D tilt, a glow that tracks the cursor, and a
 * ripple on click. Tilt and ripple are skipped under prefers-reduced-motion and
 * on coarse pointers, where they would only cost frames.
 */
export default function TiltCard({
  className = "",
  intensity = 9,
  glow = true,
  spotBorder = false,
  children,
  ...rest
}) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const [ripples, setRipples] = useState([]);

  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);

  const glowBackground = useMotionTemplate`radial-gradient(240px circle at ${glowX}% ${glowY}%, rgb(79 143 209 / 0.28), transparent 68%)`;

  const handlePointerMove = (event) => {
    if (reduceMotion || event.pointerType === "touch" || !ref.current) return;
    const bounds = ref.current.getBoundingClientRect();
    const px = (event.clientX - bounds.left) / bounds.width;
    const py = (event.clientY - bounds.top) / bounds.height;

    rotateY.set((px - 0.5) * intensity * 2);
    rotateX.set((0.5 - py) * intensity * 2);
    glowX.set(px * 100);
    glowY.set(py * 100);
  };

  const handlePointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    glowX.set(50);
    glowY.set(50);
  };

  const handlePointerDown = (event) => {
    if (reduceMotion || !ref.current) return;
    const bounds = ref.current.getBoundingClientRect();
    const id = `${event.clientX}-${event.clientY}-${bounds.top}`;
    const ripple = {
      id,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    setRipples((current) => [...current, ripple]);
    window.setTimeout(
      () => setRipples((current) => current.filter((item) => item.id !== id)),
      650
    );
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      style={reduceMotion ? undefined : { rotateX, rotateY }}
      whileHover={reduceMotion ? undefined : { y: -8, z: 40 }}
      transition={{ type: "spring", ...SPRING }}
      className={`group relative transform-3d overflow-hidden ${className}`}
      data-spot={spotBorder ? "" : undefined}
      {...rest}
    >
      {/* Edge light for a "spotlight grid": the grid that holds the cards writes the
          pointer's position into --spot-x / --spot-y on every card (see WhyUs), so the
          rims nearest the cursor light up together, across card boundaries. */}
      {spotBorder && !reduceMotion ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(300px_circle_at_var(--spot-x,50%)_var(--spot-y,50%),var(--color-splash),transparent_70%)] p-[1.5px] opacity-0 transition-opacity duration-500 mask-ring group-hover/spot:opacity-100"
        />
      ) : null}

      {glow && !reduceMotion ? (
        <motion.span
          aria-hidden="true"
          style={{ background: glowBackground }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
      ) : null}

      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            aria-hidden="true"
            initial={{ opacity: 0.35, scale: 0 }}
            animate={{ opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            style={{ left: ripple.x, top: ripple.y }}
            className="pointer-events-none absolute -ml-32 -mt-32 size-64 rounded-full bg-haze/60"
          />
        ))}
      </AnimatePresence>

      <div className="relative transform-3d">{children}</div>
    </motion.div>
  );
}
