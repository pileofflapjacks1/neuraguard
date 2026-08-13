import { describe, it, expect } from "vitest";
import {
  createEstimatorState,
  estimateState,
  captureBaseline,
  adaptBaseline,
} from "./state-estimator";
import { extractFeatures } from "@/lib/stream/features";
import { generateSyntheticBatch } from "@/lib/stream/synthetic";
import type { StreamFeatures } from "@/lib/types";

function feat(partial: Partial<StreamFeatures> = {}): StreamFeatures {
  return {
    t: Date.now(),
    meanSpeed: 0.3,
    speedVar: 0.02,
    meanAccel: 0.4,
    meanClick: 0.1,
    meanConfidence: 0.8,
    classEntropy: 0.3,
    privateRatio: 0.05,
    sampleRateHz: 20,
    dominantClass: "pointer",
    ...partial,
  };
}

describe("state estimator", () => {
  it("returns values in 0–100 including drift fields", () => {
    const { config, state: internal } = createEstimatorState({
      sessionStart: Date.now() - 60_000,
    });
    const { state } = estimateState(feat(), internal, config, "none");
    for (const k of [
      "cognitiveLoad",
      "focus",
      "fatigue",
      "agency",
      "anomalyScore",
      "biometricMatch",
      "baselineDrift",
    ] as const) {
      expect(state[k]).toBeGreaterThanOrEqual(0);
      expect(state[k]).toBeLessThanOrEqual(100);
    }
    expect(typeof state.driftAdapting).toBe("boolean");
    expect(state.stableTicks).toBeGreaterThanOrEqual(0);
  });

  it("fatigue injection raises fatigue over ticks", () => {
    const { config, state: start } = createEstimatorState({
      sessionStart: Date.now() - 5 * 60_000,
      fatigueAlpha: 0.2,
    });
    let internal = start;
    let fatigue = internal.fatigue;
    for (let i = 0; i < 30; i++) {
      const r = estimateState(
        feat({ meanConfidence: 0.4 }),
        internal,
        config,
        "fatigue",
      );
      internal = r.internal;
      fatigue = r.state.fatigue;
    }
    expect(fatigue).toBeGreaterThan(30);
  });

  it("anomaly injection raises anomaly score", () => {
    const { config, state: start } = createEstimatorState({
      anomalyAlpha: 0.35, // faster rise so a short burst is visible
    });
    let internal = start;
    for (let i = 0; i < 50; i++) {
      const r = estimateState(feat(), internal, config, "none");
      internal = r.internal;
    }
    const normal = estimateState(feat(), internal, config, "none");
    let anomalous = normal;
    // EMA needs a few ticks to climb under hysteresis
    for (let i = 0; i < 12; i++) {
      anomalous = estimateState(
        feat({ meanSpeed: 1.4, classEntropy: 0.95, meanConfidence: 0.2 }),
        anomalous.internal,
        config,
        "anomaly",
      );
    }
    expect(anomalous.state.anomalyScore).toBeGreaterThan(
      normal.state.anomalyScore,
    );
    expect(anomalous.state.anomalyScore).toBeGreaterThan(40);
  });

  it("baseline capture enables biometric tracking", () => {
    const { config, state: start } = createEstimatorState();
    let internal = start;
    for (let i = 0; i < 45; i++) {
      const r = estimateState(feat(), internal, config, "none");
      internal = r.internal;
    }
    internal = captureBaseline(internal);
    expect(internal.baseline).not.toBeNull();
    const match = estimateState(feat(), internal, config, "none");
    expect(match.state.biometricMatch).toBeGreaterThan(50);
  });

  it("end-to-end features from synthetic stream stay finite", () => {
    const batch = generateSyntheticBatch(80, { hz: 20, seed: 42 });
    const features = extractFeatures(batch, batch[batch.length - 1].t);
    expect(Number.isFinite(features.meanSpeed)).toBe(true);
    expect(features.sampleRateHz).toBeGreaterThan(0);

    const { config, state: internal } = createEstimatorState({
      sessionStart: batch[0].t,
    });
    const { state } = estimateState(features, internal, config, "none");
    expect(state.cognitiveLoad).toBeGreaterThanOrEqual(0);
  });
});

