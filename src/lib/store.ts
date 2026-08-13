/**
 * NeuraGuard Zustand store — stream loop, state history, policies, privacy, logs.
 * Client-side only; no real neural hardware.
 */

"use client";

import { create } from "zustand";
import type {
  AuthState,
  BandwidthState,
  CognitiveState,
  IntentionSample,
  PolicyAction,
  PolicyThresholds,
  PrivacySettings,
  SessionLogEntry,
  SimulatorInjection,
  StreamFeatures,
  StreamSource,
} from "@/lib/types";
import {
  DEFAULT_PRIVACY,
  DEFAULT_THRESHOLDS,
} from "@/lib/types";
import { SyntheticStream } from "@/lib/stream/synthetic";
import { extractFeatures } from "@/lib/stream/features";
import {
  createEstimatorState,
  estimateState,
  captureBaseline,
  type EstimatorConfig,
  type EstimatorInternal,
} from "@/lib/estimate/state-estimator";
import {
  applyBandwidth,
  createPolicyEngineState,
  evaluatePolicies,
  type PolicyEngineState,
} from "@/lib/policy/engine";
import { attemptUnlock } from "@/lib/auth/biometric";
import { CsvReplay, parseIntentionCsv } from "@/lib/stream/csv-loader";
import { MockIntentionSocket } from "@/lib/stream/mock-ws";
import {
  DEFAULT_AUDIT,
  decideAirlock,
  recordBlock,
  recordExportRedaction,
  recordSinkBlock,
  type PrivacyAudit,
  type PrivacyMode,
} from "@/lib/privacy/airlock";

const MAX_SAMPLES = 600; // ~30s at 20Hz kept for features; charts use state history
const MAX_STATE_HISTORY = 600; // ~10 min at 1Hz tick; we tick at 10–20Hz so ~30–60s dense; we'll downsample store pushes
const MAX_LOG = 200;

export interface GuardStore {
  // runtime
  running: boolean;
  source: StreamSource;
  injection: SimulatorInjection;
  hz: number;
  wsUrl: string;

  // latest
  lastSample: IntentionSample | null;
  lastGatedSample: IntentionSample | null;
  /** Display-safe class label (may be REDACTED when sealed) */
  lastDisplayClass: string | null;
  lastAirlockReason: string | null;
  features: StreamFeatures | null;
  state: CognitiveState;
  bandwidth: BandwidthState;
  recentActions: PolicyAction[];
  privacyAudit: PrivacyAudit;

  // history
  stateHistory: CognitiveState[];
  log: SessionLogEntry[];

  // config
  thresholds: PolicyThresholds;
  privacy: PrivacySettings;
  auth: AuthState;

  // internals (not for direct UI mutation of logic)
  _samples: IntentionSample[];
  _estimator: EstimatorInternal;
  _estConfig: EstimatorConfig;
  _policy: PolicyEngineState;
  _synth: SyntheticStream | null;
  _csv: CsvReplay | null;
  _ws: MockIntentionSocket | null;
  _timer: ReturnType<typeof setInterval> | null;
  _relockTimer: ReturnType<typeof setTimeout> | null;
  _tickCount: number;

  // actions
  start: () => void;
  stop: () => void;
  resetSession: () => void;
  setSource: (s: StreamSource) => void;
  setInjection: (i: SimulatorInjection) => void;
  setHz: (hz: number) => void;
  setWsUrl: (url: string) => void;
  setThresholds: (partial: Partial<PolicyThresholds>) => void;
  setPrivacy: (partial: Partial<PrivacySettings>) => void;
  setPrivacyMode: (mode: PrivacyMode) => void;
  togglePrivacyClass: (c: PrivacySettings["privateClasses"][number]) => void;
  unlockWithPassphrase: (pass: string, secondConfirm?: boolean) => boolean;
  sealPrivacy: () => void;
  lockSession: () => void;
  dismissBreak: () => void;
  captureAuthBaseline: () => void;
  loadCsvText: (text: string) => void;
  setDriftAdaptEnabled: (enabled: boolean) => void;
  setDriftConfig: (
    partial: Partial<
      Pick<
        EstimatorConfig,
        "driftAlpha" | "driftAnomalyMax" | "driftStableTicks" | "anomalyAlpha"
      >
    >,
  ) => void;
  noteExportRedaction: () => void;
  noteSinkBlock: (reason: string) => void;
  pushLog: (entry: Omit<SessionLogEntry, "t"> & { t?: number }) => void;
  ingestSample: (sample: IntentionSample) => void;
}

