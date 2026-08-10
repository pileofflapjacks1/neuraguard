/**
 * Documented estimation formulas (research heuristics only).
 *
 * These are intentionally simple and inspectable — not clinical models.
 * All outputs are unitless research proxies on a 0–100 scale.
 */

export const FORMULA_DOCS = {
  cognitiveLoad: {
    name: "Cognitive Load",
    formula:
      "load = 100 * clamp(0.35*norm(meanSpeed) + 0.25*norm(speedVar) + 0.20*norm(meanAccel) + 0.15*classEntropy + 0.05*meanClick)",
    notes:
      "Higher speed variance, acceleration, and class entropy raise estimated load. Pure research proxy.",
  },
  focus: {
    name: "Focus / Engagement",
    formula:
      "focus = 100 * clamp(0.45*(1 - classEntropy) + 0.35*meanConfidence + 0.20*(1 - privateRatio) - distractionPenalty)",
    notes:
      "Stable dominant class + high confidence → higher focus. Private-thought spikes reduce focus score.",
  },
  fatigue: {
    name: "Fatigue",
    formula:
      "fatigue = EMA(prev, raw, α=0.02); raw = 100 * clamp(sessionProgress*0.4 + loadComponent*0.35 + lowConfidence*0.25 + injectBoost)",
    notes:
      "Slow EMA so fatigue accumulates over minutes. Session length and sustained load contribute.",
  },
  agency: {
    name: "Agency / Confidence",
    formula:
      "agency = 100 * clamp(0.5*meanConfidence + 0.3*(1 - anomalyNorm) + 0.2*(1 - privateRatio))",
    notes:
      "Decoder confidence and low anomaly/private ratio proxy voluntary control.",
  },
  anomaly: {
    name: "Anomaly Score",
    formula:
      "anomaly = 100 * clamp(0.4*z(speed) + 0.3*z(entropy) + 0.3*z(confidence_drop))",
    notes:
      "Z-scores vs rolling baseline. Sudden distribution shifts raise the score.",
  },
  biometric: {
    name: "Neural-biometric match",
    formula:
      "match = 100 * (1 - clamp(0.5*|μ_speed - base| + 0.3*|μ_entropy - base| + 0.2*|μ_conf - base|))",
    notes:
      "Toy continuous auth: compares current window stats to a short baseline capture. Not identity verification.",
  },
} as const;

export type FormulaKey = keyof typeof FORMULA_DOCS;
