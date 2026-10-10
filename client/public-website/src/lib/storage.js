/**
 * localStorage that never throws. Some private modes and locked-down browsers block
 * storage entirely; a preference then simply lasts for the visit instead of crashing
 * the page.
 */

export const storage = Object.freeze({
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      /* nothing to do */
    }
  },

  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* nothing to do */
    }
  },
});
