import { Fragment } from "react";
import { ArrowLeft, CalendarDays, Info } from "lucide-react";
import { Link } from "../../app/router";
import { contactDetails } from "../../config/site";
import MaskedText from "../ui/MaskedText";
import Reveal from "../ui/Reveal";

/**
 * The shell for the document pages (privacy policy, terms): one readable column - a
 * title, the date, a short intro, then plain headed sections. The words live in
 * src/content/legal; this file only knows how to lay out their blocks:
 *
 *   { type: "p", text }          a paragraph
 *   { type: "list", items }      bullets
 *   { type: "note", text }       a highlighted callout
 *   { type: "contact" }          the live contact details from config/site.js
 *
 * Text between backticks is set as code.
 */

/* Text between backticks becomes <code>: enough inline markup for storage keys and
   paths without pulling in a markdown parser. */
const renderInline = (text) =>
  text.split(/(`[^`]+`)/).map((part, index) =>
    part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
      <code key={index} className="rounded-md bg-surface-soft px-1.5 py-0.5 font-mono text-[0.88em] text-ink-soft">
        {part.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  );

/** The live contact details, so a document never hard-codes an address that may change per deployment. */
function ContactBlock() {
  return (
    <div className="space-y-4">
      {contactDetails.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {contactDetails.map((detail) => {
            const Wrapper = detail.href ? "a" : "div";
            return (
              <li key={detail.label}>
                <Wrapper
                  {...(detail.href ? { href: detail.href } : {})}
                  className={`flex items-center gap-4 rounded-tile border border-edge/70 bg-surface/70 p-4 shadow-glass backdrop-blur-xl transition-all duration-300 ${
                    detail.href ? "hover:-translate-y-0.5 hover:shadow-lift" : ""
                  }`}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-chip bg-linear-to-br from-navy-700 to-navy-500 text-white shadow-glow-navy">
                    <detail.icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wide text-muted">{detail.label}</span>
                    <span className="block truncate text-base font-bold text-ink">{detail.value}</span>
                  </span>
                </Wrapper>
              </li>
            );
          })}
        </ul>
      ) : null}
      {/* always offered: it is the one channel that exists on every deployment */}
      <p>
        {contactDetails.length > 0 ? "Or use the " : "Use the "}
        <Link
          to="/#contact"
          className="font-semibold text-ink underline decoration-splash/50 underline-offset-4 transition-colors hover:decoration-splash"
        >
          enquiry form
        </Link>{" "}
        on the home page.
      </p>
    </div>
  );
}

function Block({ block }) {
  switch (block.type) {
    case "p":
      return <p>{renderInline(block.text)}</p>;

    case "list":
      return (
        <ul className="list-disc space-y-1.5 pl-5 marker:text-splash">
          {block.items.map((item, index) => (
            <li key={index} className="pl-1">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );

    case "note":
      return (
        <aside
          role="note"
          className="flex gap-3 rounded-tile border border-line border-l-4 border-l-splash bg-surface-soft/60 px-5 py-4 text-ink-soft"
        >
          <Info aria-hidden="true" className="mt-1 size-5 shrink-0 text-splash" />
          <p className="text-[0.95em]">{renderInline(block.text)}</p>
        </aside>
      );

    case "contact":
      return <ContactBlock />;

    default:
      return null;
  }
}

export default function DocumentPage({ eyebrow, title, emphasis, updatedOn, intro, sections = [] }) {
  return (
    <main data-tone="milk" className="relative bg-page pt-header text-ink">
      {/* the extra bottom padding is room for the footer's waves, which wash over this edge */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-36 pt-8 sm:px-6 sm:pt-14 lg:px-8 lg:pb-44">
        <Reveal>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Home
          </Link>
        </Reveal>

        {eyebrow ? (
          <Reveal as="p" delay={0.05} className="mt-8 text-eyebrow font-bold uppercase text-splash">
            {eyebrow}
          </Reveal>
        ) : null}
        <MaskedText as="h1" text={title} emphasis={emphasis} delay={0.1} className="mt-4 text-headline" />
        {updatedOn ? (
          <Reveal as="p" delay={0.25} className="mt-6 flex items-center gap-2 text-sm font-semibold text-muted">
            <CalendarDays aria-hidden="true" className="size-4 text-splash" />
            Last updated {updatedOn}
          </Reveal>
        ) : null}
        {intro ? (
          <Reveal as="p" delay={0.3} className="mt-6 text-lead text-muted">
            {intro}
          </Reveal>
        ) : null}

        <article className="mt-12 space-y-12 border-t border-line pt-12 text-[1.0625rem] leading-relaxed text-muted">
          {sections.map((section) => (
            <Reveal
              as="section"
              key={section.id}
              id={section.id}
              amount={0.1}
              duration={0.6}
              aria-labelledby={section.heading ? `${section.id}-heading` : undefined}
            >
              {section.heading ? (
                <h2 id={`${section.id}-heading`} className="text-title">
                  {section.heading}
                </h2>
              ) : null}
              <div className={`space-y-4 ${section.heading ? "mt-4" : ""}`}>
                {section.body.map((block, index) => (
                  <Block key={index} block={block} />
                ))}
              </div>
            </Reveal>
          ))}
        </article>
      </div>
    </main>
  );
}
