// src/pages/projectView/components/HeatLoadCalculator/room/sections/applyPresetUValues.ts
// Centralized presets for U-values depending on building era and insulation level,
// plus a helper to apply those defaults to a Room (only where values are missing).

import type { Room, BuildingMetadata, BuildingEra, InsulationLevel } from "../../types";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
export type UValuePreset = {
  wall: number;   // Außenwand [W/m²K]
  window: number; // Fenster [W/m²K]
  door: number;   // Tür [W/m²K]
  roof: number;   // Dach/Decke [W/m²K]
  floor: number;  // Boden/Decke [W/m²K]
};

/* -------------------------------------------------------------------------------------------------
 * UI options (kept generic so they work with any string-union in your types.ts)
 * -----------------------------------------------------------------------------------------------*/
export const BuildingEraOptions: Array<{ value: string; label: string; range?: string }> = [
  { value: "pre1978",     label: "bis 1977",   range: "≤ 1977" },
  { value: "1978_1995",   label: "1978–1995",  range: "1978–1995" },
  { value: "1996_2001",   label: "1996–2001",  range: "1996–2001" },
  { value: "2002_2014",   label: "2002–2014",  range: "2002–2014" }, // matches your fallback
  { value: "2015_2020",   label: "2015–2020",  range: "2015–2020" },
  { value: "2021_plus",   label: "ab 2021",    range: "≥ 2021" },
];

export const InsulationLevelOptions: Array<{ value: string; label: string }> = [
  { value: "none",      label: "Unsaniert / Keine" },
  { value: "basic",     label: "Teilweise / Standard" },   // matches your fallback
  { value: "renovated", label: "Saniert" },
];

/* -------------------------------------------------------------------------------------------------
 * Preset data
 *  - ERA_BASE gives baseline (unsaniert) values per era.
 *  - LEVEL_MULTIPLIER scales baseline by insulation level.
 *  Adjust these numbers to your authoritative dataset as needed.
 * -----------------------------------------------------------------------------------------------*/
const ERA_BASE: Record<string, UValuePreset> = {
  pre1978:     { wall: 1.30, window: 3.00, door: 2.50, roof: 1.00, floor: 0.90 },
  "1978_1995": { wall: 1.00, window: 2.70, door: 2.20, roof: 0.80, floor: 0.80 },
  "1996_2001": { wall: 0.80, window: 1.90, door: 2.00, roof: 0.50, floor: 0.50 },
  "2002_2014": { wall: 0.50, window: 1.60, door: 1.80, roof: 0.30, floor: 0.35 },
  "2015_2020": { wall: 0.35, window: 1.30, door: 1.50, roof: 0.22, floor: 0.25 },
  "2021_plus": { wall: 0.28, window: 0.95, door: 1.00, roof: 0.18, floor: 0.22 },
};

// Multipliers for insulation level relative to era baseline
const LEVEL_MULTIPLIER: Record<string, number> = {
  none: 1.0,
  basic: 0.8,
  renovated: 0.6,
};

/* -------------------------------------------------------------------------------------------------
 * API: compute preset U-values for a (era, level) pair
 *  - Accepts your string-union types OR plain strings
 * -----------------------------------------------------------------------------------------------*/
export function getUValuePreset(
  era: BuildingEra | string,
  level: InsulationLevel | string
): UValuePreset {
  const fallbackEra = "2002_2014";
  const fallbackLevel = "basic";

  const eraKey = (typeof era === "string" && ERA_BASE[era]) ? era : fallbackEra;
  const base = ERA_BASE[eraKey];

  const levelKey = (typeof level === "string" && level in LEVEL_MULTIPLIER) ? level : fallbackLevel;
  const m = LEVEL_MULTIPLIER[levelKey];

  const round = (v: number) => Math.round(v * 100) / 100;
  return {
    wall:   round(base.wall   * m),
    window: round(base.window * m),
    door:   round(base.door   * m),
    roof:   round(base.roof   * m),
    floor:  round(base.floor  * m),
  };
}

/* -------------------------------------------------------------------------------------------------
 * API: apply presets to a Room (fills only missing/invalid uValue fields)
 *  - Does NOT overwrite user-provided valid values.
 *  - Safe to call on initial room creation or when building metadata changes.
 * -----------------------------------------------------------------------------------------------*/
export function applyPresetUValues(room: Room, building?: BuildingMetadata): Room {
  const preset = getUValuePreset(
    building?.buildingEra ?? "2002_2014",
    building?.insulationLevel ?? "basic"
  );

  // Deep clone to avoid mutating caller
  const clone: Room = JSON.parse(JSON.stringify(room));

  const isValid = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0;
    };

  // Walls
  clone.walls = (clone.walls || []).map((w) => ({
    ...w,
    uValue: isValid(w.uValue) ? Number(w.uValue) : preset.wall,
  }));

  // Windows
  clone.windows = (clone.windows || []).map((win) => ({
    ...win,
    uValue: isValid(win.uValue) ? Number(win.uValue) : preset.window,
  }));

  // Doors
  clone.doors = (clone.doors || []).map((d) => ({
    ...d,
    uValue: isValid(d.uValue) ? Number(d.uValue) : preset.door,
  }));

  // Ceiling (roof)
  if (clone.ceilingConfig) {
    clone.ceilingConfig.uValue = isValid(clone.ceilingConfig.uValue)
      ? Number(clone.ceilingConfig.uValue)
      : preset.roof;
  }

  // Floor
  if (clone.floorConfig) {
    clone.floorConfig.uValue = isValid(clone.floorConfig.uValue)
      ? Number(clone.floorConfig.uValue)
      : preset.floor;
  }

  return clone;
}
