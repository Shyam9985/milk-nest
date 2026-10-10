import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DURATION, EASE_OUT, STAGGER } from "../../config/motion";

const container = (stagger, delay) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

const word = {
  hidden: { y: "115%", rotate: 5 },
  show: { y: 0, rotate: 0, transition: { duration: DURATION.reveal, ease: EASE_OUT } },
};

/* Which words of `text` fall inside the `emphasis` phrase, by character position. */
const emphasisedWords = (text, emphasis) => {
  if (!emphasis) return new Set();
  const start = text.indexOf(emphasis);
  if (start === -1) return new Set();
  const end = start + emphasis.length;
  const marked = new Set();
  let offset = 0;
  text.split(" ").forEach((value, index) => {
    const wordEnd = offset + value.length;
    if (offset < end && wordEnd > start) marked.add(index);
    offset = wordEnd + 1;
  });
  return marked;
};

/**
 * Text that rises into place from behind a mask, word after word, the first time it
 * scrolls into view. Each word sits in its own clipped box and slides up through it.
 * `emphasis` names a phrase inside the text to set in italics - the display serif's
 * italic is the site's accent.
 *
 * The words are separate elements, so the real sentence is given to assistive tech
 * through aria-label. Under reduced motion it is rendered as ordinary text.
 */
export default function MaskedText({ as = "h2", text, emphasis, className, delay = 0, amount = 0.6 }) {
  const reduceMotion = useReducedMotion();
  const Tag = motion[as] ?? motion.h2;
  const words = text.split(" ");
  const marked = emphasisedWords(text, emphasis);

  if (reduceMotion) {
    const Plain = as;
    return (
      <Plain className={className}>
        {words.map((value, index) => (
          <Fragment key={`${value}-${index}`}>
            {marked.has(index) ? <em>{value}</em> : value}
            {index < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </Plain>
    );
  }

  return (
    <Tag
      className={className}
      aria-label={text}
      variants={container(STAGGER.tight, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {words.map((value, index) => (
        <Fragment key={`${value}-${index}`}>
          {/* the padding/negative margin pair keeps descenders (g, y) inside the clip box */}
          <span
            aria-hidden="true"
            className="-mb-[0.16em] inline-block overflow-hidden pb-[0.16em] align-bottom"
          >
            <motion.span
              variants={word}
              className={`inline-block origin-bottom-left will-change-transform ${
                marked.has(index) ? "italic" : ""
              }`}
            >
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
