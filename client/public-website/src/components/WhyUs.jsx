import { usePublicStats } from "../contexts/PublicStatsContext";
import { audiences, benefits } from "../data/content";
import { Blob, GridOverlay } from "./ui/Backdrop";
import Counter from "./ui/Counter";
import Reveal from "./ui/Reveal";
import TiltCard from "./ui/TiltCard";
import { SectionHeading } from "./Services";

/* The four figures in the band, read from the live totals (value is undefined until they arrive). */
const buildStats = (stats) => [
  {
    label: "cattle on record",
    value: stats?.active_cattle,
    suffix: "",
    hint: "Every animal with its own profile",
  },
  {
    label: "farm branches",
    value: stats?.branches,
    suffix: "",
    hint: stats
      ? `Across ${stats.dairy_farms.toLocaleString()} dairy ${stats.dairy_farms === 1 ? "farm" : "farms"}`
      : "Single and multi-branch",
  },
  {
    label: "of milk recorded in the last 7 days",
    value: stats?.milk_week,
    suffix: " L",
    hint: "Morning and evening yields",
  },
  {
    label: "of milk recorded this month",
    value: stats?.milk_month,
    suffix: " L",
    hint: "Updated as entries come in",
  },
];

/* Tells every card in the grid where the pointer is, measured from that card's own
   corner. Each card paints its edge light at that point (TiltCard, spotBorder), so one
   glow appears to pass under the gaps between cards. */
const trackSpotlight = (event) => {
  if (event.pointerType === "touch") return;
  for (const card of event.currentTarget.querySelectorAll("[data-spot]")) {
    const bounds = card.getBoundingClientRect();
    card.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
    card.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
  }
};

const LIVE_NOTE = {
  ready: "Live figures from farms running on Milk Nest · refreshed every minute",
  loading: "Loading live figures…",
  error: "Live figures are unavailable right now. Please check back in a moment.",
};

export default function WhyUs() {
  const { stats, status } = usePublicStats();

  return (
    <section id="why-us" className="relative scroll-mt-24 overflow-hidden py-20 sm:py-24 lg:py-28">
      <GridOverlay />
      <Blob className="left-1/2 top-[-8rem] size-[28rem] -translate-x-1/2" tone="bg-haze-soft/70" />

      <div className="mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why Milk Nest"
          title="Built for clarity in daily dairy operations"
          copy="Less manual confusion, more confidence in everyday decisions — that is the whole point."
        />

        {/* Live statistics band (navy in both themes) */}
        <Reveal className="mt-12 lg:mt-16">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-navy-900 via-navy-800 to-navy-950 p-1 shadow-lift dark:ring-1 dark:ring-white/10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 right-0 size-72 rounded-full bg-splash/25 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 left-10 size-72 rounded-full bg-splash/20 blur-3xl"
            />
            {/* A beam of light circling the band's edge: a rotating cone of light, shown
                only through a ring-shaped mask */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl p-[2px] mask-ring"
            >
              <div className="absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 animate-beam bg-[conic-gradient(from_0deg,transparent_0deg,transparent_292deg,var(--color-splash)_338deg,white_354deg,transparent_360deg)]" />
            </div>
            <dl className="relative grid grid-cols-2 gap-px overflow-hidden rounded-[calc(1.5rem-2px)] lg:grid-cols-4">
              {buildStats(stats).map((stat, index) => (
                <Reveal
                  key={stat.label}
                  delay={index * 0.1}
                  className="flex flex-col gap-1 bg-white/[0.04] px-6 py-7 backdrop-blur-sm sm:px-8 sm:py-9"
                >
                  <dd className="order-1 text-3xl font-extrabold text-white sm:text-4xl">
                    {stat.value !== undefined ? (
                      <Counter value={stat.value} suffix={stat.suffix} />
                    ) : status === "loading" ? (
                      <span
                        aria-hidden="true"
                        className="inline-block h-8 w-24 animate-pulse rounded-lg bg-white/15 align-middle"
                      />
                    ) : (
                      "—"
                    )}
                  </dd>
                  <dt className="order-2 text-sm font-semibold text-navy-100">{stat.label}</dt>
                  <p className="order-3 mt-1 text-xs font-medium text-navy-300">{stat.hint}</p>
                </Reveal>
              ))}
            </dl>
          </div>
          <p
            role="status"
            className="mt-3 flex items-center justify-center gap-2 text-center text-xs font-medium text-muted"
          >
            {status === "ready" ? (
              <span aria-hidden="true" className="relative flex size-2 shrink-0">
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-grass-400" />
                <span className="relative size-2 rounded-full bg-grass-400" />
              </span>
            ) : null}
            {LIVE_NOTE[status]}
          </p>
        </Reveal>

        {/* Benefit cards: a spotlight grid - the cards' edges light up around the cursor */}
        <div
          onPointerMove={trackSpotlight}
          className="group/spot mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
        >
          {benefits.map((benefit, index) => (
            <Reveal
              key={benefit.title}
              from={index % 3 === 0 ? "right" : index % 3 === 2 ? "left" : "up"}
              delay={(index % 3) * 0.09}
              className="h-full"
            >
              <TiltCard
                intensity={6}
                spotBorder
                className="h-full rounded-3xl border border-line bg-surface/80 p-6 shadow-glass backdrop-blur-xl transition-shadow duration-500 hover:shadow-lift"
              >
                <div className="flex items-start gap-4">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-soft text-ink-soft ring-1 ring-line transition-transform duration-500 group-hover:scale-110"
                    style={{ transform: "translateZ(24px)" }}
                  >
                    <benefit.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold">{benefit.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{benefit.text}</p>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>

        {/* Audience strip */}
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          {audiences.map((audience, index) => (
            <Reveal key={audience.title} delay={index * 0.1} className="h-full">
              <div className="group flex h-full flex-col rounded-3xl border border-edge/70 bg-linear-to-br from-surface-soft to-surface p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift">
                <span className="grid size-10 place-items-center rounded-xl bg-surface text-ink-soft shadow-sm ring-1 ring-line transition-colors duration-300 group-hover:bg-navy-700 group-hover:text-white">
                  <audience.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-extrabold">{audience.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{audience.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
