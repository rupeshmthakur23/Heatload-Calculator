// src/pages/projectView/components/HeatLoadCalculator/defaults/defaults.ts

import type { Room, ProjectMeta, BuildingMetadata } from "../types";
import { BuildingEra, InsulationLevel } from "../types";

// ----- Construction era buckets (roughly German stock / EnEV eras) -----
export type Era =
  | "pre1919"
  | "1919_1978"
  | "1979_1994"
  | "1995_2001"
  | "2002_2014"
  | "2016_plus";

export function eraFromYear(year?: number): Era {
  const y = Number(year || 2000);
  if (y < 1919) return "pre1919";
  if (y <= 1978) return "1919_1978";
  if (y <= 1994) return "1979_1994";
  if (y <= 2001) return "1995_2001";
  if (y <= 2014) return "2002_2014";
  return "2016_plus";
}

// Base U-values (W/m²K) by era (typical/median values; tweak to your policy if needed)
const U_BASE = {
  walls: {
    pre1919: 1.6,
    "1919_1978": 1.4,
    "1979_1994": 0.9,
    "1995_2001": 0.6,
    "2002_2014": 0.35,
    "2016_plus": 0.23,
  },
  roof: {
    pre1919: 1.6,
    "1919_1978": 1.2,
    "1979_1994": 0.6,
    "1995_2001": 0.35,
    "2002_2014": 0.25,
    "2016_plus": 0.18,
  },
  floor: {
    pre1919: 1.5,
    "1919_1978": 1.2,
    "1979_1994": 0.7,
    "1995_2001": 0.45,
    "2002_2014": 0.35,
    "2016_plus": 0.28,
  },
  window: {
    pre1919: 3.7,
    "1919_1978": 3.0,
    "1979_1994": 2.7,
    "1995_2001": 1.8,
    "2002_2014": 1.3,
    "2016_plus": 1.1,
  },
  door: {
    pre1919: 3.0,
    "1919_1978": 2.5,
    "1979_1994": 2.2,
    "1995_2001": 1.8,
    "2002_2014": 1.4,
    "2016_plus": 1.2,
  },
} as const;

// Adjustment for insulation level
const INSULATION_MULTIPLIER = { none: 1.0, standard: 0.7, passive: 0.4 } as const;

function adj(ubase: number, level: "none" | "standard" | "passive" = "standard") {
  return +(ubase * INSULATION_MULTIPLIER[level]).toFixed(2);
}

// ----- Envelope defaults -----
export function applyEnvelopeDefaultsToRoom(
  room: Room,
  constructionYear?: number,
  opts?: { force?: boolean }
): Room {
  const era = eraFromYear(constructionYear);
  const force = !!opts?.force;
  const out: Room = JSON.parse(JSON.stringify(room));

  out.walls = (out.walls || []).map((w) => {
    const has = Number.isFinite(w.uValue as number) && (w.uValue as number)! > 0;
    if (!has || force) w.uValue = U_BASE.walls[era];
    return w;
  });

  out.windows = (out.windows || []).map((win) => {
    const has = Number.isFinite(win.uValue as number) && (win.uValue as number)! > 0;
    if (!has || force) win.uValue = U_BASE.window[era];
    return win;
  });

  out.doors = (out.doors || []).map((d) => {
    const has = Number.isFinite(d.uValue as number) && (d.uValue as number)! > 0;
    if (!has || force) d.uValue = U_BASE.door[era];
    return d;
  });

  if (out.ceilingConfig) {
    const level = (out.ceilingConfig.insulationStandard || "standard") as
      | "none"
      | "standard"
      | "passive";
    const has =
      Number.isFinite(out.ceilingConfig.uValue as number) &&
      (out.ceilingConfig.uValue as number)! > 0;
    if (!has || force) out.ceilingConfig.uValue = adj(U_BASE.roof[era], level);
  }

  if (out.floorConfig) {
    const level: "none" | "standard" | "passive" =
      out.floorConfig.insulated ? "standard" : "none";
    const has =
      Number.isFinite(out.floorConfig.uValue as number) &&
      (out.floorConfig.uValue as number)! > 0;
    if (!has || force) out.floorConfig.uValue = adj(U_BASE.floor[era], level);
  }

  return out;
}

// ----- Ventilation defaults -----
const ACH_DEFAULTS: Record<string, number> = {
  living: 0.5,
  bedroom: 0.3,
  kitchen: 1.0,
  bathroom: 1.0,
};

