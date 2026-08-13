/**
 * Privacy Airlock — fail-closed containment for private intention classes.
 *
 * Computer-side research simulation only. Does not protect real implants,
 * vendor clouds, or physical device compromise. Blocks private intention
 * tags from gated output, exports, and untrusted sinks until the user unlocks.
 */

import type {
  IntentClass,
  IntentionSample,
  PrivacySettings,
  SessionLogEntry,
} from "@/lib/types";

/** Airlock modes — sealed is default-deny for private + untrusted sinks. */
export type PrivacyMode = "sealed" | "public_only" | "unlocked";

/** Outbound sink trust levels. */
export type PrivacySink =
  | "local_ui"
  | "export"
  | "suite_bus"
  | "external_ws";

export interface PrivacyAudit {
  blockedPrivateSamples: number;
  blockedExports: number;
  redactedExports: number;
  blockedSinkAttempts: number;
  lastBlockReason: string | null;
  lastBlockAt: number | null;
  lastBlockClass: IntentClass | null;
  /** Samples that almost left via gated path (same as blocked for airlock) */
  almostLeaked: number;
}

export interface AirlockDecision {
  allow: boolean;
  reason: string;
  /** True if sample is in privateClasses */
  isPrivate: boolean;
  /** Display class (may be redacted for UI when sealed) */
  displayClass: IntentClass | "REDACTED" | string;
}

export const DEFAULT_AUDIT: PrivacyAudit = {
  blockedPrivateSamples: 0,
  blockedExports: 0,
  redactedExports: 0,
  blockedSinkAttempts: 0,
  lastBlockReason: null,
  lastBlockAt: null,
  lastBlockClass: null,
  almostLeaked: 0,
};

export function resolvePrivacyMode(privacy: PrivacySettings): PrivacyMode {
  // mode is source of truth; keep unlocked flag in sync via store actions
  if (privacy.mode === "unlocked" || (privacy.unlocked && !privacy.gateActive)) {
    return "unlocked";
  }
  if (privacy.mode === "public_only") return "public_only";
  if (privacy.mode === "sealed") return "sealed";
  // Legacy bridge
  if (!privacy.gateActive) return "unlocked";
  if (privacy.unlocked) return "unlocked";
  return "sealed";
}

export function isPrivateClass(
  c: IntentClass,
  privateClasses: IntentClass[],
): boolean {
  return privateClasses.includes(c);
}

/**
 * Fail-closed: private classes blocked unless mode === unlocked.
 * public_only and sealed both block private classes on the gated stream.
 */
export function decideAirlock(
  sample: IntentionSample,
  privacy: PrivacySettings,
  sessionLocked: boolean,
): AirlockDecision {
  const mode = resolvePrivacyMode(privacy);
  const isPrivate = isPrivateClass(sample.intentClass, privacy.privateClasses);

  if (sessionLocked) {
    return {
      allow: false,
      reason: "Session locked — all intention output sealed",
      isPrivate,
      displayClass:
        isPrivate && mode !== "unlocked" ? "REDACTED" : sample.intentClass,
    };
  }

  if (isPrivate && mode !== "unlocked") {
    return {
      allow: false,
      reason:
        mode === "sealed"
          ? "Privacy airlock SEALED — private class blocked (fail-closed)"
          : "Public-only mode — private class blocked",
      isPrivate: true,
      displayClass: privacy.redactLabelsWhenSealed ? "REDACTED" : sample.intentClass,
    };
  }

  return {
    allow: true,
    reason: "Allowed through airlock",
    isPrivate,
    displayClass: sample.intentClass,
  };
}

/**
 * Whether an outbound sink may receive raw/gated stream data.
 * sealed → only local_ui (and even then private is already stripped)
 * public_only → local_ui + export (redacted) ; suite_bus/ws only public
 * unlocked → all sinks (still computer-side sim)
 */
export function sinkAllowed(
  sink: PrivacySink,
  privacy: PrivacySettings,
): { allow: boolean; reason: string } {
  const mode = resolvePrivacyMode(privacy);

  if (mode === "unlocked") {
    return { allow: true, reason: "Airlock unlocked — sink permitted (sim)" };
  }

  if (mode === "sealed") {
    if (sink === "local_ui") {
      return {
        allow: true,
        reason: "Local UI only while sealed (private still fail-closed)",
      };
    }
    return {
      allow: false,
      reason: `SEALED — outbound sink "${sink}" blocked`,
    };
  }

  // public_only
  if (sink === "external_ws" || sink === "suite_bus") {
    return {
      allow: false,
      reason: `Public-only — untrusted sink "${sink}" blocked`,
    };
  }
  return { allow: true, reason: "Public-only — trusted local sink" };
}

/** Redact private classes from log messages / structured data for export. */
export function redactLogEntry(
  entry: SessionLogEntry,
  privacy: PrivacySettings,
): SessionLogEntry {
  if (resolvePrivacyMode(privacy) === "unlocked" && !privacy.alwaysRedactExports) {
    return entry;
  }
  let message = entry.message;
  for (const c of privacy.privateClasses) {
    message = message.split(c).join("REDACTED");
  }
  const data = entry.data ? { ...entry.data } : undefined;
  if (data) {
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === "string") {
        let s = v;
        for (const c of privacy.privateClasses) {
          s = s.split(c).join("REDACTED");
        }
        data[k] = s;
      }
    }
  }
  return { ...entry, message, data };
}

export function redactSampleForExport(
  sample: IntentionSample,
  privacy: PrivacySettings,
): IntentionSample | null {
  const mode = resolvePrivacyMode(privacy);
  const priv = isPrivateClass(sample.intentClass, privacy.privateClasses);
  if (priv && (mode !== "unlocked" || privacy.alwaysRedactExports)) {
    if (privacy.dropPrivateOnExport) return null;
    return {
      ...sample,
      intentClass: "private_thought", // kept for type; meta marks redacted
      vx: 0,
      vy: 0,
      clickProb: 0,
      confidence: 0,
      meta: {
        ...sample.meta,
        redacted: true,
        originalClass: "REDACTED",
        airlock: true,
      },
    };
  }
  return sample;
}

export function recordBlock(
  audit: PrivacyAudit,
  reason: string,
  cls: IntentClass | null,
  t = Date.now(),
): PrivacyAudit {
  return {
    ...audit,
    blockedPrivateSamples: audit.blockedPrivateSamples + 1,
    almostLeaked: audit.almostLeaked + 1,
    lastBlockReason: reason,
    lastBlockAt: t,
    lastBlockClass: cls,
  };
}

export function recordSinkBlock(audit: PrivacyAudit, reason: string): PrivacyAudit {
  return {
    ...audit,
    blockedSinkAttempts: audit.blockedSinkAttempts + 1,
    lastBlockReason: reason,
    lastBlockAt: Date.now(),
  };
}

export function recordExportRedaction(audit: PrivacyAudit): PrivacyAudit {
  return {
    ...audit,
    redactedExports: audit.redactedExports + 1,
  };
}

export function privacyModeLabel(mode: PrivacyMode): string {
  switch (mode) {
    case "sealed":
      return "PRIVATE SEALED";
    case "public_only":
      return "PUBLIC ONLY";
    case "unlocked":
      return "AIRLOCK OPEN";
  }
}
