// src/pages/projectView/components/HeatLoadCalculator/utils/kvRecommendation.ts
// Simple, rule-based Kv preset recommendations.
// Maps target flow (L/s) to a coarse preset per valve brand.
// NOTE: This is intentionally approximate; proper hydraulic balancing of a full network is out of scope.

import type { RadiatorRegime, Heater } from "../types";

/* ───────────────────────── Helpers ───────────────────────── */

/** Parse like "1,5" → 1.5. Returns undefined if not a finite number. */
const parseNum = (v: any): number | undefined => {
  if (v === null || v === undefined) return undefined;
  const s =
    typeof v === "string" ? v.replace(",", ".").replace(/\s+/g, "").trim() : v;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

/** Coerce to non-negative number; fallback 0. */
const k = (v: any): number => {
  const n = parseNum(v);
  return n !== undefined ? Math.max(0, n) : 0;
};

/* ───────────────────────── Core math ───────────────────────── */

/** Compute water-side ΔT from a radiator regime string like "75/65/20" (supply/return/room). */
function deltaTWater(regime: RadiatorRegime | string = "75/65/20"): number {
  const [supplyRaw, returnRaw] = String(regime).split("/");
  const tSupply = k(supplyRaw);
  const tReturn = k(returnRaw);
  const dT = (tSupply || 75) - (tReturn || 65);
  return dT > 0 ? dT : 10; // conservative fallback
}

/**
 * Compute required flow from heat output.
 * m_dot = Q / (c_p * ΔT_water);  c_p ≈ 4180 J/(kg·K), ρ ≈ 1 kg/L ⇒ kg/s ≈ L/s
 * @param outputW  design-point output in Watts
 * @param regime   radiator regime "75/65/20" etc. (ΔT_water inferred from first two numbers)
 * @returns flow in L/s
 */
export function computeFlowLps(
  outputW: number | string,
  regime: RadiatorRegime | string = "75/65/20"
): number {
  const cp = 4180; // J/(kg·K)
  const dT = deltaTWater(regime);
  const Qw = k(outputW);
  if (!(Qw > 0 && dT > 0)) return 0;
  // kg/s ≈ L/s (ρ ~ 1 kg/L)
  return Qw / (cp * dT);
}

/** Convenience: compute flow directly from a Heater object (uses standardRegime or defaults). */
export function computeFlowLpsFromHeater(h: Partial<Heater>): number {
  // If already stored on the heater, keep it
  if (parseNum(h.flowLps) && (k(h.flowLps) > 0)) return k(h.flowLps);
  // Otherwise compute from output/regime
  return computeFlowLps(h.output ?? 0, h.standardRegime ?? "75/65/20");
}

/* ───────────────────────── Presets ───────────────────────── */

export type KvBrand = "Heimeier" | "Oventrop" | "Danfoss";

/**
 * Rough bins by flow (L/s) → preset label.
 * Numbers are deliberately simple and conservative for residential TRVs.
 */
const HEIMEIER_BINS: Array<{ max: number; label: string }> = [
  { max: 0.005, label: "1" },
  { max: 0.010, label: "2" },
  { max: 0.015, label: "3" },
  { max: 0.025, label: "4" },
  { max: 0.040, label: "5" },
  { max: Infinity, label: "6" },
];

const OVENTROP_BINS: Array<{ max: number; label: string }> = [
  { max: 0.004, label: "1" },
  { max: 0.008, label: "2" },
  { max: 0.012, label: "3" },
  { max: 0.020, label: "4" },
  { max: 0.032, label: "5" },
  { max: Infinity, label: "6" },
];

const DANFOSS_BINS: Array<{ max: number; label: string }> = [
  { max: 0.004, label: "1" },
  { max: 0.008, label: "2" },
  { max: 0.012, label: "3" },
  { max: 0.018, label: "4" },
  { max: 0.028, label: "5" },
  { max: 0.040, label: "6" },
  { max: Infinity, label: "7" },
];

function pickPreset(
  flowLps: number,
  bins: Array<{ max: number; label: string }>
): string {
  const f = k(flowLps);
  if (f <= 0) return "—";
  return bins.find((b) => f <= b.max)?.label ?? bins[bins.length - 1].label;
}

/**
 * Get a suggested Kv preset label for a given brand at a target flow (L/s).
 * Example: kvPresetFor(0.012, "Heimeier") → "3"
 */
export function kvPresetFor(flowLps: number, brand: KvBrand = "Heimeier"): string {
  switch (brand) {
    case "Heimeier":
      return pickPreset(flowLps, HEIMEIER_BINS);
    case "Oventrop":
      return pickPreset(flowLps, OVENTROP_BINS);
    case "Danfoss":
      return pickPreset(flowLps, DANFOSS_BINS);
    default:
      return pickPreset(flowLps, HEIMEIER_BINS);
  }
}

/** Small formatter for display. */
export function formatFlowLps(flowLps: number): string {
  const f = k(flowLps);
  if (f <= 0) return "—";
  return `${f.toFixed(3)} L/s`;
}
