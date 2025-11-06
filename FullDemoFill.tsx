// FILE: src/pages/projectView/components/HeatLoadCalculator/demo/FullDemoFill.tsx

import * as React from "react";
import { Button, Stack, Box, Typography } from "@mui/material";
import { v4 as uuidv4 } from "uuid";

import type {
  BuildingMetadata,
  Floor,
  Room,
  ProjectMeta,
  VentilationConfigType,
  Window,
  Wall,
  Door,
} from "../types";
import {
  DEFAULT_BUILDING_META,
  DEFAULT_PROJECT_META,
} from "../defaults/defaults";
import { applyPresetUValues } from "../room/sections/applyPresetUValues";

/* Helpers */
const r2 = (n: number) => +Number(n).toFixed(2);
const r0 = (n: number) => Math.round(Number(n));
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Demo config */
export type SampleOptions = {
  floors?: number;
  roomsPerFloor?: number;
  randomized?: boolean;
};

const ROOM_TEMPLATES = [
  { name: "Wohnzimmer", type: "living", baseArea: 24, targetTemp: 20 },
  { name: "Küche", type: "kitchen", baseArea: 14, targetTemp: 20 },
  { name: "Schlafzimmer", type: "bedroom", baseArea: 16, targetTemp: 18 },
  { name: "Bad", type: "bathroom", baseArea: 10, targetTemp: 24 },
  { name: "Flur", type: "hallway", baseArea: 8, targetTemp: 15 },
] as const;

/* ───────────────── Ventilation that calculators will pick up ───────────────── */
function makeVentilation(
  roomType: string,
  targetTemp: number,
  area: number,
  height: number
): VentilationConfigType {
  // Non-zero ACH per room type so Lüftungsverluste are visible
  const ach =
    roomType === "bathroom" ? 1.0 :
    roomType === "kitchen"  ? 0.8 :
    roomType === "bedroom"  ? 0.5 : 0.6;

  const volumeM3 = +(area * height).toFixed(2);

  // Canonical single flow key many calculators expect:
  const airVolumeFlowM3h = +(volumeM3 * ach).toFixed(2);
  const flowM3s = +(airVolumeFlowM3h / 3600).toFixed(4);

  // Disable heat recovery so losses are not cancelled
  const etaHRV = 0;
  const etaHRVPercent = 0;

  const internalGainsW =
    roomType === "kitchen"  ? 300 :
    roomType === "bathroom" ? 150 :
    roomType === "living"   ? 200 :
    roomType === "bedroom"  ? 80  : 50;

  return {
    // Generic info
    roomType,
    targetTemp,

    // Switches some calculators gate on
    enabled: true,
    active: true,
    includeInCalc: true,

    // Explicit mode flags to avoid HRV paths
    ventilationMode: "natural",   // "natural" | "mechanical" | "hrv"
    type: "natural" as any,
    mechanical: false,
    ventilationSystem: false,
    hasHeatRecovery: false,
    useHeatRecovery: false,

    // ACH variants (different names used across code paths)
    ach,
    airExchangeRate: ach,
    airChangesPerHour: ach,
    infiltrationACH: ach,

    // Flow variants (provide the canonical + mirrors)
    airVolumeFlowM3h,
    flowM3h: airVolumeFlowM3h,
    supplyFlowM3h: airVolumeFlowM3h,
    extractFlowM3h: airVolumeFlowM3h,
    flowM3s,

    // HRV efficiency in multiple spellings
    etaHRV,
    heatRecoveryEfficiency: etaHRV,
    heatRecovery: etaHRV,
    heatRecoveryPercent: etaHRVPercent,

    // Extras some implementations factor
    outdoorAirFraction: 1,
    internalGainsW,
    internalHeatSourcesW: internalGainsW,
  } as unknown as VentilationConfigType;
}

