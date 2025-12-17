"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ProfilePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    // Edit Form State
    const [targetRole, setTargetRole] = useState("");
    const [targetCompany, setTargetCompany] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/profile");
            const json = await res.json();
            setData(json);
            setTargetRole(json.profile.targetRole || "");
            setTargetCompany(json.profile.targetCompany || "");
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSaveGoals = async () => {
        try {
            await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetRole, targetCompany })
            });
            setEditing(false);
            fetchProfile(); // Refresh
        } catch (err) {
            console.error(err);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1 }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading Profile...</div>;

    return (
        <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-2xl">
                        {/* Fallback Avatar */}
                        <img src={data?.user?.image || "https://github.com/shadcn.png"} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                </div>
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{data?.user?.name || "Candidate"}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg flex items-center justify-center md:justify-start gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono">
                            {data?.user?.email}
                        </span>
                    </p>
                </div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                {/* 1. Goals Card (Editable) */}
                <motion.div variants={item} className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl relative overflow-hidden group">
                    {/* Decorative BG */}
                    <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl">🎯</div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">My Career Goal</h2>
                                <p className="text-indigo-100 opacity-80">Focusing your AI prep.</p>
                            </div>
                            <button
                                onClick={() => setEditing(!editing)}
                                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-sm font-semibold transition-colors"
                            >
                                {editing ? "Cancel" : "Edit Goals"}
                            </button>
                        </div>

                        {editing ? (
                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-xs uppercase font-bold tracking-wider opacity-70 mb-1">Target Role</label>
                                    <input
                                        type="text"
                                        value={targetRole}
                                        onChange={(e) => setTargetRole(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder="e.g. Senior Backend Engineer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase font-bold tracking-wider opacity-70 mb-1">Target Company</label>
                                    <input
                                        type="text"
                                        value={targetCompany}
                                        onChange={(e) => setTargetCompany(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder="e.g. Google"
                                    />
                                </div>
                                <button
                                    onClick={handleSaveGoals}
                                    className="px-6 py-2 rounded-xl bg-white text-indigo-600 font-bold hover:bg-indigo-50 transition-colors shadow-lg"
                                >
                                    Save Changes
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <div className="text-xs uppercase font-bold tracking-wider opacity-60 mb-1">Target Role</div>
                                    <div className="text-3xl font-bold">{data?.profile.targetRole || "Set a target role"}</div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase font-bold tracking-wider opacity-60 mb-1">Dream Company</div>
                                    <div className="text-3xl font-bold">{data?.profile.targetCompany || "Set a target company"}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 2. Key Stats */}
                <motion.div variants={item} className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col justify-center">
                    <h3 className="text-slate-500 dark:text-slate-400 font-semibold mb-6 uppercase tracking-wider text-xs">Performance</h3>

                    <div className="space-y-6">
                        <div className="flex items-end justify-between">
                            <div>
                                <div className="text-4xl font-extrabold text-slate-900 dark:text-white">{data?.profile.averageScore?.toFixed(0) || 0}</div>
                                <div className="text-sm text-slate-500 font-medium">Avg. Score</div>
                            </div>
                            <div className="h-10 w-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                                +12%
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${data?.profile.averageScore || 0}%` }} />
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-between">
                            <div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">{data?.profile.sessionsCompleted}</div>
                                <div className="text-xs text-slate-500">Sessions</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">5d</div>
                                <div className="text-xs text-slate-500">Streak</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 3. Strengths & Weaknesses */}
                <motion.div variants={item} className="md:col-span-2 p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">AI Insight Analysis</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">💪</div>
                                <h4 className="font-bold text-emerald-900 dark:text-emerald-400">Core Strengths</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(data?.profile.strengths?.length ? data.profile.strengths : ["Consistency", "Technical Depth", "Python"]).map((s: string, i: number) => (
                                    <span key={i} className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-100 rounded-lg text-red-600">🚧</div>
                                <h4 className="font-bold text-red-900 dark:text-red-400">Focus Areas</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(data?.profile.weaknesses?.length ? data.profile.weaknesses : ["System Design", "Communication", "Graph Algos"]).map((s: string, i: number) => (
                                    <span key={i} className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-700 dark:text-red-300">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 4. Settings Card */}
                <motion.div variants={item} className="p-8 rounded-3xl bg-slate-900 text-slate-300 shadow-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-white font-bold text-lg mb-2">Settings</h3>
                        <p className="text-sm opacity-60 mb-6">Manage your preferences and account data.</p>

                        <div className="space-y-3">
                            <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-sm flex justify-between items-center group">
                                <span>Dark Mode</span>
                                <span className="w-8 h-4 bg-emerald-500 rounded-full relative">
                                    <span className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                                </span>
                            </button>
                            <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-sm flex justify-between items-center">
                                <span>Notifications</span>
                                <span className="text-xs font-bold bg-slate-600 px-2 py-0.5 rounded">ON</span>
                            </button>
                        </div>
                    </div>
                    <button className="mt-8 w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-bold transition-colors">
                        Sign Out
                    </button>
                </motion.div>

            </motion.div>
        </div>
    );
}
