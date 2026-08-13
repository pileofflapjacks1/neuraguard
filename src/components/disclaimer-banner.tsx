import Link from "next/link";

/**
 * Persistent, non-dismissible disclaimer — required for all Neura suite apps.
 */
export function DisclaimerBanner() {
  return (
    <div
      role="note"
      aria-label="Research simulation disclaimer"
      className="border-b border-amber-500/40 bg-amber-950/90 px-3 py-2.5 text-center text-xs leading-snug text-amber-50 sm:text-sm"
    >
      <strong className="font-semibold">Research / simulation only.</strong> Not
      a medical device. Not implant software. Not affiliated with Neuralink.
      Privacy airlock = computer-side intention-class containment — not implant
      encryption. All neural data is synthetic or mock.{" "}
      <Link
        href="/disclaimer"
        className="font-semibold text-amber-100 underline underline-offset-2 hover:text-white"
      >
        Full disclaimer
      </Link>
    </div>
  );
}
