import { useState, useEffect } from "react";

function FontSizeContext() {

    const DEFAULT_FONT = 16;
    const MIN_FONT = 12;
    const MAX_FONT = 20;

    const [fontSize, setFontSize] = useState(DEFAULT_FONT);

    /* ---------------- Font ---------------- */

    useEffect(() => {
        document.documentElement.style.setProperty(
            "--app-font-size",
            `${fontSize}px`
        );
    }, [fontSize]);

    return (
        <div className="inline-flex items-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-md text-white p-1 shadow-sm">

            <button title="Decrease Font Size" disabled={fontSize === MIN_FONT}
                onClick={(e) => {
                    e.stopPropagation();
                    setFontSize(prev => Math.max(MIN_FONT, prev - 2));
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 disabled:cursor-not-allowed 
                disabled:opacity-40 hover:bg-[var(--brand-primary)]"
            >
                A-
            </button>

            <button title="Default Font Size"
                onClick={(e) => {
                    e.stopPropagation();
                    setFontSize(DEFAULT_FONT);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200
                    ${fontSize === DEFAULT_FONT ? "bg-[var(--toggle-active-bg)] shadow-sm" :
                        "hover:bg-[var(--brand-primary)]"}`}
            >
                A
            </button>

            <button disabled={fontSize === MAX_FONT} title="Increase Font Size"
                onClick={(e) => {
                    e.stopPropagation();
                    setFontSize(prev => Math.min(MAX_FONT, prev + 2));
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 disabled:cursor-not-allowed 
                disabled:opacity-40 hover:bg-[var(--brand-primary)]"
            >
                A+
            </button>

        </div>
    )
}

export default FontSizeContext;