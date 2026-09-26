function AuthCard({ title, subtitle, children }) {
    return (
        <div
            className="w-full md:min-w-[25rem] max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--card-bg)]
                    border border-[var(--card-border)] shadow-2xl p-6">
            <div className="flex flex-col items-center">

                <img src="/images/logo-transparent.png" alt="MilkNest" className="w-20 h-20 object-contain mb-3" />

                <h2 className="text-3xl font-bold text-[var(--text-primary)]">
                    {title}
                </h2>

                <p className="mt-2 text-center text-[var(--text-secondary)]">
                    {subtitle}
                </p>

            </div>

            <div className="mt-8">

                {children}

            </div>

        </div>
    );
}

export default AuthCard;