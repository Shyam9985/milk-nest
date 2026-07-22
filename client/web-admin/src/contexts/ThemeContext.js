import { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const ThemeContext = createContext({ theme: undefined, setDarkTheme: undefined, setLightTheme: undefined });

export function ThemeContextProvider(props) {
    const [theme, setTheme] = useState('light');

    function setDarkTheme() {
        setTheme('dark');
        document.documentElement.classList.add('dark');
    }

    function setLightTheme() {
        setTheme('light');
        document.documentElement.classList.remove('dark');
    }

    return (
        <ThemeContext.Provider value={{ theme: theme, setLightTheme: setLightTheme, setDarkTheme: setDarkTheme }}>
            {props.children}
        </ThemeContext.Provider>
    )
}

export function Theme(props) {

    const themeCtx = useContext(ThemeContext);

    useEffect(() => {
        console.log('theme changes: ', themeCtx.theme);

    }, [themeCtx.theme]);

    /* ---------------- Theme ---------------- */

    return (
        <div className="inline-flex items-center rounded-xl border border-[var(--toggle-border)] bg-[var(--toggle-bg)] p-1 shadow-sm">

            <button onClick={themeCtx.setLightTheme} className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200
            ${themeCtx.theme === "light" ? "bg-[var(--toggle-active-bg)] text-[var(--toggle-active-text)] shadow-sm" : "text-[var(--toggle-text)] hover:bg-[var(--toggle-hover)]"}      `}
                title="Light Theme"
            >
                <Sun size={18} />
            </button>

            <button
                onClick={themeCtx.setDarkTheme}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200
            ${themeCtx.theme === "dark" ? "bg-[var(--toggle-active-bg)] text-[var(--toggle-active-text)] shadow-sm" : "text-[var(--toggle-text)] hover:bg-[var(--toggle-hover)]"}        `}
                title="Dark Theme"
            >
                <Moon size={18} />
            </button>

        </div>
    )
}
export default ThemeContext;