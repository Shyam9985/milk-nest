function Footer() {

    return (
        <footer className="h-10 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 
        px-6 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">

            {/* Left */}

            <div className="flex items-center gap-2">
                <span>© {new Date().getFullYear()}</span>

                <span className="text-slate-300 dark:text-slate-600">|</span>

                <span className="font-medium">
                    MilkNest Smart Dairy Farm Management
                </span>

                <span className="text-slate-300 dark:text-slate-600">|</span>

                <span>v1.0.0</span>
            </div>

            {/* Right */}

            <div>
                Powered by{" "}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Syam Vara Prasad
                </span>
            </div>

        </footer>
    );
}

export default Footer;