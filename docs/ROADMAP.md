# NeuraGuard — Future Roadmap

One-page note of natural extensions beyond MVP 0.1. Research / simulation framing remains mandatory.

## Near-term

- **Real drift adaptation** — online baseline updates that track slow non-stationarity without false anomaly storms.
- **Stronger privacy crypto** — optional local encryption for session exports; zero-knowledge style “private class” commitments (still computer-side only).
- **Neurabridge live soft-link** — BroadcastChannel / WS adapter against a running Neurabridge instance (optional dep, never hard-required).
- **NeuraShell status channel** — publish policy hints (throttle factor, freeze suggest) for Shell to surface in the control plane.
- **Richer CSV schema** — multi-channel research streams with documented column profiles.

## Medium-term

- **Multi-agent integration** — policy plugins that coordinate with RoboBridge safety layers and NFA flow co-pilot hints.
- **Calibrated user profiles** — local JSON profiles for threshold presets (like Shell readiness), still offline-first.
- **Explainable policy timeline** — scrubbable session replay with “why blocked?” tooltips.
- **Keyboard stream control pack** — full WASD/arrow intention path without pointer (beyond current form focus).

## Longer-horizon (explicit non-goals until asked)

- Real implant / vendor SDKs
- Clinical validation of cognitive-state scores
- Cloud neural data pipelines or accounts
- Claiming medical efficacy or identity-grade biometrics

## Principles that stay fixed

1. Simulator always works without hardware.
2. No medical or Neuralink affiliation claims.
3. Estimation + policy logic remains inspectable.
4. Soft suite integration only unless the user requests a hard coupling.
