"use client";

import { useState } from "react";
import { useGuardStore } from "@/lib/store";
import {
  privacyModeLabel,
  resolvePrivacyMode,
  type PrivacyMode,
} from "@/lib/privacy/airlock";
import { formatTime } from "@/lib/utils";

const MODES: { id: PrivacyMode; label: string; desc: string }[] = [
  {
    id: "sealed",
    label: "Sealed",
    desc: "Default-deny private classes + block export/WS/suite sinks",
  },
  {
    id: "public_only",
    label: "Public only",
    desc: "Private blocked; local export allowed (redacted)",
  },
  {
    id: "unlocked",
    label: "Open",
    desc: "Private classes may pass gated stream (still sim-only)",
  },
];

export function PrivacyAirlockPanel() {
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const privacy = useGuardStore((s) => s.privacy);
  const audit = useGuardStore((s) => s.privacyAudit);
  const lastDisplayClass = useGuardStore((s) => s.lastDisplayClass);
  const lastAirlockReason = useGuardStore((s) => s.lastAirlockReason);
  const lastGated = useGuardStore((s) => s.lastGatedSample);
  const lastSample = useGuardStore((s) => s.lastSample);
  const biometric = useGuardStore((s) => s.state.biometricMatch);

  const setPrivacyMode = useGuardStore((s) => s.setPrivacyMode);
  const setPrivacy = useGuardStore((s) => s.setPrivacy);
  const unlockWithPassphrase = useGuardStore((s) => s.unlockWithPassphrase);
  const sealPrivacy = useGuardStore((s) => s.sealPrivacy);

  const mode = resolvePrivacyMode(privacy);

  function onUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (privacy.requireSecondConfirm && !confirm) {
      setMsg("Check “I release private classes” to confirm.");
      return;
    }
    const ok = unlockWithPassphrase(pass, confirm || !privacy.requireSecondConfirm);
    setMsg(
      ok
        ? `Airlock open (sim). Auto re-seal in ${Math.round(privacy.autoRelockMs / 1000)}s if set.`
        : "Unlock failed — passphrase / biometric / confirm.",
    );
    if (ok) {
      setPass("");
      setConfirm(false);
    }
  }

  return (
    <div className="guard-card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Privacy airlock</h2>
          <p className="mt-1 text-xs text-guard-muted">
            Fail-closed containment for private intention classes. Blocks
            gated stream output and untrusted sinks so “private thoughts”
            don’t leave this app until you unlock.{" "}
            <strong className="text-amber-100/90">
              Computer-side simulation only — not implant encryption, not
              Neuralink security.
            </strong>
          </p>
        </div>
        <span className="rounded-full border border-violet-500/40 bg-violet-950/50 px-3 py-1 text-xs font-semibold text-violet-100">
          {privacyModeLabel(mode)}
        </span>
      </div>

      <fieldset>
        <legend className="guard-label mb-2">Mode</legend>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              title={m.desc}
              aria-pressed={mode === m.id}
              className={`guard-btn text-sm ${
                mode === m.id ? "guard-btn-primary" : "guard-btn-secondary"
              }`}
              onClick={() => {
                if (m.id === "unlocked") {
                  setMsg("Use passphrase unlock below to open the airlock.");
                  return;
                }
                setPrivacyMode(m.id);
                setMsg(null);
              }}
            >
              {m.label}
            </button>
          ))}
          <button
            type="button"
            className="guard-btn guard-btn-danger text-sm"
            onClick={() => {
              sealPrivacy();
              setMsg("Sealed.");
            }}
          >
            Force seal
          </button>
        </div>
      </fieldset>

      {/* Audit */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-guard-border bg-guard-bg/60 p-3">
          <div className="guard-label">Blocked private</div>
          <div className="font-mono text-xl font-bold text-violet-200">
            {audit.blockedPrivateSamples}
          </div>
        </div>
        <div className="rounded-xl border border-guard-border bg-guard-bg/60 p-3">
          <div className="guard-label">Almost leaked</div>
          <div className="font-mono text-xl font-bold text-amber-200">
            {audit.almostLeaked}
          </div>
        </div>
        <div className="rounded-xl border border-guard-border bg-guard-bg/60 p-3">
          <div className="guard-label">Export redactions</div>
          <div className="font-mono text-xl font-bold text-cyan-200">
            {audit.redactedExports}
          </div>
        </div>
        <div className="rounded-xl border border-guard-border bg-guard-bg/60 p-3">
          <div className="guard-label">Sink blocks</div>
          <div className="font-mono text-xl font-bold text-rose-200">
            {audit.blockedSinkAttempts}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-guard-border/80 bg-guard-bg/40 p-3 font-mono text-xs">
        <div className="guard-label mb-1">Live gate</div>
        <div className="text-guard-muted">
          raw:{" "}
          <span className="text-guard-fg">
            {lastSample
              ? mode !== "unlocked" &&
                privacy.redactLabelsWhenSealed &&
                privacy.privateClasses.includes(lastSample.intentClass)
                ? "REDACTED"
                : lastSample.intentClass
              : "—"}
          </span>
          {" → "}
          gated:{" "}
          <span className={lastGated ? "text-emerald-300" : "text-rose-300"}>
            {lastGated
              ? lastGated.intentClass
              : lastAirlockReason
                ? "BLOCKED"
                : "—"}
          </span>
          {lastDisplayClass ? (
            <span className="text-guard-muted"> · display={lastDisplayClass}</span>
          ) : null}
        </div>
        {audit.lastBlockReason ? (
          <div className="mt-2 text-violet-200/90">
            Last block: {audit.lastBlockReason}
            {audit.lastBlockAt ? (
              <span className="text-guard-muted">
                {" "}
                · {formatTime(audit.lastBlockAt)}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <form onSubmit={onUnlock} className="space-y-2 border-t border-guard-border pt-3">
        <label className="block space-y-1 text-sm">
          <span className="guard-label">
            Unlock ceremony (demo passphrase:{" "}
            <span className="font-mono text-cyan-200">focus</span>) · match{" "}
            {biometric.toFixed(0)}%
          </span>
          <input
            type="password"
            className="guard-input"
            autoComplete="off"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Simulated mental passphrase"
          />
        </label>
        {privacy.requireSecondConfirm ? (
          <label className="flex items-start gap-2 text-sm text-guard-fg">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-violet-400"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
            />
            <span>
              I deliberately release private intention classes through the
              airlock for a limited window (simulation only).
            </span>
          </label>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="guard-btn guard-btn-primary text-sm">
            Unlock airlock
          </button>
          <label className="flex items-center gap-2 text-xs text-guard-muted">
            Auto re-seal (s)
            <input
              type="number"
              min={0}
              max={600}
              className="guard-input w-20 min-h-9 py-1 text-sm"
              value={Math.round(privacy.autoRelockMs / 1000)}
              onChange={(e) =>
                setPrivacy({
                  autoRelockMs: Math.max(0, Number(e.target.value)) * 1000,
                })
              }
            />
          </label>
        </div>
      </form>
      {msg ? (
        <p className="text-sm text-cyan-100" role="status">
          {msg}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 text-xs text-guard-muted">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={privacy.alwaysRedactExports}
            onChange={(e) =>
              setPrivacy({ alwaysRedactExports: e.target.checked })
            }
            className="accent-violet-400"
          />
          Always redact exports
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={privacy.redactLabelsWhenSealed}
            onChange={(e) =>
              setPrivacy({ redactLabelsWhenSealed: e.target.checked })
            }
            className="accent-violet-400"
          />
          Redact labels in UI
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={privacy.dropPrivateOnExport}
            onChange={(e) =>
              setPrivacy({ dropPrivateOnExport: e.target.checked })
            }
            className="accent-violet-400"
          />
          Drop private rows on export
        </label>
      </div>
    </div>
  );
}
