import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { storage } from "../lib/storage";

/**
 * Reading preferences other than the theme - today, the font size.
 *
 * The chosen scale goes on <html> as --font-scale, and styles/base.css multiplies the
 * root font size by it. Every size on the site is in rem (Tailwind utilities, the type
 * scale, the clamp() bounds), so the whole page grows or shrinks together, the way the
 * web-admin portal's A- / A / A+ control works. The choice is remembered in
 * localStorage, and public/theme-init.js applies it before React loads so the page
 * never jumps. Keep STORAGE_KEY and FONT_SCALES in sync with that file.
 *
 * The control itself is components/ui/FontScaleSwitch.jsx.
 */

const STORAGE_KEY = "milk-nest-font-scale";

/* the allowed steps, smallest to largest; 1 is the design size */
export const FONT_SCALES = [0.875, 1, 1.125, 1.25];
const DEFAULT_SCALE = 1;

const PreferencesContext = createContext({
  fontScale: DEFAULT_SCALE,
  increaseFontScale: () => {},
  decreaseFontScale: () => {},
  resetFontScale: () => {},
  canIncreaseFontScale: false,
  canDecreaseFontScale: false,
});

const isAllowed = (scale) => FONT_SCALES.includes(scale);

/* theme-init.js may already have put the saved scale on <html>; read that back first */
const readInitialScale = () => {
  const fromHtml = parseFloat(document.documentElement.style.getPropertyValue("--font-scale"));
  if (isAllowed(fromHtml)) return fromHtml;
  const saved = parseFloat(storage.get(STORAGE_KEY));
  return isAllowed(saved) ? saved : DEFAULT_SCALE;
};

const applyScale = (scale) => {
  const root = document.documentElement;
  if (scale === DEFAULT_SCALE) root.style.removeProperty("--font-scale");
  else root.style.setProperty("--font-scale", String(scale));
};

export function PreferencesProvider({ children }) {
  const [fontScale, setFontScale] = useState(readInitialScale);

  useEffect(() => {
    applyScale(fontScale);
    if (fontScale === DEFAULT_SCALE) storage.remove(STORAGE_KEY);
    else storage.set(STORAGE_KEY, fontScale);
  }, [fontScale]);

  const step = useCallback((direction) => {
    setFontScale((current) => {
      const index = FONT_SCALES.indexOf(current) + direction;
      return FONT_SCALES[Math.min(FONT_SCALES.length - 1, Math.max(0, index))];
    });
  }, []);

  const value = useMemo(
    () => ({
      fontScale,
      increaseFontScale: () => step(1),
      decreaseFontScale: () => step(-1),
      resetFontScale: () => setFontScale(DEFAULT_SCALE),
      canIncreaseFontScale: fontScale !== FONT_SCALES[FONT_SCALES.length - 1],
      canDecreaseFontScale: fontScale !== FONT_SCALES[0],
      isDefaultFontScale: fontScale === DEFAULT_SCALE,
    }),
    [fontScale, step]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export const usePreferences = () => useContext(PreferencesContext);

export default PreferencesContext;
