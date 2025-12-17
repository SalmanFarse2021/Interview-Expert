"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
    const [stats, setStats] = useState({
        atsScore: 0,
        mockSessions: 0,
        successRate: 0,
        offersTracked: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch stats from backend
        fetch("/api/highlights")
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch stats", err);
                setLoading(false);
            });
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) => (
        <motion.div
            variants={item}
            className="p-6 rounded-3xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl"
        >
            <div className={`p-3 rounded-2xl w-fit mb-4 ${color}`}>
                <span className="text-2xl">{icon}</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        </motion.div>
    );

    const ActionCard = ({ title, desc, href, icon, gradient, delay }: { title: string, desc: string, href: string, icon: string, gradient: string, delay: number }) => (
        <motion.div
            variants={item}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`group relative overflow-hidden rounded-3xl p-8 shadow-2xl border border-white/10 ${gradient}`}
        >
            <Link href={href} className="absolute inset-0 z-10" />

            {/* Background Decorative */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <span className="text-9xl">{icon}</span>
            </div>

            <div className="relative z-20">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl mb-6 shadow-inner text-white">
                    {icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
                <p className="text-white/80 leading-relaxed max-w-[80%]">{desc}</p>

                <div className="mt-8 flex items-center text-white font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Start Now</span>
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen pt-20 pb-20 px-6 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Candidate</span> 👋
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                    Track your progress, optimize your resume, and master your next interview with AI-powered insights.
                </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            >
                <StatCard
                    title="Average ATS Score"
                    value={loading ? "..." : `${stats.atsScore}%`}
                    icon="📊"
                    color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <StatCard
                    title="Mock Sessions"
                    value={loading ? "..." : stats.mockSessions}
                    icon="🎤"
                    color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                />
                <StatCard
                    title="Readiness Score"
                    value={loading ? "..." : `${stats.successRate}%`}
                    icon="🎯"
                    color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                />
                <StatCard
                    title="Jobs Analyzed"
                    value={loading ? "..." : stats.offersTracked}
                    icon="💼"
                    color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                />
            </motion.div>

            {/* Quick Actions */}
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
                <ActionCard
                    title="Resume Optimizer"
                    desc="Analyze your resume against Job Descriptions to boost your ATS score."
                    href="/resume"
                    icon="📄"
                    gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                    delay={0}
                />
                <ActionCard
                    title="Mock Interview"
                    desc="Practice with our AI interviewer. Get real-time feedback and master behavioral questions."
                    href="/interview"
                    icon="🎙️"
                    gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                    delay={0.1}
                />
                <ActionCard
                    title="Career Profile"
                    desc="Manage your skills, target roles, and track your overall improvements over time."
                    href="/profile"
                    icon="👤"
                    gradient="bg-gradient-to-br from-purple-500 to-pink-600"
                    delay={0.2}
                />
            </div>

            {/* Recent Activity Mock */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
                    <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-500">View All</button>
                </div>

                <div className="space-y-4">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl">
                                {i === 0 ? "🎙️" : i === 1 ? "📄" : "🎯"}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-900 dark:text-white">
                                    {i === 0 ? "Completed Mock Interview: Senior Backend" : i === 1 ? "Resume Analysis: Google L4" : "Profile Updated"}
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {i === 0 ? "Score: 85/100 • Just now" : i === 1 ? "ATS Score: 92 • 2 hours ago" : "Added new certification • 5 hours ago"}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                                    Details
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
