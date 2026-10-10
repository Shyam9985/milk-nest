/*
 * Applies the visitor's saved preferences to <html> before the app bundle loads, so
 * the page never flashes the defaults on its way to their choice:
 *   - theme: dark by default; light only when the visitor picked it last time
 *   - font size: the scale they picked last time (1 = default)
 *
 * ThemeProvider and PreferencesProvider read the result back and take over from
 * there - keep the storage keys and the allowed scales in sync with them.
 *
 * This is a file rather than an inline <script> on purpose: the site is served with a
 * content security policy of script-src 'self', which blocks inline scripts.
 */
(function () {
  var read = function (key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null; /* storage blocked (private mode) - use the defaults */
    }
  };

  /* --- theme (dark unless light was chosen) --- */
  if (read("milk-nest-theme") !== "light") {
    document.documentElement.classList.add("dark");
  }

  /* --- font size --- */
  var scale = parseFloat(read("milk-nest-font-scale"));
  var allowed = [0.875, 1, 1.125, 1.25];
  if (allowed.indexOf(scale) !== -1 && scale !== 1) {
    document.documentElement.style.setProperty("--font-scale", String(scale));
  }
})();
