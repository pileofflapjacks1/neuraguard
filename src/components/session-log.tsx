"use client";

import { useGuardStore } from "@/lib/store";
import { buildExportBundle, exportCsv, exportJson } from "@/lib/export";
import { formatTime } from "@/lib/utils";

export function SessionLogPanel() {
  const log = useGuardStore((s) => s.log);
  const stateHistory = useGuardStore((s) => s.stateHistory);
  const recentActions = useGuardStore((s) => s.recentActions);

  function doExportJson() {
    const bundle = buildExportBundle(
      useGuardStore.getState().stateHistory,
      useGuardStore.getState().recentActions,
      useGuardStore.getState().log,
    );
    // Include full policy history from log-derived actions for demo
    exportJson({
      ...bundle,
      policies: [
        ...recentActions,
        ...useGuardStore
          .getState()
          .log.filter((e) => e.kind === "policy")
          .map((e) => ({
            type: "none" as const,
            reason: e.message,
            t: e.t,
            severity: "info" as const,
          })),
      ],
    });
  }

  function doExportCsv() {
    exportCsv(
      buildExportBundle(stateHistory, recentActions, log),
    );
  }

  return (
    <div className="guard-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Session log</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="guard-btn guard-btn-secondary text-sm"
            onClick={doExportJson}
          >
            Export JSON
          </button>
          <button
            type="button"
            className="guard-btn guard-btn-secondary text-sm"
            onClick={doExportCsv}
          >
            Export CSV
          </button>
        </div>
      </div>
      <ul
        className="max-h-64 space-y-1 overflow-y-auto text-sm"
        aria-label="Session event log"
      >
        {log.map((e, i) => (
          <li
            key={`${e.t}-${i}`}
            className="flex gap-2 border-b border-guard-border/50 py-1.5"
          >
            <time
              className="shrink-0 font-mono text-xs text-guard-muted"
              dateTime={new Date(e.t).toISOString()}
            >
              {formatTime(e.t)}
            </time>
            <span
              className={`shrink-0 rounded px-1.5 text-xs font-medium uppercase ${
                e.kind === "policy"
                  ? "bg-amber-950 text-amber-200"
                  : e.kind === "auth"
                    ? "bg-rose-950 text-rose-200"
                    : e.kind === "privacy"
                      ? "bg-violet-950 text-violet-200"
                      : e.kind === "stream"
                        ? "bg-cyan-950 text-cyan-200"
                        : "bg-slate-800 text-slate-300"
              }`}
            >
              {e.kind}
            </span>
            <span className="text-guard-fg">{e.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
