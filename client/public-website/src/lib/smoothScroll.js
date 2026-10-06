/**
 * Holds the page's smooth-scroll instance (Lenis, created by useSmoothScroll) so the few
 * components that need to pause or drive scrolling can reach it without a context.
 *
 * It is null whenever smooth scrolling is off - reduced motion, or before the page has
 * mounted - and every helper here then falls back to the browser's own behaviour.
 */

let lenis = null;

export const setLenis = (instance) => {
  lenis = instance;
};

/** Freeze / release page scrolling (used while the mobile menu covers the page). */
export const lockScroll = () => lenis?.stop();
export const unlockScroll = () => lenis?.start();

/** Scroll back to the top of the page. */
export const scrollToTop = ({ instant = false } = {}) => {
  if (lenis) {
    lenis.scrollTo(0, { immediate: instant });
    return;
  }
  window.scrollTo({ top: 0, behavior: instant ? "auto" : "smooth" });
};
