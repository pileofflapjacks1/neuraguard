"use client";

import { useGuardStore } from "@/lib/store";

/** Always-visible Simulator Mode badge. */
export function SimulatorBadge() {
  const running = useGuardStore((s) => s.running);
  const source = useGuardStore((s) => s.source);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/60 px-2.5 py-1 text-xs font-semibold tracking-wide text-cyan-100"
      title="All data is simulated or user-loaded mock data"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${running ? "bg-emerald-400 animate-pulse" : "bg-guard-muted"}`}
        aria-hidden
      />
      SIMULATOR MODE
      <span className="font-normal text-cyan-200/70">· {source}</span>
    </span>
  );
}
