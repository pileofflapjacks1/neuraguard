"use client";

import { useGuardStore } from "@/lib/store";

export function PolicyStatusPanel() {
  const bandwidth = useGuardStore((s) => s.bandwidth);
  const actions = useGuardStore((s) => s.recentActions);
  const auth = useGuardStore((s) => s.auth);
  const privacy = useGuardStore((s) => s.privacy);
  const dismissBreak = useGuardStore((s) => s.dismissBreak);
  const lockSession = useGuardStore((s) => s.lockSession);

  const flags: { on: boolean; label: string; tone: string }[] = [
    {
      on: bandwidth.lowEffortMode,
      label: "Low-effort mode",
      tone: "text-amber-200 border-amber-500/40 bg-amber-950/40",
    },
    {
      on: bandwidth.factor < 1 && bandwidth.factor > 0,
      label: `Throttle ×${bandwidth.factor.toFixed(2)}`,
      tone: "text-amber-200 border-amber-500/40 bg-amber-950/40",
    },
    {
      on: bandwidth.breakSuggested,
      label: "Break suggested",
      tone: "text-amber-100 border-amber-400/50 bg-amber-900/50",
    },
    {
      on: bandwidth.breakForced,
      label: "Break enforced",
      tone: "text-rose-100 border-rose-500/50 bg-rose-950/50",
    },
    {
      on: bandwidth.sensitivePaused,
      label: "Sensitive paused",
      tone: "text-rose-100 border-rose-500/40 bg-rose-950/40",
    },
    {
      on: bandwidth.privateBlocked,
      label: "Private blocked",
      tone: "text-violet-100 border-violet-500/40 bg-violet-950/40",
    },
    {
      on: auth.locked,
      label: "Session locked",
      tone: "text-rose-100 border-rose-400/60 bg-rose-950/60",
    },
    {
      on: privacy.mode === "unlocked" || privacy.unlocked,
      label: "Airlock open",
      tone: "text-emerald-100 border-emerald-500/40 bg-emerald-950/40",
    },
    {
      on: privacy.mode === "sealed",
      label: "Airlock sealed",
      tone: "text-violet-100 border-violet-500/40 bg-violet-950/40",
    },
    {
      on: privacy.mode === "public_only",
      label: "Public only",
      tone: "text-amber-100 border-amber-500/40 bg-amber-950/40",
    },
  ];

  return (
    <div className="guard-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Policy status</h2>
        <div className="flex gap-2">
          {(bandwidth.breakForced || bandwidth.breakSuggested) && (
            <button
              type="button"
              className="guard-btn guard-btn-secondary text-sm"
              onClick={dismissBreak}
            >
              Acknowledge break
            </button>
          )}
          <button
            type="button"
            className="guard-btn guard-btn-danger text-sm"
            onClick={lockSession}
          >
            Lock session
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-live="polite">
        {flags.filter((f) => f.on).length === 0 ? (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-200">
            All clear — full bandwidth
          </span>
        ) : (
          flags
            .filter((f) => f.on)
            .map((f) => (
              <span
                key={f.label}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${f.tone}`}
              >
                {f.label}
              </span>
            ))
        )}
      </div>

      <div>
        <div className="guard-label mb-1">Last triggered actions</div>
        <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
          {actions.length === 0 ? (
            <li className="text-guard-muted">No actions this tick.</li>
          ) : (
            actions.map((a, i) => (
              <li
                key={`${a.type}-${a.t}-${i}`}
                className="rounded-lg border border-guard-border/80 bg-guard-bg/50 px-2 py-1.5"
              >
                <span
                  className={
                    a.severity === "critical"
                      ? "text-rose-300"
                      : a.severity === "warn"
                        ? "text-amber-200"
                        : "text-cyan-200"
                  }
                >
                  {a.type}
                </span>
                <span className="text-guard-muted"> — {a.reason}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