/* Envelope generators */
function makeWalls(area: number, height: number): Wall[] {
  const perimeter = 4 * Math.sqrt(area);
  const wall1Len = perimeter * 0.28;
  const wall2Len = perimeter * 0.22;
  const wall3Len = perimeter * 0.28;
  const wall4Len = perimeter - (wall1Len + wall2Len + wall3Len);
  const lengths = [wall1Len, wall2Len, wall3Len, wall4Len];

  return lengths.map((L, i) => {
    const rawArea = L * height - (i === 2 ? 2.0 : 0) - (i === 0 ? 1.9 : 0);
    return {
      id: uuidv4(),
      name: `Außenwand ${i + 1}`,
      type: "singleSolid" as any,
      material: "Mauerwerk" as any,
      isExterior: true,
      uValue: undefined,
      rValue: undefined,
      area: r0(Math.max(0, rawArea)),
      length: r0(L),
    } as unknown as Wall;
  });
}

function makeWindows(area: number, rnd: () => number): Window[] {
  const base = Math.max(1.6, Math.min(3.0, area * 0.08));
  return [
    {
      id: uuidv4(),
      type: "standard" as any,
      area: r2(base * (0.9 + rnd() * 0.2)),
      uValue: undefined,
      orientation: "South" as any,
    } as unknown as Window,
    {
      id: uuidv4(),
      type: "standard" as any,
      area: r2(base * (0.6 + rnd() * 0.2)),
      uValue: undefined,
      orientation: "West" as any,
    } as unknown as Window,
  ];
}

function makeDoor(): Door[] {
  return [
    {
      id: uuidv4(),
      area: r0(2),
      toUnheated: false,
      uValue: undefined,
      type: "door" as any,
    } as unknown as Door,
  ];
}

function makeHeatersForRoom(area: number) {
  const totalRoomW = Math.max(200, r0(area * 60));
  const count = area > 18 ? 2 : 1;
  const perHeaterW = r0(totalRoomW / count);
  const flowLps = r2(perHeaterW / 41800);
  const pickWidth = (w: number) => (w < 800 ? 800 : w < 1000 ? 1000 : 1200);
  const width = pickWidth(perHeaterW);
  const height = 600;

  return Array.from({ length: count }).map((_, i) => ({
    id: uuidv4(),
    type: "radiator",
    subType: "platten",
    name: `Heizkörper ${i + 1}`,
    brand: "DemoBrand",
    series: "VK-Pro",
    height,
    width,
    output: perHeaterW,
    flowLps,
    standardRegime: "55/45/20",
    valveType: "Thermostatisch",
    pressureDrop: 50,
    panels: 2,
    depth: 100,
  }));
}

/* Base room builder (includes ventilation) */
function makeRoom(
  t: { name: string; type: string; baseArea: number; targetTemp: number },
  rnd: () => number
): Room {
  const area = r0(t.baseArea * (0.9 + rnd() * 0.2));
  const height = r0(2.6);

  const ceilingConfig = {
    area,
    layerRValues: [] as number[],
    insulationStandard: "standard" as any,
    roofType: "Flachdach" as any,
    kniestockHeight: 0,
    dachfenster: false,
    gauben: false,
    uValue: undefined,
  } as any;

  const floorConfig = ({
    area,
    layerRValues: [] as number[],
    heated: false,
    material: "",
    insulated: true,
    uValue: undefined,
    floorType: "beheizt",
  } as unknown) as Room["floorConfig"];

  const room: Room = ({
    id: uuidv4(),
    name: t.name,
    area,
    height,
    targetTemperature: t.targetTemp,
    walls: makeWalls(area, height),
    windows: makeWindows(area, rnd),
    doors: makeDoor(),
    ceilingConfig,
    floorConfig,
    ventilation: makeVentilation(t.type, t.targetTemp, area, height), // <-- important
    heaters: makeHeatersForRoom(area),
    pvHeatPump: { hasPV: false, hasHeatPump: false, bufferTank: false },
    thermalBridges: [
      { id: uuidv4(), name: "Balkonplatte", psiValue: r2(0.05), length: r0(4) },
    ],
  } as unknown) as Room;

  return room;
}

/* ─────────── merge helper: keep ventilation after U-value presets ─────────── */
function mergePreservingVentilation(base: Room, withU: Room): Room {
  // If the preset step dropped ventilation, restore it from the base room.
  const ventilation = withU.ventilation ?? base.ventilation;
  return { ...withU, ventilation };
}

