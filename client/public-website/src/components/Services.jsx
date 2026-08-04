import { services } from "../data/content";
import { Blob } from "./ui/Backdrop";
import Reveal from "./ui/Reveal";
import TiltCard from "./ui/TiltCard";

function SectionHeading({ eyebrow, title, copy }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Reveal as="p" className="text-xs font-bold uppercase tracking-[0.2em] text-splash">
        {eyebrow}
      </Reveal>
      <Reveal as="h2" delay={0.08} className="mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
        {title}
      </Reveal>
      {copy ? (
        <Reveal as="p" delay={0.16} className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
          {copy}
        </Reveal>
      ) : null}
    </div>
  );
}

export { SectionHeading };

export default function Services() {
  return (
    <section id="services" className="relative scroll-mt-24 overflow-hidden py-20 sm:py-24 lg:py-28">
      <Blob className="left-[-10rem] top-24 size-[26rem]" tone="bg-navy-200/50" />
      <Blob className="right-[-12rem] bottom-10 size-[30rem]" tone="bg-navy-200/40" />

      <div className="mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Services"
          title="Everything a dairy farm needs to stay organized"
          copy="Eight connected areas of farm operations — recorded once, visible everywhere, from cattle sheds to balance sheets."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:mt-16 xl:grid-cols-4">
          {services.map((service, index) => (
            <Reveal key={service.title} delay={(index % 4) * 0.09} className="h-full">
              <TiltCard className="h-full rounded-3xl border border-white/70 bg-white/70 p-6 shadow-glass backdrop-blur-xl transition-shadow duration-500 hover:shadow-lift">
                {/* Glow border sweep on hover */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-3xl border-glow opacity-0 transition-opacity duration-500 group-hover:opacity-25"
                />
                {/* Diagonal shine sweep */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 -left-3/4 w-1/2 rotate-12 bg-linear-to-r from-transparent via-white/60 to-transparent opacity-0 transition-all duration-1000 ease-out group-hover:translate-x-[320%] group-hover:opacity-100"
                />

                <span
                  className={`relative grid size-13 place-items-center rounded-2xl bg-linear-to-br text-white shadow-glow-navy transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${service.accent}`}
                  style={{ transform: "translateZ(30px)" }}
                >
                  <service.icon className="size-6" />
                </span>

                <h3 className="mt-5 text-lg font-extrabold" style={{ transform: "translateZ(20px)" }}>
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{service.text}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
