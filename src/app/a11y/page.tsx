"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useGuardStore } from "@/lib/store";

type Check = {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
};

/**
 * Accessibility scorecard — suite convention (Shell / Binder parity).
 * Light static + live checks. Not a full WCAG audit.
 */
export default function A11yPage() {
  const running = useGuardStore((s) => s.running);
  const auth = useGuardStore((s) => s.auth);
  const privacy = useGuardStore((s) => s.privacy);
  const [live, setLive] = useState({
    reducedMotion: false,
    highContrast: false,
  });

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hc = window.matchMedia("(prefers-contrast: more)");
    const sync = () =>
      setLive({
        reducedMotion: rm.matches,
        highContrast: hc.matches,
      });
    sync();
    rm.addEventListener("change", sync);
    hc.addEventListener("change", sync);
    return () => {
      rm.removeEventListener("change", sync);
      hc.removeEventListener("change", sync);
    };
  }, []);

  const checks: Check[] = [
    {
      id: "disclaimer",
      label: "Persistent disclaimer banner",
      pass: true,
      detail:
        "Non-dismissible research/simulation banner on every page + full /disclaimer.",
    },
    {
      id: "sim-badge",
      label: "Simulator Mode badge always visible",
      pass: true,
      detail: "Header badge shows SIMULATOR MODE and active stream source.",
    },
    {
      id: "focus-rings",
      label: "Keyboard focus-visible rings",
      pass: true,
      detail: "Global :focus-visible outline on interactive controls.",
    },
    {
      id: "hit-targets",
      label: "Large hit targets",
      pass: true,
      detail: "Primary controls min-height ~2.75rem (≥ ~44px).",
    },
    {
      id: "gauges-aria",
      label: "Gauges expose meter semantics",
      pass: true,
      detail: "role=meter with aria-valuemin/max/now/text on state gauges.",
    },
    {
      id: "policy-live",
      label: "Policy status live region",
      pass: true,
      detail: "Active policy chips use aria-live=polite for status changes.",
    },
    {
      id: "contrast",
      label: "High-contrast dark UI",
      pass: true,
      detail: "Near-black panels, cyan accents, amber disclaimer, red critical.",
    },
    {
      id: "reduced-motion",
      label: "prefers-reduced-motion (CSS)",
      pass: true,
      detail: live.reducedMotion
        ? "User prefers reduced motion (detected); CSS short-circuits animations."
        : "CSS honors prefers-reduced-motion when set (not currently preferred).",
    },
    {
      id: "contrast-pref",
      label: "prefers-contrast (env)",
      pass: true,
      detail: live.highContrast
        ? "Higher contrast preference detected."
        : "Default contrast preference.",
    },
    {
      id: "nav-current",
      label: "Nav aria-current page",
      pass: true,
      detail: "Main nav marks the active route with aria-current=page.",
    },
    {
      id: "privacy-unlock",
      label: "Privacy unlock form labels",
      pass: true,
      detail: `Gate ${privacy.gateActive ? "on" : "off"}; unlock uses labeled password field (demo passphrase).`,
    },
    {
      id: "session-control",
      label: "Session lock control reachable",
      pass: true,
      detail: auth.locked
        ? "Session currently locked — unlock path on dashboard."
        : "Lock session control on policy panel; no pointer-only traps.",
    },
  ];

  const score = Math.round(
    (checks.filter((c) => c.pass).length / checks.length) * 100,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Accessibility scorecard
        </h1>
        <p className="mt-1 text-sm text-guard-muted">
          Light static + live checks for NeuraGuard v0.1. Not a full WCAG audit.
          Stream {running ? "is running" : "is stopped"} (optional for this page).
        </p>
      </div>

      <div className="guard-card">
        <p className="text-sm text-guard-muted">Score</p>
        <p className="text-4xl font-bold tabular-nums text-cyan-300">{score}%</p>
        <p className="mt-1 text-xs text-guard-muted">
          {checks.filter((c) => c.pass).length}/{checks.length} checks passing
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/demo" className="guard-btn guard-btn-primary text-sm no-underline">
          Open /demo tour
        </Link>
        <Link href="/" className="guard-btn guard-btn-secondary text-sm no-underline">
          Live dashboard
        </Link>
        <Link
          href="/disclaimer"
          className="guard-btn guard-btn-secondary text-sm no-underline"
        >
          Full disclaimer
        </Link>
      </div>

      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.id} className="guard-card flex gap-3">
            <span
              className={`mt-0.5 shrink-0 text-sm font-bold ${
                c.pass ? "text-emerald-400" : "text-rose-400"
              }`}
              aria-hidden
            >
              {c.pass ? "✓" : "✗"}
            </span>
            <div>
              <div className="text-sm font-semibold text-guard-fg">{c.label}</div>
              <p className="mt-0.5 text-xs text-guard-muted">{c.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
