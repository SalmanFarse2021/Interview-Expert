"use client";

import { diffWords } from "diff";
import React, { useCallback, useMemo, useState } from "react";
import ResumeDetail from "@/components/resume-detail";

type AnalysisResponse = {
  id?: string;
  atsScore?: number | null;
  strengths?: string[];
  weaknesses?: string[];
  keywords?: string[];
  skills?: string[];
  bulletPoints?: string[];
  rewritten?: string | null;
  rewrittenFull?: string | null;
  comparisonNote?: string | null;
  rawText?: string;
  // New Structured Fields
  workExperience?: { role: string; company: string; duration: string; description: string }[];
  projects?: { name: string; tech: string; description: string; impact: string }[];
  leadership?: { role: string; organization: string; duration: string; description: string }[];
  education?: { degree: string; school: string; year: string }[];
};

type RewriteResponse = {
  rewritten?: string | null;
  rewrittenFull?: string | null;
  bulletPoints?: string[];
  keywords?: string[];
  skills?: string[];
  rawText?: string;
  // Structured Rewrites
  workExperience?: { role: string; company: string; duration: string; description: string; bullets: string[] }[];
  projects?: { name: string; tech: string; description: string; bullets: string[] }[];
  leadership?: { role: string; organization: string; bullets: string[] }[];
};

type ExampleResume = string | Record<string, unknown>;

type JobInsights = {
  summary?: string;
  jobData?: Record<string, string>;
  requirements?: string[];
  techStack?: string[];
  exampleResume?: ExampleResume;
};

