// src/pages/projectView/components/HeatLoadCalculator/hooks/useAppState.tsx

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  Dispatch,
  useCallback,
} from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Floor,
  Room,
  BuildingMetadata,
  CalculationResults,
  EnvelopeElement,
  BuildingEra,
  InsulationLevel,
  ProjectMeta,
  EnergyTariffSettings,
  AlternativeHeatingComparison,
  DimensioningInputs,
} from "./types";
import { applyPresetUValues } from "./room/sections/applyPresetUValues";
import { DEFAULT_PROJECT_META } from "./defaults/defaults";

// Allow 4 steps: 0=Gebäude, 1=Stockwerke, 2=Ergebnisse, 3=Grundmaterialien
const MAX_STEP = 3;

// —————————— STATE
export interface AppState {
  activeStep: number;            // 0=Gebäude,1=Stockwerke,2=Ergebnisse,3=Grundmaterialien
  building: BuildingMetadata;
  floors: Floor[];
  selectedRoomId: string | null;
  calculationResults: CalculationResults | null;

  // NEW: project-level meta for tariff, comparison, dimensioning, date
  projectMeta: ProjectMeta;
}

// —————————— ACTIONS
export type AppAction =
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "GO_TO_STEP"; payload: { step: number } }
  | { type: "SET_BUILDING"; payload: { building: Partial<BuildingMetadata> } }
  | { type: "ADD_FLOOR" }
  | { type: "REMOVE_FLOOR"; payload: { floorId: string } }
  | { type: "RENAME_FLOOR"; payload: { floorId: string; newName: string } }
  | { type: "ADD_ROOM"; payload: { floorId: string } }
  | { type: "REMOVE_ROOM"; payload: { roomId: string } }
  | { type: "REPLACE_ROOM"; payload: { room: Room } }
  | { type: "SELECT_ROOM"; payload: { roomId: string | null } }
  | { type: "RENAME_ROOM"; payload: { roomId: string; floorId: string; newName: string } }
  | { type: "REORDER_FLOORS"; payload: { floors: Floor[] } }
  | { type: "REORDER_ROOMS"; payload: { floorId: string; rooms: Room[] } }
  | { type: "SET_RESULTS"; payload: { results: CalculationResults | null } }
  // NEW: project meta actions
  | { type: "SET_TARIFF"; payload: EnergyTariffSettings }
  | { type: "SET_ALT_HEATING"; payload: AlternativeHeatingComparison }
  | { type: "SET_DIMENSIONING"; payload: DimensioningInputs }
  | { type: "SET_PLANNED_INSTALLATION_DATE"; payload: string }
  // NEW: load a full project (Step 0 + Step 1 prefilled)
  | {
      type: "LOAD_SAMPLE_PROJECT";
      payload: {
        building: BuildingMetadata;
        floors: Floor[];
        projectMeta?: ProjectMeta;
        selectedRoomId?: string;
      };
    };

// —————————— INITIAL STATE
const defaultBuilding: BuildingMetadata = {
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

  // presets for default U-values
  buildingEra: BuildingEra.Pre1978,
  insulationLevel: InsulationLevel.None,
};

const initialRoom: Room = {
  id: uuidv4(),
  name: "Neuer Raum",
  area: 0,
  height: 2.5,
  targetTemperature: 20,
  walls: [],
  windows: [],
  doors: [],
  ceilingConfig: {
    area: 0,
    layerRValues: [],
    insulationStandard: "standard",
    roofType: "Flachdach",
    kniestockHeight: 0,
    dachfenster: false,
    gauben: false,
  },
  floorConfig: {
    area: 0,
    layerRValues: [],
    heated: false,
    material: "",
    insulated: false,
    uValue: 0,
    floorType: "beheizt",
  },
  ventilation: {
    roomType: "living",
    targetTemp: 20,
    airExchangeRate: 0.5,
    ventilationSystem: false,
  },
  heaters: [],
  pvHeatPump: { hasPV: false, hasHeatPump: false, bufferTank: false },
  thermalBridges: [],
};

const initialState: AppState = {
  activeStep: 0,
  building: defaultBuilding,
  floors: [
    {
      id: uuidv4(),
      name: "Erdgeschoss",
      // Apply presets to the very first room as well
      rooms: [applyPresetUValues(initialRoom, defaultBuilding)],
    },
  ],
  selectedRoomId: initialRoom.id,
  calculationResults: null,

  // NEW: project meta defaults
  projectMeta: DEFAULT_PROJECT_META,
};

