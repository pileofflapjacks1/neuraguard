import { describe, it, expect } from "vitest";
import {
  decideAirlock,
  sinkAllowed,
  redactSampleForExport,
  redactLogEntry,
  resolvePrivacyMode,
  recordBlock,
  DEFAULT_AUDIT,
} from "./airlock";
import { DEFAULT_PRIVACY, type IntentionSample, type PrivacySettings } from "@/lib/types";

function sample(
  partial: Partial<IntentionSample> = {},
): IntentionSample {
  return {
    t: Date.now(),
    vx: 0.2,
    vy: -0.1,
    clickProb: 0.1,
    intentClass: "pointer",
    confidence: 0.8,
    ...partial,
  };
}

function privacy(partial: Partial<PrivacySettings> = {}): PrivacySettings {
  return { ...DEFAULT_PRIVACY, ...partial };
}

describe("privacy airlock", () => {
  it("defaults to sealed when gate active and locked", () => {
    expect(resolvePrivacyMode(privacy({ mode: "sealed", unlocked: false }))).toBe(
      "sealed",
    );
  });

  it("fail-closes private classes when sealed", () => {
    const d = decideAirlock(
      sample({ intentClass: "inner_speech" }),
      privacy({ mode: "sealed", unlocked: false }),
      false,
    );
    expect(d.allow).toBe(false);
    expect(d.isPrivate).toBe(true);
    expect(d.displayClass).toBe("REDACTED");
  });

  it("allows public classes when sealed", () => {
    const d = decideAirlock(
      sample({ intentClass: "pointer" }),
      privacy({ mode: "sealed" }),
      false,
    );
    expect(d.allow).toBe(true);
  });

  it("allows private when unlocked", () => {
    const d = decideAirlock(
      sample({ intentClass: "private_thought" }),
      privacy({ mode: "unlocked", unlocked: true, gateActive: false }),
      false,
    );
    expect(d.allow).toBe(true);
  });

  it("blocks all when session locked", () => {
    const d = decideAirlock(
      sample({ intentClass: "pointer" }),
      privacy({ mode: "unlocked", unlocked: true }),
      true,
    );
    expect(d.allow).toBe(false);
  });

  it("seals untrusted sinks", () => {
    expect(sinkAllowed("external_ws", privacy({ mode: "sealed" })).allow).toBe(
      false,
    );
    expect(sinkAllowed("suite_bus", privacy({ mode: "sealed" })).allow).toBe(
      false,
    );
    expect(sinkAllowed("local_ui", privacy({ mode: "sealed" })).allow).toBe(
      true,
    );
  });

  it("public_only blocks suite bus but allows export sink", () => {
    const p = privacy({ mode: "public_only", unlocked: false });
    expect(sinkAllowed("export", p).allow).toBe(true);
    expect(sinkAllowed("suite_bus", p).allow).toBe(false);
  });

  it("redacts private samples for export", () => {
    const out = redactSampleForExport(
      sample({ intentClass: "inner_speech", vx: 0.9 }),
      privacy({ mode: "sealed", alwaysRedactExports: true }),
    );
    expect(out).not.toBeNull();
    expect(out!.meta?.redacted).toBe(true);
    expect(out!.vx).toBe(0);
  });

  it("drops private on export when configured", () => {
    const out = redactSampleForExport(
      sample({ intentClass: "inner_speech" }),
      privacy({ dropPrivateOnExport: true, mode: "sealed" }),
    );
    expect(out).toBeNull();
  });

  it("redacts private class names from log entries", () => {
    const entry = redactLogEntry(
      {
        t: 1,
        kind: "privacy",
        message: "Blocked inner_speech sample",
        data: { class: "inner_speech" },
      },
      privacy({ mode: "sealed" }),
    );
    expect(entry.message).not.toContain("inner_speech");
    expect(entry.message).toContain("REDACTED");
    expect(entry.data?.class).toBe("REDACTED");
  });

  it("recordBlock increments audit counters", () => {
    const a = recordBlock(DEFAULT_AUDIT, "test", "inner_speech", 123);
    expect(a.blockedPrivateSamples).toBe(1);
    expect(a.almostLeaked).toBe(1);
    expect(a.lastBlockClass).toBe("inner_speech");
  });
});
