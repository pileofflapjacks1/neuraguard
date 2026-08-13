# AGENTS.md — NeuraGuard

You are working on **NeuraGuard only** unless the user asks to edit another suite repo.

## Product

Computer-side **continuous neural-state firewall** for high-bandwidth intention streams (MindGuard research name).

**MVP:** 0.3.0 — live simulator, privacy airlock (sealed/public/unlocked), policy engine, drift adaptation, session export.

Not implant software. Not medical. Not Neuralink-affiliated.  
Not Binder (TCG). Not Shell (control plane). Not Beach (catalog). Not RoboBridge (robots).

## Suite role

| | |
|--|--|
| **Path** | `~/Projects/Neuralink/neuraguard` |
| **Beach** | `col-neura-suite` · `suite_role: app` |
| **Inputs** | `velocity_2d`, `class_label`, `synthetic` (+ privacy-aware classes) |
| **Outputs** | `ui_only`, `file_export` |

## MVP boundaries

- Simulator-first: synthetic + CSV + mock WS always work without hardware.
- Pipeline: Stream Ingest → Feature Extractor → State Estimator → Policy Engine → Action Dispatcher.
- Estimation = transparent heuristics / EMAs — document in `formulas.ts` and How it works.
- No implant SDKs, medical claims, cloud neural pipelines, or monorepo merges without explicit ask.
- Soft Neurabridge adapter stub only (`src/lib/adapter/neurabridge-stub.ts`).

## Layout

```
src/app/           / /policies /history /how-it-works /disclaimer /demo /a11y
src/components/    dashboard, gauges, charts, stream, policy, auth
src/lib/stream/    synthetic, csv, mock-ws, features
src/lib/estimate/  state-estimator, formulas
src/lib/policy/    engine
src/lib/auth/      biometric toy
src/lib/adapter/   neurabridge stub
public/screenshots/ Beach catalog SVGs + og.svg
docs/              WHAT-IS-NEURAGUARD, ROADMAP, NEURABRIDGE-ADAPTER
LISTING.md         Beach re-seed copy (screenshots + absolute URLs)
neurabeach-manifest.json
```

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```

## Commits

Author: Joe \<pileofflapjacks1@gmail.com\>

## Beach

Re-seed from `LISTING.md` + `neurabeach-manifest.json` when version or demo URL changes.
