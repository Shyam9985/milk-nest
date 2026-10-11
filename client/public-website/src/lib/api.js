/**
 * Minimal client for the Milk Nest public api (the /apiv1/public routes).
 *
 * Every answer from the server has the same envelope:
 *   success -> { success: true,  code, statusKey, message, data }
 *   failure -> { success: false, code, statusKey, message, error }
 * A successful call resolves with that body. A failed one rejects with it, so callers read
 * `statusKey` to decide what happened and `error` for the text to show. When the server
 * cannot be reached at all, the rejection is the same shape with statusKey NETWORK_ERROR.
 *
 * No cookies or tokens are sent: these routes are open, and the website has no login.
 */

// vite exposes VITE_* vars on import.meta.env. left empty, calls go to the site's own origin
const BASE_URL = `${(import.meta.env.VITE_SERVER_URL || "").replace(/\/+$/, "")}/apiv1/`;

const NETWORK_ERROR = {
  success: false,
  code: 0,
  statusKey: "NETWORK_ERROR",
  message: "Unable to connect to the server.",
  error: "Unable to connect to the server. Please check your connection and try again.",
};

export async function apiRequest(path, { method = "GET", body, signal } = {}) {
  let response;

  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers: body
        ? { Accept: "application/json", "Content-Type": "application/json" }
        : { Accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    // an aborted request is the caller's own doing, not a failure to report
    if (error.name === "AbortError") throw error;
    throw NETWORK_ERROR;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* not json (a proxy error page, an empty body) - handled below */
  }

  if (!response.ok || !payload?.success) {
    throw payload?.statusKey ? payload : { ...NETWORK_ERROR, code: response.status };
  }

  return payload;
}
