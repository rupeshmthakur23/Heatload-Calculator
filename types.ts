// src/pages/projectView/components/HeatLoadCalculator/types.ts
import type { WindowTypeDefinition } from "./room/sections/windowTypes";
import type { WallTypeDefinition } from "./room/sections/wallTypes";

/* =========================================
   HeatLoadCalculator additions (enums)
   ========================================= */
export enum BuildingEra {
  Pre1978     = "pre1978",
  Y1978_1995  = "1978-1995",
  Y1996_2001  = "1996-2001",
  Y2002_2009  = "2002-2009",
  Y2010_2015  = "2010-2015",
  Y2016_2020  = "2016-2020",
  Y2021Plus   = "2021+",
}

export enum InsulationLevel {
  None           = "none",
  Partial        = "partial",
  Renovated      = "renovated",
  HighEfficiency = "high",
}

/** Standard radiator temp regimes (flow/return/room °C). */
export type RadiatorRegime = "75/65/20" | "70/55/20" | "65/55/20" | "55/45/20";

/* You still have a separate standard used in some sections */
export type InsulationStandard = "none" | "standard" | "passive";

/* =========================================
   NEW helper unions used by Building page
   ========================================= */
export type AirtightnessTestType = "none" | "n50Known" | "flowKnown" | "yesUnknown";
export type ShieldingLevel = "Hoch" | "Normal" | "Keine";
export type ThermalBridgePreset = "standard" | "dinA005" | "dinA003" | "interiorInsulation";

/* =========================================
   Core building/project model
   ========================================= */
export interface BuildingMetadata {
  postalCode: string;
  location?: string;
  address: string;
  buildingType: string;

  constructionYear: number;
  renovationYear?: number;
  ageClass?: string;

  floors: number;
  residents: number;
  professionalInput?: boolean;
  temperaturePreference: number;

  oldHeatingType?: string;
  oldHeatingYear?: number;

  solarThermal?: boolean;
  woodFireplace?: boolean;

  domesticHotWater?: "Durchlauferhitzer" | "Boiler" | "Kombitherme" | "Keine";
  annualGasConsumption?: number;
  annualElectricConsumption?: number;

  buildingLength?: number;
  buildingWidth?: number;
  exteriorWallLength?: number;

  aboveContext?: string;
  belowContext?: string;

  /** legacy boolean, kept for compatibility with older code paths */
  airtightnessTest?: boolean;

  /** if an n50 value is known */
  n50Value?: number;

  /** if Volumenstrom is known from the test (m³/h) */
  volumetricFlowM3PerH?: number;

  groundDepth?: number;

  /** normalized shielding levels (UI uses Hoch/Normal/Keine) */
  shielding?: ShieldingLevel;

  interiorWallToHeated?: boolean;
  specialFeatures?: string;

  pvHeatPump: PVHeatPumpSettings;

  /* presets used for default U-values */
  buildingEra?: BuildingEra;
  insulationLevel?: InsulationLevel;

  /* climate */
  designOutdoorTempC?: number | null;
  manualDesignOutdoorTempC?: number | null;
  designOutdoorTempMeta?: {
    method?: string;
    provider?: string;
    geocode?: { name?: string; admin1?: string; country?: string; lat?: number; lon?: number };
    computedAt?: string;
  };

  /* NEW: dropdown variant for airtightness test selection */
  airtightnessTestType?: AirtightnessTestType;

  /* NEW: expert preset for thermal bridge allowance */
  thermalBridgePreset?: ThermalBridgePreset;
}

export interface EnvelopeElement {
  name: string;
  area: number;
  uValue?: number;
  layerRValues?: number[];
}

export type WallTypeKey = WallTypeDefinition["key"];
export type WindowTypeKey = WindowTypeDefinition["key"];

export interface Wall {
  id: string;
  name: string;
  type: WallTypeKey;
  material: string;
  customMaterial?: string;
  isExterior: boolean;
  uValue?: number;
  rValue?: number;
  area: number;
  length: number;
  addon?: string;         // NEW: e.g. "+5 cm Dämmung"
}

export interface Window {
  id: string;
  area: number;
  type: WindowTypeKey;
  uValue?: number;
  orientation: "North" | "East" | "South" | "West";
}

export interface Door {
  id: string;
  area: number;
  toUnheated: boolean;
  uValue?: number;
}

export interface ThermalBridge {
  id: string;
  name: string;
  psiValue: number;
  length: number;
}

export interface CeilingConfigType {
  area: number;
  uValue?: number;
  layerRValues?: number[];
  material?: string;
  insulated?: boolean;
  insulationStandard: "none" | "standard" | "passive";
  roofType: "Flachdach" | "Satteldach" | "Walmdach";
  kniestockHeight: number;
  dachfenster: boolean;
  gauben: boolean;
  addon?: string;         // NEW
}

export interface FloorConfigType {
  area: number;
  uValue?: number;
  layerRValues?: number[];
  heated: boolean;
  material: string;
  insulated: boolean;
  floorType: "beheizt" | "unbeheizt" | "erdreich" | "aussenluft";
  addon?: string;         // NEW
}

export interface VentilationConfigType {
  roomType: string;
  targetTemp: number;
  airExchangeRate: number;
  ventilationSystem: boolean;
  heatRecoveryEfficiency?: number;
  internalGainsW?: number;
}

