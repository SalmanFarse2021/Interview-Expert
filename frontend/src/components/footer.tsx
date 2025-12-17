import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              IE
            </div>
            <span className="font-bold text-slate-900 dark:text-white">
              Interview Expert
            </span>
          </div>
          <p className="text-sm max-w-xs">
            A calmer way to prep interviews, resumes, and targeted outreach.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
          <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Contact
          </Link>
          <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
            v2.0
          </span>
        </div>
      </div>
    </footer>
  );
}

