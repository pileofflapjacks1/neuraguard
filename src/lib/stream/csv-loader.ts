/**
 * Load pre-recorded synthetic intention CSV.
 * Expected columns: t,vx,vy,clickProb,intentClass,confidence
 */

import type { IntentClass, IntentionSample } from "@/lib/types";
import { INTENT_CLASSES } from "@/lib/types";

const CLASS_SET = new Set<string>(INTENT_CLASSES);

export function parseIntentionCsv(text: string): IntentionSample[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length === 0) return [];

  let start = 0;
  const header = lines[0].toLowerCase();
  if (header.includes("vx") || header.includes("t,")) {
    start = 1;
  }

  const samples: IntentionSample[] = [];
  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < 6) continue;
    const t = Number(cols[0]);
    const vx = Number(cols[1]);
    const vy = Number(cols[2]);
    const clickProb = Number(cols[3]);
    const intentClass = cols[4] as IntentClass;
    const confidence = Number(cols[5]);
    if (![t, vx, vy, clickProb, confidence].every((n) => Number.isFinite(n))) {
      continue;
    }
    if (!CLASS_SET.has(intentClass)) continue;
    samples.push({
      t,
      vx,
      vy,
      clickProb,
      intentClass,
      confidence,
      meta: { source: "csv" },
    });
  }
  return samples;
}

/** Replay CSV samples with wall-clock offset so "live" charts work. */
export class CsvReplay {
  private samples: IntentionSample[];
  private index = 0;
  private offset: number;
  private baseT: number;

  constructor(samples: IntentionSample[]) {
    this.samples = samples;
    this.baseT = samples[0]?.t ?? Date.now();
    this.offset = Date.now() - this.baseT;
  }

  reset(): void {
    this.index = 0;
    this.offset = Date.now() - this.baseT;
  }

  /** Return next sample remapped to now, or null when exhausted. */
  next(): IntentionSample | null {
    if (this.index >= this.samples.length) return null;
    const s = this.samples[this.index++];
    return {
      ...s,
      t: s.t + this.offset,
      meta: { ...s.meta, source: "csv" },
    };
  }

  get progress(): number {
    if (this.samples.length === 0) return 1;
    return this.index / this.samples.length;
  }

  get done(): boolean {
    return this.index >= this.samples.length;
  }
}
