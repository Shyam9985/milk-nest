import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { chapterById, chapters } from "../../config/chapters";
import { EASE_OUT, SPRING } from "../../config/motion";
import useActiveSection from "../../hooks/useActiveSection";
import useMediaQuery from "../../hooks/useMediaQuery";
import BrandMark from "../ui/BrandMark";

const JUSTIFY = { left: "justify-start", center: "justify-center", right: "justify-end" };

/**
 * The one call to action that travels with the visitor: a pill fixed to the bottom
 * edge that slides to a new spot as each chapter arrives (config/chapters.js decides
 * where) and steps aside on the contact chapter itself. On phones it stays centred.
 * It takes the active chapter's tone, so it always sits on a matching glass.
 */
export default function FloatingCta() {
  const active = useActiveSection();
  const wide = useMediaQuery("(min-width: 640px)");
  const reduceMotion = useReducedMotion();

  const chapter = chapterById[active] ?? chapters[0];
  const side = wide ? chapter.cta : chapter.cta === "hidden" ? "hidden" : "center";

  return (
    <div
      data-tone={chapter.tone}
      /* the extra right padding keeps the pill clear of the back-to-top button in that corner */
      className={`pointer-events-none fixed inset-x-0 bottom-5 z-40 flex px-4 sm:pl-8 sm:pr-24 ${
        JUSTIFY[side] ?? "justify-center"
      }`}
    >
      <AnimatePresence>
        {side !== "hidden" ? (
          <motion.a
            key="cta"
            href="#contact"
            layout={reduceMotion ? false : "position"}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.4, ease: EASE_OUT, layout: { type: "spring", ...SPRING.snappy, damping: 34 } }}
            className="group pointer-events-auto flex items-center gap-1.5 rounded-full border border-edge/60 bg-surface/80 p-1.5 pr-1.5 shadow-lift backdrop-blur-xl"
          >
            <BrandMark showWordmark={false} className="pl-0.5" />
            <span className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-navy-800 via-navy-600 to-splash bg-[length:200%_auto] px-5 py-2.5 text-sm font-bold text-white shadow-glow-navy transition-[background-position] duration-500 group-hover:bg-right">
              Contact Us
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </motion.a>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
