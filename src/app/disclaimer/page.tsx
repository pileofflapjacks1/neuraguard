export default function DisclaimerPage() {
  return (
    <article className="prose prose-invert mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-guard-fg">
        Full disclaimer
      </h1>

      <div className="guard-card border-amber-500/40 bg-amber-950/30 space-y-3 text-sm leading-relaxed text-amber-50">
        <p>
          <strong>NeuraGuard (MindGuard)</strong> is an educational, research,
          and simulation tool only.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Not a medical device.</strong> It is not software as a
            medical device (SaMD), not for diagnosis, treatment, or clinical
            decision-making.
          </li>
          <li>
            <strong>Not implant firmware.</strong> It does not run on, control,
            or communicate with neural implants.
          </li>
          <li>
            <strong>Not affiliated with Neuralink</strong> or any implant
            vendor. Mentions of “Neuralink-style” bandwidth refer only to
            high-level research framing of intention streams.
          </li>
          <li>
            <strong>Never claims to work with real implants.</strong> The MVP
            uses synthetic data, user-uploaded CSV, or mock WebSocket streams
            only.
          </li>
          <li>
            Cognitive load, focus, fatigue, agency, anomaly, and biometric
            scores are <strong>transparent research heuristics</strong> — not
            validated clinical measures and not identity verification.
          </li>
          <li>
            Policy actions (throttle, breaks, privacy blocks, session lock)
            affect only the <strong>in-app simulated stream</strong>, not OS
            control or external hardware unless you later wire a separate
            adapter under your own responsibility.
          </li>
        </ul>
      </div>

      <section className="guard-card space-y-2 text-sm text-guard-muted">
        <h2 className="text-base font-semibold text-guard-fg">
          Intended use
        </h2>
        <p>
          Community / research tool in the Neurabeach catalog: explore
          continuous neural-state awareness, fatigue management, and privacy
          gates for long daily BCI-style intention sessions — in simulation.
        </p>
      </section>

      <section className="guard-card space-y-2 text-sm text-guard-muted">
        <h2 className="text-base font-semibold text-guard-fg">Data</h2>
        <p>
          Session state lives in your browser memory for the current page
          session. Exports are generated locally. No cloud neural data pipeline
          is included in this MVP.
        </p>
      </section>

      <section className="guard-card space-y-2 text-sm text-guard-muted">
        <h2 className="text-base font-semibold text-guard-fg">License</h2>
        <p>
          MIT — see <code className="text-cyan-200">LICENSE</code>. Use at your
          own risk for research and education.
        </p>
      </section>
    </article>
  );
}
