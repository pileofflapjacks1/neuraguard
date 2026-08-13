"use client";

import { useGuardStore } from "@/lib/store";
import { StreamControls } from "./stream-controls";
import { StateGauges } from "./gauges";
import { StateCharts } from "./state-charts";
import { PolicyStatusPanel } from "./policy-panel";
import { AuthPanel } from "./auth-panel";
import { SessionLogPanel } from "./session-log";
import { HowItWorksPanel } from "./how-it-works-panel";
import { DriftPanel } from "./drift-panel";
import { PrivacyAirlockPanel } from "./privacy-airlock-panel";

export function Dashboard() {
  const state = useGuardStore((s) => s.state);
  const history = useGuardStore((s) => s.stateHistory);
  const features = useGuardStore((s) => s.features);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-guard-muted">
            Continuous neural-state firewall — fatigue, agency, and a{" "}
            <strong className="text-violet-200">privacy airlock</strong> that
            fail-closes private intention classes so they don’t leave this app
            until you unlock. Research / simulation only.
          </p>
        </div>
        {features ? (
          <div className="rounded-xl border border-guard-border bg-guard-panel px-3 py-2 font-mono text-xs text-guard-muted">
            speed={features.meanSpeed.toFixed(2)} · entropy=
            {features.classEntropy.toFixed(2)} · conf=
            {features.meanConfidence.toFixed(2)} ·{" "}
            {features.dominantClass}
            {state.driftAdapting ? " · drift↑" : ""}
          </div>
        ) : null}
      </div>

      <StateGauges state={state} />

      <div className="grid gap-4 lg:grid-cols-2">
        <StreamControls />
        <PolicyStatusPanel />
      </div>

      <PrivacyAirlockPanel />

      <DriftPanel />

      <StateCharts history={history} />

      <div className="grid gap-4 lg:grid-cols-2">
        <AuthPanel />
        <SessionLogPanel />
      </div>

      <HowItWorksPanel compact />
    </div>
  );
}
