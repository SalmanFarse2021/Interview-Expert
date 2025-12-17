import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-md mb-8 animate-fade-in shadow-lg shadow-primary/10">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            FAANG-ready career OS
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-7xl lg:text-8xl mb-6 animate-fade-in drop-shadow-sm" style={{ animationDelay: "0.1s" }}>
            Clarity-first prep with{" "}
            <span className="text-gradient block mt-2 sm:inline sm:mt-0">
              Interview Expert
            </span>
            .
          </h1>

          <p className="mx-auto max-w-2xl text-xl text-slate-600 dark:text-slate-300 mb-10 animate-fade-in leading-relaxed" style={{ animationDelay: "0.2s" }}>
            Analyze JDs, optimize your resume, and run mock interviews with
            instant feedback—all in a calm, light interface tuned for ATS
            and hiring managers.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link href="/resume" className="btn-primary text-base px-8 py-4">
              Optimize my resume
            </Link>
            <Link href="/job-match" className="btn-secondary text-base px-8 py-4">
              Match a job
            </Link>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 dark:text-slate-400 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10">
                <svg className="h-4 w-4 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              ATS-aware rewrites
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10">
                <svg className="h-4 w-4 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Live interview scoring
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10">
                <svg className="h-4 w-4 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Roadmaps & projects
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full h-full max-w-7xl overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 blur-[100px] animate-pulse-slow" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-[100px] animate-float" style={{ animationDelay: "4s" }} />
      </div>
    </section>
  );
}
