"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

const navItems = [
  { href: "/", label: "Body Map" },
  { href: "/check-in", label: "Check-in" },
  { href: "/conditions", label: "Ailments" },
  { href: "/plans", label: "Plans" },
  { href: "/today", label: "Today" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

const mobileTabItems = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/check-in", label: "Check-in", icon: CheckInIcon },
  { href: "/today", label: "Today", icon: TodayIcon },
  { href: "/history", label: "History", icon: HistoryIcon },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }, [router]);

  if (pathname === "/login" || pathname === "/register") return null;

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Desktop top nav ── */}
      <nav className="hidden md:block border-b border-warm-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-sage-600 flex items-center justify-center">
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-warm-900">PhysioTracker</span>
            </Link>
            <div className="flex items-center gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-sage-100 text-sage-800"
                      : "text-warm-500 hover:bg-warm-100 hover:text-warm-800"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="ml-3 rounded-xl px-3 py-2 text-sm font-medium text-warm-400 hover:bg-warm-100 hover:text-warm-700 transition-all duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile top bar ── */}
      <nav className="md:hidden border-b border-warm-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-sage-600 flex items-center justify-center">
                <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
              <span className="text-base font-bold text-warm-900">PhysioTracker</span>
            </Link>
            <div className="flex gap-1 overflow-x-auto">
              {navItems
                .filter((item) => !mobileTabItems.some((tab) => tab.href === item.href))
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-sage-100 text-sage-800"
                        : "text-warm-500 hover:text-warm-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom tab bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-warm-200 bg-white/90 backdrop-blur-sm safe-area-bottom">
        <div className="flex h-16 items-stretch">
          {mobileTabItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                  active ? "text-sage-600" : "text-warm-400"
                }`}
              >
                <Icon active={active} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Tab bar icons ──

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function CheckInIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 011.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C7.86 4.02 6.75 5.22 6.75 6.638V18a2.25 2.25 0 002.25 2.25h6A2.25 2.25 0 0017.25 18V6.638c0-1.418-1.11-2.618-2.476-2.722a46.9 46.9 0 00-1.124-.08m-5.8 0c-.376.023-.75.05-1.124.08" />
    </svg>
  );
}

function TodayIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

function HistoryIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
