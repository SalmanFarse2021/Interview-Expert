import Link from "next/link";

type FeatureCard = {
    title: string;
    description: string;
    href: string;
    icon: string;
    tag: string;
    color: string;
};

const featureCards: FeatureCard[] = [
    {
        title: "Resume Lab",
        description: "Upload, parse, and rewrite bullets with proof points that survive ATS screens.",
        href: "/resume",
        icon: "🧭",
        tag: "ATS + proof",
        color: "from-blue-500 to-indigo-500",
    },
    {
        title: "Job Match",
        description: "Drop a job link or JD text; get keyword coverage, stack alignment, and a plan to close gaps first.",
        href: "/job-match",
        icon: "🔗",
        tag: "Gap map",
        color: "from-violet-500 to-purple-500",
    },
    {
        title: "Interview Studio",
        description: "Simulate behavioral, technical, and system design rounds with live scoring and recordings.",
        href: "/interview",
        icon: "🎙️",
        tag: "Drills",
        color: "from-fuchsia-500 to-pink-500",
    },
    {
        title: "Cover Letters",
        description: "Generate role-aware cover letters that mirror company tone and your proof points.",
        href: "/cover-letter",
        icon: "✉️",
        tag: "Tone-matched",
        color: "from-orange-500 to-amber-500",
    },
    {
        title: "Projects",
        description: "Pick guided builds—queues, microservices, or end-to-end apps to prove skills fast.",
        href: "/projects",
        icon: "🛠️",
        tag: "Portfolio",
        color: "from-emerald-500 to-teal-500",
    },
    {
        title: "Profile",
        description: "Track progress, saved roles, learning roadmaps, and your mock interview history.",
        href: "/profile",
        icon: "🗂️",
        tag: "Synced",
        color: "from-cyan-500 to-sky-500",
    },
];

export function Features() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 -z-10 bg-slate-50/50 dark:bg-slate-900/20" />
            <div className="absolute top-1/3 left-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-violet-500/5 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <div className="max-w-2xl">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-2 animate-fade-in">
                            Build momentum
                        </h2>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-5xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
                            Pick a lane and keep every artifact in sync.
                        </h3>
                        <p className="mt-6 text-xl text-slate-600 dark:text-slate-300 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                            Resume polish, JD matching, interview drills, and outreach-ready
                            cover letters—each card opens a focused workspace.
                        </p>
                    </div>
                    <Link href="/dashboard" className="btn-secondary shrink-0 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                        View dashboard
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {featureCards.map((card, idx) => (
                        <Link
                            key={card.title}
                            href={card.href}
                            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl glass-card p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 dark:hover:shadow-primary/20 animate-fade-in ring-1 ring-slate-900/5 hover:ring-primary/20"
                            style={{ animationDelay: `${0.1 * (idx + 1)}s` }}
                        >
                            {/* Gradient Splash on Hover */}
                            <div className={`absolute top-0 right-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-gradient-to-br ${card.color} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20`} />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-2xl shadow-sm ring-1 ring-inset ring-slate-900/5 group-hover:scale-110 transition-transform duration-300">
                                            {card.icon}
                                        </div>
                                        <span className="pill dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                                            {card.tag}
                                        </span>
                                    </div>
                                    <span className="text-slate-300 dark:text-slate-600 transition-colors group-hover:text-primary">
                                        <svg className="h-6 w-6 transform transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors duration-300">
                                        {card.title}
                                    </h4>
                                    <p className="mt-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {card.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
