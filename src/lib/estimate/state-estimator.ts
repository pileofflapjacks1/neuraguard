/**
 * State estimator: StreamFeatures → CognitiveState
 *
 * Sliding-window stats + EMAs. Fully inspectable — see formulas.ts.
 * Simulation / research only. Not a medical or clinical model.
 */

import type { CognitiveState, StreamFeatures } from "@/lib/types";
import { clamp, ema } from "@/lib/utils";
import type { SimulatorInjection } from "@/lib/types";

export interface EstimatorConfig {
  /** EMA alpha for fatigue (small = slow accumulation) */
  fatigueAlpha: number;
  /** EMA alpha for load / focus / agency */
  fastAlpha: number;
  /** Session start time for fatigue progress */
  sessionStart: number;
  /** Expected "full day" fatigue horizon (ms) — demo uses shorter */
  fatigueHorizonMs: number;
}

export interface EstimatorInternal {
  fatigue: number;
  load: number;
  focus: number;
  agency: number;
  /** Baseline feature means for biometric + anomaly */
  baseline: BaselineStats | null;
  /** Running means for z-scores */
  run: RunningStats;
  sampleCount: number;
}

export interface BaselineStats {
  meanSpeed: number;
  speedVar: number;
  classEntropy: number;
  meanConfidence: number;
  samples: number;
}

interface RunningStats {
  n: number;
  meanSpeed: number;
  meanEntropy: number;
  meanConf: number;
  m2Speed: number;
  m2Entropy: number;
  m2Conf: number;
}

export const DEFAULT_ESTIMATOR_CONFIG: EstimatorConfig = {
  fatigueAlpha: 0.015,
  fastAlpha: 0.12,
  sessionStart: Date.now(),
  fatigueHorizonMs: 20 * 60_000, // 20 min demo horizon
};

export function createEstimatorState(
  config: Partial<EstimatorConfig> = {},
): { config: EstimatorConfig; state: EstimatorInternal } {
  const cfg: EstimatorConfig = {
    ...DEFAULT_ESTIMATOR_CONFIG,
    ...config,
    sessionStart: config.sessionStart ?? Date.now(),
  };
  return {
    config: cfg,
    state: {
      fatigue: 12,
      load: 25,
      focus: 70,
      agency: 75,
      baseline: null,
      run: emptyRunning(),
      sampleCount: 0,
    },
  };
}

function emptyRunning(): RunningStats {
  return {
    n: 0,
    meanSpeed: 0,
    meanEntropy: 0,
    meanConf: 0.7,
    m2Speed: 0,
    m2Entropy: 0,
    m2Conf: 0,
  };
}

/** Welford online update for mean/variance. */
function updateRunning(run: RunningStats, f: StreamFeatures): RunningStats {
  const n = run.n + 1;
  const ds = f.meanSpeed - run.meanSpeed;
  const meanSpeed = run.meanSpeed + ds / n;
  const m2Speed = run.m2Speed + ds * (f.meanSpeed - meanSpeed);

  const de = f.classEntropy - run.meanEntropy;
  const meanEntropy = run.meanEntropy + de / n;
  const m2Entropy = run.m2Entropy + de * (f.classEntropy - meanEntropy);

  const dc = f.meanConfidence - run.meanConf;
  const meanConf = run.meanConf + dc / n;
  const m2Conf = run.m2Conf + dc * (f.meanConfidence - meanConf);

  return { n, meanSpeed, meanEntropy, meanConf, m2Speed, m2Entropy, m2Conf };
}

function zScore(x: number, mean: number, m2: number, n: number): number {
  if (n < 5) return 0;
  const var_ = m2 / (n - 1);
  const sd = Math.sqrt(Math.max(var_, 1e-6));
  return (x - mean) / sd;
}

/**
 * Capture baseline from current running stats (after warm-up).
 * Used for continuous auth match score.
 */
export function captureBaseline(internal: EstimatorInternal): EstimatorInternal {
  if (internal.run.n < 10) return internal;
  return {
    ...internal,
    baseline: {
      meanSpeed: internal.run.meanSpeed,
      speedVar: internal.run.m2Speed / Math.max(1, internal.run.n - 1),
      classEntropy: internal.run.meanEntropy,
      meanConfidence: internal.run.meanConf,
      samples: internal.run.n,
    },
  };
}

