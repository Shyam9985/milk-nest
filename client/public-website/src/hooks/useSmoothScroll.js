import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { setLenis } from "../lib/smoothScroll";

/**
 * Turns on smooth, slightly weighted wheel scrolling for the whole page.
 *
 * Lenis still scrolls the real page (it only eases the wheel into small steps), so
 * everything that reads the scroll position - framer-motion's useScroll, the header,
 * the section observer - keeps working unchanged. Touch screens keep their native
 * scrolling. `anchors` makes #section links glide instead of jump.
 *
 * Call it once, at the top of the app. It does nothing under reduced motion.
 */
export default function useSmoothScroll() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return undefined;

    const lenis = new Lenis({ autoRaf: true, anchors: true });
    setLenis(lenis);

    return () => {
      setLenis(null);
      lenis.destroy();
    };
  }, [reduceMotion]);
}
