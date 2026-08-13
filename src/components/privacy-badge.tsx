"use client";

import { useGuardStore } from "@/lib/store";
import { privacyModeLabel, resolvePrivacyMode } from "@/lib/privacy/airlock";

/** Always-visible privacy airlock status badge. */
export function PrivacyBadge() {
  const privacy = useGuardStore((s) => s.privacy);
  const audit = useGuardStore((s) => s.privacyAudit);
  const mode = resolvePrivacyMode(privacy);
  const label = privacyModeLabel(mode);

  const styles =
    mode === "sealed"
      ? "border-violet-500/50 bg-violet-950/70 text-violet-100"
      : mode === "public_only"
        ? "border-amber-500/40 bg-amber-950/60 text-amber-100"
        : "border-emerald-500/40 bg-emerald-950/50 text-emerald-100";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${styles}`}
      title="Computer-side intention-class airlock. Not implant encryption. Research simulation only."
      role="status"
      aria-label={`Privacy airlock ${label}. Blocked private samples: ${audit.blockedPrivateSamples}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          mode === "sealed"
            ? "bg-violet-400"
            : mode === "public_only"
              ? "bg-amber-400"
              : "bg-emerald-400"
        }`}
        aria-hidden
      />
      {label}
      {audit.almostLeaked > 0 ? (
        <span className="font-normal opacity-80">
          · {audit.almostLeaked} blocked
        </span>
      ) : null}
    </span>
  );
}