// —————————— REDUCER
function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "NEXT_STEP":
      return { ...state, activeStep: Math.min(state.activeStep + 1, MAX_STEP) };

    case "PREV_STEP":
      return { ...state, activeStep: Math.max(state.activeStep - 1, 0) };

    case "GO_TO_STEP":
      return {
        ...state,
        activeStep: Math.min(Math.max(action.payload.step, 0), MAX_STEP),
      };

    case "SET_BUILDING": {
      const updatedBuilding = { ...state.building, ...action.payload.building };

      // If era/insulation changed, re-fill ONLY missing U-values in all rooms.
      const touchesPresets =
        Object.prototype.hasOwnProperty.call(action.payload.building, "buildingEra") ||
        Object.prototype.hasOwnProperty.call(action.payload.building, "insulationLevel");

      const floors = touchesPresets
        ? state.floors.map((f) => ({
            ...f,
            rooms: f.rooms.map((r) => applyPresetUValues(r, updatedBuilding)),
          }))
        : state.floors;

      return { ...state, building: updatedBuilding, floors };
    }

    case "ADD_FLOOR": {
      const newFloor: Floor = {
        id: uuidv4(),
        name: `Stockwerk ${state.floors.length + 1}`,
        rooms: [],
      };
      return { ...state, floors: [...state.floors, newFloor] };
    }

    case "REMOVE_FLOOR": {
      const floors = state.floors.filter((f) => f.id !== action.payload.floorId);
      const stillSel =
        state.selectedRoomId &&
        floors.some((f) => f.rooms.some((r) => r.id === state.selectedRoomId));
      return { ...state, floors, selectedRoomId: stillSel ? state.selectedRoomId : null };
    }

    case "RENAME_FLOOR":
      return {
        ...state,
        floors: state.floors.map((f) =>
          f.id === action.payload.floorId ? { ...f, name: action.payload.newName } : f
        ),
      };

    case "ADD_ROOM": {
      const base: Room = { ...initialRoom, id: uuidv4() };
      const roomWithPresets = applyPresetUValues(base, state.building);
      return {
        ...state,
        floors: state.floors.map((f) =>
          f.id === action.payload.floorId
            ? { ...f, rooms: [...f.rooms, roomWithPresets] }
            : f
        ),
      };
    }

    case "REMOVE_ROOM":
      return {
        ...state,
        floors: state.floors.map((f) => ({
          ...f,
          rooms: f.rooms.filter((r) => r.id !== action.payload.roomId),
        })),
        selectedRoomId:
          state.selectedRoomId === action.payload.roomId ? null : state.selectedRoomId,
      };

    case "REPLACE_ROOM":
      return {
        ...state,
        floors: state.floors.map((f) => ({
          ...f,
          rooms: f.rooms.map((r) => (r.id === action.payload.room.id ? action.payload.room : r)),
        })),
      };

    case "SELECT_ROOM":
      return { ...state, selectedRoomId: action.payload.roomId };

    case "RENAME_ROOM":
      return {
        ...state,
        floors: state.floors.map((f) =>
          f.id === action.payload.floorId
            ? {
                ...f,
                rooms: f.rooms.map((r) =>
                  r.id === action.payload.roomId ? { ...r, name: action.payload.newName } : r
                ),
              }
            : f
        ),
      };

    case "REORDER_FLOORS":
      return { ...state, floors: action.payload.floors };

    case "REORDER_ROOMS":
      return {
        ...state,
        floors: state.floors.map((f) =>
          f.id === action.payload.floorId ? { ...f, rooms: action.payload.rooms } : f
        ),
      };

    case "SET_RESULTS":
      return { ...state, calculationResults: action.payload.results };

    // —— NEW: project meta cases ——
    case "SET_TARIFF":
      return {
        ...state,
        projectMeta: { ...state.projectMeta, tariff: { ...action.payload } },
      };

    case "SET_ALT_HEATING":
      return {
        ...state,
        projectMeta: { ...state.projectMeta, altHeating: { ...action.payload } },
      };

    case "SET_DIMENSIONING":
      return {
        ...state,
        projectMeta: { ...state.projectMeta, dimensioning: { ...action.payload } },
      };

    case "SET_PLANNED_INSTALLATION_DATE":
      return {
        ...state,
        projectMeta: { ...state.projectMeta, plannedInstallationDate: action.payload },
      };

    // —— NEW: load a complete (prefilled) project and land on Step 1
    case "LOAD_SAMPLE_PROJECT": {
      const { building, floors, projectMeta, selectedRoomId } = action.payload;
      const firstRoomId = selectedRoomId ?? floors?.[0]?.rooms?.[0]?.id ?? null;
      return {
        ...state,
        building,
        floors,
        selectedRoomId: firstRoomId,
        projectMeta: projectMeta ?? state.projectMeta,
        calculationResults: null, // force fresh calc when moving to results
        activeStep: 1,            // user will press Weiter to see results
      };
    }

    default:
      return state;
  }
}

