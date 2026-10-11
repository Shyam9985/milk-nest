import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Milk } from "lucide-react";
import { Link } from "../app/router";
import { Blob, GridOverlay, Particles } from "../components/graphics/Backdrop";
import MaskedText from "../components/ui/MaskedText";
import Reveal from "../components/ui/Reveal";
import { DURATION, EASE_OUT } from "../config/motion";

/* The address that was asked for, decoded for reading. A malformed escape is shown as typed. */
const requestedPath = () => {
  const { pathname } = window.location;
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
};

/**
 * The zero of the 404, drawn as a hollow milk drop. Its height is in em, so it keeps
 * pace with the digits either side at every viewport and font-size preference.
 */
function Droplet() {
  return (
    <svg
      viewBox="0 0 64 84"
      aria-hidden="true"
      fill="none"
      className="mx-[0.03em] h-[0.74em] w-auto animate-float-slow"
    >
      <defs>
        <linearGradient id="not-found-drop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="[stop-color:var(--color-navy-400)]" />
          <stop offset="1" className="[stop-color:var(--color-splash)]" />
        </linearGradient>
      </defs>
      <path
        d="M32 6 C32 6 10 36 10 54 a22 22 0 0 0 44 0 C54 36 32 6 32 6 Z"
        stroke="url(#not-found-drop)"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* a catch of light on the inside wall, so the drop reads as liquid rather than a ring */}
      <path
        d="M21 55 a11 11 0 0 0 8 12"
        className="stroke-splash"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

const PRIMARY =
  "group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-linear-to-r from-navy-800 via-navy-600 to-splash bg-[length:200%_auto] px-8 py-3.5 text-base font-bold text-white shadow-glow-navy transition-[background-position] duration-500 hover:bg-right";

const GHOST =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line-strong px-7 py-3.5 text-base font-bold text-ink-soft transition-colors duration-300 hover:border-splash hover:bg-surface-soft hover:text-ink";

/** The page shown for any path the router does not know. */
export default function NotFoundPage() {
  const reduceMotion = useReducedMotion();

  return (
    <main
      data-tone="ink"
      className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-page px-4 pb-20 pt-header text-ink sm:px-6"
    >
      <GridOverlay />
      <Particles />
      <Blob className="-left-32 top-1/4 size-[30rem] animate-drift" tone="bg-haze/50" />
      <Blob className="-right-40 bottom-[-10rem] size-[34rem] animate-drift-slow" tone="bg-navy-700/30" />
      <Blob className="left-1/2 top-[-8rem] size-[22rem] -translate-x-1/2 animate-drift" tone="bg-splash/10" />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: DURATION.slow, ease: EASE_OUT }}
          className="flex flex-col items-center"
        >
          <span
            aria-hidden="true"
            className="grid size-14 animate-float place-items-center rounded-tile bg-linear-to-br from-navy-700 to-navy-500 text-white shadow-glow-navy"
          >
            <Milk className="size-7" />
          </span>
          {/* one image to assistive tech: the digits and the drop are a single figure */}
          <div
            role="img"
            aria-label="Error 404"
            className="mt-6 flex items-center justify-center font-display text-display text-ink"
          >
            <span>4</span>
            <Droplet />
            <span>4</span>
          </div>
        </motion.div>

        <MaskedText
          as="h1"
          text="This page wandered off the farm."
          emphasis="wandered off"
          delay={0.3}
          className="mt-6 text-headline"
        />

        <Reveal as="p" delay={0.5} className="mt-5 max-w-md text-lead text-muted">
          The link may be old, or the address mistyped. Nothing is recorded here.
        </Reveal>

        <Reveal as="p" delay={0.6} className="mt-3 min-w-0 max-w-full truncate font-mono text-xs text-muted">
          Nothing lives at <span className="text-ink-soft">{requestedPath()}</span>
        </Reveal>

        <Reveal delay={0.7} className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link to="/" className={PRIMARY}>
            <ArrowLeft
              aria-hidden="true"
              className="size-4.5 transition-transform duration-300 group-hover:-translate-x-1"
            />
            Back to the farm
          </Link>
          <Link to="/#contact" className={GHOST}>
            Contact us
          </Link>
        </Reveal>
      </div>
    </main>
  );
}
