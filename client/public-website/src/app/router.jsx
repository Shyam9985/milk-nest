import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { scrollToTop } from "../lib/smoothScroll";

/**
 * A very small client-side router: enough for a marketing site with a home page and a
 * few documents (privacy, terms, 404), without adding a routing library.
 *
 *   <RouterProvider>   owns the current path and listens to back/forward
 *   useRoute()         -> { path, navigate }
 *   <Link to="/terms"> an <a> that navigates in-app on a plain left click and behaves
 *                      like a normal link otherwise (new tab, middle click, modifiers)
 *
 * Paths are matched exactly after normalising a trailing slash. Hash links (#services)
 * are left to the browser and to Lenis, which handles them on the home page. Hosting
 * must serve index.html for every path (SPA fallback) for deep links to work.
 */

const RouteContext = createContext({ path: "/", navigate: () => {} });

const normalise = (pathname) => {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};

const currentPath = () => normalise(window.location.pathname);

export function RouterProvider({ children }) {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to) => {
    const url = new URL(to, window.location.origin);
    const nextPath = normalise(url.pathname);

    /* same page, only the hash differs: let the browser (and Lenis) scroll to it */
    if (nextPath === currentPath() && url.hash) {
      window.location.hash = url.hash;
      return;
    }

    window.history.pushState({}, "", url.pathname + url.search + url.hash);
    setPath(nextPath);

    /* a new page starts at the top; a hash on it is honoured once it has rendered - and
       once more a moment later, because fonts and images landing can move the target */
    if (url.hash) {
      const scrollToTarget = () => document.querySelector(url.hash)?.scrollIntoView();
      window.requestAnimationFrame(scrollToTarget);
      window.setTimeout(scrollToTarget, 450);
    } else {
      scrollToTop({ instant: true });
    }
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

export const useRoute = () => useContext(RouteContext);

/* Should this click be handled in-app, or left to the browser (new tab, download, modifier keys)? */
const isPlainLeftClick = (event, target) =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey &&
  (!target || target === "_self");

export function Link({ to, onClick, target, children, ...rest }) {
  const { navigate } = useRoute();

  const handleClick = (event) => {
    onClick?.(event);
    if (!isPlainLeftClick(event, target)) return;
    event.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} target={target} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
