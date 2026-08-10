"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SimulatorBadge } from "./simulator-badge";

const LINKS = [
  { href: "/", label: "Live Dashboard" },
  { href: "/policies", label: "Policy Editor" },
  { href: "/history", label: "Session History" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/demo", label: "Demo" },
  { href: "/a11y", label: "A11y" },
  { href: "/disclaimer", label: "Disclaimer" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-guard-border bg-guard-panel/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-guard-fg no-underline hover:text-cyan-200"
          >
            Neura<span className="text-cyan-400">Guard</span>
          </Link>
          <span className="hidden text-xs text-guard-muted sm:inline">
            Continuous neural-state firewall
          </span>
          <SimulatorBadge />
        </div>
        <nav aria-label="Main" className="flex flex-wrap gap-1">
          {LINKS.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors ${
                  active
                    ? "bg-cyan-950/70 text-cyan-100 ring-1 ring-cyan-500/40"
                    : "text-guard-muted hover:bg-guard-panel-2 hover:text-guard-fg"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
