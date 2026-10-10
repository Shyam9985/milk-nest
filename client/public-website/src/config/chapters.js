/**
 * The page, chapter by chapter.
 *
 * This list is the single source of truth for the order of the page, the navigation,
 * the corner labels, each chapter's colour tone and where the floating "Contact Us"
 * pill sits while that chapter is on screen. Adding a chapter means adding an entry
 * here and a section component in src/sections; the header, dot navigation, scroll
 * tracking and the pill all read from this list.
 *
 *   id       anchor and section id (#services)
 *   number   the "Chapter 02" corner label; null hides it
 *   label    the other corner label ("What it covers")
 *   navLabel the menu text; omit `inNav` to keep a chapter out of the menu
 *   tone     palette for the chapter: milk | ink | navy (styles/themes.css). milk follows
 *            the theme; ink and navy are dark in both. The page alternates: milk, ink, milk, navy…
 *   cta      where the floating pill sits on wide screens: left | center | right | hidden
 */
export const chapters = [
  { id: "home", number: null, label: null, navLabel: "Home", inNav: true, tone: "milk", cta: "right" },
  { id: "problem", number: "01", label: "The problem", tone: "ink", cta: "left" },
  { id: "services", number: "02", label: "What it covers", navLabel: "Services", inNav: true, tone: "milk", cta: "right" },
  { id: "why-us", number: "03", label: "Live from the farms", navLabel: "Why Us", inNav: true, tone: "navy", cta: "left" },
  { id: "how-it-helps", number: "04", label: "How it works", navLabel: "How It Helps", inNav: true, tone: "milk", cta: "right" },
  { id: "contact", number: "05", label: "Get in touch", navLabel: "Contact", inNav: true, tone: "navy", cta: "hidden" },
];

export const chapterById = Object.fromEntries(chapters.map((chapter) => [chapter.id, chapter]));

export const chapterIds = chapters.map((chapter) => chapter.id);

export const navItems = chapters
  .filter((chapter) => chapter.inNav)
  .map((chapter) => ({ id: chapter.id, label: chapter.navLabel, href: `#${chapter.id}` }));