type TailoredInsights = {
  resumeSuggestions?: string[];
  tailoredBullets?: string[];
  gaps?: string[];
  exampleResume?: ExampleResume;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [alignLoading, setAlignLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [alignError, setAlignError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [originalText, setOriginalText] = useState<string>("");

  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [clLoading, setClLoading] = useState(false);
  const [clError, setClError] = useState<string | null>(null);

  const [jobDescription, setJobDescription] = useState("");
  const [jobInsights, setJobInsights] = useState<JobInsights | null>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);
  const [tailored, setTailored] = useState<TailoredInsights | null>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleJobExtract = useCallback(async () => {
    if (!jobDescription.trim()) {
      setJobError("Paste the job description first.");
      return;
    }
    setJobLoading(true);
    setJobError(null);
    try {
      const res = await fetch("/api/job-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.error || "Unable to read job description");
      }
      const data = (await res.json()) as JobInsights;
      setJobInsights(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to analyze job description.";
      setJobError(msg);
    } finally {
      setJobLoading(false);
    }
  }, [jobDescription]);

  const handleUpload = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!file) return;
      setLoading(true);
      setError(null);
      setResult(null);
      setRewriteError(null);
      setTailored(null);
      setAlignError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API_BASE_URL}/api/resume/analyze`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({}));
          throw new Error(detail?.detail || detail?.error || "Request failed");
        }
        const data = (await res.json()) as AnalysisResponse;
        setResult(data);
        setOriginalText(data.rawText ?? "");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to analyze resume. Please try again.";
        setError(msg);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [file]
  );

  const handleRewrite = useCallback(async () => {
    if (!result?.id && !result?.rewritten && !result?.bulletPoints) return;
    setRewriteLoading(true);
    setRewriteError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/resume/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: result?.id, text: originalText }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail || detail?.error || "Rewrite failed");
      }
      const data = (await res.json()) as RewriteResponse;
      setResult((prev) =>
        prev
          ? {
            ...prev,
            rawText: data.rawText ?? prev.rawText,
            rewritten: data.rewritten ?? prev.rewritten,
            rewrittenFull: data.rewrittenFull ?? prev.rewrittenFull ?? data.rewritten,
            bulletPoints: data.bulletPoints ?? prev.bulletPoints,
            keywords: data.keywords ?? prev.keywords,
            skills: data.skills ?? prev.skills,
            // Merge structured rewrites
            workExperience: data.workExperience ?? prev.workExperience,
            projects: data.projects ?? prev.projects,
            leadership: data.leadership ?? prev.leadership,
          }
          : prev
      );
      if (data.rawText) setOriginalText(data.rawText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Rewrite failed";
      setRewriteError(msg);
      console.error(err);
    } finally {
      setRewriteLoading(false);
    }
  }, [result?.id, result?.rewritten, result?.bulletPoints, originalText]);

  const handleAlignToJob = useCallback(async () => {
    if (!jobDescription.trim()) {
      setAlignError("Paste the job description first.");
      return;
    }
    const resumeText = originalText || result?.rawText;
    if (!resumeText) {
      setAlignError("Upload and analyze your resume first.");
      return;
    }
    setAlignLoading(true);
    setAlignError(null);
    try {
      const res = await fetch("/api/job-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, resumeText }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.error || "Could not tailor to job.");
      }
      const data = (await res.json()) as TailoredInsights & JobInsights;
      setTailored({
        resumeSuggestions: data.resumeSuggestions,
        tailoredBullets: data.tailoredBullets,
        gaps: data.gaps,
        exampleResume: data.exampleResume,
      });
      if (data.summary || data.jobData || data.requirements || data.techStack) {
        setJobInsights((prev) => ({
          summary: data.summary ?? prev?.summary,
          jobData: data.jobData ?? prev?.jobData,
          requirements: data.requirements ?? prev?.requirements,
          techStack: data.techStack ?? prev?.techStack,
          exampleResume: data.exampleResume ?? prev?.exampleResume,
        }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not tailor to job.";
      setAlignError(msg);
    } finally {
      setAlignLoading(false);
    }
  }, [jobDescription, originalText, result?.rawText]);

  const handleGenerateCoverLetter = async () => {
    if (!result?.id) return;
    setClLoading(true);
    setClError(null);
    try {
      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: result.id,
          jobDescriptionId: tailored ? undefined : undefined // We could pass ID if we stored it
        }),
      });
      if (!res.ok) throw new Error("Failed to generate cover letter");
      const data = await res.json();
      setCoverLetter(data.coverLetter);
    } catch (err) {
      setClError("Could not generate cover letter. Try again.");
    } finally {
      setClLoading(false);
    }
  };

  const scoreBadge = useMemo(() => {
    if (!result?.atsScore && result?.atsScore !== 0) return null;
    const score = result.atsScore;
    const tone =
      score >= 80
        ? "text-emerald-700 bg-emerald-50"
        : score >= 60
          ? "text-amber-700 bg-amber-50"
          : "text-rose-700 bg-rose-50";
    return (
      <span className={`rounded-full px-3 py-2 text-sm font-semibold ${tone}`}>
        ATS Score: {score}
      </span>
    );
  }, [result?.atsScore]);

  return (
    <div className="min-h-screen pb-20 pt-10 text-slate-900">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header - Always visible but smaller when analyzing */}
        <div className={`transition-all duration-500 ease-in-out ${result ? "mb-8 gap-0" : "mb-16 text-center gap-4"} flex flex-col`}>
          {!result && (
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 shadow-sm">
              <span>✨ AI-Powered Career Agent</span>
            </div>
          )}
          <h1 className={`font-bold tracking-tight text-slate-900 transition-all ${result ? "text-2xl" : "text-4xl md:text-5xl"}`}>
            {result ? "Resume Intelligence Dashboard" : "Resume Intelligence & Optimization"}
          </h1>
          {!result && (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Upload your resume to get FAANG-grade analysis, ATS scoring, and targeted rewrite suggestions tailored to your dream job.
            </p>
          )}
        </div>

        {/* Main Content Area */}
        <div className={`grid gap-8 transition-all duration-500 ${result ? "lg:grid-cols-[380px_1fr]" : "max-w-3xl mx-auto"}`}>

          {/* Left Column (or Center Hero when no result) */}
          <div className="flex flex-col gap-6">

            {/* Upload Card */}
            <div
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragOver={(e) => { e.preventDefault(); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDrop={handleDrop}
              className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-300 ${dragActive
                  ? "border-indigo-400 bg-indigo-50/80 scale-[1.02]"
                  : result
                    ? "border-slate-200 bg-white/80 p-6"
                    : "border-slate-200/60 bg-white/60 p-10 hover:border-indigo-200 hover:shadow-xl"
                }`}
            >
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl opacity-50" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-100/50 blur-3xl opacity-50" />

              <div className={`relative z-10 flex flex-col items-center text-center ${result ? "gap-3" : "gap-6"}`}>
                <div className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg ${result ? "h-12 w-12" : "h-20 w-20"}`}>
                  <svg className={`w-1/2 h-1/2`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>

                <div className="space-y-1">
                  <p className={`font-semibold text-slate-900 ${result ? "text-sm" : "text-xl"}`}>
                    {file ? file.name : "Upload Resume (PDF/DOCX)"}
                  </p>
                  {!result && !file && <p className="text-sm text-slate-500">Drag & drop or click to browse</p>}
                </div>

                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />

                {(file || result) && (
                  <div className="z-20 w-full pt-2">
                    <button
                      onClick={handleUpload}
                      disabled={loading || !file}
                      className={`btn-primary w-full shadow-md transition-all ${loading ? "opacity-80 cursor-wait" : "hover:scale-[1.02]"}`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing...
                        </span>
                      ) : result ? "Re-Analyze" : "Analyze Resume"}
                    </button>
                  </div>
                )}
                {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
              </div>
            </div>

            {/* Context/JD Input */}
            <div className={`rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm transition-all duration-500 ${result ? "opacity-100" : "opacity-90 hover:opacity-100"}`}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Target Role</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">Optional</span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste Job Description to unlock Gap Analysis & Targeted Rewrites..."
                className="min-h-[120px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
              <button
                onClick={handleJobExtract}
                disabled={jobLoading || !jobDescription}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50"
              >
                {jobLoading ? "Processing..." : "Extract Keywords"}
              </button>
              {jobInsights && (
                <div className="mt-4 space-y-2 rounded-xl bg-indigo-50/50 p-3 text-xs">
                  <p className="font-semibold text-indigo-900">Detected Signals:</p>
                  <div className="flex flex-wrap gap-1">
                    {jobInsights.techStack?.slice(0, 5).map(t => (
                      <span key={t} className="rounded border border-indigo-100 bg-white px-1.5 py-0.5 text-indigo-700">{t}</span>
                    ))}
                  </div>
                  <p className="text-slate-500 line-clamp-2">{jobInsights.summary}</p>
                </div>
              )}
            </div>

            {/* Dashboard Actions */}
            {result && (
              <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm space-y-3">
                <h3 className="font-semibold text-slate-900">Optimization Actions</h3>
                <button
                  onClick={handleAlignToJob}
                  disabled={alignLoading || !jobDescription}
                  className="flex w-full items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-left text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                >
                  <span>Tailor to Job</span>
                  {alignLoading && <span className="animate-spin">↻</span>}
                </button>
                <button
                  onClick={handleRewrite}
                  disabled={rewriteLoading}
                  className="flex w-full items-center justify-between rounded-xl bg-indigo-50 px-4 py-3 text-left text-sm font-semibold text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
                >
                  <span>Polish Resume</span>
                  {rewriteLoading && <span className="animate-spin">↻</span>}
                </button>
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={clLoading}
                  className="flex w-full items-center justify-between rounded-xl bg-purple-50 px-4 py-3 text-left text-sm font-semibold text-purple-800 hover:bg-purple-100 disabled:opacity-50"
                >
                  <span>Generate Cover Letter</span>
                  {clLoading && <span className="animate-spin">↻</span>}
                </button>
                {(rewriteError || alignError || clError) && (
                  <p className="text-xs text-rose-600">{rewriteError || alignError || clError}</p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Analysis Results */}
          <div className="flex flex-col gap-8 min-w-0">
            {result ? (
              <>
                {/* Main Detail View */}
                <ResumeDetail result={result} />

                {/* Tailored Insights */}
                {tailored && (
                  <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <h2 className="mb-4 text-xl font-bold text-slate-900">Alignment Strategy</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card title="Suggested Adds" tone="warn" icon="💡" items={tailored.gaps} />
                      <Card title="Bullet Point Upgrades" tone="good" icon="⚡" items={tailored.tailoredBullets} />
                    </div>
                  </div>
                )}

                {/* Cover Letter Modal/Section */}
                {coverLetter && (
                  <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 relative rounded-3xl border border-purple-200 bg-white p-8 shadow-lg">
                    <div className="absolute top-4 right-4 text-xs text-purple-500 font-bold uppercase tracking-wider">Generated Cover Letter</div>
                    <h3 className="mb-4 text-xl font-bold text-slate-900">Cover Letter Draft</h3>
                    <div className="prose prose-sm prose-slate max-w-none text-slate-700 whitespace-pre-line">
                      {coverLetter}
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(coverLetter)} className="mt-4 text-xs font-semibold text-purple-600 hover:underline">
                      Copy to Clipboard
                    </button>
                  </div>
                )}

                {/* Advanced Side-by-Side Comparison */}
                {(result.rewritten || result.rewrittenFull) && (
                  <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <h2 className="mb-6 text-2xl font-bold text-slate-900">Side-by-Side Optimization</h2>

                    {/* Loop through sections */}
                    <div className="space-y-12">

                      {/* Projects Side-by-Side */}
                      {result.projects && result.projects.length > 0 && (
                        <div>
                          <div className="mb-4 flex items-center gap-2">
                            <span className="text-xl">🚀</span><h3 className="text-lg font-bold">Projects</h3>
                          </div>
                          <div className="space-y-6">
                            {result.projects.map((proj, i) => (
                              <SideBySideBox
                                key={i}
                                title={proj.name}
                                original={proj.description + "\n" + (proj.impact || "")} // Fallback if no bullets extracted yet
                                refined={
                                  // Try to find matching rewritten project
                                  // This relies on the AI returning orderly data or us parsing it correctly.
                                  // For now, if simple structure, show rewritten summary or bullet improvements
                                  (result as any).projects?.[i]?.bullets?.join("\n") || "AI is optimizing this section..."
                                  // Ideally we use a strict index match if we updated schema fully
                                }
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Work Experience Side-by-Side */}
                      {result.workExperience && result.workExperience.length > 0 && (
                        <div>
                          <div className="mb-4 flex items-center gap-2">
                            <span className="text-xl">💼</span><h3 className="text-lg font-bold">Experience</h3>
                          </div>
                          <div className="space-y-6">
                            {result.workExperience.map((exp, i) => (
                              <SideBySideBox
                                key={i}
                                title={`${exp.role} @ ${exp.company}`}
                                original={exp.description}
                                refined={
                                  (result as any).workExperience?.[i]?.bullets?.join("\n") || "Optimizing..."
                                }
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full Text Comparison (Fallback or Summary) */}
                      {(!result.projects && !result.workExperience) && (
                        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                          <div className="grid grid-cols-2 bg-slate-50 p-4 border-b border-slate-100 font-semibold text-slate-500">
                            <div>Original</div>
                            <div className="text-emerald-600">Refined</div>
                          </div>
                          <div className="grid grid-cols-2 divide-x divide-slate-100 min-h-[400px]">
                            <div className="p-6 text-sm text-slate-600 whitespace-pre-wrap">{originalText}</div>
                            <div className="p-6 text-sm text-slate-800 bg-emerald-50/10 whitespace-pre-wrap">{result.rewrittenFull ?? result.rewritten}</div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="hidden animate-in fade-in zoom-in-95 duration-700 lg:block opacity-60 hover:opacity-100 transition-opacity">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { title: "Semantic Analysis", desc: "Beyond keywords. We understand impact & seniority.", icon: "🧠" },
                    { title: "ATS Simulation", desc: "Real-time scoring against modern tracking systems.", icon: "🎯" },
                    { title: "Gap Detection", desc: "Paste a JD to see exactly what you're missing.", icon: "🔍" },
                    { title: "AI Rewriter", desc: "One-click polish or targeted tailoring.", icon: "✨" }
                  ].map((feature, i) => (
                    <div key={i} className="rounded-2xl border border-slate-100 p-6">
                      <div className="mb-2 text-2xl">{feature.icon}</div>
                      <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                      <p className="text-sm text-slate-500">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SideBySideBox({ title, original, refined }: { title: string, original: string, refined: string }) {
  const diff = diffWords(original || "", refined || "");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 font-bold text-slate-800 text-sm">{title}</div>
      <div className="grid grid-cols-2 divide-x divide-slate-100">
        <div className="p-5 text-sm text-slate-500 whitespace-pre-wrap leading-relaxed">
          {original}
        </div>
        <div className="p-5 text-sm text-slate-800 bg-emerald-50/10 leading-relaxed whitespace-pre-wrap">
          {diff.map((part, i) => {
            if (part.added) return <span key={i} className="bg-emerald-100 text-emerald-800 font-semibold px-0.5 rounded">{part.value}</span>;
            if (part.removed) return null; // Don't show removed text in the Right box, just show the new version.
            return <span key={i}>{part.value}</span>;
          })}
        </div>
      </div>
    </div>
  )
}

// Re-defining Card and DiffColumn at the end of file to ensure clean replacement if I cut them off
function Card({
  title,
  items,
  body,
  tone,
  wide,
  children,
  icon
}: {
  title: string;
  items?: string[];
  body?: string[] | ExampleResume | null;
  tone?: "warn" | "good";
  wide?: boolean;
  children?: React.ReactNode;
  icon?: string;
}) {
  const toneClass =
    tone === "warn"
      ? "border-amber-200/80 bg-amber-50/30"
      : tone === "good"
        ? "border-emerald-200/80 bg-emerald-50/30"
        : "border-slate-200/80 bg-white/90";

  return (
    <div
      className={`rounded-2xl border ${toneClass} p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] ${wide ? "lg:col-span-2" : ""
        }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon && <span>{icon}</span>}
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>

      {items && items.length > 0 && (
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {items.map((item, i) => (
            <li key={i}>• {item}</li>
          ))}
        </ul>
      )}
      {renderBody(body)}
      {children}
      {!items?.length && !body && !children && (
        <p className="mt-2 text-sm text-slate-500">No data available.</p>
      )}
    </div>
  );
}

