"use client";

import { SessionLogPanel } from "@/components/session-log";
import { StateCharts } from "@/components/state-charts";
import { useGuardStore } from "@/lib/store";
import { formatTime } from "@/lib/utils";

export default function HistoryPage() {
  const history = useGuardStore((s) => s.stateHistory);
  const log = useGuardStore((s) => s.log);
  const state = useGuardStore((s) => s.state);

  const policyEvents = log.filter((e) => e.kind === "policy" || e.kind === "privacy" || e.kind === "auth");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Session History</h1>
        <p className="mt-1 max-w-2xl text-sm text-guard-muted">
          State history, policy triggers, and privacy events for the current
          browser session. Export JSON/CSV for offline analysis.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {(
          [
            ["Load", state.cognitiveLoad],
            ["Focus", state.focus],
            ["Fatigue", state.fatigue],
            ["Agency", state.agency],
          ] as const
        ).map(([label, v]) => (
          <div key={label} className="guard-card text-center">
            <div className="guard-label">{label} (now)</div>
            <div className="mt-1 font-mono text-2xl font-bold">
              {v.toFixed(0)}
            </div>
          </div>
        ))}
      </div>

      <StateCharts history={history} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SessionLogPanel />
        <div className="guard-card space-y-2">
          <h2 className="text-sm font-semibold">Policy & privacy events</h2>
          <ul className="max-h-80 space-y-1 overflow-y-auto text-sm">
            {policyEvents.length === 0 ? (
              <li className="text-guard-muted">
                No policy events yet — run the simulator and inject fatigue or
                private spikes.
              </li>
            ) : (
              policyEvents.map((e, i) => (
                <li
                  key={`${e.t}-${i}`}
                  className="border-b border-guard-border/40 py-1.5"
                >
                  <time className="font-mono text-xs text-guard-muted">
                    {formatTime(e.t)}
                  </time>{" "}
                  <span className="text-cyan-200">{e.kind}</span> — {e.message}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
