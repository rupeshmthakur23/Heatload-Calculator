// src/pages/projectView/components/HeatLoadCalculator/room/sections/wallUValues.ts

import { BuildingEra, InsulationLevel } from "../../types";

/** UI ranges by wall construction (kept for hints/validation). */
export const WALL_U_VALUES: Record<string, [number, number]> = {
  singleSolid:      [0.80, 1.40],
  ventilatedFacade: [0.30, 0.50],
  etics:            [0.30, 0.40],
  timberFrame:      [0.40, 0.60],
  prefab:           [0.30, 0.50],

  brick24:          [1.80, 2.10],
  brick36:          [1.20, 1.50],
  hollowBrick36:    [1.00, 1.30],
  rubbleStone50:    [1.50, 1.80],
  concrete20:       [3.00, 3.50],
  halfTimbered20:   [1.50, 2.50],
  pumice30:         [1.30, 1.60],

  brickEps8:        [0.35, 0.40],
  concreteEps10:    [0.25, 0.30],
  timberfiber10:    [0.30, 0.40],
  pumiceMineral12:  [0.20, 0.25],
  lightweight14:    [0.15, 0.20],

  perliteBrick36_5: [0.18, 0.22],
  concreteEtics20:  [0.12, 0.15],
  timberFrame24:    [0.10, 0.14],
  passiveWall30:    [0.08, 0.12],

  calcium5:         [0.40, 0.50],
  woodfiber6:       [0.35, 0.45],
  aerogel2:         [0.20, 0.30],
};

export const WALL_LABELS: Record<string, string> = {
  singleSolid: "Massivwand einfach",
  ventilatedFacade: "Hinterlüftete Fassade",
  etics: "WDVS / Wärmedämmverbundsystem",
  timberFrame: "Holzrahmenbau",
  prefab: "Fertighauswand",

  brick24: "Ziegel 24 cm (unisoliert)",
  brick36: "Ziegel 36 cm (unisoliert)",
  hollowBrick36: "Hohlblock 36 cm (unisoliert)",
  rubbleStone50: "Bruchstein 50 cm",
  concrete20: "Beton 20 cm",
  halfTimbered20: "Fachwerk 20 cm",
  pumice30: "Bims 30 cm",

  brickEps8: "Ziegel + EPS 8 cm",
  concreteEps10: "Beton + EPS 10 cm",
  timberfiber10: "Holz + Holzfaser 10 cm",
  pumiceMineral12: "Bims + Mineralwolle 12 cm",
  lightweight14: "Leichtbau 14 cm",

  perliteBrick36_5: "Perlit-Ziegel 36,5 cm",
  concreteEtics20: "Beton + WDVS 20 cm",
  timberFrame24: "Holzrahmenbau 24 cm",
  passiveWall30: "Passivhauswand 30 cm",

  calcium5: "Innen: Kalziumsilikat 5 cm",
  woodfiber6: "Innen: Holzfaser 6 cm",
  aerogel2: "Innen: Aerogel 2 cm",
};

/** -------- Preset data aligned with BuildingEra & InsulationLevel -------- */
const WALL_BASE_BY_ERA: Record<BuildingEra, number> = {
  [BuildingEra.Pre1978]:    1.30,
  [BuildingEra.Y1978_1995]: 1.00,
  [BuildingEra.Y1996_2001]: 0.80,
  [BuildingEra.Y2002_2009]: 0.50,
  [BuildingEra.Y2010_2015]: 0.35,
  [BuildingEra.Y2016_2020]: 0.28,
  [BuildingEra.Y2021Plus]:  0.22,
};

const LEVEL_MULTIPLIER: Record<InsulationLevel, number> = {
  [InsulationLevel.None]:           1.00,
  [InsulationLevel.Partial]:        0.80,
  [InsulationLevel.Renovated]:      0.60,
  [InsulationLevel.HighEfficiency]: 0.45,
};

const round2 = (v: number) => Math.round(v * 100) / 100;

export const WALL_U_PRESETS: Record<
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
  const base = WALL_BASE_BY_ERA[era];
  acc[era] = {
    [InsulationLevel.None]:           round2(base * LEVEL_MULTIPLIER[InsulationLevel.None]),
    [InsulationLevel.Partial]:        round2(base * LEVEL_MULTIPLIER[InsulationLevel.Partial]),
    [InsulationLevel.Renovated]:      round2(base * LEVEL_MULTIPLIER[InsulationLevel.Renovated]),
    [InsulationLevel.HighEfficiency]: round2(base * LEVEL_MULTIPLIER[InsulationLevel.HighEfficiency]),
  };
  return acc;
}, {} as Record<BuildingEra, Record<InsulationLevel, number>>);

export function getWallUDefault(
  era: BuildingEra = BuildingEra.Y2002_2009,
  ins: InsulationLevel = InsulationLevel.Partial
): number {
  return WALL_U_PRESETS[era][ins];
}
