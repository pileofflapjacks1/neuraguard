"use client";

import { useGuardStore } from "@/lib/store";

/**
 * Online drift adaptation status — research UI for baseline non-stationarity tracking.
 */
export function DriftPanel() {
  const state = useGuardStore((s) => s.state);
  const auth = useGuardStore((s) => s.auth);
  const cfg = useGuardStore((s) => s._estConfig);
  const setDriftAdaptEnabled = useGuardStore((s) => s.setDriftAdaptEnabled);
  const setDriftConfig = useGuardStore((s) => s.setDriftConfig);
  const captureAuthBaseline = useGuardStore((s) => s.captureAuthBaseline);

  const gateOk = state.stableTicks >= cfg.driftStableTicks;
  const anomalyOk = state.anomalyScore < cfg.driftAnomalyMax;

  return (
    <div className="guard-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Baseline drift adaptation</h2>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            state.driftAdapting
              ? "border-emerald-500/40 bg-emerald-950/50 text-emerald-200"
              : cfg.driftAdaptEnabled
                ? "border-cyan-500/30 bg-cyan-950/40 text-cyan-100"
                : "border-guard-border bg-guard-bg text-guard-muted"
          }`}
          aria-live="polite"
        >
          {state.driftAdapting
            ? "Adapting now"
            : cfg.driftAdaptEnabled
              ? "Armed · waiting for stability"
              : "Off"}
        </span>
      </div>

      <p className="text-xs text-guard-muted">
        Slow non-stationarity tracking: when anomaly stays low, the auth/anomaly
        baseline drifts toward the current stream so long sessions don’t
        false-lock. Freezes during high anomaly. Research heuristic only.
      </p>

      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="guard-label">Baseline</dt>
          <dd>{auth.baselineReady ? "Ready" : "Warming…"}</dd>
        </div>
        <div>
          <dt className="guard-label">Stable ticks</dt>
          <dd className="font-mono">
            {state.stableTicks}
            <span className="text-guard-muted">
              /{cfg.driftStableTicks}
            </span>
          </dd>
        </div>
        <div>
          <dt className="guard-label">Drift meter</dt>
          <dd className="font-mono">{state.baselineDrift.toFixed(0)}</dd>
        </div>
        <div>
          <dt className="guard-label">Anomaly gate</dt>
          <dd className={anomalyOk ? "text-emerald-300" : "text-amber-200"}>
            {state.anomalyScore.toFixed(0)}{" "}
            <span className="text-guard-muted">
              &lt; {cfg.driftAnomalyMax}
            </span>
          </dd>
        </div>
      </dl>

      <div className="h-2 overflow-hidden rounded-full bg-guard-bg">
        <div
          className="h-full rounded-full bg-cyan-500/70 transition-[width] duration-150"
          style={{
            width: `${Math.min(100, (state.stableTicks / Math.max(1, cfg.driftStableTicks)) * 100)}%`,
          }}
          role="progressbar"
          aria-valuenow={state.stableTicks}
          aria-valuemin={0}
          aria-valuemax={cfg.driftStableTicks}
          aria-label="Stability progress toward drift step"
        />
      </div>
      <p className="text-xs text-guard-muted">
        Gate: {gateOk ? "open" : "closed"} · anomaly{" "}
        {anomalyOk ? "OK" : "too high"} · α_drift={cfg.driftAlpha}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`guard-btn text-sm ${
            cfg.driftAdaptEnabled
              ? "guard-btn-primary"
              : "guard-btn-secondary"
          }`}
          aria-pressed={cfg.driftAdaptEnabled}
          onClick={() => setDriftAdaptEnabled(!cfg.driftAdaptEnabled)}
        >
          {cfg.driftAdaptEnabled ? "Drift ON" : "Drift OFF"}
        </button>
        <button
          type="button"
          className="guard-btn guard-btn-secondary text-sm"
          onClick={captureAuthBaseline}
        >
          Hard-reset baseline
        </button>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="flex justify-between">
          <span className="font-medium">Drift speed (α)</span>
          <span className="font-mono text-cyan-200">{cfg.driftAlpha.toFixed(3)}</span>
        </span>
        <input
          type="range"
          className="w-full accent-cyan-400"
          min={0.001}
          max={0.05}
          step={0.001}
          value={cfg.driftAlpha}
          onChange={(e) =>
            setDriftConfig({ driftAlpha: Number(e.target.value) })
          }
        />
        <span className="text-xs text-guard-muted">
          Higher α tracks faster (noisier). Lower α = slower, safer adaptation.
        </span>
      </label>
    </div>
  );
}
