function Footer() {

    return (
        <footer className="h-10 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] px-6 flex
        items-center justify-between text-xs text-[var(--text-secondary)] transition-colors duration-300">

            {/* Left */}

            <div className="flex items-center gap-2">

                <span>© {new Date().getFullYear()}</span>

                <span className="text-[var(--text-tertiary)]">|</span>

                <span className="font-medium text-[var(--text-primary)]">
                    MilkNest Smart Dairy Farm Management
                </span>

                <span className="text-[var(--text-tertiary)]">|</span>

                <span>v1.0.0</span>

            </div>

            {/* Right */}

            <div>
                Powered by{" "}
                <span className="font-semibold text-[var(--brand-primary)]">
                    Syam Vara Prasad
                </span>
            </div>

        </footer>
    );
}

export default Footer;