/* ───────────────────── Build a full demo project ───────────────────── */
export function buildFullDemoProject(
  options: SampleOptions = {}
): {
  building: BuildingMetadata;
  floors: Floor[];
  projectMeta: ProjectMeta;
  selectedRoomId: string;
} {
  const { floors = 3, roomsPerFloor = 3, randomized = true } = options;
  const rng = randomized ? mulberry32(42) : () => 0.5;

  /* Step 0 — Building meta */
  const building: BuildingMetadata = {
    ...(DEFAULT_BUILDING_META as BuildingMetadata),

    // Address
    postalCode: "90402",
    location: "Nürnberg",
    city: "Nürnberg" as any,
    address: "Musterstraße 1",

    // Type / Era / Insulation — enum VALUES
    buildingType:
      ((DEFAULT_BUILDING_META as any).buildingType ?? "Einfamilienhaus") as any,
    buildingEra: "pre1978" as any,
    insulationLevel: "none" as any,

    // Years
    constructionYear: 1972,
    renovationYear: 2015,
    renovationYearOfBuilding: 2015 as any,

    // Counts
    floors: 1,
    numberOfFloors: 1 as any,
    residents: 4,

    // Temperatures
    temperaturePreference: 21,
    designOutdoorTempC:
      (DEFAULT_BUILDING_META as any).designOutdoorTempC ?? -10,
    manualDesignOutdoorTempC: null,

    // Geometry
    buildingWidthM: 10,
    widthM: 10 as any,
    buildingWidth: 10 as any,

    buildingLengthM: 12,
    lengthM: 12 as any,
    buildingLength: 12 as any,

    exteriorWallLengthM: 44,
    exteriorWallLength: 44 as any,
    externalWallLengthM: 44 as any,
    outerWallLengthM: 44 as any,

    // Above / below
    aboveBuilding: "attic" as any,
    whatIsAbove: "attic" as any,
    overBuildingType: "attic" as any,
    belowBuilding: "basement" as any,
    whatIsBelow: "basement" as any,
    underBuildingType: "basement" as any,

    // Airtightness
    airtightnessTest: true,
    hasAirtightnessTest: true as any,
    n50Value: 1.5,

    // Energy mirrors
    annualElectricityConsumptionKWh: 4200 as any,
    annualGasConsumptionKWh: 12000 as any,

    // PV & Heat pump (building slice)
    pv: {
      hasPV: true,
      pvKwp: r2(5.2),
      hasHeatPump: true,
      hpType: "Luft-Wasser" as any,
      bufferTank: true,
      bufferSizeLiters: 300,
    } as any,

    // Legacy combined block
    pvHeatPump: {
      hasPV: true,
      pvPowerKWp: r2(5.2),
      hasHeatPump: true,
      heatPumpType: "Luft-Wasser" as any,
      bufferTank: true,
      bufferTankVolumeL: 300,
    } as any,
  } as BuildingMetadata;

  /* Step 1 — Floors & Rooms */
  const floorNames = [
    "Erdgeschoss",
    "Obergeschoss",
    "Dachgeschoss",
    "Keller",
    "2. OG",
  ];
  const floorsArr: Floor[] = Array.from({ length: floors }).map((_, fIdx) => {
    const name = floorNames[fIdx] || `Geschoss ${fIdx + 1}`;
    const rooms: Room[] = Array.from({ length: roomsPerFloor }).map(
      (__, rIdx) => {
        const tpl =
          ROOM_TEMPLATES[(fIdx * roomsPerFloor + rIdx) % ROOM_TEMPLATES.length];

        // Build a room WITH ventilation…
        const baseRoom = makeRoom(tpl, rng);

        // …apply U-value presets (may drop ventilation)…
        const afterU = applyPresetUValues(baseRoom, building) as Room;

        // …then restore ventilation if it was lost.
        const finalRoom = mergePreservingVentilation(baseRoom, afterU);

        return finalRoom;
      }
    );
    return { id: uuidv4(), name, rooms } as Floor;
  });

  const firstRoomId = floorsArr[0]?.rooms[0]?.id || uuidv4();

  /* Step 0 — Project meta mirrors */
  const projectMeta: ProjectMeta = {
    ...(DEFAULT_PROJECT_META as ProjectMeta),

    heatPumpTariffEnabled: true as any,
    electricityPriceCtPerKWh: r2(20),
    compareWithAltHeating: true as any,
    alternativeHeatingCostEuro: r2(0),
    replacementAfterYears: 0 as any,

    manualHeatLoadW: 12070 as any,
    bivalentTemperatureC: r2(-5),
    hotWaterPerPersonLPerDay: r2(40),
    plannedInstallationDate: "2025-02-01",

    oldHeatingSystemType: "KeineAngabe" as any,
    oldHeatingInstallYear: 1998 as any,
    previousHeatingType: "KeineAngabe" as any,
    previousHeatingYear: 1998 as any,

    hotWaterSource: "none" as any,
    dhwSource: "none" as any,

    annualElectricityConsumptionKWh: 4200,
    yearlyElectricityKWh: 4200 as any,
    electricityConsumptionKWh: 4200 as any,

    annualGasConsumptionKWh: 12000,
    yearlyGasKWh: 12000 as any,
    gasConsumptionKWh: 12000 as any,

    solarThermal: true as any,
    hasSolarThermal: true as any,
    hasFireplace: true as any,
    ovenFireplace: true as any,
    hasOven: true as any,

    pvHasSystem: true as any,
    pvPowerKWp: r2(5.2),
    pvKWp: r2(5.2) as any,
    pvPowerKwp: r2(5.2) as any,

    hpPlanned: true as any,
    hpType: "Luft-Wasser" as any,
    heatPumpType: "Luft-Wasser" as any,

    bufferTankPresent: true as any,
    bufferTankVolumeL: 300 as any,
    bufferTankVolumeLiters: 300 as any,
  } as ProjectMeta;

  return {
    building,
    floors: floorsArr,
    projectMeta,
    selectedRoomId: firstRoomId,
  };
}