describe("online drift adaptation", () => {
  it("adaptBaseline moves means toward features", () => {
    const base = {
      meanSpeed: 0.2,
      speedVar: 0.01,
      classEntropy: 0.2,
      meanConfidence: 0.9,
      samples: 40,
      capturedAtSamples: 40,
    };
    const { baseline, step } = adaptBaseline(
      base,
      feat({ meanSpeed: 0.6, classEntropy: 0.5, meanConfidence: 0.7 }),
      0.5,
    );
    expect(baseline.meanSpeed).toBeGreaterThan(base.meanSpeed);
    expect(baseline.classEntropy).toBeGreaterThan(base.classEntropy);
    expect(step).toBeGreaterThan(0);
  });

  it("drifts baseline under stable low-anomaly stream", () => {
    const { config, state: start } = createEstimatorState({
      driftAdaptEnabled: true,
      driftAlpha: 0.05,
      driftAnomalyMax: 50,
      driftStableTicks: 5,
      anomalyAlpha: 0.3,
    });
    let internal = start;
    // warm-up to capture baseline at ~0.3 speed
    for (let i = 0; i < 50; i++) {
      const r = estimateState(feat({ meanSpeed: 0.3 }), internal, config, "none");
      internal = r.internal;
    }
    expect(internal.baseline).not.toBeNull();
    const speed0 = internal.baseline!.meanSpeed;

    // slow shift in features; keep samples similar so z-scores stay mild
    for (let i = 0; i < 80; i++) {
      const r = estimateState(
        feat({
          meanSpeed: 0.45,
          classEntropy: 0.32,
          meanConfidence: 0.78,
          speedVar: 0.02,
        }),
        internal,
        config,
        "none",
      );
      internal = r.internal;
    }
    expect(internal.baseline!.meanSpeed).toBeGreaterThan(speed0);
    expect(internal.baselineDrift).toBeGreaterThan(0);
    expect(internal.lastDriftApplied || internal.baselineDrift > 0).toBe(true);
  });

  it("freezes drift during anomaly injection", () => {
    const { config, state: start } = createEstimatorState({
      driftAdaptEnabled: true,
      driftAlpha: 0.08,
      driftAnomalyMax: 40,
      driftStableTicks: 3,
    });
    let internal = start;
    for (let i = 0; i < 50; i++) {
      const r = estimateState(feat({ meanSpeed: 0.3 }), internal, config, "none");
      internal = r.internal;
    }
    const frozen = internal.baseline!.meanSpeed;

    for (let i = 0; i < 40; i++) {
      const r = estimateState(
        feat({ meanSpeed: 1.2, classEntropy: 0.9, meanConfidence: 0.2 }),
        internal,
        config,
        "anomaly",
      );
      internal = r.internal;
    }
    // Should not have fully tracked the wild meanSpeed while anomaly inject active
    expect(Math.abs(internal.baseline!.meanSpeed - frozen)).toBeLessThan(0.08);
    expect(internal.lastDriftApplied).toBe(false);
  });

  it("disabled drift never adapts baseline means", () => {
    const { config, state: start } = createEstimatorState({
      driftAdaptEnabled: false,
      driftAlpha: 0.2,
      driftStableTicks: 1,
    });
    let internal = start;
    for (let i = 0; i < 50; i++) {
      const r = estimateState(feat({ meanSpeed: 0.25 }), internal, config, "none");
      internal = r.internal;
    }
    const speed0 = internal.baseline!.meanSpeed;
    for (let i = 0; i < 40; i++) {
      const r = estimateState(feat({ meanSpeed: 0.7 }), internal, config, "none");
      internal = r.internal;
    }
    expect(internal.baseline!.meanSpeed).toBeCloseTo(speed0, 5);
    expect(internal.lastDriftApplied).toBe(false);
  });
});
