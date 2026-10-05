import { services } from "../data/content";

/* The list is short, so each strip repeats it: a strip narrower than the screen would
   leave a visible gap every time the loop wraps on a wide monitor. */
const REPEATS = 2;
const stripItems = Array.from({ length: REPEATS }, (_, repeat) =>
  services.map((service) => ({ ...service, key: `${repeat}-${service.title}` }))
).flat();

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
 * Infinite ticker of service areas between the hero and services sections.
 * The track holds two copies and slides by -50%; under reduced motion the
 * global CSS freezes the animation and only the first copy shows.
 */
export default function Marquee() {
  return (
    <section
      aria-label={`Milk Nest covers ${services.map((service) => service.title).join(", ")}`}
      className="relative border-y border-line bg-surface/70 py-4 backdrop-blur"
    >
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee">
          <Strip />
          <Strip hidden />
        </div>
      </div>
    </section>
  );
}
