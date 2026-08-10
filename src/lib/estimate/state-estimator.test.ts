import { describe, it, expect } from "vitest";
import {
  createEstimatorState,
  estimateState,
  captureBaseline,
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
  it("returns values in 0–100", () => {
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
    ] as const) {
      expect(state[k]).toBeGreaterThanOrEqual(0);
      expect(state[k]).toBeLessThanOrEqual(100);
    }
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
    const { config, state: start } = createEstimatorState();
    let internal = start;
    // warm-up normal
    for (let i = 0; i < 50; i++) {
      const r = estimateState(feat(), internal, config, "none");
      internal = r.internal;
    }
    const normal = estimateState(feat(), internal, config, "none");
    const anomalous = estimateState(
      feat({ meanSpeed: 1.4, classEntropy: 0.95, meanConfidence: 0.2 }),
      normal.internal,
      config,
      "anomaly",
    );
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
