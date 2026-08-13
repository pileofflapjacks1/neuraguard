# What is NeuraGuard?

**One-pager for the Neura suite / NeuraBeach catalog.**

## In one sentence

NeuraGuard is a **computer-side, simulator-first continuous neural-state firewall** — fatigue manager, privacy gate, and adaptive policy layer for high-bandwidth *intention streams*.

## Research name

**MindGuard** appears in research notes and the original product prompt. The suite product and Beach listing name is **NeuraGuard**.

## Where it sits

```
NeuraBeach (discover)
  → NeuraShell   — day-to-day control plane (ARM, panic, modes)
  → NeuraGuard   — watches stream state; throttles / breaks / privacy
  → Neurabridge  — optional middleware for sharing intents
  → apps (Binder, …) / Intent→OS / RoboBridge
```

North star: *Beach finds tools · Shell keeps you in control · Bridge shares intents · **Guard watches state and enforces safety policies on the stream.***

## What it does (MVP)

| Capability | Behavior |
|------------|----------|
| Live simulator | Synthetic intention stream + fatigue / distraction / private / anomaly injectors |
| State estimates | Load, focus, fatigue, agency, anomaly (EMA hysteresis), toy biometric match |
| Drift adaptation (0.2) | Slow baseline EMA when stable; freezes on high anomaly |
| **Privacy airlock (0.3)** | Sealed / public-only / unlocked; fail-closed private classes; export redaction; audit |
| Policy engine | Throttle bandwidth, low-effort mode, micro-breaks, pause sensitive |
| Export | Session log → JSON / CSV |
| Adapter stub | Neurabridge-shaped intention contract (soft, optional) |

## What it is *not*

- Not implant firmware or a Neuralink product  
- Not a medical device / SaMD  
- Not identity-grade biometrics  
- Not a robot controller (that’s RoboBridge)  
- Not a daily control plane (that’s Shell)

All MVP “neural” data is **synthetic**, user CSV, or mock WebSocket.

## Try it

| Route | Purpose |
|-------|---------|
| `/demo` | Auto-running injection tour (catalog entrypoint) |
| `/` | Full live dashboard |
| `/policies` | Threshold + privacy editor |
| `/a11y` | Accessibility scorecard |
| `/disclaimer` | Full safety text |

Local: `npm install && npm run dev`  
Listing: [`LISTING.md`](../LISTING.md) · Manifest: [`neurabeach-manifest.json`](../neurabeach-manifest.json)
