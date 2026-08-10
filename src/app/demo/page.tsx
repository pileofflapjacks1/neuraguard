"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useGuardStore } from "@/lib/store";
import { StateGauges } from "@/components/gauges";
import { PolicyStatusPanel } from "@/components/policy-panel";

/**
 * Scripted demo tour — starts synthetic stream and cycles injections.
 * No account, no external services.
 */
export default function DemoPage() {
  const start = useGuardStore((s) => s.start);
  const stop = useGuardStore((s) => s.stop);
  const setInjection = useGuardStore((s) => s.setInjection);
  const setSource = useGuardStore((s) => s.setSource);
  const running = useGuardStore((s) => s.running);
  const state = useGuardStore((s) => s.state);
  const injection = useGuardStore((s) => s.injection);

  useEffect(() => {
    setSource("synthetic");
    start();
    const steps: { at: number; inj: Parameters<typeof setInjection>[0]; note: string }[] = [
      { at: 4000, inj: "none", note: "baseline" },
      { at: 8000, inj: "distraction", note: "distraction" },
      { at: 16000, inj: "private_spike", note: "private spike" },
      { at: 24000, inj: "fatigue", note: "fatigue" },
      { at: 36000, inj: "anomaly", note: "anomaly" },
      { at: 48000, inj: "none", note: "recover" },
    ];
    const timers = steps.map((s) =>
      setTimeout(() => setInjection(s.inj), s.at),
    );
    return () => {
      timers.forEach(clearTimeout);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for tour
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live demo tour</h1>
        <p className="mt-1 max-w-2xl text-sm text-guard-muted">
          Auto-starts the synthetic intention stream and cycles distraction →
          private spike → fatigue → anomaly. No external services required.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-cyan-500/40 bg-cyan-950/50 px-3 py-1 text-xs font-semibold text-cyan-100">
          {running ? "Tour running" : "Tour stopped"} · injection: {injection}
        </span>
        <Link href="/" className="guard-btn guard-btn-primary text-sm no-underline">
          Open full dashboard
        </Link>
        <button
          type="button"
          className="guard-btn guard-btn-secondary text-sm"
          onClick={() => (running ? stop() : start())}
        >
          {running ? "Stop" : "Restart tour stream"}
        </button>
      </div>

      <StateGauges state={state} />
      <PolicyStatusPanel />

      <ol className="guard-card list-decimal space-y-2 pl-5 text-sm text-guard-muted">
        <li>0–8s: baseline synthetic stream, baseline capture warms up</li>
        <li>8–16s: distraction — load/entropy rise</li>
        <li>16–24s: private-thought spike — privacy gate blocks classes</li>
        <li>24–36s: fatigue — throttle / low-effort mode</li>
        <li>36–48s: anomaly — sensitive pause, possible lock pressure</li>
        <li>48s+: recover to baseline injection</li>
      </ol>
    </div>
  );
}