export function estimateState(
  features: StreamFeatures,
  internal: EstimatorInternal,
  config: EstimatorConfig,
  injection: SimulatorInjection = "none",
): { state: CognitiveState; internal: EstimatorInternal } {
  const run = updateRunning(internal.run, features);
  const n = run.n;

  // --- raw proxies (0–1) ---
  // Normalize speed loosely: intentional motion often ~0.2–0.8
  const normSpeed = clamp(features.meanSpeed / 0.9, 0, 1);
  const normVar = clamp(features.speedVar / 0.25, 0, 1);
  const normAccel = clamp(features.meanAccel / 2.5, 0, 1);

  let rawLoad = clamp(
    0.35 * normSpeed +
      0.25 * normVar +
      0.2 * normAccel +
      0.15 * features.classEntropy +
      0.05 * features.meanClick,
    0,
    1,
  );

  let distractionPenalty = 0;
  if (injection === "distraction") {
    rawLoad = clamp(rawLoad + 0.25, 0, 1);
    distractionPenalty = 0.3;
  }
  if (injection === "fatigue") {
    rawLoad = clamp(rawLoad + 0.1, 0, 1);
  }
  if (injection === "private_spike") {
    distractionPenalty = 0.15;
  }

  const rawFocus = clamp(
    0.45 * (1 - features.classEntropy) +
      0.35 * features.meanConfidence +
      0.2 * (1 - features.privateRatio) -
      distractionPenalty,
    0,
    1,
  );

  const sessionProgress = clamp(
    (features.t - config.sessionStart) / config.fatigueHorizonMs,
    0,
    1.2,
  );
  let rawFatigue = clamp(
    sessionProgress * 0.4 +
      rawLoad * 0.35 +
      (1 - features.meanConfidence) * 0.25,
    0,
    1,
  );
  if (injection === "fatigue") {
    rawFatigue = clamp(rawFatigue + 0.35, 0, 1);
  }

  // Anomaly vs running distribution
  let zSpeed = Math.abs(zScore(features.meanSpeed, run.meanSpeed, run.m2Speed, n));
  let zEnt = Math.abs(
    zScore(features.classEntropy, run.meanEntropy, run.m2Entropy, n),
  );
  const zConf = Math.abs(
    zScore(1 - features.meanConfidence, 1 - run.meanConf, run.m2Conf, n),
  );
  if (injection === "anomaly") {
    zSpeed += 4;
    zEnt += 3;
  }
  const anomalyNorm = clamp((0.4 * zSpeed + 0.3 * zEnt + 0.3 * zConf) / 4, 0, 1);

  const rawAgency = clamp(
    0.5 * features.meanConfidence +
      0.3 * (1 - anomalyNorm) +
      0.2 * (1 - features.privateRatio),
    0,
    1,
  );

  // EMAs
  const load = ema(internal.load, rawLoad * 100, config.fastAlpha);
  const focus = ema(internal.focus, rawFocus * 100, config.fastAlpha);
  const fatigue = ema(internal.fatigue, rawFatigue * 100, config.fatigueAlpha);
  const agency = ema(internal.agency, rawAgency * 100, config.fastAlpha);

  // Biometric match vs captured baseline
  let biometricMatch = 85;
  if (internal.baseline) {
    const b = internal.baseline;
    const dSpeed = Math.abs(features.meanSpeed - b.meanSpeed);
    const dEnt = Math.abs(features.classEntropy - b.classEntropy);
    const dConf = Math.abs(features.meanConfidence - b.meanConfidence);
    const dist = clamp(0.5 * dSpeed + 0.3 * dEnt + 0.2 * dConf * 2, 0, 1);
    biometricMatch = (1 - dist) * 100;
    if (injection === "anomaly") {
      biometricMatch = Math.max(10, biometricMatch - 40);
    }
  }

  const nextInternal: EstimatorInternal = {
    fatigue,
    load,
    focus,
    agency,
    baseline: internal.baseline,
    run,
    sampleCount: internal.sampleCount + 1,
  };

  // Auto-capture baseline after warm-up if missing
  const withBaseline =
    !nextInternal.baseline && nextInternal.run.n >= 40
      ? captureBaseline(nextInternal)
      : nextInternal;

  return {
    state: {
      t: features.t,
      cognitiveLoad: clamp(load, 0, 100),
      focus: clamp(focus, 0, 100),
      fatigue: clamp(fatigue, 0, 100),
      agency: clamp(agency, 0, 100),
      anomalyScore: clamp(anomalyNorm * 100, 0, 100),
      biometricMatch: clamp(biometricMatch, 0, 100),
    },
    internal: withBaseline,
  };
}
