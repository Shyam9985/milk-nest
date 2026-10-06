import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

const container = (stagger, delay) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

const word = {
  hidden: { y: "115%", rotate: 5 },
  show: { y: 0, rotate: 0, transition: { duration: 0.85, ease: EASE } },
};

/**
 * Text that rises into place from behind a mask, word after word, the first time it
 * scrolls into view. Each word sits in its own clipped box and slides up through it.
 *
 * The words are separate elements, so the real sentence is given to assistive tech
 * through aria-label. Under reduced motion it is rendered as ordinary text.
 */
export default function MaskedText({
  as = "h2",
  text,
  className,
  delay = 0,
  stagger = 0.05,
  amount = 0.7,
}) {
  const reduceMotion = useReducedMotion();
  const Tag = motion[as] ?? motion.h2;

  if (reduceMotion) {
    const Plain = as;
    return <Plain className={className}>{text}</Plain>;
  }

  const words = text.split(" ");

  return (
    <Tag
      className={className}
      aria-label={text}
      variants={container(stagger, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {words.map((value, index) => (
        <Fragment key={`${value}-${index}`}>
          {/* the padding/negative margin pair keeps descenders (g, y) inside the clip box */}
          <span
            aria-hidden="true"
            className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom"
          >
            <motion.span variants={word} className="inline-block origin-bottom-left will-change-transform">
              {value}
            </motion.span>
          </span>
          {/* a real space between the boxes, so lines wrap and centre as plain text would */}
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
