/** Small pure helpers — no medical claims, pure math. */

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Exponential moving average. alpha closer to 1 tracks faster. */
export function ema(prev: number, next: number, alpha: number): number {
  return alpha * next + (1 - alpha) * prev;
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

export function variance(xs: number[], m?: number): number {
  if (xs.length < 2) return 0;
  const mu = m ?? mean(xs);
  let s = 0;
  for (const x of xs) {
    const d = x - mu;
    s += d * d;
  }
  return s / (xs.length - 1);
}

export function speed2d(vx: number, vy: number): number {
  return Math.hypot(vx, vy);
}

/** Normalized Shannon entropy of a count map (0 = pure, 1 = uniform). */
export function normalizedEntropy(counts: Record<string, number>): number {
  const values = Object.values(counts);
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const k = values.length;
  if (k <= 1) return 0;
  let h = 0;
  for (const c of values) {
    if (c <= 0) continue;
    const p = c / total;
    h -= p * Math.log2(p);
  }
  return h / Math.log2(k);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function formatTime(t: number): string {
  return new Date(t).toLocaleTimeString();
}
