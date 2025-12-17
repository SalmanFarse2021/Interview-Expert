import React from "react";

type Project = {
    name: string;
    tech: string;
    description: string;
    impact: string;
};

type AnalysisResponse = {
    id?: string;
    atsScore?: number | null;
    strengths?: string[];
    weaknesses?: string[];
    keywords?: string[];
    skills?: string[]; // Legacy / Tech
    techSkills?: string[];
    softSkills?: string[];
    projects?: Project[];
    impactMetrics?: string[];
    domain?: string | null;
    bulletPoints?: string[];
    rewritten?: string | null;
    rewrittenFull?: string | null;
    comparisonNote?: string | null;
    rawText?: string;
};

export default function ResumeDetail({ result }: { result: AnalysisResponse }) {
    const atsScore = result.atsScore ?? 0;
    const scoreColor = atsScore >= 80 ? "text-emerald-600" : atsScore >= 60 ? "text-amber-600" : "text-rose-600";
    const scoreBg = atsScore >= 80 ? "bg-emerald-100" : atsScore >= 60 ? "bg-amber-100" : "bg-rose-100";

    return (
        <div className="flex flex-col gap-6">
            {/* Top Summary Card */}
            <div className="glass-card flex flex-col gap-6 rounded-3xl border border-slate-200/60 p-8 shadow-sm lg:flex-row">
                {/* Gauge */}
                <div className="flex flex-shrink-0 flex-col items-center justify-center gap-2">
                    <div className={`flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold border-4 ${scoreColor} ${scoreBg} border-current`}>
                        {atsScore}
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">ATS Score</span>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{result.domain || "General"} Profile</h2>
                        <p className="text-sm text-slate-500">{result.comparisonNote || "Based on semantic analysis of your resume content."}</p>
                    </div>

                    {/* Impact Metrics - The "Wow" Factor */}
                    {result.impactMetrics && result.impactMetrics.length > 0 && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {result.impactMetrics.slice(0, 4).map((metric, i) => (
                                <div key={i} className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200 text-xs text-emerald-800">⚡</span>
                                    <span className="text-xs font-medium text-emerald-900">{metric}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Tech Skills */}
                <Card title="Technical Arsenal" icon="🛠️">
                    <div className="flex flex-wrap gap-2">
                        {(result.techSkills?.length ? result.techSkills : result.skills)?.map((skill) => (
                            <span key={skill} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm">
                                {skill}
                            </span>
                        ))}
                        {!(result.techSkills?.length || result.skills?.length) && <p className="text-sm text-slate-500">No skills detected.</p>}
                    </div>
                </Card>

                {/* Soft Skills */}
                <Card title="Leadership & Soft Skills" icon="🤝">
                    <div className="flex flex-wrap gap-2">
                        {result.softSkills?.map((skill) => (
                            <span key={skill} className="rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                                {skill}
                            </span>
                        ))}
                        {!result.softSkills?.length && <p className="text-sm text-slate-500">No soft skills detected.</p>}
                    </div>
                </Card>
            </div>

            {/* Projects Deep Dive */}
            {result.projects && result.projects.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 ml-1">Key Projects</h3>
                    <div className="grid gap-4 lg:grid-cols-2">
                        {result.projects.map((p, i) => (
                            <div key={i} className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 hover:bg-white transition">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-slate-900">{p.name}</h4>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Project</span>
                                </div>
                                <p className="mt-1 text-xs text-slate-500 font-mono">{p.tech}</p>
                                <p className="mt-3 text-sm text-slate-600 line-clamp-3">{p.description}</p>
                                <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2">
                                    <span className="mt-0.5 text-xs">🚀</span>
                                    <p className="text-xs font-medium text-amber-800">{p.impact}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Legacy "Weaknesses" & "Strengths" can stay or be merged */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Areas to Improve" tone="warn" icon="⚠️">
                    <ul className="space-y-2">
                        {result.weaknesses?.map(w => <li key={w} className="text-sm text-slate-600">• {w}</li>)}
                    </ul>
                </Card>
                <Card title="Core Strengths" tone="good" icon="✅">
                    <ul className="space-y-2">
                        {result.strengths?.map(s => <li key={s} className="text-sm text-slate-600">• {s}</li>)}
                    </ul>
                </Card>
            </div>
        </div>
    );
}

function Card({ title, children, tone = "neutral", icon }: { title: string; children: React.ReactNode; tone?: "good" | "warn" | "neutral"; icon?: string }) {
    const border = tone === "good" ? "border-emerald-200" : tone === "warn" ? "border-amber-200" : "border-slate-200";
    return (
        <div className={`rounded-2xl border ${border} bg-white/80 p-5 shadow-sm`}>
            <div className="mb-4 flex items-center gap-2">
                {icon && <span>{icon}</span>}
                <h3 className="font-semibold text-slate-800">{title}</h3>
            </div>
            {children}
        </div>
    )
}
