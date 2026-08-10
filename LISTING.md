# NeuraBeach listing copy (NeuraGuard)

**Source of truth for catalog re-seed.** Keep in sync with NeuraBeach seed for collection `col-neura-suite` (e.g. `seed-proj-neuraguard` when added).

> **Host note:** Planned first deploy hostname is `neuraguard.vercel.app`. If Vercel assigns a different URL, replace it everywhere below + in `neurabeach-manifest.json` before re-seeding Beach.

| Field | Value |
|-------|--------|
| **Slug** | `neuraguard` |
| **Title** | NeuraGuard |
| **Version** | `0.1.0` |
| **Category** | `research` |
| **Featured** | yes |
| **Collection** | `col-neura-suite` |
| **Suite role** | `app` (neural-state firewall / MindGuard) |
| **Depends on** | `[]` (optional soft Neurabridge later) |
| **License** | MIT |
| **GitHub** | https://github.com/pileofflapjacks1/neuraguard |
| **Live demo** | https://neuraguard.vercel.app/demo |
| **Dashboard** | https://neuraguard.vercel.app/ |
| **A11y** | https://neuraguard.vercel.app/a11y |
| **Disclaimer** | https://neuraguard.vercel.app/disclaimer |
| **How it works** | https://neuraguard.vercel.app/how-it-works |
| **Entrypoint** | same as live demo `/demo` |
| **Manifest** | `neurabeach-manifest.json` in repo root |
| **safety_class** | `computer_side` |
| **runtime** | `web` |
| **adapter_maturity** | `simulator_only` |
| **banned_claims** | `true` |
| **permissions** | `none` |
| **inputs** | `velocity_2d`, `class_label`, `synthetic` |
| **outputs** | `ui_only`, `file_export` |
| **hardware** | `synthetic`, `generic_intent`, `websocket_intent` |

---

## Short description (catalog card)

> Continuous neural-state awareness and safety layer for intention streams: fatigue manager, privacy gate, adaptive throttle, anomaly pause. Simulator-first MindGuard MVP. Not implant software. Not a medical device. Not affiliated with Neuralink.

---

## Screenshots (public absolute URLs)

```
https://neuraguard.vercel.app/screenshots/01-dashboard.svg
https://neuraguard.vercel.app/screenshots/02-policies.svg
https://neuraguard.vercel.app/screenshots/03-demo.svg
https://neuraguard.vercel.app/screenshots/04-privacy.svg
https://neuraguard.vercel.app/screenshots/05-a11y.svg
https://neuraguard.vercel.app/og.svg
```

| Asset | Content |
|-------|---------|
| `01-dashboard` | Live gauges + stream controls + policy status |
| `02-policies` | Threshold editor + privacy class picker |
| `03-demo` | `/demo` injection tour timeline |
| `04-privacy` | Continuous auth + gated private classes |
| `05-a11y` | Accessibility scorecard |
| `og.svg` | Open Graph / social card |

Suite one-pager (repo): [`docs/WHAT-IS-NEURAGUARD.md`](./docs/WHAT-IS-NEURAGUARD.md)

---

## Safety blurb (required)

Computer-side web app only. Not implant software. Not a medical device (not SaMD). Not affiliated with Neuralink or any implant vendor. Consumes **synthetic / mock intention streams** only in the MVP — never private implant APIs. Agency, privacy, and fatigue management for long simulator sessions. Local session export only; no cloud neural data. Persistent disclaimer banner + full `/disclaimer` page. `banned_claims: true`.

---

## Safety gate (upload checklist)

- [x] Computer-side / simulation / research only  
- [x] Not implant firmware  
- [x] Not a medical device / SaMD  
- [x] Not affiliated with Neuralink  
- [x] No real implant connect API claimed  
- [x] Simulator Mode badge + non-dismissible disclaimer  
- [x] `banned_claims: true` in manifest  

**One-liner:** *NeuraGuard watches synthetic intention streams and applies research policies (throttle, breaks, privacy). It does not connect to implants.*

---

## Tags

`typescript` `nextjs` `research` `intent-v1` `web` `neura-suite` `neuraguard` `mindguard` `simulator` `fatigue` `privacy` `firewall` `agency` `anomaly` `showcase` `mvp` `a11y`

---

## Suite map (do not rebuild)

| Piece | Role |
|-------|------|
| **NeuraBeach** | Catalog — https://neurabeach.com · `col-neura-suite` |
| **NeuraShell** | Daily-driver control plane |
| **NeuraBinder** | End-user TCG + BCI Mode demo |
| **Neurabridge** | Intent middleware |
| **NeuraRoboBridge** | Intent → safe robot commands |
| **Neural Flow Architect** | Flow co-pilot research |
| **NeuraGuard (this)** | Continuous neural-state firewall / safety layer |

North star: *Beach finds tools · Shell keeps you in control · Bridge shares intents · **Guard watches state and enforces safety policies on the stream.***

---

## Install (local)

```bash
npm install
npm run dev
# open http://localhost:3000/demo
# also /  /policies  /history  /a11y  /how-it-works  /disclaimer
```

```bash
npm test
npm run build
```

No env secrets required for demo mode. Optional: `NEXT_PUBLIC_SITE_URL=https://neuraguard.vercel.app` for absolute Open Graph URLs.

---

## Manifest highlights

```json
{
  "suite_role": "app",
  "depends_on": [],
  "entrypoint": "https://neuraguard.vercel.app/demo",
  "demo_video_url": "https://neuraguard.vercel.app/demo",
  "safety_class": "computer_side",
  "runtime": "web",
  "adapter_maturity": "simulator_only",
  "banned_claims": true,
  "featured": true,
  "collection": "col-neura-suite"
}
```

---

## Beach re-seed note

**Not yet seeded** — first ship. After deploy:

1. Confirm live hostname (update this LISTING + `neurabeach-manifest.json` if not `neuraguard.vercel.app`).
2. Smoke `/demo`, `/a11y`, and screenshot URLs return 200.
3. Seed Beach from this LISTING + manifest (add `seed-proj-neuraguard` in the Beach repo when ready).
4. Set **featured** on the card in `col-neura-suite` to match suite peers.
