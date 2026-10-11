/**
 * Decorative background layers: a faint grid, organic blobs, drifting particles and
 * the footer's wave. All layers are aria-hidden and pointer-events-none so they never
 * interfere with content or assistive tech. They use -z-10, so the section that holds
 * them must create a stacking context (Chapter does, with `isolate`).
 */

/** Faint blueprint grid, faded out at the edges. */
export function GridOverlay({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-line)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)] ${className}`}
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
export function Blob({ className = "", tone = "bg-haze/40" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -z-10 rounded-full blur-3xl ${tone} ${className}`}
    />
  );
}

/*
 * Three wave layers, back to front. Every path is two identical periods wide (2880
 * units), and its layer slides sideways by exactly half its own width - one period -
 * so the loop has no seam. Different speeds and directions keep the surface from ever
 * repeating visibly. The front layer is the footer's own colour, so the footer appears
 * to rise out of the wave.
 */
const WAVES = [
  {
    d: "M0,70 C360,10 1080,130 1440,70 C1800,10 2520,130 2880,70 L2880,120 L0,120 Z",
    className: "fill-splash/25 [animation-duration:31s]",
  },
  {
    d: "M0,62 C240,112 480,12 720,62 C960,112 1200,12 1440,62 C1680,112 1920,12 2160,62 C2400,112 2640,12 2880,62 L2880,120 L0,120 Z",
    className: "fill-navy-700/45 [animation-direction:reverse] [animation-duration:23s]",
  },
  {
    d: "M0,84 C360,44 1080,124 1440,84 C1800,44 2520,124 2880,84 L2880,120 L0,120 Z",
    className: "fill-page [animation-duration:17s]",
  },
];

/**
 * Slowly flowing milk wave that closes the page above the footer. It is positioned
 * above the footer's top edge, so the waves wash over the bottom of whatever section
 * comes before it (the parent must be `relative`) instead of taking a strip of their
 * own - a strip would show the page colour, a white band in the light theme.
 */
export function WaveDivider({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 bottom-[calc(100%-1px)] z-10 h-[70px] w-full overflow-hidden sm:h-[100px] lg:h-[130px] ${className}`}
    >
      {WAVES.map((wave) => (
        <svg
          key={wave.d}
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
          className={`absolute bottom-0 left-0 h-full w-[200%] min-w-[1800px] animate-wave ${wave.className}`}
        >
          <path d={wave.d} />
        </svg>
      ))}
    </div>
  );
}
