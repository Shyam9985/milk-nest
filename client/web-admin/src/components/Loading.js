import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const loadingSteps = [
    { message: "Connecting to Farm", progress: 15 },
    { message: "Authenticating User", progress: 35 },
    { message: "Loading Dashboard", progress: 55 },
    { message: "Fetching Livestock", progress: 75 },
    { message: "Preparing MilkNest", progress: 95 },
    { message: "Almost Ready", progress: 100 }
];

function Loader() {

    const [step, setStep] = useState(0);
    const [progress, setProgress] = useState(loadingSteps[0].progress);
    const [dots, setDots] = useState("");

    useEffect(() => {

        const interval = setInterval(() => {

            setStep(prev => {

                const next = (prev + 1) % loadingSteps.length;
                setProgress(loadingSteps[next].progress);
                return next;

            });

        }, 1800);

        return () => clearInterval(interval);

    }, []);

    useEffect(() => {

        const timer = setInterval(() => {

            setDots(prev => prev.length === 3 ? "" : prev + ".");

        }, 400);

        return () => clearInterval(timer);

    }, []);

    return createPortal(

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md">

            <div className="border-white/30 p-10 flex flex-col items-center">

                {/* Logo + Spinner */}

                <div className="relative flex items-center justify-center w-40 h-40">

                    {/* Outer Ring */}

                    <div className="absolute inset-0 rounded-full border-[5px] border-transparent border-t-[var(--brand-primary)] 
                    border-r-[var(--success)] animate-spin" style={{ animationDuration: "2.5s" }} />

                    {/* Inner Ring */}

                    <div className="absolute inset-3 rounded-full border-[4px] border-transparent border-b-[var(--brand-primary)] 
                    border-l-[var(--success)]" style={{ animation: "spin 1.4s linear infinite reverse" }} />

                    {/* Glow */}

                    <div className="absolute w-24 h-24 rounded-full bg-[var(--brand-primary)] opacity-20 blur-2xl" />

                    {/* Logo */}

                    <img src="/images/logo-transparent.png" alt="MilkNest"
                        className="relative w-24 h-24 object-contain animate-bounce drop-shadow-xl"
                        style={{ animationDuration: "3s" }} />
                </div>

                {/* Title */}

                <h1 className="mt-8 text-4xl font-bold text-[var(--text-primary)]">
                    MilkNest
                </h1>

                {/* Animated Message */}

                <div key={step}
                    className="mt-8 text-lg font-medium text-[var(--text-primary)] animate-pulse">
                    {loadingSteps[step].message}
                    {dots}
                </div>

            </div>

        </div>,

        document.getElementById("loader-root")

    );

}

export default Loader;