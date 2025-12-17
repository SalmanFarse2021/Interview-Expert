"use client";

import { useEffect, useState } from "react";

type HighlightMetrics = {
    atsScore: number;
    mockSessions: number;
    successRate: number;
    offersTracked: number;
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export function Stats() {
    const [highlights, setHighlights] = useState<HighlightMetrics>({
        atsScore: 82,
        mockSessions: 128,
        successRate: 96,
        offersTracked: 47,
    });

    useEffect(() => {
        async function fetchHighlights() {
            try {
                const res = await fetch(`${API_BASE_URL}/api/highlights`);
                if (res.ok) {
                    const data = await res.json();
                    setHighlights(data);
                }
            } catch (error) {
                console.error("Failed to load highlights", error);
            }
        }
        fetchHighlights();
    }, []);

    return (
        <div className="relative w-full max-w-sm mx-auto lg:mx-0 animate-float">
            {/* Glow Effect */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary via-violet-500 to-fuchsia-500 blur-xl opacity-30 animate-pulse-slow" />

            <div className="relative rounded-3xl glass-card p-6 ring-1 ring-white/20 dark:ring-white/5">
                <div className="flex items-center justify-between mb-8">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 box-shadow-glow"></span>
                        </span>
                        Live snapshot
                    </span>
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                        Auto-updated
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <MetricCard label="ATS Score" value={highlights.atsScore.toString()} delay="0.1s" />
                    <MetricCard label="Mock sessions" value={highlights.mockSessions.toString()} delay="0.2s" />
                    <MetricCard label="Success rate" value={`${highlights.successRate}%`} delay="0.3s" />
                    <MetricCard label="Offers tracked" value={highlights.offersTracked.toString()} delay="0.4s" />
                </div>

                <div className="rounded-2xl bg-white/50 dark:bg-slate-800/50 p-4 text-sm text-slate-600 dark:text-slate-300 italic border border-slate-200/50 dark:border-slate-700/50 relative">
                    <span className="absolute -top-3 left-4 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Feedback</span>
                    “This feels like a coach and recruiter in one place. I know exactly what’s missing.”
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, delay }: { label: string; value: string; delay: string }) {
    return (
        <div className="group rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-4 text-center transition-all duration-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg animate-fade-in" style={{ animationDelay: delay }}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 group-hover:text-primary transition-colors">
                {label}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white group-hover:scale-110 transition-transform duration-300">{value}</p>
        </div>
    );
}
