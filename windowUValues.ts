// src/pages/projectView/components/HeatLoadCalculator/room/sections/windowUValues.ts

import { BuildingEra, InsulationLevel } from "../../types";

/** All valid window type keys for UI/type-safety. */
export const WINDOW_TYPE_KEYS = [
  "singlePane",
  "doublePane",
  "triplePVC",
  "tripleWood",
  "tripleAlu",
  "tripleWoodAlu",
  "passiveHouse",
  "soundproof",
  "security",
  "heritage",
  "smart",
] as const;
export type WindowTypeKey = (typeof WINDOW_TYPE_KEYS)[number];

/** U-value ranges [min, max] in W/(m²K) by glazing/type for UI hints. */
export const WINDOW_U_VALUES: Record<WindowTypeKey, [number, number]> = {
  singlePane: [5.00, 6.00],
  doublePane: [1.10, 2.80],
  triplePVC: [0.80, 1.10],
  tripleWood: [0.70, 1.00],
  tripleAlu: [0.90, 1.20],
  tripleWoodAlu: [0.70, 0.90],
  passiveHouse: [0.50, 0.80],
  soundproof: [1.00, 2.50],
  security: [1.10, 2.00],
  heritage: [1.50, 3.00],
  smart: [1.00, 1.80],
};

export const WINDOW_LABELS: Record<WindowTypeKey, string> = {
  singlePane: "Einfachverglasung",
  doublePane: "Doppelverglasung",
  triplePVC: "Dreifachverglasung (PVC)",
  tripleWood: "Dreifachverglasung (Holz)",
  tripleAlu: "Dreifachverglasung (Aluminium)",
  tripleWoodAlu: "Dreifachverglasung (Holz-Alu)",
  passiveHouse: "Passivhaus-Fenster",
  soundproof: "Schallschutzfenster",
  security: "Sicherheitsfenster",
  heritage: "Denkmalschutz-Fenster",
  smart: "Smart Glass / Intelligente Verglasung",
};

/** -------- Preset data aligned with BuildingEra & InsulationLevel -------- */
const WINDOW_BASE_BY_ERA: Record<BuildingEra, number> = {
  [BuildingEra.Pre1978]:    3.00,
  [BuildingEra.Y1978_1995]: 2.70,
  [BuildingEra.Y1996_2001]: 1.90,
  [BuildingEra.Y2002_2009]: 1.60,
  [BuildingEra.Y2010_2015]: 1.30,
  [BuildingEra.Y2016_2020]: 1.10,
  [BuildingEra.Y2021Plus]:  0.95,
};

const LEVEL_MULTIPLIER: Record<InsulationLevel, number> = {
  [InsulationLevel.None]:           1.00,
  [InsulationLevel.Partial]:        0.80,
  [InsulationLevel.Renovated]:      0.60,
  [InsulationLevel.HighEfficiency]: 0.45,
};

const round2 = (v: number) => Math.round(v * 100) / 100;

export const WINDOW_U_PRESETS: Record<
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
  const base = WINDOW_BASE_BY_ERA[era];
  acc[era] = {
    [InsulationLevel.None]:           round2(base * LEVEL_MULTIPLIER[InsulationLevel.None]),
    [InsulationLevel.Partial]:        round2(base * LEVEL_MULTIPLIER[InsulationLevel.Partial]),
    [InsulationLevel.Renovated]:      round2(base * LEVEL_MULTIPLIER[InsulationLevel.Renovated]),
    [InsulationLevel.HighEfficiency]: round2(base * LEVEL_MULTIPLIER[InsulationLevel.HighEfficiency]),
  };
  return acc;
}, {} as Record<BuildingEra, Record<InsulationLevel, number>>);

export function getWindowUDefault(
  era: BuildingEra = BuildingEra.Y2002_2009,
  ins: InsulationLevel = InsulationLevel.Partial
): number {
  return WINDOW_U_PRESETS[era][ins];
}
