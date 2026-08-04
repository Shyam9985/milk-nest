import { services } from "../data/content";

/** One copy of the scrolling strip content. */
function Strip({ hidden = false }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className="flex w-max shrink-0 items-center gap-10 pr-10"
    >
      {services.map((service) => (
        <span
          key={service.title}
          className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.14em] text-navy-600"
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
      aria-label="Milk Nest covers cattle, milk, sales, attendance, vaccinations, reports, branches, and feed"
      className="relative border-y border-navy-100 bg-white/70 py-4 backdrop-blur"
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
