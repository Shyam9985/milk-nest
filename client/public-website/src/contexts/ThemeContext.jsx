import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";

/**
 * Light / dark theme, built the same way as the web-admin portal: a context holds the
 * active theme and toggles a `dark` class on <html>, and the stylesheet redefines its
 * colour variables under that class (see styles.css).
 *
 * Three additions over the portal's version:
 *   - the choice is remembered in localStorage, so it survives a reload
 *   - a visitor who has never chosen gets their operating system's setting
 *   - the switch is animated: the new theme spreads out from the button (chooseTheme)
 * public/theme-init.js applies the same rules before React loads, so the first paint is
 * already in the right theme. Keep STORAGE_KEY in sync with that file.
 */

const STORAGE_KEY = "milk-nest-theme";

/* Colour of the browser's own chrome (mobile address bar), matched to the page. */
const THEME_COLOR = { light: "#0f2247", dark: "#060d1f" };

const ThemeContext = createContext({
  theme: "light",
  setLightTheme: undefined,
  setDarkTheme: undefined,
});

/* localStorage throws in some private modes; the theme then simply lasts for the visit. */
const readSavedTheme = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
};

const saveTheme = (theme) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* nothing to do - see readSavedTheme */
  }
};

const applyTheme = (theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[theme]);
};

export function ThemeContextProvider({ children }) {
  /* theme-init.js has already decided; read its answer back instead of deciding twice. */
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  /* Until the visitor picks a theme themselves, keep following the operating system. */
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => {
      if (!readSavedTheme()) setTheme(event.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  /*
   * The visitor picks a theme. Where the browser has the View Transitions API, the new
   * theme spreads out in a circle from the button that was pressed; anywhere else, and
   * under reduced motion, it simply switches. `event` is the click, and is optional.
   */
  const chooseTheme = useCallback((next, event) => {
    saveTheme(next);

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

/**
 * Sun / moon switch - the same two-button control the web-admin header uses.
 * `className` sets how it is displayed (and so where it is hidden): the default shows it
 * everywhere, the header passes "hidden sm:inline-flex" to keep it off phones.
 */
export function Theme({ className = "inline-flex" }) {
  const { theme, setLightTheme, setDarkTheme } = useContext(ThemeContext);

  const options = [
    { name: "light", label: "Light theme", Icon: Sun, select: setLightTheme },
    { name: "dark", label: "Dark theme", Icon: Moon, select: setDarkTheme },
  ];

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={`items-center rounded-xl border border-ink/10 bg-surface/80 p-1 backdrop-blur ${className}`}
    >
      {options.map(({ name, label, Icon, select }) => {
        const isActive = theme === name;
        return (
          <button
            key={name}
            type="button"
            onClick={select}
            title={label}
            aria-label={label}
            aria-pressed={isActive}
            className={`grid size-8 place-items-center rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-linear-to-br from-navy-700 to-splash text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            <Icon className="size-4.5" />
          </button>
        );
      })}
    </div>
  );
}

export default ThemeContext;
