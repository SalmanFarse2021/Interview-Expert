import Link from "next/link";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Resume", href: "/resume" },
  { label: "Interview", href: "/interview" },
  { label: "Profile", href: "/profile" },
];

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo Section */}
          <Link href="/" className="ml-2 flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/30 transition-transform group-hover:scale-110">
              <span className="font-bold text-lg">IE</span>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-primary transition-colors">
                Interview Expert
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Career OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full transition-all duration-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 mr-2">
            <Link href="/dashboard" className="hidden sm:inline-flex btn-primary py-2 px-6 text-sm">
              Dashboard
            </Link>
            <Link href="/profile" className="xl:hidden inline-flex btn-secondary py-2 px-4 text-sm">
              Menu
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

