import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

/**
 * Live platform totals from GET /apiv1/public/stats, shared by every chapter that shows
 * a number (the hero record field, the live band). One provider means one request,
 * however many components read it.
 *
 * `status` is "loading" until the first answer, then "ready" or "error". Once there are
 * numbers on screen a failed refresh keeps them - a slightly old figure is more useful
 * than a blank - so "error" only ever means "nothing to show yet".
 */

/* How often the page asks the server for fresh totals. */
const REFRESH_MS = 60_000;

const PublicStatsContext = createContext({ stats: null, status: "loading" });

export function PublicStatsProvider({ children }) {
  const [state, setState] = useState({ stats: null, status: "loading" });

  useEffect(() => {
    let active = true;
    let controller = null;
    let lastLoadedAt = 0;

    const load = async () => {
      controller?.abort();
      controller = new AbortController();

      try {
        const response = await apiRequest("public/stats", { signal: controller.signal });
        if (!active) return;
        lastLoadedAt = Date.now();
        setState({ stats: response.data, status: "ready" });
      } catch (error) {
        if (!active || error.name === "AbortError") return;
        setState((current) => (current.stats ? current : { stats: null, status: "error" }));
      }
    };

    load();

    /* A hidden tab does not poll; it catches up the moment it is looked at again. */
    const interval = window.setInterval(() => {
      if (!document.hidden) load();
    }, REFRESH_MS);

    const onVisibilityChange = () => {
      if (!document.hidden && Date.now() - lastLoadedAt >= REFRESH_MS) load();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return <PublicStatsContext.Provider value={state}>{children}</PublicStatsContext.Provider>;
}

export function usePublicStats() {
  return useContext(PublicStatsContext);
}
