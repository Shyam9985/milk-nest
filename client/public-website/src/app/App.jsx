import { lazy, Suspense, useEffect } from "react";
import FloatingCta from "../components/layout/FloatingCta";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import { BackToTop, CursorSpotlight, DotNav, ScrollProgress } from "../components/layout/PageChrome";
import PageErrorBoundary from "../components/layout/PageErrorBoundary";
import { notFoundRoute, routes } from "../config/routes";
import useSmoothScroll from "../hooks/useSmoothScroll";
import HomePage from "../pages/HomePage";
import { useRoute } from "./router";

/*
 * Every file under src/pages is a page, loaded only when someone opens it (the home page
 * is the site, so it is imported directly above). Vite's glob keeps the mapping honest:
 * a page file that does not exist yet simply is not routable, instead of breaking the
 * build, which lets pages be added - or written by someone else - independently.
 */
const pageModules = import.meta.glob(["../pages/**/*.jsx", "!../pages/HomePage.jsx"]);
const lazyPage = (file) => (pageModules[file] ? lazy(pageModules[file]) : null);

/* Shown while a document page loads, and if a page is missing or fails to load. */
const PageFallback = () => <div aria-hidden="true" className="min-h-dvh bg-page" />;
const MissingPage = () => (
  <main data-tone="milk" className="flex min-h-dvh items-center justify-center bg-page px-6 pt-header text-center text-ink">
    <p className="text-lead text-muted">This page is not available right now.</p>
  </main>
);

const PAGES = {
  "/": HomePage,
  "/privacy": lazyPage("../pages/legal/PrivacyPolicyPage.jsx"),
  "/terms": lazyPage("../pages/legal/TermsPage.jsx"),
  "/application-privacy": lazyPage("../pages/legal/ApplicationPrivacyPage.jsx"),
};
const NotFoundPage = lazyPage("../pages/NotFoundPage.jsx") ?? MissingPage;

export default function App() {
  useSmoothScroll();
  const { path } = useRoute();

  const Page = PAGES[path] ?? NotFoundPage;
  const route = routes[path] ?? notFoundRoute;
  const isHome = path === "/";

  useEffect(() => {
    document.title = route.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", route.description);
  }, [route]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-navy-800 focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <CursorSpotlight />
      <Header />

      <div id="main-content" tabIndex={-1} className="outline-none">
        <PageErrorBoundary resetKey={path} fallback={<MissingPage />}>
          <Suspense fallback={<PageFallback />}>{Page ? <Page /> : <MissingPage />}</Suspense>
        </PageErrorBoundary>
      </div>

      <Footer />

      {/* chapter navigation only makes sense on the page that has chapters */}
      {isHome ? <DotNav /> : null}
      {isHome ? <FloatingCta /> : null}
      <BackToTop />
    </>
  );
}
