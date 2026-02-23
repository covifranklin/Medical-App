"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const navItems = [
  { href: "/", label: "Body Map" },
  { href: "/check-in", label: "Check-in" },
  { href: "/conditions", label: "Ailments" },
  { href: "/plans", label: "Plans" },
  { href: "/daily", label: "Daily Routine" },
  { href: "/history", label: "History" },
];

export default function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Don't show nav on auth page
  if (pathname === "/auth") return null;

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-gray-900">
            PhysioTracker
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {session?.user && (
              <>
                <span className="ml-3 border-l border-gray-200 pl-3 text-sm text-gray-500">
                  {session.user.name}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth" })}
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
