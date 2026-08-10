/**
 * Neurabridge-compatible intention adapter stub.
 *
 * Documents the expected API shape for soft integration with Neurabridge /
 * NeuraShell middleware. Does not require Neurabridge at runtime.
 *
 * Suite intent vocabulary (preferred):
 *   velocity_2d | class_label | switch_binary | synthetic
 *
 * NeuraGuard extends this with optional privacy-aware IntentionSample fields.
 */

import type { IntentionSample } from "@/lib/types";

/** Suite-style intent event (from NeuralBridge / NeuraShell). */
export type SuiteIntentEvent =
  | { type: "velocity_2d"; vx: number; vy: number; t: number }
  | { type: "class_label"; label: string; confidence: number; t: number }
  | { type: "switch_binary"; index: number; active: boolean; t: number }
  | { type: "synthetic"; name: string; t: number };

export interface IntentionAdapter {
  readonly id: string;
  readonly description: string;
  start(onSample: (s: IntentionSample) => void): void;
  stop(): void;
}

/** Map suite events → NeuraGuard IntentionSample. */
export function suiteEventToSample(ev: SuiteIntentEvent): IntentionSample {
  const t = "t" in ev ? ev.t : Date.now();
  switch (ev.type) {
    case "velocity_2d":
      return {
        t,
        vx: ev.vx,
        vy: ev.vy,
        clickProb: 0,
        intentClass: "pointer",
        confidence: 0.85,
        meta: { adapter: "neurabridge", suite: "velocity_2d" },
      };
    case "class_label":
      return {
        t,
        vx: 0,
        vy: 0,
        clickProb: ev.label === "click" ? 0.95 : 0,
        intentClass: labelToClass(ev.label),
        confidence: ev.confidence,
        meta: { adapter: "neurabridge", suite: "class_label", label: ev.label },
      };
    case "switch_binary":
      return {
        t,
        vx: 0,
        vy: 0,
        clickProb: ev.active ? 1 : 0,
        intentClass: "select",
        confidence: 0.9,
        meta: {
          adapter: "neurabridge",
          suite: "switch_binary",
          index: ev.index,
        },
      };
    case "synthetic":
      return {
        t,
        vx: 0,
        vy: 0,
        clickProb: 0,
        intentClass: "system",
        confidence: 1,
        meta: { adapter: "neurabridge", suite: "synthetic", name: ev.name },
      };
  }
}

function labelToClass(label: string): IntentionSample["intentClass"] {
  const l = label.toLowerCase();
  if (l.includes("private")) return "private_thought";
  if (l.includes("speech") || l.includes("inner")) return "inner_speech";
  if (l.includes("click")) return "click";
  if (l.includes("type")) return "type";
  if (l.includes("nav")) return "navigation";
  if (l.includes("sys")) return "system";
  if (l.includes("select")) return "select";
  return "pointer";
}

/**
 * Stub adapter: no-op start/stop with documented contract.
 * Wire to BroadcastChannel / WS in a future soft-integration pass.
 */
export function createNeurabridgeStubAdapter(): IntentionAdapter {
  return {
    id: "neurabridge-stub",
    description:
      "Placeholder for Neurabridge WS / BroadcastChannel. Map SuiteIntentEvent → IntentionSample via suiteEventToSample().",
    start() {
      /* no-op in MVP — synthetic path owns live demos */
    },
    stop() {
      /* no-op */
    },
  };
}

/** Expected WebSocket message shapes (document for integrators). */
export const NEURABRIDGE_WS_CONTRACT = {
  inbound: [
    '{ "type": "velocity_2d", "vx": 0.1, "vy": -0.2, "t": 1710000000000 }',
    '{ "type": "class_label", "label": "click", "confidence": 0.9, "t": 1710000000000 }',
    '{ "vx": 0.1, "vy": 0.2, "clickProb": 0.1, "intentClass": "pointer", "confidence": 0.8, "t": 1710000000000 }',
  ],
  outbound_policy_hint: [
    '{ "type": "policy", "action": "throttle_bandwidth", "factor": 0.4, "t": 1710000000000 }',
    '{ "type": "policy", "action": "block_private", "classes": ["inner_speech"], "t": 1710000000000 }',
  ],
} as const;
