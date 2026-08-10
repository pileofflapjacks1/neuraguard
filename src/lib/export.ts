/**
 * Session log export — JSON / CSV.
 */

import type { CognitiveState, PolicyAction, SessionLogEntry } from "@/lib/types";
import { downloadBlob } from "@/lib/utils";

export interface ExportBundle {
  exportedAt: string;
  disclaimer:
    "NeuraGuard research simulation only. Not a medical device. Not implant software. Not affiliated with Neuralink.";
  states: CognitiveState[];
  policies: PolicyAction[];
  log: SessionLogEntry[];
}

export function buildExportBundle(
  states: CognitiveState[],
  policies: PolicyAction[],
  log: SessionLogEntry[],
): ExportBundle {
  return {
    exportedAt: new Date().toISOString(),
    disclaimer:
      "NeuraGuard research simulation only. Not a medical device. Not implant software. Not affiliated with Neuralink.",
    states,
    policies,
    log,
  };
}

export function exportJson(bundle: ExportBundle): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  downloadBlob(`neuraguard-session-${Date.now()}.json`, blob);
}

export function exportCsv(bundle: ExportBundle): void {
  const header =
    "t,cognitiveLoad,focus,fatigue,agency,anomalyScore,biometricMatch\n";
  const rows = bundle.states
    .map(
      (s) =>
        `${s.t},${s.cognitiveLoad.toFixed(2)},${s.focus.toFixed(2)},${s.fatigue.toFixed(2)},${s.agency.toFixed(2)},${s.anomalyScore.toFixed(2)},${s.biometricMatch.toFixed(2)}`,
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  downloadBlob(`neuraguard-states-${Date.now()}.csv`, blob);
}
