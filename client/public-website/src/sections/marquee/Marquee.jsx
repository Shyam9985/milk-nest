import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { services } from "../../content/services";

/* The list is short, so each strip repeats it: a strip narrower than the screen would
   leave a visible gap every time the loop wraps on a wide monitor. */
const REPEATS = 2;
const stripItems = Array.from({ length: REPEATS }, (_, repeat) =>
  services.items.map((service) => ({ ...service, key: `${repeat}-${service.title}` }))
).flat();

/* Resting speed, in percent of the track's width per second. The track is two strips
   wide and loops every 50%, so 1.3 means one full pass about every 38 seconds. */
const BASE_SPEED = 1.3;

/* Keeps a value inside [min, max) by wrapping it round, like a clock face. */
const wrap = (min, max, value) => {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
};

/** One copy of the scrolling strip content. */
function Strip({ hidden = false }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className="flex w-max shrink-0 items-center gap-10 pr-10"
    >
      {stripItems.map((service) => (
        <span
          key={service.key}
          className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.14em] text-ink-soft"
        >
          <service.icon className="size-4.5 text-splash" />
          {service.title}
        </span>
      ))}
    </div>
  );
}

/**
 * Infinite ticker of the service areas, between the hero and the first chapter.
 *
 * The track holds two copies of the strip and its position wraps every 50%, so the loop
 * has no seam. It drifts on its own, and scrolling the page pushes it: faster the harder
 * you scroll, leaning into the movement, and turning round when you scroll the other
 * way. Hovering holds it still. Under reduced motion it does not move.
 */
export default function Marquee() {
  const reduceMotion = useReducedMotion();
  const paused = useRef(false);
  const direction = useRef(-1);

  const position = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });

  /* px/second of page scroll -> how many extra multiples of the resting speed to add */
  const boost = useTransform(scrollVelocity, [0, 1000], [0, 4], { clamp: false });
  const skewX = useTransform(scrollVelocity, [-2000, 0, 2000], [7, 0, -7]);
  const x = useTransform(position, (value) => `${wrap(-50, 0, value)}%`);

  useAnimationFrame((_, delta) => {
    if (reduceMotion || paused.current) return;

    /* the small dead zone stops the direction flickering as the push settles back to zero */
    const push = boost.get();
    if (push < -0.05) direction.current = 1;
    else if (push > 0.05) direction.current = -1;

    /* `delta` is the time since the last frame, so the speed is the same at any refresh rate */
    const step = BASE_SPEED * (delta / 1000) * (1 + Math.min(Math.abs(push), 8));
    position.set(position.get() + direction.current * step);
  });

  return (
    <section
      aria-label={`Milk Nest covers ${services.items.map((service) => service.title).join(", ")}`}
      className="relative border-y border-line bg-surface/70 py-4 backdrop-blur"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") paused.current = true;
      }}
      onPointerLeave={() => {
        paused.current = false;
      }}
    >
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <motion.div
          style={reduceMotion ? undefined : { x, skewX }}
          className="flex w-max will-change-transform"
        >
          <Strip />
          <Strip hidden />
        </motion.div>
      </div>
    </section>
  );
}
