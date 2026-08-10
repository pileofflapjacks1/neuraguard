/**
 * Feature extractor: IntentionSample[] → StreamFeatures
 *
 * Transparent sliding-window statistics. Documented for "How it works".
 * Not a neural decoder — operates on already-decoded intention streams.
 */

import type { IntentClass, IntentionSample, StreamFeatures } from "@/lib/types";
import { mean, normalizedEntropy, speed2d, variance } from "@/lib/utils";

export const DEFAULT_WINDOW_MS = 4_000;

export function extractFeatures(
  samples: IntentionSample[],
  now = Date.now(),
  windowMs = DEFAULT_WINDOW_MS,
): StreamFeatures {
  const window = samples.filter((s) => s.t >= now - windowMs && s.t <= now);
  if (window.length === 0) {
    return emptyFeatures(now);
  }

  const speeds = window.map((s) => speed2d(s.vx, s.vy));
  const meanSpeed = mean(speeds);
  const speedVar = variance(speeds, meanSpeed);

  const accels: number[] = [];
  for (let i = 1; i < window.length; i++) {
    const dt = (window[i].t - window[i - 1].t) / 1000;
    if (dt <= 0) continue;
    const s0 = speed2d(window[i - 1].vx, window[i - 1].vy);
    const s1 = speed2d(window[i].vx, window[i].vy);
    accels.push(Math.abs(s1 - s0) / dt);
  }

  const classCounts: Record<string, number> = {};
  for (const s of window) {
    classCounts[s.intentClass] = (classCounts[s.intentClass] ?? 0) + 1;
  }
  let dominantClass: IntentClass = "pointer";
  let best = -1;
  for (const [k, v] of Object.entries(classCounts)) {
    if (v > best) {
      best = v;
      dominantClass = k as IntentClass;
    }
  }

  const privateCount = window.filter(
    (s) => s.intentClass === "inner_speech" || s.intentClass === "private_thought",
  ).length;

  const durationSec = Math.max(
    0.001,
    (window[window.length - 1].t - window[0].t) / 1000,
  );

  return {
    t: now,
    meanSpeed,
    speedVar,
    meanAccel: mean(accels),
    meanClick: mean(window.map((s) => s.clickProb)),
    meanConfidence: mean(window.map((s) => s.confidence)),
    classEntropy: normalizedEntropy(classCounts),
    privateRatio: privateCount / window.length,
    sampleRateHz: (window.length - 1) / durationSec,
    dominantClass,
  };
}

function emptyFeatures(t: number): StreamFeatures {
  return {
    t,
    meanSpeed: 0,
    speedVar: 0,
    meanAccel: 0,
    meanClick: 0,
    meanConfidence: 0.5,
    classEntropy: 0,
    privateRatio: 0,
    sampleRateHz: 0,
    dominantClass: "pointer",
  };
}
