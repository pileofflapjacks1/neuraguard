/**
 * Policy engine: CognitiveState + thresholds → PolicyAction[] + BandwidthState
 *
 * Configurable, inspectable rules. Simulation only — no real implant control.
 */

import type {
  BandwidthState,
  CognitiveState,
  PolicyAction,
  PolicyThresholds,
  PrivacySettings,
  IntentClass,
} from "@/lib/types";
import { SENSITIVE_CLASSES } from "@/lib/types";

export interface PolicyEngineState {
  highLoadSince: number | null;
  lastActions: PolicyAction[];
  breakUntil: number | null;
  sessionLocked: boolean;
}

export function createPolicyEngineState(): PolicyEngineState {
  return {
    highLoadSince: null,
    lastActions: [],
    breakUntil: null,
    sessionLocked: false,
  };
}

export interface PolicyTickResult {
  actions: PolicyAction[];
  bandwidth: BandwidthState;
  engine: PolicyEngineState;
  /** Whether current sample's intent class is allowed through */
  allowClass: (c: IntentClass) => boolean;
}

export function evaluatePolicies(
  state: CognitiveState,
  thresholds: PolicyThresholds,
  privacy: PrivacySettings,
  engine: PolicyEngineState,
  authLocked: boolean,
): PolicyTickResult {
  const now = state.t;
  const actions: PolicyAction[] = [];

  let factor = 1;
  let lowEffortMode = false;
  let breakSuggested = false;
  let breakForced = false;
  let sensitivePaused = false;
  const privateBlocked = privacy.gateActive && !privacy.unlocked;
  let sessionLocked = engine.sessionLocked || authLocked;

  // Sustained high load tracking
  let highLoadSince = engine.highLoadSince;
  if (state.cognitiveLoad >= thresholds.loadSuggest) {
    if (highLoadSince == null) highLoadSince = now;
  } else {
    highLoadSince = null;
  }

  // Clear expired force-break
  let breakUntil = engine.breakUntil;
  if (breakUntil != null && now >= breakUntil) {
    breakUntil = null;
  }

  // --- Rules (order: safety first) ---

  if (authLocked || state.biometricMatch < thresholds.biometricLock) {
    if (state.biometricMatch < thresholds.biometricLock) {
      actions.push({
        type: "require_unlock",
        reason: `Biometric match ${state.biometricMatch.toFixed(0)} < ${thresholds.biometricLock}`,
        t: now,
        severity: "critical",
      });
      sessionLocked = true;
    }
  }

  if (state.anomalyScore >= thresholds.anomalyPause) {
    actions.push({
      type: "pause_sensitive",
      reason: `Anomaly score ${state.anomalyScore.toFixed(0)} ≥ ${thresholds.anomalyPause}`,
      t: now,
      severity: "critical",
    });
    sensitivePaused = true;
    factor = Math.min(factor, 0.2);
  }

  if (state.agency < thresholds.agencyPause) {
    actions.push({
      type: "pause_sensitive",
      reason: `Agency ${state.agency.toFixed(0)} < ${thresholds.agencyPause}`,
      t: now,
      severity: "warn",
    });
    sensitivePaused = true;
  }

  if (state.fatigue >= thresholds.fatigueBreak) {
    actions.push({
      type: "force_break",
      reason: `Fatigue ${state.fatigue.toFixed(0)} ≥ ${thresholds.fatigueBreak}`,
      t: now,
      severity: "critical",
    });
    breakForced = true;
    factor = 0;
    if (breakUntil == null) {
      breakUntil = now + thresholds.forceBreakMs;
    }
  } else if (state.fatigue >= thresholds.fatigueThrottle) {
    actions.push({
      type: "throttle_bandwidth",
      reason: `Fatigue ${state.fatigue.toFixed(0)} ≥ ${thresholds.fatigueThrottle}`,
      t: now,
      severity: "warn",
    });
    actions.push({
      type: "low_effort_mode",
      reason: "High fatigue — reduced intention bandwidth",
      t: now,
      severity: "info",
    });
    factor = Math.min(factor, thresholds.throttleFactor);
    lowEffortMode = true;
  }

  if (
    highLoadSince != null &&
    now - highLoadSince >= thresholds.loadSustainMs &&
    !breakForced
  ) {
    actions.push({
      type: "suggest_break",
      reason: `Load ≥ ${thresholds.loadSuggest} for ${(thresholds.loadSustainMs / 1000).toFixed(0)}s`,
      t: now,
      severity: "warn",
    });
    breakSuggested = true;
  }

  if (privateBlocked) {
    actions.push({
      type: "block_private",
      reason: "Privacy gate active — private classes locked",
      t: now,
      severity: "info",
    });
  }

  if (breakUntil != null && now < breakUntil) {
    breakForced = true;
    factor = 0;
  }

  if (sessionLocked) {
    actions.push({
      type: "lock_session",
      reason: "Session locked — unlock required",
      t: now,
      severity: "critical",
    });
    factor = 0;
  }

  const bandwidth: BandwidthState = {
    factor,
    lowEffortMode,
    breakSuggested,
    breakForced,
    sensitivePaused,
    privateBlocked,
  };

  const allowClass = (c: IntentClass): boolean => {
    if (sessionLocked || breakForced) return false;
    if (privateBlocked && privacy.privateClasses.includes(c)) return false;
    if (sensitivePaused && SENSITIVE_CLASSES.includes(c)) return false;
    return true;
  };

  // Keep a short history of distinct action types (dedupe by type within tick is fine)
  const merged = [...actions, ...engine.lastActions].slice(0, 40);

  return {
    actions,
    bandwidth,
    engine: {
      highLoadSince,
      lastActions: merged,
      breakUntil,
      sessionLocked,
    },
    allowClass,
  };
}

/** Apply bandwidth throttle to a sample's velocity/click (simulation). */
export function applyBandwidth(
  vx: number,
  vy: number,
  clickProb: number,
  factor: number,
): { vx: number; vy: number; clickProb: number } {
  return {
    vx: vx * factor,
    vy: vy * factor,
    clickProb: clickProb * factor,
  };
}
