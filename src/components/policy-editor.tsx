"use client";

import { useGuardStore } from "@/lib/store";
import { INTENT_CLASSES, type IntentClass } from "@/lib/types";
import { PolicyStatusPanel } from "./policy-panel";

function ThresholdField({
  label,
  help,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  help: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-cyan-200">{value}</span>
      </span>
      <input
        type="range"
        className="w-full accent-cyan-400"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${value}`}
      />
      <span className="block text-xs text-guard-muted">{help}</span>
    </label>
  );
}

export function PolicyEditor() {
  const thresholds = useGuardStore((s) => s.thresholds);
  const privacy = useGuardStore((s) => s.privacy);
  const setThresholds = useGuardStore((s) => s.setThresholds);
  const setPrivacy = useGuardStore((s) => s.setPrivacy);
  const togglePrivacyClass = useGuardStore((s) => s.togglePrivacyClass);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Policy Editor</h1>
        <p className="mt-1 max-w-2xl text-sm text-guard-muted">
          Edit thresholds for fatigue throttle, micro-breaks, agency pause, and
          the privacy gate. Changes apply immediately to the live policy engine.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="guard-card space-y-4">
          <h2 className="text-sm font-semibold">Thresholds</h2>
          <ThresholdField
            label="Fatigue → throttle"
            help="Above this, bandwidth is reduced and low-effort mode engages."
            value={thresholds.fatigueThrottle}
            min={30}
            max={95}
            onChange={(fatigueThrottle) => setThresholds({ fatigueThrottle })}
          />
          <ThresholdField
            label="Fatigue → force break"
            help="Above this, intention bandwidth drops to zero for a micro-break."
            value={thresholds.fatigueBreak}
            min={50}
            max={100}
            onChange={(fatigueBreak) => setThresholds({ fatigueBreak })}
          />
          <ThresholdField
            label="Load suggest-break"
            help="Sustained cognitive load above this suggests a micro-break."
            value={thresholds.loadSuggest}
            min={40}
            max={100}
            onChange={(loadSuggest) => setThresholds({ loadSuggest })}
          />
          <ThresholdField
            label="Load sustain (seconds)"
            help="How long high load must persist before suggesting a break."
            value={thresholds.loadSustainMs / 1000}
            min={5}
            max={120}
            onChange={(s) => setThresholds({ loadSustainMs: s * 1000 })}
          />
          <ThresholdField
            label="Agency pause"
            help="Below this agency score, sensitive intention classes pause."
            value={thresholds.agencyPause}
            min={5}
            max={70}
            onChange={(agencyPause) => setThresholds({ agencyPause })}
          />
          <ThresholdField
            label="Anomaly pause"
            help="Above this anomaly score, sensitive actions pause."
            value={thresholds.anomalyPause}
            min={30}
            max={100}
            onChange={(anomalyPause) => setThresholds({ anomalyPause })}
          />
          <ThresholdField
            label="Biometric lock"
            help="Below this match score, session requires unlock."
            value={thresholds.biometricLock}
            min={10}
            max={80}
            onChange={(biometricLock) => setThresholds({ biometricLock })}
          />
          <ThresholdField
            label="Throttle factor"
            help="Bandwidth multiplier when fatigue throttle is active."
            value={thresholds.throttleFactor}
            min={0.1}
            max={0.9}
            step={0.05}
            onChange={(throttleFactor) => setThresholds({ throttleFactor })}
          />
          <ThresholdField
            label="Force-break duration (s)"
            help="How long a forced micro-break lasts."
            value={thresholds.forceBreakMs / 1000}
            min={5}
            max={60}
            onChange={(s) => setThresholds({ forceBreakMs: s * 1000 })}
          />
        </div>

        <div className="space-y-4">
          <div className="guard-card space-y-3">
            <h2 className="text-sm font-semibold">Privacy gate</h2>
            <p className="text-xs text-guard-muted">
              Mark intention classes as private. When the gate is active and
              unlocked is false, those classes are blocked until a simulated
              unlock intention / passphrase.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={privacy.gateActive}
                onChange={(e) => setPrivacy({ gateActive: e.target.checked })}
                className="h-4 w-4 accent-cyan-400"
              />
              Privacy gate active
            </label>
            <label className="block space-y-1 text-sm">
              <span className="guard-label">Mental passphrase (demo)</span>
              <input
                className="guard-input font-mono"
                value={privacy.mentalPassphrase}
                onChange={(e) =>
                  setPrivacy({ mentalPassphrase: e.target.value })
                }
              />
            </label>
            <fieldset>
              <legend className="guard-label mb-2">Private classes</legend>
              <div className="flex flex-wrap gap-2">
                {INTENT_CLASSES.map((c: IntentClass) => {
                  const on = privacy.privateClasses.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={on}
                      className={`guard-btn text-xs ${
                        on ? "guard-btn-primary" : "guard-btn-secondary"
                      }`}
                      onClick={() => togglePrivacyClass(c)}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
          <PolicyStatusPanel />
        </div>
      </div>
    </div>
  );
}
