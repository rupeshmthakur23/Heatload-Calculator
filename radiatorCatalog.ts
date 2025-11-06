// src/pages/projectView/components/HeatLoadCalculator/room/sections/radiatorCatalog.ts
// Minimal radiator catalog + helpers.
// Notes:
// - Nominal outputs are given for the standard regime 75/65/20 (ΔT≈50 K).
// - If you pass a different regime, we'll scale with exponent n≈1.3,
//   using Q ~ (ΔT/50)^n (typical manufacturer convention).

import type { RadiatorRegime } from "../../types";

export type RadiatorType = "panel" | "tubular" | "bathroom";

export type RadiatorCatalogItem = {
  brand: string;
  series: string;
  type: RadiatorType;
  heights: number[]; // mm
  widths: number[];  // mm
  regime: RadiatorRegime; // nominal regime for the table below (usually 75/65/20)
  // Nominal W for each size key "HxW" (e.g., "600x1000")
  table: Record<string, number>;
  // Optional valve kv presets (human label -> kv value)
  kvPresets?: Record<string, number>;
};

// Small starter catalog (realistic, but illustrative data)
export const RADIATORS: RadiatorCatalogItem[] = [
  {
    brand: "Kermi",
    series: "Profil-K",
    type: "panel",
    heights: [300, 600],
    widths: [400, 600, 1000],
    regime: "75/65/20",
    table: {
      "300x400": 380,
      "300x600": 560,
      "300x1000": 900,
      "600x400": 720,
      "600x600": 1080,
      "600x1000": 1750,
    },
    kvPresets: { "Voreinstellung 1": 0.15, "Voreinstellung 2": 0.20, "Werk": 0.25 },
  },
  {
    brand: "Purmo",
    series: "Ventil Compact",
    type: "panel",
    heights: [300, 600],
    widths: [400, 600, 1000],
    regime: "75/65/20",
    table: {
      "300x400": 360,
      "300x600": 540,
      "300x1000": 880,
      "600x400": 700,
      "600x600": 1040,
      "600x1000": 1700,
    },
    kvPresets: { "Werk": 0.25, "Niedrig": 0.18, "Hoch": 0.32 },
  },
  {
    brand: "Vogel & Noot",
    series: "Compact",
    type: "panel",
    heights: [300, 600],
    widths: [400, 600, 1000],
    regime: "75/65/20",
    table: {
      "300x400": 350,
      "300x600": 520,
      "300x1000": 860,
      "600x400": 680,
      "600x600": 1020,
      "600x1000": 1650,
    },
  },
];

// ---------- helpers ----------

export const listBrands = () =>
  Array.from(new Set(RADIATORS.map((r) => r.brand))).sort();

export const listSeries = (brand?: string) =>
  RADIATORS.filter((r) => !brand || r.brand === brand)
    .map((r) => r.series)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();

export function getItem(brand?: string, series?: string): RadiatorCatalogItem | undefined {
  if (!brand || !series) return undefined;
  return RADIATORS.find((r) => r.brand === brand && r.series === series);
}

export function listHeights(brand?: string, series?: string): number[] {
  return getItem(brand, series)?.heights ?? [];
}

export function listWidths(brand?: string, series?: string): number[] {
  return getItem(brand, series)?.widths ?? [];
}

function deltaT(regime: RadiatorRegime): number {
  // regime like "75/65/20" => mean water temp minus room temp
  const [twf, trf, tr] = regime.split("/").map((x) => Number(x));
  const mean = (twf + trf) / 2;
  return mean - tr;
}

/** Nominal W at desired regime (scales from catalog regime with n≈1.3 if different). */
export function getRadiatorNominalW(
  brand: string | undefined,
  series: string | undefined,
  height: number | undefined,
  width: number | undefined,
  regime: RadiatorRegime = "75/65/20",
  exponent = 1.3
): number | null {
  const item = getItem(brand, series);
  if (!item || !height || !width) return null;

  const key = `${height}x${width}`;
  const base = item.table[key];
  if (!base || base <= 0) return null;

  if (regime === item.regime) return base;

  const dtBase = deltaT(item.regime);
  const dtTarget = deltaT(regime);
  if (dtBase <= 0 || dtTarget <= 0) return base;

  const factor = Math.pow(dtTarget / dtBase, exponent);
  return Math.round(base * factor);
}
