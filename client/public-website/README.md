# Milk Nest — public website

The marketing site for Milk Nest: a single page of full-screen "chapters", plus the
privacy policy, the terms and a 404 page. React 19, Vite 7, Tailwind CSS v4,
framer-motion and Lenis; no router library and no UI kit.

```bash
npm install
cp .env.example .env     # then fill in VITE_SERVER_URL and the contact details
npm run dev              # http://localhost:5173 (the api must allow this origin: PUBLIC_SITE_ORIGIN in the root .env)
npm run build            # production bundle in dist/
```

## How the code is organised

```
public/
  fonts/            self-hosted display serif (Instrument Serif, OFL) — the CSP allows no font CDN
  theme-init.js     applies the saved theme and text size before React loads (no flash)
src/
  main.jsx          mounts <RouterProvider> → <AppProviders> → <App>
  app/
    App.jsx         page shell: header, the routed page, footer, floating controls
    router.jsx      the tiny client-side router (RouterProvider, useRoute, Link)
  config/           facts that steer the site, no UI in here
    chapters.js     THE page outline: order, labels, tone and CTA position of every chapter
    routes.js       the pages and their <title> / description
    site.js         brand name, contact details (from .env), social profiles
    motion.js       the shared easing, durations and springs
    env.js          the only place import.meta.env is read
  content/          every word on the site, one file per chapter (hero.js, services.js…)
  styles/           design tokens and themes — see "Changing the look" below
  providers/        React contexts: ThemeProvider, PreferencesProvider (text size), PublicStatsProvider (live api data)
  hooks/            useActiveSection, useMediaQuery, useSmoothScroll
  lib/              framework-free helpers: api client, formatting, storage, smooth-scroll handle
  components/
    ui/             small reusable pieces: Reveal, MaskedText, SectionHeading, Counter, TiltCard, switches…
    layout/         Chapter (the section shell), Header, Footer, FloatingCta, PageChrome
    graphics/       decorative and data graphics: Backdrop layers, CardField (hero), TrendBars
  sections/         one folder per chapter of the home page; each renders a <Chapter> from config
  pages/            HomePage (the chapters), legal/…, NotFoundPage
  assets/           images imported by components
```

Rules of thumb:

- **Copy lives in `src/content`**, never inside a component. Change words there.
- **Colours and sizes are tokens.** Components use `bg-page`, `text-ink`, `text-muted`,
  `border-line`, `rounded-card`, `text-headline`… and never a raw hex or pixel value.
- **A chapter is three things:** an entry in `config/chapters.js`, a content file, and a
  section component wrapped in `<Chapter id="…">`. Navigation, corner labels, scroll
  tracking and the floating CTA pick it up from the config.

## Changing the look

| To change…                              | Edit                                                        |
| --------------------------------------- | ----------------------------------------------------------- |
| brand colours, type scale, radii, shadows | `styles/tokens.css` (the `@theme` block)                   |
| the light / dark theme values           | `styles/themes.css` (`:root`, `.dark`)                      |
| a chapter's palette, or add a new tone  | `styles/themes.css` (`[data-tone="…"]`), then use the tone in `config/chapters.js` |
| the display or body typeface            | `styles/fonts.css` + `--font-display` / `--font-sans` in tokens.css |
| ambient animations (float, drift, marquee) | `styles/animations.css`                                  |
| easing / durations used by framer-motion | `config/motion.js`                                         |

How a chapter gets its colours: `<Chapter>` puts `data-tone` on its section, and
`themes.css` re-points the semantic tokens under that attribute. Because CSS custom
properties inherit, every token-based utility inside the section follows — the same
component looks right on milk, ink and navy without a single conditional. `milk` follows
the light/dark theme; `ink` and `navy` are dark bands in both themes by design. A tone
that should follow the theme needs light values under `[data-tone]` and dark values
under `.dark [data-tone]`.

## Visitor preferences

- **Theme** — `ThemeProvider`. A `dark` class on `<html>`, remembered in localStorage
  (`milk-nest-theme`); first-time visitors follow their operating system. The switch
  animates with the View Transitions API where available.
- **Text size** — `PreferencesProvider`. Puts `--font-scale` on `<html>`; `base.css`
  multiplies the root font size by it, so every rem-based size on the site scales
  together. Steps are in `FONT_SCALES`; remembered as `milk-nest-font-scale`.
- Both are applied by `public/theme-init.js` before the bundle loads. Keep its keys and
  values in sync with the two providers.

## Live data and the enquiry form

- `PublicStatsProvider` polls `GET /apiv1/public/stats` once a minute and shares the
  totals with the hero record field and the live band. When the api is unreachable the
  figures show "—", never made-up numbers.
- The enquiry form (`sections/contact`) posts to `POST /apiv1/public/enquiries`. One
  enquiry per email address and one request per 10 minutes per IP are enforced by the
  server; the form shows the server's messages.

## Motion and accessibility

Every animated component checks `useReducedMotion()` and renders a static version when
the visitor asks for less motion; `base.css` also stops the CSS loops. Headings revealed
word by word keep their full sentence in `aria-label`. All layouts are tested at 390px and
1440px with no horizontal scroll.

## Deployment notes

- Deep links (`/privacy`, `/terms`) need the host to serve `index.html` for unknown paths
  (SPA fallback).
- The site is written for a CSP of `script-src 'self'; style-src 'self'; font-src 'self'`:
  no CDN assets, no inline scripts.
