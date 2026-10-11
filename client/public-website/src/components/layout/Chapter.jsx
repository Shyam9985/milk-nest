import { chapterById } from "../../config/chapters";

/**
 * The shell every chapter of the page sits in.
 *
 * It reads the chapter's entry in config/chapters.js and provides:
 *   - the section id the navigation scrolls to
 *   - data-tone, which hands the chapter its own palette (styles/themes.css): every
 *     token-based utility inside - bg-page, text-ink, border-line... - follows it
 *   - the two corner labels ("What it covers" / "Chapter 02")
 *   - a full-height, centred layout with room for the fixed header
 *
 * `backdrop` is for full-bleed decoration (photos, blobs, grids): it is rendered directly
 * in the section, so `absolute inset-0` spans the whole chapter, not just the content
 * column. `fullHeight={false}` makes a shorter interlude instead of a full screen.
 * `className` extends the section; `innerClassName` the centred content column.
 */
export default function Chapter({
  id,
  className = "",
  innerClassName = "",
  showLabels = true,
  fullHeight = true,
  backdrop = null,
  children,
  ...rest
}) {
  const chapter = chapterById[id];
  if (!chapter) throw new Error(`Chapter "${id}" is not listed in config/chapters.js`);

  const hasLabels = showLabels && (chapter.label || chapter.number);

  return (
    <section
      id={id}
      data-tone={chapter.tone}
      data-chapter={id}
      /* `isolate` matters: the decorative layers inside use -z-10, and without a stacking
         context of its own the section would paint its bg-page over them */
      className={`relative isolate flex flex-col justify-center overflow-hidden bg-page pb-20 pt-header text-ink sm:pb-24 ${
        fullHeight ? "min-h-dvh" : ""
      } ${className}`}
      {...rest}
    >
      {backdrop}

      {hasLabels ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto flex w-full max-w-site items-start justify-between px-4 pt-[calc(var(--spacing-header)+0.25rem)] text-eyebrow font-bold uppercase text-muted sm:px-6 lg:px-8">
          <span>{chapter.label}</span>
          {chapter.number ? <span>Chapter {chapter.number}</span> : null}
        </div>
      ) : null}

      {/* with labels in the corners, the content starts below them, so a tall chapter never
          climbs up into its own label row */}
      <div
        className={`relative mx-auto flex w-full max-w-site flex-col px-4 sm:px-6 lg:px-8 ${
          hasLabels ? "pt-10" : ""
        } ${innerClassName}`}
      >
        {children}
      </div>
    </section>
  );
}
