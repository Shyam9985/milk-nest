import { GridOverlay } from "../../components/graphics/Backdrop";
import Chapter from "../../components/layout/Chapter";
import Counter from "../../components/ui/Counter";
import Reveal from "../../components/ui/Reveal";
import SectionHeading from "../../components/ui/SectionHeading";
import TiltCard from "../../components/ui/TiltCard";
import { STAGGER } from "../../config/motion";
import { whyUs } from "../../content/why-us";
import { usePublicStats } from "../../providers/PublicStatsProvider";

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

/** One figure of the live band. */
function Figure({ figure, stats, status, index }) {
  const value = stats ? stats[figure.key] : undefined;
  const hint =
    typeof figure.hint === "function" ? (stats ? figure.hint(stats) : figure.fallbackHint) : figure.hint;

  return (
    <Reveal
      delay={index * STAGGER.base}
      className="flex flex-col gap-1 bg-surface/40 px-6 py-7 backdrop-blur-sm sm:px-8 sm:py-9"
    >
      <dd className="order-1 font-display text-4xl text-ink sm:text-5xl">
        {value !== undefined ? (
          <Counter value={value} suffix={figure.suffix ?? ""} />
        ) : status === "loading" ? (
          <span aria-hidden="true" className="inline-block h-9 w-24 animate-pulse rounded-lg bg-haze-strong/40 align-middle" />
        ) : (
          "—"
        )}
      </dd>
      <dt className="order-2 text-sm font-semibold text-ink-soft">{figure.label}</dt>
      <p className="order-3 mt-1 text-xs font-medium text-muted">{hint}</p>
    </Reveal>
  );
}

/** Chapter 03: the live figures, and the three reasons the product exists. */
export default function WhyUs() {
  const { stats, status } = usePublicStats();

  return (
    <Chapter id="why-us" backdrop={<GridOverlay />}>
      <SectionHeading title={whyUs.headline} emphasis={whyUs.emphasis} copy={whyUs.lead} />

      {/* Live statistics band */}
      <Reveal className="mt-12 lg:mt-16">
        <div className="relative overflow-hidden rounded-card border border-line bg-surface/50 p-px shadow-lift backdrop-blur-xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-0 size-72 rounded-full bg-splash/20 blur-3xl"
          />
          {/* A beam of light circling the band's edge: a rotating cone of light, shown
              only through a ring-shaped mask */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-card p-[1.5px] mask-ring"
          >
            <div className="absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 animate-beam bg-[conic-gradient(from_0deg,transparent_0deg,transparent_292deg,var(--color-splash)_338deg,white_354deg,transparent_360deg)]" />
          </div>
          <dl className="relative grid grid-cols-2 gap-px overflow-hidden rounded-[calc(var(--radius-card)-1px)] lg:grid-cols-4">
            {whyUs.figures.map((figure, index) => (
              <Figure key={figure.key} figure={figure} stats={stats} status={status} index={index} />
            ))}
          </dl>
        </div>
        <p
          role="status"
          className="mt-3 flex items-center justify-center gap-2 text-center text-xs font-medium text-muted"
        >
          {status === "ready" ? (
            <span aria-hidden="true" className="relative flex size-2 shrink-0">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-splash" />
              <span className="relative size-2 rounded-full bg-splash" />
            </span>
          ) : null}
          {whyUs.liveNote[status]}
        </p>
      </Reveal>

      {/* Benefit cards: a spotlight grid - the cards' edges light up around the cursor */}
      <div
        onPointerMove={trackSpotlight}
        className="group/spot mt-14 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3"
      >
        {whyUs.benefits.map((benefit, index) => (
          <Reveal
            key={benefit.title}
            from={index === 0 ? "right" : index === 2 ? "left" : "up"}
            delay={index * STAGGER.base}
            className="h-full"
          >
            <TiltCard
              intensity={6}
              spotBorder
              className="h-full rounded-card border border-line bg-surface/60 p-6 shadow-glass backdrop-blur-xl transition-shadow duration-500 hover:shadow-lift"
            >
              <div className="flex items-start gap-4">
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-tile bg-surface-soft text-splash ring-1 ring-line transition-transform duration-500 group-hover:scale-110"
                  style={{ transform: "translateZ(24px)" }}
                >
                  <benefit.icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-sans text-base font-extrabold tracking-tight">{benefit.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{benefit.text}</p>
                </div>
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </Chapter>
  );
}
