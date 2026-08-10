"use client";

import type { CognitiveState } from "@/lib/types";

interface GaugeProps {
  label: string;
  value: number;
  hint?: string;
  /** Color ramp: higher is worse (load, fatigue, anomaly) or better (focus, agency, bio) */
  invert?: boolean;
}

function colorFor(value: number, invert?: boolean): string {
  const v = invert ? 100 - value : value;
  if (v >= 70) return "var(--guard-ok)";
  if (v >= 40) return "var(--guard-warn)";
  return "var(--guard-danger)";
}

export function Gauge({ label, value, hint, invert }: GaugeProps) {
  const pct = Math.max(0, Math.min(100, value));
  const stroke = colorFor(pct, invert);
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="guard-card flex flex-col items-center gap-2">
      <div className="guard-label">{label}</div>
      <div
        className="relative h-28 w-28"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-valuetext={`${Math.round(pct)} percent`}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="#1e293b"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-2xl font-bold tabular-nums text-guard-fg">
            {Math.round(pct)}
          </span>
        </div>
      </div>
      {hint ? (
        <p className="text-center text-xs text-guard-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function StateGauges({ state }: { state: CognitiveState }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Gauge
        label="Cognitive Load"
        value={state.cognitiveLoad}
        invert
        hint="Higher → more demand"
      />
      <Gauge label="Focus" value={state.focus} hint="Engagement proxy" />
      <Gauge
        label="Fatigue"
        value={state.fatigue}
        invert
        hint="Accumulates slowly"
      />
      <Gauge label="Agency" value={state.agency} hint="Control confidence" />
      <Gauge
        label="Anomaly"
        value={state.anomalyScore}
        invert
        hint="Distribution shift"
      />
      <Gauge
        label="Biometric match"
        value={state.biometricMatch}
        hint="vs baseline (toy)"
      />
    </div>
  );
}
