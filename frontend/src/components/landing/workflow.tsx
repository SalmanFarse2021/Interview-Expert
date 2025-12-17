import Link from "next/link";

const workflow = [
    {
        title: "Upload your resume",
        detail: "We parse, score ATS, and rewrite bullets with measurable proof points.",
    },
    {
        title: "Paste a job link",
        detail: "We map keywords, tech stack, and highlight gaps to fix first.",
    },
    {
        title: "Generate tailoring",
        detail: "Role-aware resume + cover letter tuned for the job language.",
    },
    {
        title: "Run mock interviews",
        detail: "Behavioral and technical drills with voice/text and live scoring.",
    },
    {
        title: "Follow your roadmap",
        detail: "Daily learning + project tasks to prove skills quickly.",
    },
];

export function Workflow() {
    return (
        <section className="py-24 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] items-start">
                    <div className="sticky top-32">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-2 animate-fade-in">
                            Workflow
                        </h2>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                            Day-one clarity, then measurable proof.
                        </h3>
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                            Stop guessing what recruiters want. Follow a data-driven process that
                            optimizes every touchpoint of your application.
                        </p>
                        <Link href="/dashboard" className="btn-primary animate-fade-in" style={{ animationDelay: "0.3s" }}>
                            See timeline
                        </Link>
                    </div>

                    <div className="grid gap-6">
                        {workflow.map((step, index) => (
                            <div
                                key={step.title}
                                className="group relative flex gap-6 rounded-2xl glass-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-primary/10 ring-1 ring-slate-900/5"
                                style={{ transitionDelay: `${index * 50}ms` }}
                            >
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary ring-1 ring-primary/20 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-primary/50">
                                    {index + 1}
                                </div>
                                <div className="space-y-2 pt-1">
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                        {step.title}
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {step.detail}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
