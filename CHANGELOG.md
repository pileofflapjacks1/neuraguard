# Changelog

## 0.3.0 — 2026-08-09

### Privacy Airlock (MindGuard privacy pack)

- **Modes:** `sealed` (default) · `public_only` · `unlocked`
- **Fail-closed gated stream** — private intention classes never leave on `lastGatedSample` while sealed/public-only
- **Outbound sink rules** — SEALED blocks export / suite bus / external WS; Public-only allows redacted local export
- **Export redaction** — private class names/samples scrubbed (or dropped) by default
- **Unlock ceremony** — passphrase + optional second confirm + timed auto re-seal
- **Privacy audit** — blocked private counts, almost-leaked, export redactions, sink blocks
- **UI** — persistent PRIVATE SEALED badge, Privacy airlock panel on dashboard
- Disclaimer/banner: airlock = computer-side intention-class containment, not implant encryption
- Unit tests for airlock decisions, sinks, redaction (33 total)

## 0.2.0 — 2026-08-09

### Online baseline drift adaptation (MindGuard session intelligence)

- **Online drift** — when smoothed anomaly stays low for N ticks, slowly EMA-update the auth/anomaly baseline toward current stream features
- **Anomaly hysteresis** — EMA on anomaly score reduces flapping from brief spikes
- **Freeze on shock** — drift disabled during high anomaly / anomaly injection so sudden shifts still trip policies
- **Drift panel** on Live Dashboard — status, stable-tick gate, drift meter, α slider, hard-reset baseline
- **Inspectable formulas** — `formulas.ts` documents drift + smoothed anomaly
- Unit tests for adapt / freeze / disable paths (22 total)

## 0.1.0 — 2026-08-09

Initial MindGuard / NeuraGuard MVP + Beach listing polish:

### Product
- Live synthetic intention stream with fatigue, distraction, private, anomaly injections
- CSV replay and mock WebSocket ingest
- Real-time cognitive-state estimation (load, focus, fatigue, agency, anomaly, biometric match)
- Configurable policy engine and privacy gate
- Dashboard, policy editor, session history, how-it-works, disclaimer, demo tour
- JSON/CSV export
- Neurabridge adapter stub
- Unit tests for estimator, policy, and feature modules

### Beach / suite packaging
- `LISTING.md` with absolute demo, a11y, and screenshot URLs (Shell/Binder parity)
- `neurabeach-manifest.json` with `screenshots[]`, `a11y_url`, `featured`, `col-neura-suite`
- Catalog SVGs: `public/screenshots/01–05` + polished `og.svg`
- `/a11y` accessibility scorecard
- `docs/WHAT-IS-NEURAGUARD.md` suite one-pager
