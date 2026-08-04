import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Check } from "lucide-react";
import { steps } from "../data/content";
import { Blob } from "./ui/Backdrop";
import Reveal from "./ui/Reveal";
import { SectionHeading } from "./Services";

/** Curved connector across the three steps, drawn as the section scrolls in. */
function DesktopPath({ progress }) {
  const pathLength = useSpring(progress, { stiffness: 60, damping: 20 });
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 140"
      fill="none"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-10 hidden h-32 w-full lg:block"
    >
      <path
        d="M60 100 C 260 20, 420 20, 600 70 C 780 120, 940 120, 1140 40"
        stroke="var(--color-navy-100)"
        strokeWidth="2.5"
        strokeDasharray="8 10"
      />
      <motion.path
        d="M60 100 C 260 20, 420 20, 600 70 C 780 120, 940 120, 1140 40"
        stroke="url(#path-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ pathLength }}
      />
      <defs>
        <linearGradient id="path-gradient" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-navy-300)" />
          <stop offset="50%" stopColor="var(--color-splash)" />
          <stop offset="100%" stopColor="var(--color-navy-700)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function HowItHelps() {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 75%", "end 55%"],
  });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="how-it-helps" className="relative scroll-mt-24 overflow-hidden py-20 sm:py-24 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-transparent via-navy-50/60 to-transparent"
      />
      <Blob className="right-[-10rem] top-16 size-[24rem]" tone="bg-splash/15" />

      <div className="mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How It Helps"
          title="Three steps from scattered notes to confident decisions"
        />

        <div ref={trackRef} className="relative mt-12 lg:mt-20">
          {reduceMotion ? null : <DesktopPath progress={progress} />}

          {/* Mobile/tablet vertical spine */}
          <div
            aria-hidden="true"
            className="absolute bottom-10 left-[1.85rem] top-4 w-0.5 bg-linear-to-b from-navy-300 via-splash to-navy-600 opacity-25 lg:hidden"
          />

          <ol className="relative grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8">
            {steps.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 0.14} className="relative">
                <div className="group relative flex gap-5 lg:flex-col lg:gap-0">
                  {/* Progress dot */}
                  <div className="relative z-10 mt-1 lg:mx-auto lg:mt-0">
                    <span className="relative grid size-[3.7rem] place-items-center rounded-2xl bg-linear-to-br from-navy-800 to-navy-600 text-white shadow-glow-navy transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:scale-105 lg:size-16 lg:rounded-3xl">
                      <step.icon className="size-6 lg:size-7" />
                      <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-splash text-[10px] font-extrabold text-white ring-2 ring-white">
                        {index + 1}
                      </span>
                    </span>
                    {reduceMotion ? null : (
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 -z-10 animate-pulse-ring rounded-2xl bg-splash/40 lg:rounded-3xl"
                        style={{ animationDelay: `${index * 0.9}s` }}
                      />
                    )}
                  </div>

                  {/* Card */}
                  <div className="flex-1 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-glass backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-lift lg:mt-6 lg:text-center">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-splash">
                      Step {step.number}
                    </p>
                    <h3 className="mt-1.5 text-xl font-extrabold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
                    <ul className="mt-4 space-y-2 lg:inline-block lg:text-left">
                      {step.points.map((point) => (
                        <li key={point} className="flex items-center gap-2 text-sm font-medium text-navy-800">
                          <span className="grid size-4.5 shrink-0 place-items-center rounded-full bg-navy-100 text-navy-700">
                            <Check className="size-3" strokeWidth={3} />
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
