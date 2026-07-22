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
        <div className="inline-flex items-center rounded-xl border border-[var(--toggle-border)] bg-[var(--toggle-bg)] p-1 shadow-sm">

            <button
                disabled={fontSize === MIN_FONT}
                onClick={() =>
                    setFontSize(prev => Math.max(MIN_FONT, prev - 2))
                }
                className="
            flex h-9 w-10 items-center justify-center rounded-lg
            text-[var(--toggle-text)]
            transition-all duration-200
            hover:bg-[var(--toggle-hover)]
            disabled:cursor-not-allowed
            disabled:opacity-40
        "
                title="Decrease Font Size"
            >
                A-
            </button>

            <button
                onClick={() => setFontSize(DEFAULT_FONT)}
                className={`
            flex h-9 w-10 items-center justify-center rounded-lg
            transition-all duration-200
            ${fontSize === DEFAULT_FONT
                        ? "bg-[var(--toggle-active-bg)] text-[var(--toggle-active-text)] shadow-sm"
                        : "text-[var(--toggle-text)] hover:bg-[var(--toggle-hover)]"
                    }
        `}
                title="Default Font Size"
            >
                A
            </button>

            <button
                disabled={fontSize === MAX_FONT}
                onClick={() =>
                    setFontSize(prev => Math.min(MAX_FONT, prev + 2))
                }
                className="
            flex h-9 w-10 items-center justify-center rounded-lg
            text-[var(--toggle-text)]
            transition-all duration-200
            hover:bg-[var(--toggle-hover)]
            disabled:cursor-not-allowed
            disabled:opacity-40
        "
                title="Increase Font Size"
            >
                A+
            </button>

        </div>
    )
}

export default FontSizeContext;