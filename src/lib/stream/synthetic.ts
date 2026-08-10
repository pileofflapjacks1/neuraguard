/**
 * Synthetic intention stream generator.
 *
 * Produces velocity-like 2D vectors + click probability + intent tags.
 * Inject fatigue / distraction / private spikes / anomalies for demos.
 * Research simulation only — not real neural data.
 */

import type { IntentClass, IntentionSample, SimulatorInjection } from "@/lib/types";

export interface SyntheticConfig {
  hz: number;
  injection: SimulatorInjection;
  /** Base noise scale */
  noise: number;
  seed?: number;
}

const PUBLIC_CLASSES: IntentClass[] = [
  "pointer",
  "click",
  "select",
  "type",
  "navigation",
  "system",
];

/** Simple mulberry32 PRNG for reproducible demos when seed is set. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SyntheticStream {
  private t0: number;
  private phase = 0;
  private last: IntentionSample | null = null;
  private rand: () => number;
  private injection: SimulatorInjection;
  private noise: number;
  readonly hz: number;

  constructor(config: Partial<SyntheticConfig> = {}) {
    this.hz = config.hz ?? 20;
    this.injection = config.injection ?? "none";
    this.noise = config.noise ?? 0.08;
    this.t0 = Date.now();
    this.rand = config.seed != null ? mulberry32(config.seed) : Math.random;
  }

  setInjection(inj: SimulatorInjection): void {
    this.injection = inj;
  }

  getInjection(): SimulatorInjection {
    return this.injection;
  }

  /** Generate one sample at time `now` (ms). */
  next(now = Date.now()): IntentionSample {
    const elapsed = (now - this.t0) / 1000;
    this.phase += 0.05 + this.rand() * 0.02;

    // Smooth Lissajous-like intention cursor with slow drift
    let vx =
      0.45 * Math.sin(this.phase * 0.7) +
      0.2 * Math.sin(elapsed * 0.15) +
      (this.rand() - 0.5) * this.noise;
    let vy =
      0.4 * Math.cos(this.phase * 0.55) +
      0.15 * Math.sin(elapsed * 0.11 + 1.2) +
      (this.rand() - 0.5) * this.noise;

    let clickProb = 0.05 + 0.08 * Math.max(0, Math.sin(this.phase * 0.3));
    let confidence = 0.72 + (this.rand() - 0.5) * 0.12;
    let intentClass: IntentClass = pickClass(this.rand, elapsed, this.injection);

    // Injections reshape the stream distribution
    switch (this.injection) {
      case "fatigue":
        vx *= 0.55;
        vy *= 0.55;
        confidence -= 0.18;
        clickProb *= 0.6;
        vx += (this.rand() - 0.5) * 0.15;
        vy += (this.rand() - 0.5) * 0.15;
        break;
      case "distraction":
        vx += (this.rand() - 0.5) * 0.55;
        vy += (this.rand() - 0.5) * 0.55;
        intentClass = PUBLIC_CLASSES[Math.floor(this.rand() * PUBLIC_CLASSES.length)];
        confidence -= 0.12;
        break;
      case "private_spike":
        if (this.rand() < 0.55) {
          intentClass = this.rand() < 0.5 ? "inner_speech" : "private_thought";
          confidence = 0.55 + this.rand() * 0.2;
          vx *= 0.3;
          vy *= 0.3;
        }
        break;
      case "anomaly":
        vx = (this.rand() - 0.5) * 2.2;
        vy = (this.rand() - 0.5) * 2.2;
        confidence = 0.2 + this.rand() * 0.25;
        clickProb = this.rand();
        intentClass = PUBLIC_CLASSES[Math.floor(this.rand() * PUBLIC_CLASSES.length)];
        break;
      default:
        break;
    }

    // Clamp velocity-like components
    vx = Math.max(-1.5, Math.min(1.5, vx));
    vy = Math.max(-1.5, Math.min(1.5, vy));
    confidence = Math.max(0.05, Math.min(0.99, confidence));
    clickProb = Math.max(0, Math.min(1, clickProb));

    const sample: IntentionSample = {
      t: now,
      vx,
      vy,
      clickProb,
      intentClass,
      confidence,
      meta: { source: "synthetic", injection: this.injection },
    };
    this.last = sample;
    return sample;
  }

  getLast(): IntentionSample | null {
    return this.last;
  }
}

function pickClass(
  rand: () => number,
  elapsed: number,
  injection: SimulatorInjection,
): IntentClass {
  if (injection === "private_spike") {
    return rand() < 0.5 ? "inner_speech" : "private_thought";
  }
  // Mostly pointer with occasional discrete acts
  const r = rand();
  if (r < 0.62) return "pointer";
  if (r < 0.74) return "click";
  if (r < 0.82) return "select";
  if (r < 0.9) return "type";
  if (r < 0.95) return "navigation";
  if (r < 0.98) return "system";
  // Rare private bleed (simulates decoder leakage) — privacy gate demos
  return elapsed > 5 && rand() < 0.5 ? "inner_speech" : "private_thought";
}

/** Generate a batch for offline tests / CSV. */
export function generateSyntheticBatch(
  count: number,
  config: Partial<SyntheticConfig> = {},
  startT = Date.now(),
): IntentionSample[] {
  const stream = new SyntheticStream(config);
  const hz = config.hz ?? 20;
  const dt = 1000 / hz;
  const out: IntentionSample[] = [];
  for (let i = 0; i < count; i++) {
    out.push(stream.next(startT + i * dt));
  }
  return out;
}
