# Neurabridge-compatible intention adapter

NeuraGuard MVP includes a **stub** only (`src/lib/adapter/neurabridge-stub.ts`). Soft integration preferred.

## Suite intent events → IntentionSample

| Suite event | Mapping |
|-------------|---------|
| `velocity_2d` | `vx/vy` → pointer sample |
| `class_label` | label → `intentClass` + confidence |
| `switch_binary` | active → select / clickProb |
| `synthetic` | system marker |

## WebSocket (optional)

Connect mock WS source to a local Neurabridge or custom server. Frames may be suite events or full `IntentionSample` JSON.

Outbound policy hints (future):

```json
{ "type": "policy", "action": "throttle_bandwidth", "factor": 0.4, "t": 1710000000000 }
```

## Contract stability

Prefer shared suite vocabulary names. Do not invent implant-specific fields in the public adapter surface.
