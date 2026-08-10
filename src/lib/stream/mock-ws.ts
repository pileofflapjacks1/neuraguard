/**
 * Mock WebSocket intention source.
 *
 * In demo mode without a server, uses an in-process timer that mimics
 * WS frames. Optional real WebSocket URL for Neurabridge-style adapters.
 *
 * Research / simulation only.
 */

import type { IntentionSample } from "@/lib/types";
import { SyntheticStream } from "./synthetic";

export type MockWsStatus = "idle" | "connecting" | "open" | "closed" | "error";

export interface MockWsOptions {
  /** If set, attempt a real WebSocket; otherwise pure in-process mock. */
  url?: string;
  hz?: number;
  onSample: (s: IntentionSample) => void;
  onStatus?: (s: MockWsStatus, detail?: string) => void;
}

/**
 * Parse a Neurabridge-compatible intention frame.
 * Accepts JSON: { type, vx?, vy?, label?, confidence?, t? } or full IntentionSample.
 */
export function parseIntentionFrame(raw: string): IntentionSample | null {
  try {
    const msg = JSON.parse(raw) as Record<string, unknown>;
    const t = typeof msg.t === "number" ? msg.t : Date.now();

    // Full sample shape
    if (typeof msg.vx === "number" && typeof msg.vy === "number") {
      return {
        t,
        vx: msg.vx,
        vy: msg.vy,
        clickProb: typeof msg.clickProb === "number" ? msg.clickProb : 0,
        intentClass:
          typeof msg.intentClass === "string"
            ? (msg.intentClass as IntentionSample["intentClass"])
            : typeof msg.label === "string"
              ? mapLabel(msg.label)
              : "pointer",
        confidence:
          typeof msg.confidence === "number" ? msg.confidence : 0.7,
        meta: { source: "websocket" },
      };
    }

    // velocity_2d suite event
    if (msg.type === "velocity_2d") {
      return {
        t,
        vx: Number(msg.vx ?? 0),
        vy: Number(msg.vy ?? 0),
        clickProb: 0,
        intentClass: "pointer",
        confidence: 0.8,
        meta: { source: "websocket", suite: "velocity_2d" },
      };
    }

    // class_label suite event
    if (msg.type === "class_label" && typeof msg.label === "string") {
      return {
        t,
        vx: 0,
        vy: 0,
        clickProb: msg.label === "click" ? 0.9 : 0,
        intentClass: mapLabel(msg.label),
        confidence: typeof msg.confidence === "number" ? msg.confidence : 0.7,
        meta: { source: "websocket", suite: "class_label" },
      };
    }

    return null;
  } catch {
    return null;
  }
}

function mapLabel(label: string): IntentionSample["intentClass"] {
  const l = label.toLowerCase();
  if (l.includes("private") || l.includes("thought")) return "private_thought";
  if (l.includes("speech") || l.includes("inner")) return "inner_speech";
  if (l.includes("click")) return "click";
  if (l.includes("type") || l.includes("text")) return "type";
  if (l.includes("nav")) return "navigation";
  if (l.includes("sys")) return "system";
  if (l.includes("select")) return "select";
  return "pointer";
}

export class MockIntentionSocket {
  private timer: ReturnType<typeof setInterval> | null = null;
  private ws: WebSocket | null = null;
  private synth: SyntheticStream;
  private opts: MockWsOptions;
  status: MockWsStatus = "idle";

  constructor(opts: MockWsOptions) {
    this.opts = opts;
    this.synth = new SyntheticStream({ hz: opts.hz ?? 20 });
  }

  connect(): void {
    this.disconnect();
    if (this.opts.url && typeof WebSocket !== "undefined") {
      this.setStatus("connecting");
      try {
        const ws = new WebSocket(this.opts.url);
        this.ws = ws;
        ws.onopen = () => this.setStatus("open");
        ws.onerror = () => {
          this.setStatus("error", "WebSocket error — falling back to mock");
          this.startMock();
        };
        ws.onclose = () => {
          this.setStatus("closed");
        };
        ws.onmessage = (ev) => {
          const sample = parseIntentionFrame(String(ev.data));
          if (sample) this.opts.onSample(sample);
        };
        return;
      } catch {
        this.setStatus("error", "Failed to open WebSocket — mock mode");
      }
    }
    this.startMock();
  }

  private startMock(): void {
    this.setStatus("open", "In-process mock WebSocket");
    const hz = this.opts.hz ?? 20;
    this.timer = setInterval(() => {
      this.opts.onSample(this.synth.next());
    }, 1000 / hz);
  }

  disconnect(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("closed");
  }

  private setStatus(s: MockWsStatus, detail?: string): void {
    this.status = s;
    this.opts.onStatus?.(s, detail);
  }
}
