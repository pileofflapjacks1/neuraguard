/**
 * NeuraGuard / MindGuard — shared types.
 *
 * Research / simulation only. Not a medical device. Not implant firmware.
 * Not affiliated with Neuralink. All neural data is synthetic or mock.
 */

/** Intention classes compatible with suite intent vocabulary + privacy tags. */
export type IntentClass =
  | "pointer"
  | "click"
  | "select"
  | "type"
  | "navigation"
  | "system"
  | "inner_speech"
  | "private_thought";

/** Single sample from an intention stream (synthetic or mock WS/CSV). */
export interface IntentionSample {
  /** Unix ms timestamp */
  t: number;
  /** Velocity-like 2D intention components, typically in [-1, 1] */
  vx: number;
  vy: number;
  /** Probability / strength of a discrete click-like actuate [0, 1] */
  clickProb: number;
  intentClass: IntentClass;
  /** Decoder confidence proxy [0, 1] */
  confidence: number;
  /** Optional free-form metadata for research adapters */
  meta?: Record<string, number | string | boolean>;
}

/** Sliding-window features extracted from the intention stream. */
export interface StreamFeatures {
  t: number;
  /** Mean speed magnitude over the window */
  meanSpeed: number;
  /** Speed variance (higher → more erratic motion) */
  speedVar: number;
  /** Mean absolute acceleration */
  meanAccel: number;
  /** Mean click probability */
  meanClick: number;
  /** Mean decoder confidence */
  meanConfidence: number;
  /** Shannon-like class entropy (normalized 0–1) */
  classEntropy: number;
  /** Fraction of samples tagged private / inner_speech */
  privateRatio: number;
  /** Sample rate estimate (Hz) over the window */
  sampleRateHz: number;
  /** Dominant intent class in the window */
  dominantClass: IntentClass;
}

/** Continuous cognitive-state estimates (all 0–100 unless noted). */
export interface CognitiveState {
  t: number;
  cognitiveLoad: number;
  focus: number;
  fatigue: number;
  agency: number;
  /** Distribution-shift anomaly score 0–100 */
  anomalyScore: number;
  /** Baseline match for continuous auth 0–100 (higher = more like baseline) */
  biometricMatch: number;
}

export type PolicyActionType =
  | "none"
  | "throttle_bandwidth"
  | "low_effort_mode"
  | "suggest_break"
  | "force_break"
  | "pause_sensitive"
  | "block_private"
  | "require_unlock"
  | "lock_session";

export interface PolicyAction {
  type: PolicyActionType;
  reason: string;
  t: number;
  severity: "info" | "warn" | "critical";
}

export interface PolicyThresholds {
  /** Fatigue above this → throttle / low-effort */
  fatigueThrottle: number;
  /** Fatigue above this → force micro-break */
  fatigueBreak: number;
  /** Sustained load above this (ms) → suggest break */
  loadSuggest: number;
  /** Sustained high-load duration (ms) before suggest */
  loadSustainMs: number;
  /** Agency below this → pause sensitive */
  agencyPause: number;
  /** Anomaly above this → pause / lock */
  anomalyPause: number;
  /** Biometric match below this → require unlock */
  biometricLock: number;
  /** Bandwidth multiplier when throttled (0–1) */
  throttleFactor: number;
  /** Force-break duration (ms) */
  forceBreakMs: number;
}

export interface PrivacySettings {
  /** Classes treated as private (blocked when gate is active) */
  privateClasses: IntentClass[];
  /** When true, private classes are blocked until unlock */
  gateActive: boolean;
  /** Session unlocked after mental passphrase / secondary confirm */
  unlocked: boolean;
  /** Simulated mental passphrase (demo only) */
  mentalPassphrase: string;
}

export interface AuthState {
  baselineReady: boolean;
  locked: boolean;
  lastUnlockAt: number | null;
  failCount: number;
}

export type StreamSource = "synthetic" | "csv" | "mock_ws";

export type SimulatorInjection =
  | "none"
  | "fatigue"
  | "distraction"
  | "private_spike"
  | "anomaly";

export interface SessionLogEntry {
  t: number;
  kind: "state" | "policy" | "privacy" | "auth" | "stream" | "system";
  message: string;
  data?: Record<string, unknown>;
}

export interface BandwidthState {
  /** Effective intention bandwidth multiplier 0–1 */
  factor: number;
  lowEffortMode: boolean;
  breakSuggested: boolean;
  breakForced: boolean;
  sensitivePaused: boolean;
  privateBlocked: boolean;
}

export const DEFAULT_THRESHOLDS: PolicyThresholds = {
  fatigueThrottle: 65,
  fatigueBreak: 85,
  loadSuggest: 75,
  loadSustainMs: 30_000,
  agencyPause: 35,
  anomalyPause: 70,
  biometricLock: 40,
  throttleFactor: 0.4,
  forceBreakMs: 15_000,
};

export const DEFAULT_PRIVACY: PrivacySettings = {
  privateClasses: ["inner_speech", "private_thought"],
  gateActive: true,
  unlocked: false,
  mentalPassphrase: "focus",
};

export const INTENT_CLASSES: IntentClass[] = [
  "pointer",
  "click",
  "select",
  "type",
  "navigation",
  "system",
  "inner_speech",
  "private_thought",
];

export const SENSITIVE_CLASSES: IntentClass[] = [
  "system",
  "type",
  "inner_speech",
  "private_thought",
];
