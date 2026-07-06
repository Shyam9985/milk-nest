import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const messages = [
    "Connecting to Farm...",
    "Loading Dashboard...",
    "Fetching Livestock...",
    "Preparing MilkNest...",
    "Almost Ready..."
];

function Loader() {

    const [messageIndex, setMessageIndex] = useState(0);
    const [dots, setDots] = useState("");

    useEffect(() => {

        const messageTimer = setInterval(() => {

            setMessageIndex(prev => (prev + 1) % messages.length);

        }, 1800);

        return () => clearInterval(messageTimer);

    }, []);

    useEffect(() => {

        const dotsTimer = setInterval(() => {

            setDots(prev => prev.length === 3 ? "" : prev + ".");

        }, 400);

        return () => clearInterval(dotsTimer);

    }, []);

    return createPortal(

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">

            <div className="flex flex-col items-center">

                {/* Spinner */}

                <div className="relative w-32 h-32 flex items-center justify-center">

                    <div className="absolute inset-0 rounded-full border-[5px] border-transparent border-t-[var(--brand-primary)]
                            border-r-[var(--success)] animate-spin"/>

                    <img src="/images/logo-transparent.png" alt="MilkNest" className="w-20 h-20 object-contain" />

                </div>

                <h2 className="mt-6 text-3xl font-bold text-[var(--text-primary)]">
                    MilkNest
                </h2>

                <p className="mt-2 text-[var(--text-secondary)]">
                    {messages[messageIndex]}{dots}
                </p>

            </div>

        </div>,

        document.getElementById("loader-root")

    );

}

export default Loader;