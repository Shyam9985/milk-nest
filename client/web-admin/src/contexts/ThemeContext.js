import { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const ThemeContext = createContext({ theme: 'light', setDarkTheme: undefined, setLightTheme: undefined });

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
        <div className="flex overflow-hidden rounded-lg border border-white/20 bg-white/15 backdrop-blur-md">

            <button
                onClick={themeCtx.setLightTheme}
                className={`p-2 transition ${themeCtx.theme === "light" ? "bg-[var(--brand-primary)] text-white" : "text-white hover:bg-white/20"}`}>
                <Sun size={18} />
            </button>

            <button
                onClick={themeCtx.setDarkTheme}
                className={`p-2 transition ${themeCtx.theme === "dark" ? "bg-[var(--brand-primary)] text-white" : "text-white hover:bg-white/20"}`}>
                <Moon size={18} />
            </button>

        </div>
    )
}
export default ThemeContext;