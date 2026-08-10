import { describe, it, expect } from "vitest";
import { extractFeatures } from "./features";
import { generateSyntheticBatch } from "./synthetic";
import { parseIntentionCsv } from "./csv-loader";
import type { IntentionSample } from "@/lib/types";

describe("feature extractor", () => {
  it("handles empty window", () => {
    const f = extractFeatures([], Date.now());
    expect(f.meanSpeed).toBe(0);
    expect(f.dominantClass).toBe("pointer");
  });

  it("computes stats from synthetic batch", () => {
    const batch = generateSyntheticBatch(100, { hz: 20, seed: 7 });
    const now = batch[batch.length - 1].t;
    const f = extractFeatures(batch, now, 5000);
    expect(f.meanSpeed).toBeGreaterThan(0);
    expect(f.classEntropy).toBeGreaterThanOrEqual(0);
    expect(f.classEntropy).toBeLessThanOrEqual(1);
    expect(f.sampleRateHz).toBeGreaterThan(10);
  });
});

describe("csv loader", () => {
  it("parses header + rows", () => {
    const csv = `t,vx,vy,clickProb,intentClass,confidence
1000,0.1,-0.2,0.05,pointer,0.9
1050,0.2,-0.1,0.1,click,0.85`;
    const samples = parseIntentionCsv(csv);
    expect(samples).toHaveLength(2);
    expect(samples[1].intentClass).toBe("click");
  });

  it("skips bad rows", () => {
    const samples = parseIntentionCsv("bad\n1,x,y,0,pointer,0.5");
    expect(samples).toHaveLength(0);
  });
});

describe("synthetic stream", () => {
  it("is deterministic with seed", () => {
    const a = generateSyntheticBatch(5, { seed: 99, hz: 10 });
    const b = generateSyntheticBatch(5, { seed: 99, hz: 10 });
    expect(a.map((s: IntentionSample) => s.vx)).toEqual(b.map((s) => s.vx));
  });
});
