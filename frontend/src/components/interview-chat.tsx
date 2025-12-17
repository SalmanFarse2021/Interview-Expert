
"use client";

import React, { useState, useEffect, useRef } from "react";

type Message = {
    id: string;
    role: "assistant" | "user" | "system";
    content: string;
    type?: string; // "question" | "answer" | "feedback"
    metadata?: any; // Score, feedback details
};

export function InterviewChat({ sessionId }: { sessionId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("Initializing...");
    const [report, setReport] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Initial Load: Get First Question
    useEffect(() => {
        fetchNextQuestion();
    }, []);

    const fetchNextQuestion = async () => {
        setLoading(true);
        setStatus("Interviewer is thinking...");
        try {
            const res = await fetch("/api/interview/next", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
            });
            if (!res.ok) throw new Error("Failed to fetch question");

            const data = await res.json();

            if (data.isComplete) {
                setStatus("Generating Final Report...");
                await fetchReport();
                return;
            }

            // Add Question Message
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: data.question,
                    type: "question",
                    metadata: {
                        type: data.type,
                        difficulty: data.difficulty,
                        hints: data.hints
                    }
                }
            ]);
            setStatus("awaiting_input");
        } catch (err) {
            console.error(err);
            setStatus("Error fetching question.");
        } finally {
            setLoading(false);
        }
    };

    const fetchReport = async () => {
        try {
            const res = await fetch("/api/interview/results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
            });
            if (!res.ok) throw new Error("Failed to fetch results");
            const data = await res.json();
            setReport(data);
        } catch (err) {
            console.error(err);
            setStatus("Failed to generate report.");
        }
    };

    const handleSubmitAnswer = async () => {
        if (!input.trim()) return;
        const answerText = input;
        setInput("");
        setLoading(true);

        // Add User Answer immediately
        const userMsgId = Date.now().toString();
        setMessages(prev => [
            ...prev,
            { id: userMsgId, role: "user", content: answerText, type: "answer" }
        ]);

        setStatus("Evaluating answer...");

        try {
            // Find the last question to link context
            const lastQuestion = messages.filter(m => m.type === "question").pop();

            const res = await fetch("/api/interview/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    question: lastQuestion?.content || "Unknown",
                    answer: answerText,
                    type: lastQuestion?.metadata?.type
                }),
            });

            if (!res.ok) throw new Error("Submission failed");
            const feedback = await res.json();

            // Add System Feedback
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: "system",
                    content: feedback.feedback,
                    type: "feedback",
                    metadata: feedback
                }
            ]);

            // Auto-fetch next question after short delay
            setTimeout(() => {
                fetchNextQuestion();
            }, 2000);

        } catch (err) {
            console.error(err);
            setStatus("Error submitting answer.");
            setLoading(false);
        }
    };

    if (report) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-full bg-emerald-100 text-emerald-600 text-4xl mb-4">🏆</div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Interview Complete</h2>
                    <p className="text-slate-600 dark:text-slate-300 mt-2">Here is your FAANG Readiness Report</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-1 bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
                        <div className="text-sm font-bold uppercase text-slate-500 mb-2">Overall Score</div>
                        <div className={`text-5xl font-extrabold ${report.overallScore >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {report.overallScore}
                        </div>
                        <div className="text-sm font-medium mt-2 text-slate-600 dark:text-slate-400">{report.readinessLevel}</div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 h-full">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Executive Summary</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{report.summary}</p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Skill Heatmap</h3>
                        <div className="space-y-3">
                            {report.heatmap?.map((item: any) => (
                                <div key={item.topic}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600 dark:text-slate-400">{item.topic}</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.score}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                            style={{ width: `${item.score}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20">
                            <h4 className="font-bold text-green-800 dark:text-green-400 text-sm mb-2">✅ Key Strengths</h4>
                            <ul className="list-disc list-inside text-xs text-green-700 dark:text-green-300 space-y-1">
                                {report.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/20">
                            <h4 className="font-bold text-red-800 dark:text-red-400 text-sm mb-2">⚠️ Areas for Improvement</h4>
                            <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-300 space-y-1">
                                {report.weaknesses?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Live Interview Session</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">ID: {sessionId.slice(-6)}</div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl p-5 shadow-sm ${msg.role === "user"
                            ? "bg-primary text-white rounded-br-none"
                            : msg.role === "assistant"
                                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-bl-none"
                                : "bg-slate-100 dark:bg-slate-800 border border-emerald-200/50 w-full max-w-full" // System/Feedback
                            }`}>

                            {/* Metadata Header for Assistant */}
                            {msg.role === "assistant" && msg.metadata && (
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-600 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                                        {msg.metadata.type}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        {msg.metadata.difficulty}
                                    </span>
                                </div>
                            )}

                            {/* Content */}
                            <div className="whitespace-pre-wrap leading-relaxed">
                                {msg.content}
                            </div>

                            {/* Feedback Metadata */}
                            {msg.type === "feedback" && msg.metadata && (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="block text-xs uppercase text-slate-500 font-bold">Score</span>
                                            <span className={`font-bold ${msg.metadata.score >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {msg.metadata.score}/100
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-xs uppercase text-slate-500 font-bold">Suggestion</span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                                {msg.metadata.improvements}
                                            </p>
                                        </div>
                                    </div>

                                    {/* NEW: STAR Framework Analysis */}
                                    {msg.metadata.starAnalysis && (
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                            <h5 className="font-bold text-sm mb-3 text-slate-700 dark:text-slate-300">STAR Framework Analysis</h5>

                                            {/* STAR Components Grid */}
                                            <div className="grid grid-cols-4 gap-2 mb-3">
                                                {['Situation', 'Task', 'Action', 'Result'].map((component, i) => {
                                                    const key = `has${component}` as keyof typeof msg.metadata.starAnalysis;
                                                    const present = msg.metadata.starAnalysis[key];
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`p-2 rounded-lg text-center text-xs font-semibold transition-all ${present
                                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                                }`}
                                                        >
                                                            {component} {present ? '✓' : '✗'}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* STAR Score */}
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">STAR Completeness</span>
                                                <span className={`text-sm font-bold ${msg.metadata.starAnalysis.starScore >= 75 ? 'text-emerald-600' :
                                                        msg.metadata.starAnalysis.starScore >= 50 ? 'text-amber-600' :
                                                            'text-red-600'
                                                    }`}>
                                                    {msg.metadata.starAnalysis.starScore}%
                                                </span>
                                            </div>

                                            {/* Missing Components Warning */}
                                            {msg.metadata.starAnalysis.missingComponents.length > 0 && (
                                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
                                                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">
                                                        ⚠️ Missing: {msg.metadata.starAnalysis.missingComponents.join(', ')}
                                                    </p>
                                                    <details className="text-xs">
                                                        <summary className="cursor-pointer font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                                            See STAR-compliant version
                                                        </summary>
                                                        <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                                                            {msg.metadata.starAnalysis.rewriteSuggestion}
                                                        </p>
                                                    </details>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {loading && status !== "Evaluating answer..." && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-700 rounded-2xl rounded-bl-none p-4 shadow-sm border border-slate-200 dark:border-slate-600">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                <div className="relative flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitAnswer();
                            }
                        }}
                        disabled={loading || status !== "awaiting_input"}
                        placeholder={status === "awaiting_input" ? "Type your answer here..." : "Interviewer is speaking..."}
                        className="w-full rounded-xl border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-3 pr-12 focus:ring-primary focus:border-primary resize-none disabled:opacity-50"
                        rows={2}
                    />
                    <button
                        onClick={handleSubmitAnswer}
                        disabled={loading || !input.trim() || status !== "awaiting_input"}
                        className="absolute right-2 bottom-2 p-2 rounded-lg bg-primary text-white hover:bg-indigo-600 disabled:bg-slate-300 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
                <div className="text-center mt-2 text-xs text-slate-400">
                    {loading ? status : "Press Enter to send"}
                </div>
            </div>
        </div>
    );
}
