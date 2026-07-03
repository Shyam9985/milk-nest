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

        <div className="flex overflow-hidden rounded-lg border border-white/20 bg-white/15 backdrop-blur-md">

            <button
                disabled={fontSize === MIN_FONT}
                onClick={() =>
                    setFontSize((prev) =>
                        Math.max(MIN_FONT, prev - 1)
                    )
                }
                className="px-3 py-2 text-white hover:bg-white/20 disabled:opacity-40"
            >
                A-
            </button>

            <button
                onClick={() => setFontSize(DEFAULT_FONT)}
                className={`px-3 py-2 transition ${fontSize === DEFAULT_FONT
                    ? "bg-blue-600"
                    : "hover:bg-white/20"
                    } text-white`}
            >
                A
            </button>

            <button
                disabled={fontSize === MAX_FONT}
                onClick={() =>
                    setFontSize((prev) =>
                        Math.min(MAX_FONT, prev + 1)
                    )
                }
                className="px-3 py-2 text-white hover:bg-white/20 disabled:opacity-40"
            >
                A+
            </button>

        </div>

    )
}

export default FontSizeContext;