function initialCognitive(t = Date.now()): CognitiveState {
  return {
    t,
    cognitiveLoad: 25,
    focus: 70,
    fatigue: 12,
    agency: 75,
    anomalyScore: 5,
    biometricMatch: 90,
    driftAdapting: false,
    baselineDrift: 0,
    stableTicks: 0,
  };
}

function initialBandwidth(): BandwidthState {
  return {
    factor: 1,
    lowEffortMode: false,
    breakSuggested: false,
    breakForced: false,
    sensitivePaused: false,
    privateBlocked: true,
    privacyMode: "sealed",
  };
}

function clearRelockTimer(get: () => GuardStore): void {
  const t = get()._relockTimer;
  if (t) clearTimeout(t);
}

export const useGuardStore = create<GuardStore>((set, get) => {
  const est = createEstimatorState();

  return {
    running: false,
    source: "synthetic",
    injection: "none",
    hz: 20,
    wsUrl: "",

    lastSample: null,
    lastGatedSample: null,
    lastDisplayClass: null,
    lastAirlockReason: null,
    features: null,
    state: initialCognitive(),
    bandwidth: initialBandwidth(),
    recentActions: [],
    privacyAudit: { ...DEFAULT_AUDIT },

    stateHistory: [],
    log: [
      {
        t: Date.now(),
        kind: "system",
        message:
          "NeuraGuard ready — research simulation only. Not a medical device.",
      },
      {
        t: Date.now(),
        kind: "privacy",
        message:
          "Privacy airlock SEALED by default — private intention classes fail-closed.",
      },
    ],

    thresholds: { ...DEFAULT_THRESHOLDS },
    privacy: { ...DEFAULT_PRIVACY },
    auth: {
      baselineReady: false,
      locked: false,
      lastUnlockAt: null,
      failCount: 0,
    },

    _samples: [],
    _estimator: est.state,
    _estConfig: est.config,
    _policy: createPolicyEngineState(),
    _synth: null,
    _csv: null,
    _ws: null,
    _timer: null,
    _relockTimer: null,
    _tickCount: 0,

    pushLog: (entry) => {
      const full: SessionLogEntry = {
        t: entry.t ?? Date.now(),
        kind: entry.kind,
        message: entry.message,
        data: entry.data,
      };
      set((s) => ({ log: [full, ...s.log].slice(0, MAX_LOG) }));
    },

    ingestSample: (sample) => {
      const s = get();
      const samples = [...s._samples, sample].slice(-MAX_SAMPLES);
      const features = extractFeatures(samples, sample.t);
      const { state, internal } = estimateState(
        features,
        s._estimator,
        s._estConfig,
        s.injection,
      );

      const authLocked = s.auth.locked;
      const policyResult = evaluatePolicies(
        state,
        s.thresholds,
        s.privacy,
        s._policy,
        authLocked,
      );

      // Privacy airlock (fail-closed) then policy allowClass
      const airlock = decideAirlock(
        sample,
        s.privacy,
        policyResult.engine.sessionLocked || s.auth.locked,
      );
      const allowed =
        airlock.allow && policyResult.allowClass(sample.intentClass);
      const throttled = applyBandwidth(
        sample.vx,
        sample.vy,
        sample.clickProb,
        policyResult.bandwidth.factor,
      );

      let privacyAudit = s.privacyAudit;
      if (!airlock.allow && airlock.isPrivate) {
        privacyAudit = recordBlock(
          privacyAudit,
          airlock.reason,
          sample.intentClass,
          sample.t,
        );
      }

      const gated: IntentionSample | null = allowed
        ? {
            ...sample,
            ...throttled,
            meta: {
              ...sample.meta,
              gated: true,
              bandwidth: policyResult.bandwidth.factor,
              airlock: "pass",
            },
          }
        : null;

      // Log new policy actions (dedupe spam: only when type set changes)
      const prevTypes = new Set(s.recentActions.slice(0, 5).map((a) => a.type));
      for (const a of policyResult.actions) {
        if (
          a.type === "none" ||
          a.type === "block_private" ||
          a.type === "airlock_sealed"
        ) {
          continue;
        }
        if (!prevTypes.has(a.type)) {
          get().pushLog({
            kind: "policy",
            message: `${a.type}: ${a.reason}`,
            data: { severity: a.severity },
            t: a.t,
          });
        }
      }

      // Sparse privacy block log (every ~20 private blocks)
      if (
        !airlock.allow &&
        airlock.isPrivate &&
        privacyAudit.blockedPrivateSamples % 20 === 1
      ) {
        get().pushLog({
          kind: "privacy",
          message: airlock.reason,
          t: sample.t,
          data: {
            almostLeaked: privacyAudit.almostLeaked,
            mode: policyResult.bandwidth.privacyMode,
          },
        });
      }

      // Auto-lock on severe biometric drop
      let auth = s.auth;
      if (
        !auth.locked &&
        state.biometricMatch < s.thresholds.biometricLock &&
        internal.baseline
      ) {
        auth = { ...auth, locked: true };
        get().pushLog({
          kind: "auth",
          message: "Session auto-locked — biometric match dropped (simulated).",
          t: state.t,
        });
      }

      const tick = s._tickCount + 1;
      // Keep ~2Hz history for charts (every N ticks)
      const every = Math.max(1, Math.round(s.hz / 2));
      let history = s.stateHistory;
      if (tick % every === 0) {
        history = [...s.stateHistory, state].slice(-MAX_STATE_HISTORY);
      }

      set({
        lastSample: sample,
        lastGatedSample: gated,
        lastDisplayClass: airlock.displayClass,
        lastAirlockReason: airlock.allow ? null : airlock.reason,
        features,
        state,
        bandwidth: policyResult.bandwidth,
        recentActions: policyResult.actions,
        privacyAudit,
        stateHistory: history,
        _samples: samples,
        _estimator: {
          ...internal,
          baseline: internal.baseline,
        },
        _policy: {
          ...policyResult.engine,
          sessionLocked: auth.locked || policyResult.engine.sessionLocked,
        },
        auth: {
          ...auth,
          baselineReady: !!internal.baseline,
        },
        _tickCount: tick,
      });
    },

    start: () => {
      const s = get();
      if (s.running) return;
      get().stop();

      const estFresh = createEstimatorState({
        sessionStart: Date.now(),
      });

      set({
        running: true,
        _estimator: estFresh.state,
        _estConfig: estFresh.config,
        _policy: createPolicyEngineState(),
        _samples: [],
        stateHistory: [],
        state: initialCognitive(),
        bandwidth: initialBandwidth(),
        auth: {
          ...get().auth,
          locked: false,
          baselineReady: false,
        },
        _tickCount: 0,
      });

      get().pushLog({
        kind: "stream",
        message: `Stream started (${get().source}) at ${get().hz} Hz — Simulator Mode.`,
      });

      const source = get().source;

      if (source === "mock_ws") {
        const ws = new MockIntentionSocket({
          url: get().wsUrl || undefined,
          hz: get().hz,
          onSample: (sample) => {
            if (get().running) get().ingestSample(sample);
          },
          onStatus: (st, detail) => {
            get().pushLog({
              kind: "stream",
              message: `WebSocket ${st}${detail ? `: ${detail}` : ""}`,
            });
          },
        });
        ws.connect();
        set({ _ws: ws, _synth: null, _csv: null, _timer: null });
        return;
      }

      if (source === "csv") {
        const csv = get()._csv;
        if (!csv) {
          get().pushLog({
            kind: "system",
            message: "No CSV loaded — falling back to synthetic.",
          });
          set({ source: "synthetic" });
        }
      }

      const synth = new SyntheticStream({
        hz: get().hz,
        injection: get().injection,
      });
      set({ _synth: synth });

      const timer = setInterval(() => {
        const cur = get();
        if (!cur.running) return;

        let sample: IntentionSample | null = null;
        if (cur.source === "csv" && cur._csv) {
          sample = cur._csv.next();
          if (!sample) {
            // loop replay
            cur._csv.reset();
            sample = cur._csv.next();
          }
        } else {
          cur._synth?.setInjection(cur.injection);
          sample = cur._synth?.next() ?? synth.next();
        }
        if (sample) cur.ingestSample(sample);
      }, 1000 / get().hz);

      set({ _timer: timer, _ws: null });
    },

    stop: () => {
      const s = get();
      if (s._timer) clearInterval(s._timer);
      s._ws?.disconnect();
      set({
        running: false,
        _timer: null,
        _ws: null,
      });
      if (s.running) {
        get().pushLog({ kind: "stream", message: "Stream stopped." });
      }
    },

    resetSession: () => {
      get().stop();
      clearRelockTimer(get);
      const estFresh = createEstimatorState({ sessionStart: Date.now() });
      set({
        lastSample: null,
        lastGatedSample: null,
        lastDisplayClass: null,
        lastAirlockReason: null,
        features: null,
        state: initialCognitive(),
        bandwidth: initialBandwidth(),
        recentActions: [],
        privacyAudit: { ...DEFAULT_AUDIT },
        stateHistory: [],
        _samples: [],
        _estimator: estFresh.state,
        _estConfig: estFresh.config,
        _policy: createPolicyEngineState(),
        _csv: null,
        injection: "none",
        auth: {
          baselineReady: false,
          locked: false,
          lastUnlockAt: null,
          failCount: 0,
        },
        privacy: { ...DEFAULT_PRIVACY },
        log: [
          {
            t: Date.now(),
            kind: "system",
            message: "Session reset. Research simulation only.",
          },
          {
            t: Date.now(),
            kind: "privacy",
            message: "Privacy airlock re-SEALED on reset.",
          },
        ],
        _tickCount: 0,
        _relockTimer: null,
      });
    },

    setSource: (source) => {
      const was = get().running;
      get().stop();
      set({ source });
      get().pushLog({ kind: "stream", message: `Source set to ${source}.` });
      if (was) get().start();
    },

    setInjection: (injection) => {
      set({ injection });
      get()._synth?.setInjection(injection);
      get().pushLog({
        kind: "stream",
        message: `Simulator injection: ${injection}`,
      });
    },

    setHz: (hz) => {
      const was = get().running;
      get().stop();
      set({ hz: Math.max(5, Math.min(60, hz)) });
      if (was) get().start();
    },

    setWsUrl: (wsUrl) => set({ wsUrl }),

    setThresholds: (partial) => {
      set((s) => ({ thresholds: { ...s.thresholds, ...partial } }));
      get().pushLog({ kind: "policy", message: "Policy thresholds updated." });
    },

    setPrivacy: (partial) => {
      set((s) => {
        const next = { ...s.privacy, ...partial };
        // Keep mode / unlocked / gateActive consistent
        if (partial.mode === "unlocked") {
          next.unlocked = true;
          next.gateActive = false;
        } else if (partial.mode === "sealed" || partial.mode === "public_only") {
          next.unlocked = false;
          next.gateActive = true;
        } else if (partial.unlocked === true) {
          next.mode = "unlocked";
          next.gateActive = false;
        } else if (partial.unlocked === false) {
          next.mode = next.mode === "public_only" ? "public_only" : "sealed";
          next.gateActive = true;
        }
        return { privacy: next };
      });
      get().pushLog({
        kind: "privacy",
        message: `Privacy settings updated (${Object.keys(partial).join(", ")}).`,
      });
    },

    setPrivacyMode: (mode) => {
      get().setPrivacy({ mode });
      get().pushLog({
        kind: "privacy",
        message: `Privacy airlock mode → ${mode}`,
      });
    },

    togglePrivacyClass: (c) => {
      set((s) => {
        const has = s.privacy.privateClasses.includes(c);
        const privateClasses = has
          ? s.privacy.privateClasses.filter((x) => x !== c)
          : [...s.privacy.privateClasses, c];
        return { privacy: { ...s.privacy, privateClasses } };
      });
    },

    unlockWithPassphrase: (pass, secondConfirm = false) => {
      const s = get();
      if (s.privacy.requireSecondConfirm && !secondConfirm) {
        get().pushLog({
          kind: "privacy",
          message: "Unlock requires second confirm (release private classes).",
        });
        return false;
      }
      const result = attemptUnlock({
        passphrase: pass,
        expected: s.privacy.mentalPassphrase,
        biometricMatch: s.state.biometricMatch,
        minMatch: Math.max(25, s.thresholds.biometricLock - 10),
      });
      if (result.ok) {
        clearRelockTimer(get);
        set({
          auth: {
            ...s.auth,
            locked: false,
            lastUnlockAt: Date.now(),
            failCount: 0,
          },
          privacy: {
            ...s.privacy,
            unlocked: true,
            mode: "unlocked",
            gateActive: false,
          },
          _policy: { ...s._policy, sessionLocked: false },
        });
        get().pushLog({ kind: "auth", message: result.reason });
        get().pushLog({
          kind: "privacy",
          message:
            "Airlock OPEN — private classes may pass gated stream (simulated, computer-side only).",
        });
        const ms = get().privacy.autoRelockMs;
        if (ms > 0) {
          const timer = setTimeout(() => {
            get().sealPrivacy();
            get().pushLog({
              kind: "privacy",
              message: `Auto re-seal after ${Math.round(ms / 1000)}s unlock window.`,
            });
          }, ms);
          set({ _relockTimer: timer });
        }
        return true;
      }
      set({
        auth: { ...s.auth, failCount: s.auth.failCount + 1 },
      });
      get().pushLog({ kind: "auth", message: result.reason });
      return false;
    },

    sealPrivacy: () => {
      clearRelockTimer(get);
      set((s) => ({
        privacy: {
          ...s.privacy,
          mode: "sealed",
          unlocked: false,
          gateActive: true,
        },
        _relockTimer: null,
      }));
      get().pushLog({
        kind: "privacy",
        message: "Privacy airlock SEALED — private classes fail-closed.",
      });
    },

    lockSession: () => {
      clearRelockTimer(get);
      set((s) => ({
        auth: { ...s.auth, locked: true },
        privacy: {
          ...s.privacy,
          unlocked: false,
          mode: "sealed",
          gateActive: true,
        },
        _policy: { ...s._policy, sessionLocked: true },
        _relockTimer: null,
      }));
      get().pushLog({ kind: "auth", message: "Session locked by user." });
      get().pushLog({
        kind: "privacy",
        message: "Airlock sealed with session lock.",
      });
    },

    dismissBreak: () => {
      set((s) => ({
        _policy: { ...s._policy, breakUntil: null, highLoadSince: null },
        bandwidth: {
          ...s.bandwidth,
          breakForced: false,
          breakSuggested: false,
        },
      }));
      get().pushLog({
        kind: "policy",
        message: "Break dismissed / acknowledged (simulation).",
      });
    },

    captureAuthBaseline: () => {
      const next = captureBaseline(get()._estimator);
      set({
        _estimator: next,
        auth: { ...get().auth, baselineReady: !!next.baseline },
      });
      get().pushLog({
        kind: "auth",
        message: next.baseline
          ? "Auth baseline captured from current stream stats."
          : "Need more samples before baseline capture (run stream ~2s).",
      });
    },

    setDriftAdaptEnabled: (enabled) => {
      set((s) => ({
        _estConfig: { ...s._estConfig, driftAdaptEnabled: enabled },
      }));
      get().pushLog({
        kind: "system",
        message: `Online drift adaptation ${enabled ? "enabled" : "disabled"}.`,
      });
    },

    setDriftConfig: (partial) => {
      set((s) => ({
        _estConfig: { ...s._estConfig, ...partial },
      }));
      get().pushLog({
        kind: "system",
        message: `Drift config updated (${Object.keys(partial).join(", ")}).`,
      });
    },

    loadCsvText: (text) => {
      const samples = parseIntentionCsv(text);
      if (samples.length === 0) {
        get().pushLog({
          kind: "system",
          message: "CSV parse failed or empty.",
        });
        return;
      }
      set({
        _csv: new CsvReplay(samples),
        source: "csv",
      });
      get().pushLog({
        kind: "stream",
        message: `Loaded ${samples.length} CSV samples.`,
      });
    },

    noteExportRedaction: () => {
      set((s) => ({
        privacyAudit: recordExportRedaction(s.privacyAudit),
      }));
    },

    noteSinkBlock: (reason) => {
      set((s) => ({
        privacyAudit: recordSinkBlock(s.privacyAudit, reason),
      }));
      get().pushLog({ kind: "privacy", message: reason });
    },
  };
});
