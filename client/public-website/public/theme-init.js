/*
 * Puts the visitor's theme on <html> before the app bundle loads, so the page never
 * flashes the light theme on its way to the dark one.
 *
 * Order of preference: the theme they picked last time, otherwise their operating
 * system's setting. ThemeContext.jsx reads the result back and takes over from there -
 * keep the storage key below in sync with it.
 *
 * This is a file rather than an inline <script> on purpose: the site is served with a
 * content security policy of script-src 'self', which blocks inline scripts.
 */
(function () {
  var theme = null;

  try {
    theme = window.localStorage.getItem("milk-nest-theme");
  } catch (error) {
    /* storage blocked (private mode) - fall through to the system setting */
  }

  if (theme !== "light" && theme !== "dark") {
    theme =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  }

  if (theme === "dark") document.documentElement.classList.add("dark");
})();
