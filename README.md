# NeuraGuard

**MVP 0.3.0** — continuous **neural-state firewall** with a **privacy airlock** (fail-closed private intention classes), fatigue manager, and online baseline drift adaptation.

Also known in research notes as **MindGuard**.

Simulator-first. **Not** implant software. **Not** a Neuralink product. **Not** a medical device.

```
Intention stream (synthetic / CSV / mock WS)
  → Feature extractor
  → State estimator (load · focus · fatigue · agency)
  → Policy engine (throttle · breaks · privacy · lock)
  → Action dispatcher (gated stream + UI)
```

| Doc | |
|-----|--|
| **Suite one-pager** | [`docs/WHAT-IS-NEURAGUARD.md`](./docs/WHAT-IS-NEURAGUARD.md) |
| **Beach listing** | [`LISTING.md`](./LISTING.md) |
| **Manifest** | [`neurabeach-manifest.json`](./neurabeach-manifest.json) |
| **Roadmap** | [`docs/ROADMAP.md`](./docs/ROADMAP.md) |
| **Changelog** | [`CHANGELOG.md`](./CHANGELOG.md) |

---

## Live (planned host)

| | |
|--|--|
| **Demo tour** | https://neuraguard.vercel.app/demo |
| **Dashboard** | https://neuraguard.vercel.app/ |
| **A11y** | https://neuraguard.vercel.app/a11y |
| **Disclaimer** | https://neuraguard.vercel.app/disclaimer |
| **Beach listing** | *(seed after deploy)* https://neurabeach.com/projects/neuraguard |
| **Suite collection** | https://neurabeach.com/collections/col-neura-suite |
| **GitHub** | https://github.com/pileofflapjacks1/neuraguard |

If Vercel assigns a different hostname, update `LISTING.md` + `neurabeach-manifest.json` before Beach re-seed.

---

## Disclaimer (read this)

| | |
|--|--|
| **Not** a medical device | Not SaMD; not for diagnosis or treatment |
| **Not** implant firmware | No implant SDKs; no vendor APIs |
| **Not** Neuralink-affiliated | Unaffiliated research suite tool |
| **Data** | Synthetic, user CSV, or mock WebSocket only |

A **persistent banner** and full page at `/disclaimer` ship with the app. Never claim real-implant operation.

---

## Quick start

```bash
cd ~/Projects/neuraguard
npm install
npm run dev
```

| Route | Purpose |
|-------|---------|
| `/` | Live dashboard (gauges, charts, stream controls) |
| `/demo` | Auto-running injection tour (**catalog entrypoint**) |
| `/policies` | Threshold + privacy gate editor |
| `/history` | Session log + export |
| `/how-it-works` | Pipeline + formulas |
| `/a11y` | Accessibility scorecard |
| `/disclaimer` | Full legal/safety text |

```bash
npm test
npm run build
```

No accounts. No env secrets for demo mode.  
Optional: `NEXT_PUBLIC_SITE_URL=https://neuraguard.vercel.app` for absolute Open Graph URLs.

---

## What ships (MVP 0.1)

| Area | Behavior |
|------|----------|
| **Live stream simulator** | Synthetic velocity + click + intent tags; inject fatigue / distraction / private / anomaly |
| **CSV + mock WS** | Replay sample CSV; optional WS URL or in-process mock |
| **State dashboard** | Cognitive load, focus, fatigue, agency, anomaly, biometric match |
| **Charts** | Live time-series (Recharts) |
| **Policy engine** | Editable thresholds → throttle, low-effort, micro-break, pause sensitive |
| **Privacy gate** | Mark classes private; block until simulated unlock |
| **Continuous auth (toy)** | Baseline vs current stream stats + mental passphrase (`focus`) |
| **Logging / export** | Session log → JSON or CSV |
| **Neurabridge stub** | Documented adapter API shape |
| **Beach packaging** | LISTING, manifest, screenshots, OG, `/a11y` |

---

## Catalog screenshots

Served from `public/screenshots/` after deploy:

1. `/screenshots/01-dashboard.svg`  
2. `/screenshots/02-policies.svg`  
3. `/screenshots/03-demo.svg`  
4. `/screenshots/04-privacy.svg`  
5. `/screenshots/05-a11y.svg`  
6. `/og.svg`

---

## Architecture

```
src/lib/stream/     ingest (synthetic, csv, mock-ws) + features
src/lib/estimate/   state estimator + documented formulas
src/lib/policy/     policy engine + bandwidth gate
src/lib/auth/       biometric unlock helpers
src/lib/adapter/    Neurabridge-compatible stub
src/lib/store.ts    Zustand live loop
src/components/     dashboard UI
src/app/            Next.js routes
```

All estimation logic is inspectable — see `src/lib/estimate/formulas.ts` and `/how-it-works`.

### Intention sample shape

```ts
{
  t: number;           // ms
  vx: number;          // ~[-1, 1]
  vy: number;
  clickProb: number;   // [0, 1]
  intentClass: "pointer" | "click" | "select" | "type" | "navigation"
             | "system" | "inner_speech" | "private_thought";
  confidence: number;  // [0, 1]
}
```

Suite soft-compat: map `velocity_2d` / `class_label` via `src/lib/adapter/neurabridge-stub.ts`.

---

## Tech stack

- Next.js 16 + React 19 + TypeScript  
- Tailwind CSS 4  
- Zustand  
- Recharts  
- Vitest (unit tests for estimator + policy)

Deployable on Vercel as a standard Next app. Demo runs fully client-side.

---

## Positioning

> Continuous neural-state awareness and safety layer for intention streams.

Community / research tool for the Neurabeach catalog — emphasize **agency**, **privacy**, and **fatigue management** for long daily BCI-style sessions (simulated).

---

## License

MIT — see [`LICENSE`](./LICENSE).
