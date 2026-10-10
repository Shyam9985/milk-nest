import { motion, useReducedMotion } from "framer-motion";
import { GridOverlay } from "../../components/graphics/Backdrop";
import Chapter from "../../components/layout/Chapter";
import MaskedText from "../../components/ui/MaskedText";
import Reveal from "../../components/ui/Reveal";
import { EASE_OUT, STAGGER } from "../../config/motion";
import { problem } from "../../content/problem";

/*
 * The pile of paper beside the words: the records as they are kept today. Purely
 * visual - no figures, no words - just ruled pages, a pinned sticky note and a torn
 * slip, each carrying a few handwritten strokes that draw themselves in.
 *
 * Positions are percentages of the pile box. The last two pieces are left out on
 * phones, where the box is shorter.
 */
const PAPERS = [
  { kind: "page", left: "2%", top: "4%", width: "15rem", rotate: -7, strokes: [92, 68, 84], float: "animate-float-slow" },
  { kind: "sticky", left: "60%", top: "0%", width: "10.5rem", rotate: 6, strokes: [80, 55], float: "animate-float-delayed" },
  { kind: "page", left: "36%", top: "40%", width: "14rem", rotate: 3, strokes: [88, 60], float: "animate-float" },
  { kind: "slip", left: "4%", top: "70%", width: "13rem", rotate: -4, strokes: [90], float: "animate-float-delayed", desktopOnly: true },
  { kind: "page", left: "62%", top: "62%", width: "12rem", rotate: 9, strokes: [76, 90], float: "animate-float-slow", desktopOnly: true },
];

/* Ruled lines for the notebook pages, one per stroke row (0.75rem stroke + 1rem gap). */
const RULED =
  "bg-[repeating-linear-gradient(transparent,transparent_1.75rem,var(--color-line)_1.75rem,var(--color-line)_calc(1.75rem+1px))] bg-[position:0_0.6rem]";

/** One line of "handwriting": a wavy stroke that draws itself the first time it is seen. */
function Stroke({ width, delay }) {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 200 16"
      preserveAspectRatio="none"
      style={{ width: `${width}%` }}
      className="block h-3 overflow-visible"
    >
      <motion.path
        d="M2 9 C 12 1, 22 15, 32 9 S 52 1, 62 9 S 82 15, 92 9 S 112 1, 122 9 S 142 15, 152 9 S 172 1, 182 9 S 194 13, 198 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={reduceMotion ? false : { pathLength: 0, opacity: 0.3 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1, delay, ease: EASE_OUT }}
      />
    </svg>
  );
}

/** The face of one piece of paper, by kind. */
function PaperFace({ paper, index }) {
  const strokes = (className) => (
    <div className={`space-y-4 ${className}`}>
      {paper.strokes.map((width, row) => (
        <Stroke key={row} width={width} delay={0.5 + index * 0.18 + row * 0.22} />
      ))}
    </div>
  );

  if (paper.kind === "sticky") {
    return (
      <div className="relative rounded-sm bg-dawn/85 px-4 pb-5 pt-6 shadow-lift">
        {/* the pin */}
        <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-navy-800 shadow-md ring-2 ring-dawn/80" />
        {strokes("text-navy-900/70")}
      </div>
    );
  }

  if (paper.kind === "slip") {
    return (
      <div className="rounded-sm border border-dashed border-line-strong bg-surface/80 px-4 py-4 shadow-glass backdrop-blur">
        {strokes("text-ink-soft/80")}
      </div>
    );
  }

  return (
    <div className={`rounded-md border border-line bg-surface/85 px-4 pb-5 pt-3 shadow-glass backdrop-blur ${RULED}`}>
      {/* a heading, as a bar */}
      <span className="mb-4 block h-1.5 w-16 rounded-full bg-muted/50" />
      {strokes("text-ink-soft/80")}
    </div>
  );
}

/** The records as they are kept today: a loose pile of pages, notes and slips. */
function PaperPile() {
  return (
    <div aria-hidden="true" className="relative h-[14rem] w-full max-w-md sm:h-[22rem] lg:h-[26rem] lg:max-w-none">
      {PAPERS.map((paper, index) => (
        <Reveal
          key={index}
          from="scale"
          delay={0.15 + index * STAGGER.base}
          amount={0.3}
          style={{ left: paper.left, top: paper.top, width: paper.width }}
          className={`absolute ${paper.desktopOnly ? "hidden lg:block" : ""}`}
        >
          {/* the float animation owns the outer transform, so the tilt lives on the inner element */}
          <div className={paper.float} style={{ animationDelay: `${index * -1.9}s` }}>
            <div style={{ transform: `rotate(${paper.rotate}deg)` }}>
              <PaperFace paper={paper} index={index} />
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/**
 * Chapter 01: a short, quiet statement between the hero and the product, with the
 * scattered paper it describes piled beside it. Smaller type and less height than the
 * chapters around it on purpose - it sets up the story, it is not the story.
 */
export default function Problem() {
  return (
    <Chapter
      id="problem"
      fullHeight={false}
      backdrop={<GridOverlay />}
      className="py-20 sm:py-24 lg:py-28"
      innerClassName="justify-center"
    >
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <MaskedText as="h2" text={problem.headline} emphasis={problem.emphasis} className="text-headline" />
          <Reveal as="p" delay={0.3} className="mt-6 max-w-xl text-lead text-muted">
            {problem.lead}
          </Reveal>
          <Reveal as="p" delay={0.45} className="mt-5 max-w-xl font-display text-title text-ink">
            {problem.aside}
          </Reveal>
        </div>

        <div className="flex justify-center lg:col-span-5 lg:justify-end">
          <PaperPile />
        </div>
      </div>
    </Chapter>
  );
}
