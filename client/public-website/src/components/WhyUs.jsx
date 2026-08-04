import { audiences, benefits, stats } from "../data/content";
import { Blob, GridOverlay } from "./ui/Backdrop";
import Counter from "./ui/Counter";
import Reveal from "./ui/Reveal";
import TiltCard from "./ui/TiltCard";
import { SectionHeading } from "./Services";

export default function WhyUs() {
  return (
    <section id="why-us" className="relative scroll-mt-24 overflow-hidden py-20 sm:py-24 lg:py-28">
      <GridOverlay />
      <Blob className="left-1/2 top-[-8rem] size-[28rem] -translate-x-1/2" tone="bg-navy-100/70" />

      <div className="mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why Milk Nest"
          title="Built for clarity in daily dairy operations"
          copy="Less manual confusion, more confidence in everyday decisions — that is the whole point."
        />

        {/* Animated statistics band */}
        <Reveal className="mt-12 lg:mt-16">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-navy-900 via-navy-800 to-navy-950 p-1 shadow-lift">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 right-0 size-72 rounded-full bg-splash/25 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 left-10 size-72 rounded-full bg-splash/20 blur-3xl"
            />
            <dl className="relative grid grid-cols-2 gap-px overflow-hidden rounded-[calc(1.5rem-2px)] lg:grid-cols-4">
              {stats.map((stat, index) => (
                <Reveal
                  key={stat.label}
                  delay={index * 0.1}
                  className="flex flex-col gap-1 bg-white/[0.04] px-6 py-7 backdrop-blur-sm sm:px-8 sm:py-9"
                >
                  <dd className="order-1 text-3xl font-extrabold text-white sm:text-4xl">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </dd>
                  <dt className="order-2 text-sm font-semibold text-navy-100">{stat.label}</dt>
                  <p className="order-3 mt-1 text-xs font-medium text-navy-300">{stat.hint}</p>
                </Reveal>
              ))}
            </dl>
          </div>
        </Reveal>

        {/* Benefit cards */}
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
            <Reveal
              key={benefit.title}
              from={index % 3 === 0 ? "right" : index % 3 === 2 ? "left" : "up"}
              delay={(index % 3) * 0.09}
              className="h-full"
            >
              <TiltCard
                intensity={6}
                className="h-full rounded-3xl border border-navy-100 bg-white/80 p-6 shadow-glass backdrop-blur-xl transition-shadow duration-500 hover:shadow-lift"
              >
                <div className="flex items-start gap-4">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-navy-100 transition-transform duration-500 group-hover:scale-110"
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
              <div className="group flex h-full flex-col rounded-3xl border border-white/70 bg-linear-to-br from-navy-50 to-white p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift">
                <span className="grid size-10 place-items-center rounded-xl bg-white text-navy-700 shadow-sm ring-1 ring-navy-100 transition-colors duration-300 group-hover:bg-navy-800 group-hover:text-white">
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
