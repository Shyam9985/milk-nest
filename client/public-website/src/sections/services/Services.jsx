import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Blob } from "../../components/graphics/Backdrop";
import Chapter from "../../components/layout/Chapter";
import Reveal from "../../components/ui/Reveal";
import SectionHeading from "../../components/ui/SectionHeading";
import TiltCard from "../../components/ui/TiltCard";
import { DURATION, STAGGER } from "../../config/motion";
import { services } from "../../content/services";

/** One service: the card stands up into place, then its icon draws itself. */
function ServiceCard({ service, index }) {
  const reduceMotion = useReducedMotion();
  const [seen, setSeen] = useState(false);

  return (
    <Reveal
      from="flip"
      duration={DURATION.slow}
      delay={(index % 3) * STAGGER.base}
      className="h-full"
      /* motion-only prop: under reduced motion Reveal renders a plain element */
      {...(reduceMotion ? {} : { onViewportEnter: () => setSeen(true) })}
    >
      <TiltCard className="h-full rounded-card border border-edge/70 bg-surface/70 p-6 shadow-glass backdrop-blur-xl transition-shadow duration-500 hover:shadow-lift">
        {/* Glow border sweep on hover */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-card border-glow opacity-0 transition-opacity duration-500 group-hover:opacity-25"
        />
        {/* Diagonal shine sweep */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-3/4 w-1/2 rotate-12 bg-linear-to-r from-transparent via-white/60 to-transparent opacity-0 transition-all duration-1000 ease-out group-hover:translate-x-[320%] group-hover:opacity-100 dark:via-white/10"
        />

        <span
          className={`relative grid size-13 place-items-center rounded-tile bg-linear-to-br text-white shadow-glow-navy transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${
            service.accent
          } ${seen ? "icon-draw" : ""}`}
          style={{ transform: "translateZ(30px)" }}
        >
          <service.icon className="size-6" />
        </span>

        <h3 className="mt-5 font-sans text-lg font-extrabold tracking-tight" style={{ transform: "translateZ(20px)" }}>
          {service.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{service.text}</p>
      </TiltCard>
    </Reveal>
  );
}

/** Chapter 02: the six areas the product covers. */
export default function Services() {
  return (
    <Chapter
      id="services"
      backdrop={
        <>
          <Blob className="left-[-10rem] top-24 size-[26rem]" tone="bg-haze/50" />
          <Blob className="right-[-12rem] bottom-10 size-[30rem]" tone="bg-haze/40" />
        </>
      }
    >
      <SectionHeading title={services.headline} emphasis={services.emphasis} copy={services.lead} />

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:mt-16 lg:grid-cols-3">
        {services.items.map((service, index) => (
          <ServiceCard key={service.title} service={service} index={index} />
        ))}
      </div>
    </Chapter>
  );
}
