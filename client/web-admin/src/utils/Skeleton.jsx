// Centralized skeleton loader. Pick the variant that matches the content being loaded:
// <Skeleton variant="table" rows={5} columns={4} /> , <Skeleton variant="card" count={3} /> ,
// <Skeleton variant="custom" width="10rem" height="2rem" /> etc.

// single pulsing block every variant is composed from
const Bone = ({ className = '', style }) => (
    <div className={`animate-pulse rounded-md bg-[var(--skeleton-bg)] ${className}`} style={style} />
);

const repeat = (count, render) => Array.from({ length: count }, (_, index) => render(index));

function Skeleton({ variant = 'text', width, height, count = 1, rows = 5, columns = 4, className = '' }) {

    const style = { width, height };

    const variants = {

        text: () => (
            <div className={`space-y-2 ${className}`} style={style}>
                {repeat(count, (i) => (
                    <Bone key={i} className={`h-4 ${i === count - 1 && count > 1 ? 'w-2/3' : 'w-full'}`} />
                ))}
            </div>
        ),

        title: () => <Bone className={`h-7 w-48 ${className}`} style={style} />,

        avatar: () => <Bone className={`h-10 w-10 !rounded-full ${className}`} style={style} />,

        button: () => <Bone className={`h-9 w-28 rounded-lg ${className}`} style={style} />,

        input: () => (
            <div className={`space-y-2 ${className}`} style={style}>
                <Bone className="h-4 w-24" />
                <Bone className="h-11 w-full rounded-lg" />
            </div>
        ),

        image: () => <Bone className={`h-40 w-full rounded-xl ${className}`} style={style} />,

        card: () => (
            <div className={`space-y-4 ${className}`} style={style}>
                {repeat(count, (i) => (
                    <div key={i} className="rounded-xl border border-[var(--card-border)] p-4">
                        <div className="flex items-center gap-3">
                            <Bone className="h-10 w-10 rounded-lg" />
                            <Bone className="h-5 w-40" />
                        </div>
                        <div className="mt-4 space-y-2">
                            <Bone className="h-4 w-full" />
                            <Bone className="h-4 w-5/6" />
                            <Bone className="h-4 w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        ),

        table: () => (
            <div className={`overflow-hidden rounded-xl border border-[var(--card-border)] ${className}`} style={style}>
                <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3">
                    <Bone className="h-9 w-64 rounded-lg" />
                    <Bone className="h-9 w-9 rounded-lg" />
                </div>
                <div className="flex gap-4 border-b border-[var(--card-border)] px-4 py-3">
                    {repeat(columns, (i) => <Bone key={i} className="h-4 flex-1" />)}
                </div>
                {repeat(rows, (r) => (
                    <div key={r} className="flex gap-4 border-b border-[var(--card-border)] px-4 py-4 last:border-b-0">
                        {repeat(columns, (c) => <Bone key={c} className="h-4 flex-1" />)}
                    </div>
                ))}
            </div>
        ),

        'table-row': () => (
            <div className={`flex gap-4 px-4 py-3 ${className}`} style={style}>
                {repeat(columns, (i) => <Bone key={i} className="h-4 flex-1" />)}
            </div>
        ),

        list: () => (
            <div className={`space-y-4 ${className}`} style={style}>
                {repeat(count > 1 ? count : 5, (i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Bone className="h-10 w-10 !rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Bone className="h-4 w-1/3" />
                            <Bone className="h-3 w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        ),

        profile: () => (
            <div className={`flex items-center gap-4 ${className}`} style={style}>
                <Bone className="h-16 w-16 !rounded-full" />
                <div className="space-y-2">
                    <Bone className="h-5 w-40" />
                    <Bone className="h-4 w-56" />
                    <Bone className="h-3 w-32" />
                </div>
            </div>
        ),

        sidebar: () => (
            <div className={`space-y-3 p-3 ${className}`} style={style}>
                {repeat(count > 1 ? count : 8, (i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Bone className="h-6 w-6 rounded-lg" />
                        <Bone className="h-4 flex-1" />
                    </div>
                ))}
            </div>
        ),

        navbar: () => (
            <div className={`flex items-center justify-between px-4 py-3 ${className}`} style={style}>
                <div className="flex items-center gap-3">
                    <Bone className="h-9 w-9 !rounded-full" />
                    <Bone className="h-5 w-28" />
                </div>
                <div className="hidden items-center gap-4 sm:flex">
                    {repeat(4, (i) => <Bone key={i} className="h-4 w-16" />)}
                </div>
                <div className="flex items-center gap-3">
                    <Bone className="h-8 w-8 rounded-lg" />
                    <Bone className="h-9 w-9 !rounded-full" />
                </div>
            </div>
        ),

        'dashboard-card': () => (
            <div className={`rounded-xl border border-[var(--card-border)] p-4 ${className}`} style={style}>
                <div className="flex items-center justify-between">
                    <Bone className="h-4 w-24" />
                    <Bone className="h-9 w-9 rounded-lg" />
                </div>
                <Bone className="mt-4 h-8 w-28" />
                <Bone className="mt-2 h-3 w-20" />
            </div>
        ),

        stats: () => (
            <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`} style={style}>
                {repeat(count > 1 ? count : 4, (i) => (
                    <div key={i} className="rounded-xl border border-[var(--card-border)] p-4">
                        <div className="flex items-center justify-between">
                            <Bone className="h-4 w-24" />
                            <Bone className="h-9 w-9 rounded-lg" />
                        </div>
                        <Bone className="mt-4 h-8 w-28" />
                        <Bone className="mt-2 h-3 w-20" />
                    </div>
                ))}
            </div>
        ),

        chart: () => (
            <div className={`rounded-xl border border-[var(--card-border)] p-4 ${className}`} style={style}>
                <Bone className="h-5 w-40" />
                <div className="mt-6 flex h-40 items-end gap-3">
                    {[65, 40, 80, 55, 95, 30, 70, 50].map((barHeight, i) => (
                        <Bone key={i} className="flex-1" style={{ height: `${barHeight}%` }} />
                    ))}
                </div>
                <div className="mt-3 flex gap-3">
                    {repeat(8, (i) => <Bone key={i} className="h-3 flex-1" />)}
                </div>
            </div>
        ),

        notification: () => (
            <div className={`space-y-4 ${className}`} style={style}>
                {repeat(count > 1 ? count : 4, (i) => (
                    <div key={i} className="flex items-start gap-3">
                        <Bone className="h-9 w-9 !rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Bone className="h-4 w-3/4" />
                            <Bone className="h-3 w-1/2" />
                        </div>
                        <Bone className="h-3 w-12" />
                    </div>
                ))}
            </div>
        ),

        chat: () => (
            <div className={`space-y-4 ${className}`} style={style}>
                {repeat(count > 1 ? count : 6, (i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <Bone className={`h-10 rounded-2xl ${i % 3 === 0 ? 'w-2/3' : 'w-1/2'}`} />
                    </div>
                ))}
            </div>
        ),

        custom: () => <Bone className={className} style={style} />
    };

    const render = variants[variant] || variants.text;
    return render();
}

export default Skeleton;
