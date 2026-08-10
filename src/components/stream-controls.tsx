"use client";

import { useRef } from "react";
import { useGuardStore } from "@/lib/store";
import type { SimulatorInjection, StreamSource } from "@/lib/types";

const INJECTIONS: { id: SimulatorInjection; label: string; desc: string }[] = [
  { id: "none", label: "None", desc: "Baseline synthetic stream" },
  { id: "fatigue", label: "Fatigue", desc: "Slower motion, lower confidence" },
  {
    id: "distraction",
    label: "Distraction",
    desc: "High variance + class hopping",
  },
  {
    id: "private_spike",
    label: "Private spike",
    desc: "Inner-speech / private-thought burst",
  },
  {
    id: "anomaly",
    label: "Anomaly",
    desc: "Sudden distribution shift",
  },
];

export function StreamControls() {
  const fileRef = useRef<HTMLInputElement>(null);
  const running = useGuardStore((s) => s.running);
  const source = useGuardStore((s) => s.source);
  const injection = useGuardStore((s) => s.injection);
  const hz = useGuardStore((s) => s.hz);
  const wsUrl = useGuardStore((s) => s.wsUrl);
  const lastSample = useGuardStore((s) => s.lastSample);
  const lastGated = useGuardStore((s) => s.lastGatedSample);
  const bandwidth = useGuardStore((s) => s.bandwidth);

  const start = useGuardStore((s) => s.start);
  const stop = useGuardStore((s) => s.stop);
  const resetSession = useGuardStore((s) => s.resetSession);
  const setSource = useGuardStore((s) => s.setSource);
  const setInjection = useGuardStore((s) => s.setInjection);
  const setHz = useGuardStore((s) => s.setHz);
  const setWsUrl = useGuardStore((s) => s.setWsUrl);
  const loadCsvText = useGuardStore((s) => s.loadCsvText);

  async function loadSampleCsv() {
    const res = await fetch("/samples/synthetic-session.csv");
    const text = await res.text();
    loadCsvText(text);
  }

  return (
    <div className="guard-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Intention stream</h2>
        <div className="flex flex-wrap gap-2">
          {!running ? (
            <button type="button" className="guard-btn guard-btn-primary" onClick={start}>
              Start stream
            </button>
          ) : (
            <button type="button" className="guard-btn guard-btn-danger" onClick={stop}>
              Stop
            </button>
          )}
          <button
            type="button"
            className="guard-btn guard-btn-secondary"
            onClick={resetSession}
          >
            Reset session
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="guard-label">Source</span>
          <select
            className="guard-input"
            value={source}
            onChange={(e) => setSource(e.target.value as StreamSource)}
          >
            <option value="synthetic">Synthetic simulator</option>
            <option value="csv">CSV replay</option>
            <option value="mock_ws">Mock WebSocket</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="guard-label">Sample rate (Hz)</span>
          <input
            type="number"
            min={5}
            max={60}
            className="guard-input"
            value={hz}
            onChange={(e) => setHz(Number(e.target.value))}
          />
        </label>
      </div>

      {source === "csv" && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="guard-btn guard-btn-secondary"
            onClick={loadSampleCsv}
          >
            Load sample CSV
          </button>
          <button
            type="button"
            className="guard-btn guard-btn-secondary"
            onClick={() => fileRef.current?.click()}
          >
            Upload CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              loadCsvText(await f.text());
            }}
          />
        </div>
      )}

      {source === "mock_ws" && (
        <label className="block space-y-1 text-sm">
          <span className="guard-label">
            WebSocket URL (optional — empty = in-process mock)
          </span>
          <input
            className="guard-input font-mono text-sm"
            placeholder="ws://127.0.0.1:8765/intent"
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
          />
        </label>
      )}

      <fieldset>
        <legend className="guard-label mb-2">Inject scenario</legend>
        <div className="flex flex-wrap gap-2">
          {INJECTIONS.map((inj) => (
            <button
              key={inj.id}
              type="button"
              title={inj.desc}
              aria-pressed={injection === inj.id}
              className={`guard-btn text-sm ${
                injection === inj.id
                  ? "guard-btn-primary"
                  : "guard-btn-secondary"
              }`}
              onClick={() => setInjection(inj.id)}
            >
              {inj.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2 rounded-xl border border-guard-border bg-guard-bg/60 p-3 font-mono text-xs sm:grid-cols-2">
        <div>
          <div className="guard-label mb-1">Raw sample</div>
          {lastSample ? (
            <pre className="overflow-x-auto whitespace-pre-wrap text-guard-fg">
              {`vx=${lastSample.vx.toFixed(2)} vy=${lastSample.vy.toFixed(2)}
click=${lastSample.clickProb.toFixed(2)} conf=${lastSample.confidence.toFixed(2)}
class=${lastSample.intentClass}`}
            </pre>
          ) : (
            <span className="text-guard-muted">—</span>
          )}
        </div>
        <div>
          <div className="guard-label mb-1">
            Gated / throttled (factor {bandwidth.factor.toFixed(2)})
          </div>
          {lastGated ? (
            <pre className="overflow-x-auto whitespace-pre-wrap text-emerald-300/90">
              {`vx=${lastGated.vx.toFixed(2)} vy=${lastGated.vy.toFixed(2)}
click=${lastGated.clickProb.toFixed(2)}
class=${lastGated.intentClass} ✓`}
            </pre>
          ) : (
            <span className="text-rose-300/90">
              {lastSample
                ? `Blocked (${lastSample.intentClass})`
                : "—"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
