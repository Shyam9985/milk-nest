/**
 * Decorative background layers: animated mesh gradients, organic blobs, a
 * faint grid, and drifting particles. All layers are aria-hidden and
 * pointer-events-none so they never interfere with content or assistive tech.
 */

/** Soft animated mesh gradient — the base wash behind light sections. */
export function MeshBackdrop({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
    >
      <div className="absolute -top-40 -left-32 size-[36rem] animate-drift rounded-full bg-[radial-gradient(circle_at_center,var(--color-navy-200),transparent_65%)] opacity-70 blur-3xl" />
      <div className="absolute -top-24 right-[-12rem] size-[34rem] animate-drift-slow rounded-full bg-[radial-gradient(circle_at_center,var(--color-navy-300),transparent_65%)] opacity-50 blur-3xl" />
      <div className="absolute bottom-[-16rem] left-1/3 size-[40rem] animate-drift rounded-full bg-[radial-gradient(circle_at_center,var(--color-navy-50),transparent_70%)] opacity-90 blur-3xl" />
      <div className="absolute inset-0 bg-noise opacity-[0.035] mix-blend-multiply" />
    </div>
  );
}

/** Faint blueprint grid, faded out at the edges. */
export function GridOverlay({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(15_34_71/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(15_34_71/0.05)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)] ${className}`}
    />
  );
}

/* Fixed offsets keep particles deterministic across renders. */
const PARTICLES = [
  { left: "8%", size: 6, delay: "0s", duration: "16s", tone: "bg-navy-300/40" },
  { left: "22%", size: 4, delay: "2.4s", duration: "13s", tone: "bg-splash/35" },
  { left: "37%", size: 8, delay: "5.1s", duration: "18s", tone: "bg-navy-200/50" },
  { left: "51%", size: 5, delay: "1.2s", duration: "15s", tone: "bg-splash/30" },
  { left: "66%", size: 7, delay: "3.8s", duration: "19s", tone: "bg-navy-400/30" },
  { left: "78%", size: 4, delay: "6.4s", duration: "14s", tone: "bg-navy-300/35" },
  { left: "91%", size: 6, delay: "0.8s", duration: "17s", tone: "bg-splash/25" },
];

/** Slow-rising dust motes. */
export function Particles({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
    >
      {PARTICLES.map((particle) => (
        <span
          key={particle.left}
          className={`absolute bottom-0 animate-rise rounded-full blur-[1px] ${particle.tone}`}
          style={{
            left: particle.left,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </div>
  );
}

/** Single positioned blur blob, for accenting individual sections. */
export function Blob({ className = "", tone = "bg-navy-200/40" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -z-10 rounded-full blur-3xl ${tone} ${className}`}
    />
  );
}

/** Curved SVG divider used between light and dark sections. */
export function CurveDivider({ className = "", fill = "fill-navy-950", flip = false }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none w-full leading-none ${className}`}>
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={`block h-[60px] w-full sm:h-[90px] lg:h-[120px] ${fill} ${
          flip ? "rotate-180" : ""
        }`}
      >
        <path d="M0,64 C240,120 480,8 720,32 C960,56 1200,120 1440,72 L1440,120 L0,120 Z" />
      </svg>
    </div>
  );
}