export function applyVentilationDefaultsToRoom(
  room: Room,
  opts?: { mvhr?: boolean; force?: boolean }
): Room {
  const mvhr = !!opts?.mvhr;
  const force = !!opts?.force;
  const out: Room = JSON.parse(JSON.stringify(room));

  if (!out.ventilation)
    out.ventilation = {
      roomType: "living",
      targetTemp: out.targetTemperature,
      airExchangeRate: 0.5,
      ventilationSystem: mvhr,
    };

  const rt = (out.ventilation.roomType || "living").toLowerCase();
  const key =
    rt.includes("wohn") ? "living" :
    rt.includes("schlaf") ? "bedroom" :
    rt.includes("küche") || rt.includes("kueche") || rt.includes("kitchen") ? "kitchen" :
    rt.includes("bad") || rt.includes("bath") ? "bathroom" :
    "living";

  const hasACH =
    Number.isFinite(out.ventilation.airExchangeRate as number) &&
    (out.ventilation.airExchangeRate as number)! > 0;
  if (!hasACH || force) out.ventilation.airExchangeRate = ACH_DEFAULTS[key];

  out.ventilation.ventilationSystem = mvhr || !!out.ventilation.ventilationSystem;
  if (
    out.ventilation.ventilationSystem &&
    (force || !Number.isFinite(out.ventilation.heatRecoveryEfficiency as number))
  ) {
    out.ventilation.heatRecoveryEfficiency = 0.8;
  }
  return out;
}

// ----- Thermal-bridge allowance -----
export function applyThermalBridgeAllowanceToRoom(
  room: Room,
  kTb: number = 0.04,
  opts?: { forceReplace?: boolean }
): Room {
  const out: Room = JSON.parse(JSON.stringify(room));

  const wallsA = (out.walls || []).reduce((s, w) => s + (w.area || 0), 0);
  const winA = (out.windows || []).reduce((s, w) => s + (w.area || 0), 0);
  const doorA = (out.doors || []).reduce((s, d) => s + (d.area || 0), 0);
  const ceilA = out.ceilingConfig?.area || out.area || 0;
  const floorA = out.floorConfig?.area || out.area || 0;
  const envA = wallsA + winA + doorA + ceilA + floorA;

  const item = {
    id: "default-k_tb",
    name: "Default allowance (k_tb × A)",
    psiValue: kTb,
    length: envA,
  };

  out.thermalBridges = Array.isArray(out.thermalBridges)
    ? [...out.thermalBridges]
    : [];
  const existIdx = out.thermalBridges.findIndex((x) => x.id === "default-k_tb");
  if (existIdx >= 0) out.thermalBridges[existIdx] = item;
  else out.thermalBridges.push(item);

  return out;
}

// ----- Constants for DIN EN 12831 calculations -----
export const AIR_PROPERTIES = {
  rho: 1.204, // kg/m³ at 20 °C
  cp: 1005,   // J/(kg·K)
};

export const DEFAULT_MVHR_EFFICIENCY = 0.8;
export const DESIGN_OUTDOOR_TEMP_C = -10; // °C (adjust by region if needed)
export const THERMAL_BRIDGE_DEFAULT_FACTOR = 0.05; // 5%

export const ROOM_DESIGN_TEMPS: Record<string, number> = {
  living: 20,
  bedroom: 18,
  kitchen: 20,
  bathroom: 24,
  hallway: 15,
  custom: 20,
};

// ----- NEW: Building + Project defaults -----
export const DEFAULT_BUILDING_META: BuildingMetadata = {
  postalCode: "",
  address: "",
  buildingType: "",
  constructionYear: new Date().getFullYear(),
  renovationYear: undefined,
  ageClass: "",
  floors: 1,
  residents: 1,
  professionalInput: false,
  temperaturePreference: 21,
  oldHeatingType: "",
  oldHeatingYear: undefined,
  solarThermal: false,
  woodFireplace: false,
  domesticHotWater: "Keine",
  annualGasConsumption: undefined,
  annualElectricConsumption: undefined,
  buildingLength: undefined,
  buildingWidth: undefined,
  exteriorWallLength: undefined,
  aboveContext: "",
  belowContext: "",
  airtightnessTest: false,
  n50Value: undefined,
  groundDepth: undefined,
  shielding: "Keine",
  interiorWallToHeated: false,
  specialFeatures: "",
  pvHeatPump: {
    hasPV: false,
    pvKwp: undefined,
    hasHeatPump: false,
    hpType: undefined,
    bufferTank: false,
    bufferSizeLiters: undefined,
    brand: undefined,
    model: undefined,
    capacity: undefined,
  },
  buildingEra: BuildingEra.Pre1978,
  insulationLevel: InsulationLevel.None,
};

export const DEFAULT_PROJECT_META: ProjectMeta = {
  ...DEFAULT_BUILDING_META, // 👈 brings in required BuildingMetadata fields
  plannedInstallationDate: "2025-02-01",
  tariff: {
    hpTariffEnabled: false,
    electricityPriceCt: 20,
  },
  altHeating: {
    compareAlternativeHeating: false,
    altHeatingCostEUR: 0,
    altHeatingReplacementYears: 0,
  },
  dimensioning: {
    heatLoadW: 12070,
    residents: 4,
    dhwPerResidentLPerDay: 40,
    bivalenceTemperatureC: -5,
  },
};