/* Wiring helpers */
export function loadDemoViaDispatch(
  dispatch: React.Dispatch<{ type: string; payload?: any }>,
  options?: SampleOptions
) {
  const payload = buildFullDemoProject(options);
  dispatch({ type: "LOAD_SAMPLE_PROJECT", payload });
}

export function loadDemoViaSetters(
  setters: {
    setBuilding: (b: BuildingMetadata) => void;
    setFloors: (f: Floor[]) => void;
    setProjectMeta?: (p: ProjectMeta) => void;
    setSelectedRoomId?: (id: string) => void;
    setActiveStep?: (n: number) => void;
  },
  options?: SampleOptions
) {
  const { building, floors, projectMeta, selectedRoomId } =
    buildFullDemoProject(options);

  // helpful while aligning bindings
  console.log("[DEMO] building", building);
  console.log("[DEMO] projectMeta", projectMeta);

  setters.setBuilding(building);
  setters.setFloors(floors);
  setters.setProjectMeta?.(projectMeta);
  setters.setSelectedRoomId?.(selectedRoomId);
  setters.setActiveStep?.(0); // stay on Step 0
}

/* Buttons */
export function FullDemoFillButtons(
  props:
    | { mode: "dispatch"; dispatch: React.Dispatch<{ type: string, payload?: any }> }
    | { mode: "setters"; setters: Parameters<typeof loadDemoViaSetters>[0] }
) {
  const fill = (floors: number, roomsPerFloor: number) => {
    const opts: SampleOptions = { floors, roomsPerFloor, randomized: true };
    if ("dispatch" in props) loadDemoViaDispatch(props.dispatch, opts);
    else loadDemoViaSetters(props.setters, opts);
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.75, mb: 1 }}>
        Demo-Projekt füllen:
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" onClick={() => fill(1, 2)} data-testid="fill-small">
          Small (1×2)
        </Button>
        <Button variant="outlined" onClick={() => fill(3, 3)} data-testid="fill-medium">
          Medium (3×3)
        </Button>
        <Button variant="outlined" onClick={() => fill(5, 4)} data-testid="fill-large">
          Large (5×4)
        </Button>
      </Stack>
    </Box>
  );
}