// —————————— CONTEXTS
const StateContext = createContext<AppState | undefined>(undefined);
const DispatchContext = createContext<Dispatch<AppAction> | undefined>(undefined);

// —————————— PROVIDER (no calc side-effects here)
export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
};

// —————————— HOOKS
export function useAppState(): AppState {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

export function useAppActions() {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) throw new Error("useAppActions must be used within AppStateProvider");

  // Make each action a stable callback (prevents effects from re-firing endlessly)
  const nextStep        = useCallback(() => dispatch({ type: "NEXT_STEP" }), [dispatch]);
  const prevStep        = useCallback(() => dispatch({ type: "PREV_STEP" }), [dispatch]);
  const goToStep        = useCallback((step: number) => dispatch({ type: "GO_TO_STEP", payload: { step } }), [dispatch]);
  const setBuildingInfo = useCallback((b: Partial<BuildingMetadata>) => dispatch({ type: "SET_BUILDING", payload: { building: b } }), [dispatch]);
  const addFloor        = useCallback(() => dispatch({ type: "ADD_FLOOR" }), [dispatch]);
  const removeFloor     = useCallback((floorId: string) => dispatch({ type: "REMOVE_FLOOR", payload: { floorId } }), [dispatch]);
  const renameFloor     = useCallback((floorId: string, newName: string) => dispatch({ type: "RENAME_FLOOR", payload: { floorId, newName } }), [dispatch]);
  const addRoom         = useCallback((floorId: string) => dispatch({ type: "ADD_ROOM", payload: { floorId } }), [dispatch]);
  const removeRoom      = useCallback((roomId: string) => dispatch({ type: "REMOVE_ROOM", payload: { roomId } }), [dispatch]);
  const replaceRoom     = useCallback((room: Room) => dispatch({ type: "REPLACE_ROOM", payload: { room } }), [dispatch]);
  const selectRoom      = useCallback((roomId: string | null) => dispatch({ type: "SELECT_ROOM", payload: { roomId } }), [dispatch]);
  const renameRoom      = useCallback((roomId: string, floorId: string, newName: string) => dispatch({ type: "RENAME_ROOM", payload: { roomId, floorId, newName } }), [dispatch]);
  const reorderFloors   = useCallback((floors: Floor[]) => dispatch({ type: "REORDER_FLOORS", payload: { floors } }), [dispatch]);
  const reorderRooms    = useCallback((floorId: string, rooms: Room[]) => dispatch({ type: "REORDER_ROOMS", payload: { floorId, rooms } }), [dispatch]);
  const setCalculationResults = useCallback((r: CalculationResults | null) => dispatch({ type: "SET_RESULTS", payload: { results: r } }), [dispatch]);

  // NEW: handy dispatchers
  const setTariff = useCallback(
    (v: EnergyTariffSettings) => dispatch({ type: "SET_TARIFF", payload: v }),
    [dispatch]
  );
  const setAltHeating = useCallback(
    (v: AlternativeHeatingComparison) => dispatch({ type: "SET_ALT_HEATING", payload: v }),
    [dispatch]
  );
  const setDimensioning = useCallback(
    (v: DimensioningInputs) => dispatch({ type: "SET_DIMENSIONING", payload: v }),
    [dispatch]
  );
  const setPlannedDate = useCallback(
    (isoDate: string) => dispatch({ type: "SET_PLANNED_INSTALLATION_DATE", payload: isoDate }),
    [dispatch]
  );

  // NEW: fill an entire project (Step 0 + Step 1) in one dispatch
  const fillWithSampleProject = useCallback(
    (payload: {
      building: BuildingMetadata;
      floors: Floor[];
      projectMeta?: ProjectMeta;
      selectedRoomId?: string;
    }) => dispatch({ type: "LOAD_SAMPLE_PROJECT", payload }),
    [dispatch]
  );

  return {
    nextStep, prevStep, goToStep,
    setBuildingInfo,
    addFloor, removeFloor, renameFloor,
    addRoom, removeRoom, replaceRoom, selectRoom, renameRoom,
    reorderFloors, reorderRooms,
    setCalculationResults,

    // NEW
    setTariff,
    setAltHeating,
    setDimensioning,
    setPlannedDate,

    // NEW: one-shot fill
    fillWithSampleProject,
  };
}

export type { Floor, Room, BuildingMetadata, CalculationResults, EnvelopeElement };
