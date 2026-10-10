import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Building2, ChevronDown, Gauge, ShieldCheck } from "lucide-react";
import heroImage from "../../assets/dairy-hero.png";
import { Particles } from "../../components/graphics/Backdrop";
import CardField from "../../components/graphics/CardField";
import Chapter from "../../components/layout/Chapter";
import MaskedText from "../../components/ui/MaskedText";
import { DURATION, EASE_OUT, STAGGER } from "../../config/motion";
import useMediaQuery from "../../hooks/useMediaQuery";
import { hero } from "../../content/hero";

const BADGE_ICONS = [ShieldCheck, Building2, Gauge];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER.base, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.reveal, ease: EASE_OUT } },
};

/**
 * The opening chapter: the headline over a field of farm records floating in 3D.
 * Copy and the records come from content/hero.js.
 */
export default function Hero() {
  const reduceMotion = useReducedMotion();
  const wide = useMediaQuery("(min-width: 1024px)");
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  /* the copy drifts up and fades as the chapter leaves; the field has its own exit (CardField) */
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const copyOpacity = useTransform(scrollYProgress, [0.1, 0.6], [1, 0]);

  /* The farm itself, full bleed behind the chapter, pushing in very slowly. A wash in the
     page colour keeps the headline readable at the top and thins out lower down, so the
     photo shows through under the floating records; it closes again at the bottom edge
     for a clean hand-over to the next chapter. The wash is built from the page token, so
     it is milk in the light theme and dark in the dark theme. */
  const backdrop = (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <img
          src={heroImage}
          alt=""
          width="1823"
          height="863"
          fetchPriority="high"
          className="size-full animate-kenburns object-cover object-[50%_65%]"
        />
        <div className="absolute inset-0 bg-linear-to-b from-page from-8% via-page/65 via-42% to-page/5 to-82%" />
        <div className="absolute inset-0 bg-linear-to-t from-page to-transparent to-22%" />
        <div className="absolute inset-0 bg-linear-to-r from-page/50 via-transparent to-page/50" />
      </div>
      <Particles />
    </>
  );

  return (
    <Chapter
      id="home"
      ref={sectionRef}
      showLabels={false}
      backdrop={backdrop}
      className="justify-start pb-0 pt-[calc(var(--spacing-header)+1.5rem)]"
      innerClassName="items-center text-center"
    >
      <motion.div
        variants={stagger}
        initial={reduceMotion ? false : "hidden"}
        animate="show"
        style={reduceMotion || !wide ? undefined : { y: copyY, opacity: copyOpacity }}
        className="relative z-10 flex max-w-5xl flex-col items-center"
      >
        <motion.p
          variants={fadeUp}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-1.5 text-eyebrow font-bold uppercase text-ink-soft backdrop-blur"
        >
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-splash" />
            <span className="relative size-2 rounded-full bg-splash" />
          </span>
          {hero.eyebrow}
        </motion.p>

        <MaskedText
          as="h1"
          text={hero.headline}
          emphasis={hero.emphasis}
          delay={0.35}
          amount={0.1}
          className="mt-6 text-display"
        />

        <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lead text-muted">
          {hero.lead}
        </motion.p>

        <motion.ul
          variants={fadeUp}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5"
        >
          {hero.badges.map((badge, index) => {
            const Icon = BADGE_ICONS[index % BADGE_ICONS.length];
            return (
              <li key={badge} className="flex items-center gap-2 text-sm font-semibold text-muted">
                <Icon className="size-4.5 text-splash" />
                {badge}
              </li>
            );
          })}
        </motion.ul>
      </motion.div>

      {/* The field of records. Its height is the rest of the first screen. */}
      <CardField
        records={hero.records}
        progress={scrollYProgress}
        className="mt-8 h-[54vh] min-h-[24rem] w-full max-w-6xl sm:mt-10"
      />

      {/* Scroll indicator */}
      <motion.a
        href="#problem"
        aria-label="Scroll to the next chapter"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="relative z-10 mx-auto mb-5 mt-2 hidden flex-col items-center gap-1 text-muted transition-colors hover:text-ink lg:flex"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">{hero.scrollHint}</span>
        <ChevronDown className="size-4 animate-bounce" />
      </motion.a>
    </Chapter>
  );
}
