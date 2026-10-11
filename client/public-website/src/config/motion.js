/**
 * Motion vocabulary shared by every animated component. One easing, a few durations
 * and a few springs: using these instead of ad-hoc numbers is what makes the whole
 * site move as one thing. The CSS side of the same vocabulary is in styles/tokens.css
 * (--ease-out-brand) and styles/animations.css.
 */

/* the brand curve: quick out of the gate, long gentle settle */
export const EASE_OUT = [0.16, 1, 0.3, 1];

export const DURATION = Object.freeze({
  base: 0.6,
  reveal: 0.85,
  slow: 1.1,
});

export const SPRING = Object.freeze({
  /* pointer-following parallax: slow and heavy */
  drift: { stiffness: 60, damping: 18 },
  /* small UI that should feel crisp (pills, switches) */
  snappy: { stiffness: 380, damping: 32 },
  /* checkmarks and badges popping in */
  pop: { type: "spring", stiffness: 420, damping: 24 },
});

/* the stagger between siblings revealed one after another */
export const STAGGER = Object.freeze({ tight: 0.05, base: 0.09, loose: 0.14 });
