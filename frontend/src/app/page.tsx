import Link from "next/link";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Workflow } from "@/components/landing/workflow";
import { Stats } from "@/components/landing/stats";
import { ProfileAuthActions } from "@/components/profile-auth-actions";

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden">
      <main className="flex-1 flex flex-col">
        <div className="relative">
          <Hero />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-12 lg:-mt-20 relative z-20 mb-20">
            <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-end">
              <div className="hidden lg:block">
                {/* Spacer to align stats correctly with hero content */}
              </div>
              <Stats />
            </div>
          </div>
        </div>

        <Features />

        <Workflow />

        <section className="py-24 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-black px-8 py-20 shadow-2xl ring-1 ring-white/10">
              {/* Background Gradients */}
              <div className="absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/3 rounded-full bg-primary/40 blur-[100px] animate-pulse-slow" />
              <div className="absolute bottom-0 left-0 h-96 w-96 translate-y-1/3 -translate-x-1/4 rounded-full bg-violet-500/40 blur-[100px] animate-float" />

              <div className="relative flex flex-col gap-10 md:flex-row md:items-center md:justify-between z-10">
                <div className="space-y-6 max-w-2xl">
                  <p className="text-sm font-bold uppercase tracking-wider text-indigo-400">
                    Calm, focused, shipping
                  </p>
                  <h3 className="text-4xl font-bold text-white sm:text-5xl leading-tight">
                    Start where it matters—your next role and the proof for it.
                  </h3>
                  <p className="text-xl text-slate-300">
                    Bring a resume and a job link. We map skills, rewrite bullets,
                    and keep interview drills honest so you move with confidence.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                  <Link
                    href="/resume"
                    className="btn-primary bg-white text-primary hover:bg-slate-50 hover:text-indigo-700 shadow-xl border-transparent px-8 py-4 text-base"
                  >
                    Upload resume
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
                Your Career Hub
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Manage authentication, keep your artifacts synced, and resume where you left off.
              </p>
            </div>

            <div className="mx-auto max-w-lg glass-card rounded-3xl p-10 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800">
              <div className="flex flex-col items-center gap-8">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl shadow-inner shadow-primary/20">
                  👤
                </div>
                <div className="w-full">
                  <ProfileAuthActions />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  Secure access powered by NextAuth.js
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

