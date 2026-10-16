"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartPie, List, Plus } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { APP_NAME } from "@/lib/app-name";

const NAV = [
  { href: "/", label: "Overview", icon: ChartPie, active: (p: string) => p === "/" },
  { href: "/records", label: "Records", icon: List, active: (p: string) => p === "/records" },
] as const;

const ADD_ACTIVE = (p: string) => p === "/records/new";

// Wide screens: nav and actions in the top bar. Phone (<= 760 px): wordmark and Log out on top,
// Overview / Records / Add record in a bottom tab bar. Only one "Add record" is visible at a time.
export function AppHeader() {
  const pathname = usePathname();
  const addActive = ADD_ACTIVE(pathname);

  return (
    <>
      <header className="border-b border-rule bg-sheet">
        <div className="mx-auto flex min-h-16 max-w-4xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-lg font-semibold tracking-tight text-accent">
              {APP_NAME}
            </Link>
            <nav aria-label="Main" className="hidden self-stretch tab:flex tab:gap-6">
              {NAV.map(({ href, label, active }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={active(pathname) ? "page" : undefined}
                  className="flex items-center border-b-2 border-transparent pt-0.5 text-muted hover:text-ink aria-[current=page]:border-accent aria-[current=page]:font-medium aria-[current=page]:text-ink"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/records/new"
              aria-current={addActive ? "page" : undefined}
              className="hidden min-h-11 items-center gap-2 rounded-control bg-accent px-4 font-medium whitespace-nowrap text-white hover:bg-accent-hover tab:inline-flex"
            >
              <Plus aria-hidden className="size-5" />
              Add record
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-t border-rule bg-sheet tab:hidden"
      >
        {[
          ...NAV.map((n) => ({ ...n, isActive: n.active(pathname) })),
          { href: "/records/new", label: "Add record", icon: Plus, isActive: addActive },
        ].map(({ href, label, icon: Icon, isActive }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-muted aria-[current=page]:font-medium aria-[current=page]:text-accent"
          >
            <Icon aria-hidden className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