function renderBody(body?: string[] | ExampleResume | null) {
  if (!body) return null;

  if (typeof body === "string") {
    return (
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
        {body}
      </p>
    );
  }

  if (Array.isArray(body)) {
    return (
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {body.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    );
  }

  const entries = Object.entries(body);
  return (
    <div className="mt-3 space-y-2 text-sm text-slate-600">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{key}</p>
          <p className="whitespace-pre-line text-sm text-slate-800">
            {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
          </p>
        </div>
      ))}
    </div>
  );
}

function DiffColumn({
  title,
  text,
  rewritten,
  mode,
}: {
  title: string;
  text: string;
  rewritten: string;
  mode: "added" | "removed";
}) {
  // This function is kept for completeness in the file but unused in new design if we used a inline replacement
  // But wait, I used it in the dashboard view above, so it is needed.
  const parts = useMemo(() => diffWords(text || "", rewritten || ""), [text, rewritten]);
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]">
      <h3 className="mb-3 text-base font-semibold text-slate-900">{title}</h3>
      <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {parts.map((part, idx) => {
          if (part.added) {
            return (
              <span
                key={idx}
                className={mode === "added" ? "text-emerald-700 font-semibold" : "text-slate-400"}
              >
                {part.value}
              </span>
            );
          }
          if (part.removed) {
            return (
              <span
                key={idx}
                className={mode === "removed" ? "text-rose-700 line-through" : "hidden"}
              >
                {part.value}
              </span>
            );
          }
          return <span key={idx}>{part.value}</span>;
        })}
      </div>
    </div>
  );
}
