"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { InterviewChat } from "@/components/interview-chat";

export default function InterviewPage() {
    const router = useRouter();

    // Setup State
    const [file, setFile] = useState<File | null>(null);
    const [jdText, setJdText] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(""); // "Analyzing Resume...", etc.

    // Session State
    const [session, setSession] = useState<any>(null);

    const handleSetup = async () => {
        if (!file || !jdText) return;
        setLoading(true);
        setStatus("Analyzing Resume... (This uses Gemini Vision)");

        try {
            // 1. Analyze Resume
            const resumeFormData = new FormData();
            resumeFormData.append("file", file);

            const resumeRes = await fetch("/api/resume/analyze", {
                method: "POST",
                body: resumeFormData,
            });
            let resumeJson;
            try {
                resumeJson = await resumeRes.json();
            } catch (e) {
                resumeJson = { error: resumeRes.statusText || "Failed to parse resume analysis response" };
            }

            if (!resumeRes.ok) {
                throw new Error(resumeJson.detail || resumeJson.error || "Resume analysis failed");
            }
            const resumeData = resumeJson;

            setStatus("Analyzing Job Description...");

            // 2. Analyze Job Description
            const jdRes = await fetch("/api/job/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: jdText }),
            });
            let jdJson;
            try {
                jdJson = await jdRes.json();
            } catch (e) {
                jdJson = { error: jdRes.statusText || "Failed to parse job analysis response" };
            }

            if (!jdRes.ok) {
                throw new Error(jdJson.detail || jdJson.error || "Job analysis failed");
            }
            const jdData = jdJson;

            setStatus("Initializing Interview Loop...");

            // 3. Initialize Session
            const initRes = await fetch("/api/interview/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resumeId: resumeData.id,
                    jobDescriptionId: jdData.id,
                    type: "SCREENING", // Default for now
                    difficulty: "MEDIUM"
                }),
            });
            let initJson;
            try {
                initJson = await initRes.json();
            } catch (e) {
                initJson = { error: initRes.statusText || "Failed to parse session initialization response" };
            }

            if (!initRes.ok) {
                throw new Error(initJson.detail || initJson.error || "Initialization failed");
            }
            const sessionData = initJson;

            setSession(sessionData);
            setStatus("");

        } catch (err: any) {
            console.error(err);
            alert(`Error: ${err.message}`);
            setStatus("Failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                        AI Interview Coach
                    </h1>
                    <p className="mt-4 text-xl text-slate-600 dark:text-slate-300">
                        Upload your resume and a job description. We'll simulate the rest.
                    </p>
                </div>

                {!session ? (
                    <div className="bg-white dark:bg-slate-800 shadow-xl rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="p-8 sm:p-12 grid gap-8 md:grid-cols-2">

                            {/* Left: Resume */}
                            <div className="space-y-4">
                                <label className="block text-lg font-semibold text-slate-900 dark:text-white">
                                    1. Your Resume (PDF)
                                </label>
                                <div className="mt-2 flex justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 px-6 py-10 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors relative">
                                    <div className="text-center">
                                        {file ? (
                                            <div className="text-emerald-600 font-medium">
                                                Selected: {file.name}
                                                <button onClick={() => setFile(null)} className="block mx-auto mt-2 text-xs text-red-500 underline">Change</button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="mx-auto h-12 w-12 text-slate-400">📄</div>
                                                <div className="mt-4 flex text-sm leading-6 text-slate-600 dark:text-slate-400 justify-center">
                                                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-transparent font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-indigo-500">
                                                        <span>Upload a file</span>
                                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                                    </label>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">PDF, DOCX up to 5MB</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Job Description */}
                            <div className="space-y-4">
                                <label className="block text-lg font-semibold text-slate-900 dark:text-white">
                                    2. Job Description
                                </label>
                                <textarea
                                    className="w-full h-48 rounded-xl border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-4 text-sm focus:ring-primary focus:border-primary scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600"
                                    placeholder="Paste the job requirements here..."
                                    value={jdText}
                                    onChange={(e) => setJdText(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-6 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                            <div className="text-sm text-slate-500">
                                {loading && <span className="animate-pulse">✨ {status}</span>}
                            </div>
                            <button
                                onClick={handleSetup}
                                disabled={loading || !file || !jdText}
                                className="btn-primary py-3 px-8 text-lg shadow-lg shadow-primary/25"
                            >
                                {loading ? "Preparing..." : "Start Interview Loop →"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        <InterviewChat sessionId={session.id} />
                    </div>
                )}
            </div>
        </div>
    );
}