export type Heater = {
  id: string;
  type: "radiator" | "underfloor";
  subType?: "platten" | "glieder" | "bad";
  height?: number;
  width?: number;
  output: number;               // W (actual design-point output)
  valveType: string;
  valveBrand?: string;           // e.g. "Danfoss"
  valveName?: string;            // e.g. "RA-N"
  valveDimension?: string;       // e.g. "15"
  valveForm?: string;      
  roomTemp: number;
  replacement?: boolean;
  standardTemp?: number;
  brand?: string;
  series?: string;

  // optional catalog-driven fields:
  standardRegime?: RadiatorRegime;   // nominal regime of catalog lookup (default "75/65/20")
  nominalOutputAtStandard?: number;  // W at standard regime for selected size
  kvPresetLabel?: string;            // if chosen from kvPresets
  kvValue?: number;                  // resolved kv

  // computed required flow for this heater (filled by UI calc)
  flowLps?: number;                  // L/s at current output and regime

  pressureDrop?: number;
};

export interface PVHeatPumpSettings {
  hasPV: boolean;
  pvKwp?: number;
  hasHeatPump: boolean;
  hpType?: "air-water" | "ground-water" | "water-water" | "direct-evap";
  bufferTank: boolean;
  bufferSizeLiters?: number;
  brand?: string;
  model?: string;
  capacity?: number;
}

export interface Room {
  id: string;
  name: string;
  area: number;
  height: number;
  targetTemperature: number;
  walls: Wall[];
  windows: Window[];
  doors: Door[];
  ceilingConfig: CeilingConfigType;
  floorConfig: FloorConfigType;
  ventilation?: VentilationConfigType;
  heaters: Heater[];
  pvHeatPump?: PVHeatPumpSettings;
  thermalBridges: ThermalBridge[];
}

export interface Floor {
  id: string;
  name: string;
  rooms: Room[];
}

/* =========================================
   Calculation (DIN EN 12831) types
   ========================================= */
export interface DinTransmissionSurface {
  kind: "wall" | "window" | "door" | "ceiling" | "floor";
  name: string;
  area: number;    // m²
  uValue: number;  // W/(m²·K)
  deltaT: number;  // K
  qW: number;      // W
}

export interface DinThermalBridgeItem {
  id: string;
  name: string;
  psiValue: number; // W/(m·K)
  length: number;   // m
  deltaT: number;   // K
  qW: number;       // W
}

export interface DinSections {
  transmission: {
    surfaces: DinTransmissionSurface[];
    sumW: number;
  };
  thermalBridge: {
    items: DinThermalBridgeItem[];
    sumW: number;
    factorApplied?: number;
  };
  ventilation: {
    vdot_m3_s: number;
    effectiveDT: number;
    efficiency: number;
    qW: number;
  };
  totalW: number;
}

export interface DinTotals {
  transmissionW: number;
  thermalBridgeW: number;
  ventilationW: number;
  totalW: number;
}

export interface PerRoomLoad {
  roomId: string;
  roomName: string;
  transmissionLoss: number;
  ventilationLoss: number;
  thermalBridgeLoss: number;
  safetyMargin: number;
  roomHeatLoad: number;
  area: number;
  totalLoss?: number;
  din?: DinSections;
}

export interface CalculationResults {
  perRoomLoads: PerRoomLoad[];
  totalHeatLoadKW: number;
  dinTotals: DinTotals;
}

export interface SummaryRow {
  floor: string;
  room: string;
  transmissionLoss: number;
  ventilationLoss: number;
  thermalBridgeLoss: number;
  safetyMargin: number;
  roomHeatLoad: number;
  area: number;
  totalLoss?: number;
}

export interface ResultSummary {
  totalRooms: number;
  totalLoad: number;
  totalArea: number;
  energyClass: string;
  recommendation: string;
  roomBreakdown: SummaryRow[];
}

export interface ExportOptions {
  totalLoad: number;
  totalArea: number;
  wattsPerSqm: number;
  energyClass: string;
  recommendation: string;
  roomBreakdown: SummaryRow[];
}

/* =========================================
   NEW: Tariff / Alternative heating / Dimensioning
   ========================================= */
export interface EnergyTariffSettings {
  hpTariffEnabled: boolean;
  electricityPriceCt: number; // ct/kWh
}

export interface AlternativeHeatingComparison {
  compareAlternativeHeating: boolean;
  altHeatingCostEUR?: number;
  altHeatingReplacementYears?: number;
}

export interface DimensioningInputs {
  heatLoadW: number;               // e.g. 12070 W
  residents: number;               // e.g. 4
  dhwPerResidentLPerDay: number;   // e.g. 40 L/day
  bivalenceTemperatureC: number;   // e.g. -5 °C
}

/**
 * ProjectMeta extends the existing BuildingMetadata with
 * the extra fields used in your screenshots (tariff, comparison,
 * dimensioning, and planned installation date).
 */
export interface ProjectMeta extends BuildingMetadata {
  plannedInstallationDate?: string; // ISO YYYY-MM-DD
  tariff: EnergyTariffSettings;
  altHeating: AlternativeHeatingComparison;
  dimensioning: DimensioningInputs;
}
