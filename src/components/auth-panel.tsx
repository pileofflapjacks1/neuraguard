"use client";

import { useState } from "react";
import { useGuardStore } from "@/lib/store";

export function AuthPanel() {
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const auth = useGuardStore((s) => s.auth);
  const privacy = useGuardStore((s) => s.privacy);
  const biometric = useGuardStore((s) => s.state.biometricMatch);
  const unlockWithPassphrase = useGuardStore((s) => s.unlockWithPassphrase);
  const captureAuthBaseline = useGuardStore((s) => s.captureAuthBaseline);
  const lockSession = useGuardStore((s) => s.lockSession);

  function onUnlock(e: React.FormEvent) {
    e.preventDefault();
    // Quick path from auth panel: secondConfirm true so users aren't double-blocked
    const ok = unlockWithPassphrase(pass, true);
    setMsg(
      ok
        ? "Airlock open (simulated)."
        : "Unlock failed — check passphrase / biometric match.",
    );
    if (ok) setPass("");
  }

  return (
    <div className="guard-card space-y-3">
      <h2 className="text-sm font-semibold">
        Continuous auth & privacy unlock
      </h2>
      <p className="text-xs text-guard-muted">
        Toy neural-biometric match vs stream baseline + simulated mental
        passphrase. Not real identity verification.
      </p>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="guard-label">Baseline</dt>
          <dd>{auth.baselineReady ? "Ready" : "Warming up…"}</dd>
        </div>
        <div>
          <dt className="guard-label">Match</dt>
          <dd className="font-mono">{biometric.toFixed(0)}%</dd>
        </div>
        <div>
          <dt className="guard-label">Session</dt>
          <dd>{auth.locked ? "Locked" : "Open"}</dd>
        </div>
        <div>
          <dt className="guard-label">Airlock</dt>
          <dd className="capitalize">{privacy.mode.replace("_", " ")}</dd>
        </div>
      </dl>

      <p className="text-xs text-guard-muted">
        Prefer the <strong>Privacy airlock</strong> panel for seal / unlock
        ceremony. This panel is continuous auth + emergency lock.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="guard-btn guard-btn-secondary text-sm"
          onClick={captureAuthBaseline}
        >
          Capture baseline
        </button>
        <button
          type="button"
          className="guard-btn guard-btn-danger text-sm"
          onClick={lockSession}
        >
          Lock + seal
        </button>
      </div>

      <form onSubmit={onUnlock} className="space-y-2">
        <label className="block space-y-1 text-sm">
          <span className="guard-label">
            Quick unlock (demo:{" "}
            <span className="font-mono text-cyan-200">focus</span>)
          </span>
          <input
            type="password"
            className="guard-input"
            autoComplete="off"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Enter simulated passphrase"
          />
        </label>
        <button type="submit" className="guard-btn guard-btn-primary w-full sm:w-auto">
          Unlock (skips second confirm)
        </button>
      </form>
      {msg ? (
        <p className="text-sm text-cyan-100" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
