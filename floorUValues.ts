// src/pages/projectView/components/HeatLoadCalculator/room/sections/floorUValues.ts

import { BuildingEra, InsulationLevel } from "../../types";

/**
 * UI ranges by floor/condition (kept for hints/validation).
 */
export const FLOOR_U_VALUES: Record<string, [number, number]> = {
  heated_insulated:     [0.2, 0.4],
  heated_uninsulated:   [0.5, 0.7],
  unheated_insulated:   [0.3, 0.6],
  unheated_uninsulated: [0.7, 1.2],
};

/** -------- Preset data aligned with BuildingEra & InsulationLevel -------- */
const FLOOR_BASE_BY_ERA: Record<BuildingEra, number> = {
  [BuildingEra.Pre1978]:    0.90,
  [BuildingEra.Y1978_1995]: 0.80,
  [BuildingEra.Y1996_2001]: 0.50,
  [BuildingEra.Y2002_2009]: 0.35,
  [BuildingEra.Y2010_2015]: 0.25,
  [BuildingEra.Y2016_2020]: 0.22,
  [BuildingEra.Y2021Plus]:  0.18,
};

const LEVEL_MULTIPLIER: Record<InsulationLevel, number> = {
  [InsulationLevel.None]:           1.00,
  [InsulationLevel.Partial]:        0.80,
  [InsulationLevel.Renovated]:      0.60,
  [InsulationLevel.HighEfficiency]: 0.45,
};

const round2 = (v: number) => Math.round(v * 100) / 100;

export const FLOOR_U_PRESETS: Record<
  BuildingEra,
  Record<InsulationLevel, number>
> = ([
  BuildingEra.Pre1978,
  BuildingEra.Y1978_1995,
  BuildingEra.Y1996_2001,
  BuildingEra.Y2002_2009,
  BuildingEra.Y2010_2015,
  BuildingEra.Y2016_2020,
  BuildingEra.Y2021Plus,
] as const).reduce((acc, era) => {
  const base = FLOOR_BASE_BY_ERA[era];
  acc[era] = {
    [InsulationLevel.None]:           round2(base * LEVEL_MULTIPLIER[InsulationLevel.None]),
    [InsulationLevel.Partial]:        round2(base * LEVEL_MULTIPLIER[InsulationLevel.Partial]),
    [InsulationLevel.Renovated]:      round2(base * LEVEL_MULTIPLIER[InsulationLevel.Renovated]),
    [InsulationLevel.HighEfficiency]: round2(base * LEVEL_MULTIPLIER[InsulationLevel.HighEfficiency]),
  };
  return acc;
}, {} as Record<BuildingEra, Record<InsulationLevel, number>>);

export function getFloorUDefault(
  era: BuildingEra = BuildingEra.Y2002_2009,
  ins: InsulationLevel = InsulationLevel.Partial
): number {
  return FLOOR_U_PRESETS[era][ins];
}
