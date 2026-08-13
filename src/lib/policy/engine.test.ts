import { describe, it, expect } from "vitest";
import {
  createPolicyEngineState,
  evaluatePolicies,
  applyBandwidth,
} from "./engine";
import {
  DEFAULT_PRIVACY,
  DEFAULT_THRESHOLDS,
  type CognitiveState,
} from "@/lib/types";

function state(partial: Partial<CognitiveState> = {}): CognitiveState {
  return {
    t: Date.now(),
    cognitiveLoad: 30,
    focus: 70,
    fatigue: 20,
    agency: 80,
    anomalyScore: 10,
    biometricMatch: 90,
    driftAdapting: false,
    baselineDrift: 0,
    stableTicks: 0,
    ...partial,
  };
}

describe("policy engine", () => {
  it("throttles on high fatigue", () => {
    const result = evaluatePolicies(
      state({ fatigue: 70 }),
      DEFAULT_THRESHOLDS,
      { ...DEFAULT_PRIVACY, unlocked: true, mode: "unlocked", gateActive: false },
      createPolicyEngineState(),
      false,
    );
    expect(result.bandwidth.factor).toBeLessThan(1);
    expect(result.bandwidth.lowEffortMode).toBe(true);
    expect(result.actions.some((a) => a.type === "throttle_bandwidth")).toBe(
      true,
    );
  });

  it("force-breaks on extreme fatigue", () => {
    const result = evaluatePolicies(
      state({ fatigue: 90 }),
      DEFAULT_THRESHOLDS,
      { ...DEFAULT_PRIVACY, unlocked: true, mode: "unlocked", gateActive: false },
      createPolicyEngineState(),
      false,
    );
    expect(result.bandwidth.breakForced).toBe(true);
    expect(result.bandwidth.factor).toBe(0);
    expect(result.actions.some((a) => a.type === "force_break")).toBe(true);
  });

  it("pauses sensitive on low agency", () => {
    const result = evaluatePolicies(
      state({ agency: 20 }),
      DEFAULT_THRESHOLDS,
      { ...DEFAULT_PRIVACY, unlocked: true, mode: "unlocked", gateActive: false },
      createPolicyEngineState(),
      false,
    );
    expect(result.bandwidth.sensitivePaused).toBe(true);
    expect(result.allowClass("system")).toBe(false);
    expect(result.allowClass("pointer")).toBe(true);
  });

  it("blocks private classes when sealed", () => {
    const result = evaluatePolicies(
      state(),
      DEFAULT_THRESHOLDS,
      { ...DEFAULT_PRIVACY, mode: "sealed", gateActive: true, unlocked: false },
      createPolicyEngineState(),
      false,
    );
    expect(result.bandwidth.privateBlocked).toBe(true);
    expect(result.bandwidth.privacyMode).toBe("sealed");
    expect(result.allowClass("inner_speech")).toBe(false);
    expect(result.allowClass("pointer")).toBe(true);
  });

  it("allows private after unlock", () => {
    const result = evaluatePolicies(
      state(),
      DEFAULT_THRESHOLDS,
      {
        ...DEFAULT_PRIVACY,
        mode: "unlocked",
        gateActive: false,
        unlocked: true,
      },
      createPolicyEngineState(),
      false,
    );
    expect(result.allowClass("private_thought")).toBe(true);
  });

  it("locks on auth and zeros bandwidth", () => {
    const result = evaluatePolicies(
      state(),
      DEFAULT_THRESHOLDS,
      { ...DEFAULT_PRIVACY, unlocked: true, mode: "unlocked", gateActive: false },
      createPolicyEngineState(),
      true,
    );
    expect(result.bandwidth.factor).toBe(0);
    expect(result.actions.some((a) => a.type === "lock_session")).toBe(true);
  });

  it("suggests break after sustained high load", () => {
    const now = Date.now();
    const engine = createPolicyEngineState();
    engine.highLoadSince = now - DEFAULT_THRESHOLDS.loadSustainMs - 1000;
    const result = evaluatePolicies(
      state({ t: now, cognitiveLoad: 80, fatigue: 40 }),
      DEFAULT_THRESHOLDS,
      { ...DEFAULT_PRIVACY, unlocked: true, mode: "unlocked", gateActive: false },
      engine,
      false,
    );
    expect(result.bandwidth.breakSuggested).toBe(true);
    expect(result.actions.some((a) => a.type === "suggest_break")).toBe(true);
  });

  it("applyBandwidth scales vectors", () => {
    const r = applyBandwidth(1, -1, 0.5, 0.4);
    expect(r.vx).toBeCloseTo(0.4);
    expect(r.vy).toBeCloseTo(-0.4);
    expect(r.clickProb).toBeCloseTo(0.2);
  });
});
