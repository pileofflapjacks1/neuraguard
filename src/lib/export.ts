/**
 * Session log export — JSON / CSV with privacy airlock redaction.
 */

import type {
  CognitiveState,
  IntentionSample,
  PolicyAction,
  PrivacySettings,
  SessionLogEntry,
} from "@/lib/types";
import { downloadBlob } from "@/lib/utils";
import {
  redactLogEntry,
  redactSampleForExport,
  resolvePrivacyMode,
  sinkAllowed,
} from "@/lib/privacy/airlock";

export interface ExportBundle {
  exportedAt: string;
  disclaimer: string;
  privacyMode: string;
  redacted: boolean;
  states: CognitiveState[];
  policies: PolicyAction[];
  log: SessionLogEntry[];
  samples?: IntentionSample[];
}

const DISCLAIMER =
  "NeuraGuard research simulation only. Not a medical device. Not implant software. Not affiliated with Neuralink. Privacy airlock is computer-side intention-class containment — not implant encryption.";

export function buildExportBundle(
  states: CognitiveState[],
  policies: PolicyAction[],
  log: SessionLogEntry[],
  privacy?: PrivacySettings,
  samples?: IntentionSample[],
): ExportBundle {
  const mode = privacy ? resolvePrivacyMode(privacy) : "unlocked";
  const shouldRedact =
    !!privacy &&
    (privacy.alwaysRedactExports || mode !== "unlocked");

  const safeLog = privacy
    ? log.map((e) => redactLogEntry(e, privacy))
    : log;

  let safeSamples: IntentionSample[] | undefined;
  if (samples && privacy) {
    safeSamples = samples
      .map((s) => redactSampleForExport(s, privacy))
      .filter((s): s is IntentionSample => s != null);
  }

  return {
    exportedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
    privacyMode: mode,
    redacted: shouldRedact,
    states,
    policies,
    log: safeLog,
    samples: safeSamples,
  };
}

export function canExport(
  privacy: PrivacySettings,
): { allow: boolean; reason: string } {
  return sinkAllowed("export", privacy);
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
