import { FORMULA_DOCS } from "@/lib/estimate/formulas";

export function HowItWorksPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className="guard-card space-y-3">
      <h2 className="text-sm font-semibold">How estimation works</h2>
      <p className="text-sm text-guard-muted">
        Transparent heuristics on decoded intention streams — not clinical
        models, not implant firmware.
      </p>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-guard-fg">
        <li>
          <strong>Stream ingest</strong> — synthetic / CSV / mock WebSocket
        </li>
        <li>
          <strong>Feature extractor</strong> — sliding-window speed, variance,
          entropy, confidence
        </li>
        <li>
          <strong>State estimator</strong> — EMAs → load, focus, fatigue, agency
        </li>
        <li>
          <strong>Policy engine</strong> — thresholds → throttle / break /
          privacy block
        </li>
        <li>
          <strong>Action dispatcher</strong> — gated sample + UI status
        </li>
      </ol>
      {!compact && (
        <div className="space-y-3 pt-2">
          {(Object.keys(FORMULA_DOCS) as (keyof typeof FORMULA_DOCS)[]).map(
            (k) => {
              const d = FORMULA_DOCS[k];
              return (
                <div
                  key={k}
                  className="rounded-lg border border-guard-border bg-guard-bg/50 p-3"
                >
                  <div className="text-sm font-semibold text-cyan-200">
                    {d.name}
                  </div>
                  <code className="mt-1 block whitespace-pre-wrap font-mono text-xs text-guard-fg">
                    {d.formula}
                  </code>
                  <p className="mt-1 text-xs text-guard-muted">{d.notes}</p>
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
