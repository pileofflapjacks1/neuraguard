/**
 * Lightweight continuous "neural-biometric" check (research toy).
 *
 * Compares stream statistics to a baseline window. Not identity verification,
 * not medical biometrics, not implant authentication.
 */

import type { CognitiveState } from "@/lib/types";

export interface UnlockAttempt {
  passphrase: string;
  expected: string;
  biometricMatch: number;
  minMatch: number;
}

export function attemptUnlock(opts: UnlockAttempt): {
  ok: boolean;
  reason: string;
} {
  const passOk =
    opts.passphrase.trim().toLowerCase() === opts.expected.trim().toLowerCase();
  const bioOk = opts.biometricMatch >= opts.minMatch;

  if (passOk && bioOk) {
    return { ok: true, reason: "Passphrase and stream match accepted (simulated)." };
  }
  if (!passOk && !bioOk) {
    return {
      ok: false,
      reason: "Passphrase mismatch and biometric match too low.",
    };
  }
  if (!passOk) {
    return { ok: false, reason: "Simulated mental passphrase incorrect." };
  }
  return {
    ok: false,
    reason: `Biometric match ${opts.biometricMatch.toFixed(0)} below threshold ${opts.minMatch}.`,
  };
}

export function shouldAutoLock(state: CognitiveState, threshold: number): boolean {
  return state.biometricMatch < threshold || state.anomalyScore > 85;
}
