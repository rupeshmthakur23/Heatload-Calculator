// src/pages/projectView/components/HeatLoadCalculator/room/sections/ceilingUValues.ts

import { BuildingEra, InsulationLevel } from "../../types"; // value import (used at runtime)
import type { InsulationStandard } from "../../types";      // type-only import

/**
 * UI ranges for ceiling/roof based on the classic InsulationStandard.
 * These are kept for sliders / validation and do not conflict with presets.
 */
export const CEILING_U_VALUES: Record<InsulationStandard, [number, number]> = {
  none: [0.60, 0.90],      // uninsulated (older roofs)
  standard: [0.20, 0.35],  // typical renovated / EnEV-level
  passive: [0.10, 0.15],   // passive-house level
};

/** Optional labels for the UI. */
export const CEILING_LABELS: Record<InsulationStandard, string> = {
  none: "Ungedämmt",
  standard: "Standarddämmung",
  passive: "Passivhaus-Standard",
};

/* -------------------------------------------------------------------------------------------------
 * Era + insulation presets (used to auto-fill missing U-values)
 * ------------------------------------------------------------------------------------------------*/

/** Baseline U-values per building era (unsaniert), W/(m²·K). Adjust to your dataset if needed. */
const CEILING_BASE_BY_ERA: Record<BuildingEra, number> = {
  [BuildingEra.Pre1978]: 1.00,
  [BuildingEra.Y1978_1995]: 0.80,
  [BuildingEra.Y1996_2001]: 0.50,
  [BuildingEra.Y2002_2009]: 0.30,
  [BuildingEra.Y2010_2015]: 0.22,
  [BuildingEra.Y2016_2020]: 0.18,
  [BuildingEra.Y2021Plus]: 0.14,
};

/** Multipliers by insulation level (relative to era baseline). */
const LEVEL_MULTIPLIER: Record<InsulationLevel, number> = {
  [InsulationLevel.None]: 1.00,
  [InsulationLevel.Partial]: 0.80,
  [InsulationLevel.Renovated]: 0.60,
  [InsulationLevel.HighEfficiency]: 0.45,
};

/**
 * Compute default U-value for ceiling/roof for a given era + insulation level.
 * Defaults align with your app’s fallbacks.
 */
export function getCeilingUDefault(
  era: BuildingEra = BuildingEra.Y2002_2009,
  level: InsulationLevel = InsulationLevel.Partial
): number {
  const base = CEILING_BASE_BY_ERA[era] ?? CEILING_BASE_BY_ERA[BuildingEra.Y2002_2009];
  const m = LEVEL_MULTIPLIER[level] ?? LEVEL_MULTIPLIER[InsulationLevel.Partial];
  return +(base * m).toFixed(2);
}

/**
 * Optional: precomputed table if you ever want to look up instead of compute.
 */
export const CEILING_U_PRESETS: Record<BuildingEra, Record<InsulationLevel, number>> = (Object
  .values(BuildingEra) as BuildingEra[]).reduce((acc, era) => {
    acc[era] = {
      [InsulationLevel.None]: getCeilingUDefault(era, InsulationLevel.None),
      [InsulationLevel.Partial]: getCeilingUDefault(era, InsulationLevel.Partial),
      [InsulationLevel.Renovated]: getCeilingUDefault(era, InsulationLevel.Renovated),
      [InsulationLevel.HighEfficiency]: getCeilingUDefault(era, InsulationLevel.HighEfficiency),
    };
    return acc;
  }, {} as Record<BuildingEra, Record<InsulationLevel, number>>);
