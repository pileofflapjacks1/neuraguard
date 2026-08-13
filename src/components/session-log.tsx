"use client";

import { useGuardStore } from "@/lib/store";
import {
  buildExportBundle,
  canExport,
  exportCsv,
  exportJson,
} from "@/lib/export";
import { formatTime } from "@/lib/utils";

export function SessionLogPanel() {
  const log = useGuardStore((s) => s.log);
  const stateHistory = useGuardStore((s) => s.stateHistory);
  const recentActions = useGuardStore((s) => s.recentActions);
  const privacy = useGuardStore((s) => s.privacy);
  const noteExportRedaction = useGuardStore((s) => s.noteExportRedaction);
  const noteSinkBlock = useGuardStore((s) => s.noteSinkBlock);

  function doExportJson() {
    const check = canExport(privacy);
    if (!check.allow) {
      noteSinkBlock(check.reason);
      return;
    }
    const st = useGuardStore.getState();
    const bundle = buildExportBundle(
      st.stateHistory,
      st.recentActions,
      st.log,
      st.privacy,
      st._samples,
    );
    if (bundle.redacted) noteExportRedaction();
    exportJson({
      ...bundle,
      policies: [
        ...recentActions,
        ...st.log
          .filter((e) => e.kind === "policy")
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
    const check = canExport(privacy);
    if (!check.allow) {
      noteSinkBlock(check.reason);
      return;
    }
    const bundle = buildExportBundle(
      stateHistory,
      recentActions,
      log,
      privacy,
    );
    if (bundle.redacted) noteExportRedaction();
    exportCsv(bundle);
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
            title="Blocked when airlock is SEALED"
          >
            Export JSON
          </button>
          <button
            type="button"
            className="guard-btn guard-btn-secondary text-sm"
            onClick={doExportCsv}
            title="Blocked when airlock is SEALED"
          >
            Export CSV
          </button>
        </div>
      </div>
      <p className="text-xs text-guard-muted">
        Exports are blocked in <strong>SEALED</strong> mode.{" "}
        <strong>Public only</strong> / unlocked allow redacted exports by
        default.
      </p>
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
