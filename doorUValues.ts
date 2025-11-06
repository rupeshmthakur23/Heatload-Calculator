// src/pages/projectView/components/HeatLoadCalculator/room/sections/doorUValues.ts

import { BuildingEra, InsulationLevel } from "../../types";

/**
 * UI ranges for doors (kept for hints/validation).
 */
export type DoorInsulationCondition = "heated" | "unheated";
export const DOOR_U_VALUES: Record<DoorInsulationCondition, [number, number]> = {
  heated: [1.3, 1.8],
  unheated: [2.0, 3.0],
};

/** -------- Preset data aligned with BuildingEra & InsulationLevel -------- */
const DOOR_BASE_BY_ERA: Record<BuildingEra, number> = {
  [BuildingEra.Pre1978]:    2.50,
  [BuildingEra.Y1978_1995]: 2.20,
  [BuildingEra.Y1996_2001]: 2.00,
  [BuildingEra.Y2002_2009]: 1.80,
  [BuildingEra.Y2010_2015]: 1.50,
  [BuildingEra.Y2016_2020]: 1.30,
  [BuildingEra.Y2021Plus]:  1.00,
};

const LEVEL_MULTIPLIER: Record<InsulationLevel, number> = {
  [InsulationLevel.None]:           1.00,
  [InsulationLevel.Partial]:        0.80,
  [InsulationLevel.Renovated]:      0.60,
  [InsulationLevel.HighEfficiency]: 0.45,
};

const round2 = (v: number) => Math.round(v * 100) / 100;

export const DOOR_U_PRESETS: Record<
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
  const base = DOOR_BASE_BY_ERA[era];
  acc[era] = {
    [InsulationLevel.None]:           round2(base * LEVEL_MULTIPLIER[InsulationLevel.None]),
    [InsulationLevel.Partial]:        round2(base * LEVEL_MULTIPLIER[InsulationLevel.Partial]),
    [InsulationLevel.Renovated]:      round2(base * LEVEL_MULTIPLIER[InsulationLevel.Renovated]),
    [InsulationLevel.HighEfficiency]: round2(base * LEVEL_MULTIPLIER[InsulationLevel.HighEfficiency]),
  };
  return acc;
}, {} as Record<BuildingEra, Record<InsulationLevel, number>>);

export function getDoorUDefault(
  era: BuildingEra = BuildingEra.Y2002_2009,
  ins: InsulationLevel = InsulationLevel.Partial
): number {
  return DOOR_U_PRESETS[era][ins];
}
