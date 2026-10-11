import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { storage } from "../lib/storage";

/**
 * Light / dark theme, built the same way as the web-admin portal: a context holds the
 * active theme and toggles a `dark` class on <html>, and the stylesheet redefines its
 * colour tokens under that class (styles/themes.css).
 *
 * Three additions over the portal's version:
 *   - dark is the default; the choice is remembered in localStorage, so it survives
 *     a reload
 *   - the switch is animated: the new theme spreads out from the button (chooseTheme)
 * public/theme-init.js applies the same rule before React loads, so the first paint is
 * already in the right theme. Keep STORAGE_KEY in sync with that file.
 *
 * The switch control itself is components/ui/ThemeSwitch.jsx.
 */

const STORAGE_KEY = "milk-nest-theme";

/* Colour of the browser's own chrome (mobile address bar), matched to the page. */
const THEME_COLOR = { light: "#0f2247", dark: "#060d1f" };

const ThemeContext = createContext({
  theme: "dark",
  setLightTheme: () => {},
  setDarkTheme: () => {},
});

const applyTheme = (theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[theme]);
};

export function ThemeProvider({ children }) {
  /* theme-init.js has already decided; read its answer back instead of deciding twice. */
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  /*
   * The visitor picks a theme. Where the browser has the View Transitions API, the new
   * theme spreads out in a circle from the button that was pressed; anywhere else, and
   * under reduced motion, it simply switches. `event` is the click, and is optional.
   */
  const chooseTheme = useCallback((next, event) => {
    storage.set(STORAGE_KEY, next);

    const root = document.documentElement;
    const alreadyOn = root.classList.contains("dark") === (next === "dark");
    const canAnimate =
      !alreadyOn &&
      typeof document.startViewTransition === "function" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canAnimate) {
      setTheme(next);
      return;
    }

    /* Centre of the pressed button (a keyboard "click" carries no pointer position). */
    const button = event?.currentTarget?.getBoundingClientRect?.();
    const x = button ? button.left + button.width / 2 : window.innerWidth / 2;
    const y = button ? button.top + button.height / 2 : 0;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    root.classList.add("theme-switching");

    /* The page must be fully in the new theme by the time this callback returns: that is
       the picture the browser reveals. So the class goes on now, and React is flushed
       now, instead of waiting for the usual effect. */
    const transition = document.startViewTransition(() => {
      applyTheme(next);
      flushSync(() => setTheme(next));
    });

    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          {
            duration: 650,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      .catch(() => {
        /* the transition was skipped (tab hidden, another one started) - the theme is already applied */
      });

    transition.finished.finally(() => root.classList.remove("theme-switching"));
  }, []);

  const setLightTheme = useCallback((event) => chooseTheme("light", event), [chooseTheme]);
  const setDarkTheme = useCallback((event) => chooseTheme("dark", event), [chooseTheme]);

  const value = useMemo(
    () => ({ theme, setLightTheme, setDarkTheme }),
    [theme, setLightTheme, setDarkTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
