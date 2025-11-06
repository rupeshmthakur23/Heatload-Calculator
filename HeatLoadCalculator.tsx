// src/pages/projectView/components/HeatLoadCalculator/HeatLoadCalculator.tsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Box, useMediaQuery, useTheme, Typography } from "@mui/material";
import { Spin, Alert } from "antd";
import { ExclamationCircleOutlined, CloseOutlined } from "@ant-design/icons";
import httpClient from "shared/utils/httpClient";
import ChecklistSidebar from "./checklist/ChecklistSidebar";
import FloorRoomTree from "./checklist/FloorRoomTree";
import { BuildingInformationCard } from "./checklist/BuildingInformationCard";
import RoomPanel from "./room/RoomPanel";
import ResultPanel from "./results/ResultPanel";
import { useCalculationResults } from "./useCalculationResults";
import { useAppState, useAppActions } from "./useAppState";
import type { Floor as AppFloor } from "./useAppState";
import PrimaryButton from "./PrimaryButton";
import PillButton from "./PillButton";

// ✅ reads activeSavedProject from Redux to prefill address
import { useAppState as useRootSelector } from "redux/store";
import { selectActiveSavedProject } from "redux/task/selectors";

// Aggregate "Grundmaterialien" panel (property-wide)
import GrundmaterialienPanel from "./checklist/GrundmaterialienPanel";
// To re-apply Ära/Dämmniveau presets to rooms
import { applyPresetUValues } from "./room/sections/applyPresetUValues";

import {
  HeatLoadPayload,
  EnvelopeElement as ApiEnvelopeElement,
  Floor as ApiFloor,
  WallDetail,
  WindowDetail,
  DoorDetail,
  PVHeatPumpSettings,
} from "api/heatLoad/heatLoad.types";
import type { SummaryRow } from "./types";
import { colors } from "./designTokens";

// Demo fill
import { FullDemoFillButtons } from "./demo/FullDemoFill";

// Steps incl. Grundmaterialien
const steps = ["Gebäude", "Stockwerke", "Ergebnisse", "Grundmaterialien"];

const SIDEBAR_W = 280;
const GUTTER = 32;
const CHAT_BUBBLE_OFFSET = 96;

function makeAuthConfig() {
  let raw = localStorage.getItem("token") || "";
  if (raw.startsWith("JWT ")) raw = raw.slice(4);
  try {
    const root = JSON.parse(localStorage.getItem("persist:root") || "{}");
    const auth = root.auth && JSON.parse(root.auth);
    raw = raw || auth?.token || auth?.jwt || "";
  } catch {}
  return raw ? { headers: { Authorization: `Bearer ${raw}` } } : {};
}

interface Props {
  projectId: string | null;
  initialQuoteId: string;
}

const D2E = {
  domesticHotWater: {
    Durchlauferhitzer: "instantaneous",
    Boiler: "boiler",
    Kombitherme: "combi",
    Keine: "none",
  } as Record<string, any>,
  shielding: { Keine: "none", Gering: "low", Mittel: "medium", Hoch: "high" } as Record<string, any>,
  roofType: { Flachdach: "flat", Satteldach: "gable", Walmdach: "hip" } as Record<string, any>,
  floorType: {
    beheizt: "heated",
    unbeheizt: "unheated",
    erdreich: "ground",
    aussenluft: "outside_air",
  } as Record<string, any>,
  heaterSubType: { platten: "panel", glieder: "column", bad: "bath" } as Record<string, any>,
};

const E2D = {
  domesticHotWater: {
    instantaneous: "Durchlauferhitzer",
    boiler: "Boiler",
    combi: "Kombitherme",
    none: "Keine",
  } as Record<string, any>,
  shielding: { none: "Keine", low: "Gering", medium: "Mittel", high: "Hoch" } as Record<string, any>,
  roofType: { flat: "Flachdach", gable: "Satteldach", hip: "Walmdach" } as Record<string, any>,
  floorType: {
    heated: "beheizt",
    unheated: "unbeheizt",
    ground: "erdreich",
    outside_air: "aussenluft",
  } as Record<string, any>,
  heaterSubType: { panel: "platten", column: "glieder", bath: "bad" } as Record<string, any>,
};

const mapVal = (v: any, dict: Record<string, any>) => (typeof v === "string" ? dict[v] ?? v : v);

/** Keep only the first line of any address (street + house number). */
const firstAddressLine = (addr: any): string => {
  if (addr == null) return "";
  const s = String(addr);
  const first = s.split(/\r?\n|,/)[0];
  return (first || "").trim();
};

/* -------------------- NEW: mapping + normalizer for Gebäudetyp autofill -------------------- */
const BUILDING_TYPE_LABEL_MAP: Record<string, string> = {
  Einfamilienhaus: "Einfamilienhaus",
  Mehrfamilienhaus: "Mehrfamilienhaus",
  Reihenhaus: "Reihenhaus",
  Doppelhaushälfte: "Doppelhaushälfte",
  Wohnung: "Wohnung",
  Bürogebäude: "Bürogebäude",
  "Single Family": "Einfamilienhaus",
  "Single-Family": "Einfamilienhaus",
  "Single Family House": "Einfamilienhaus",
  "Single-Family House": "Einfamilienhaus",
  "Single-Family Building": "Einfamilienhaus",
  "Multi Family": "Mehrfamilienhaus",
  "Multi-Family": "Mehrfamilienhaus",
  "Multi-Family Building": "Mehrfamilienhaus",
  Apartment: "Wohnung",
  Flat: "Wohnung",
  "Row House": "Reihenhaus",
  Townhouse: "Reihenhaus",
  "Semi-Detached": "Doppelhaushälfte",
  "Semi Detached": "Doppelhaushälfte",
  "Office Building": "Bürogebäude",
};
const BUILDING_TYPE_CODE_MAP: Record<string, string> = {
  single_family: "Einfamilienhaus",
  "single-family": "Einfamilienhaus",
  singlefamily: "Einfamilienhaus",
  single_family_house: "Einfamilienhaus",
  multi_family: "Mehrfamilienhaus",
  "multi-family": "Mehrfamilienhaus",
  multifamily: "Mehrfamilienhaus",
  apartment: "Wohnung",
  flat: "Wohnung",
  row_house: "Reihenhaus",
  townhouse: "Reihenhaus",
  semi_detached: "Doppelhaushälfte",
  "semi-detached": "Doppelhaushälfte",
  office: "Bürogebäude",
  office_building: "Bürogebäude",
};
const normalizeHeaderBuildingTypeToGerman = (raw: any): string | undefined => {
  if (raw == null) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  if (BUILDING_TYPE_LABEL_MAP[s]) return BUILDING_TYPE_LABEL_MAP[s];
  const key = s.toLowerCase().replace(/\s+/g, "_");
  if (BUILDING_TYPE_CODE_MAP[key]) return BUILDING_TYPE_CODE_MAP[key];
  return s;
};
/* ------------------------------------------------------------------------------------------- */

export default function HeatLoadCalculator({ projectId, initialQuoteId }: Props) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const { building, floors: rawFloors, selectedRoomId, activeStep } = useAppState();
  const floors: AppFloor[] = useMemo(() => rawFloors ?? [], [rawFloors]);
  const {
    setBuildingInfo,
    addFloor,
    removeFloor,
    addRoom,
    removeRoom,
    renameFloor,
    renameRoom,
    replaceRoom,
    selectRoom,
    nextStep,
    prevStep,
    goToStep,
    reorderFloors,
    reorderRooms,
  } = useAppActions();

  const activeSavedProject = useRootSelector(selectActiveSavedProject);

  const setBuildingInfoSanitized = useCallback(
    (meta: any) => {
      if (meta && Object.prototype.hasOwnProperty.call(meta, "address")) {
        setBuildingInfo({ ...meta, address: firstAddressLine(meta.address) });
      } else {
        setBuildingInfo(meta);
      }
    },
    [setBuildingInfo]
  );

  useEffect(() => {
    const mba = activeSavedProject?.quote?.mapboxAddress;
    if (!mba) return;

    const needsPostal = !building?.postalCode && mba.postcode;
    const needsCity = !building?.location && (mba.city || mba.locality);
    const needsAddr = !building?.address && (mba.address || mba.complete || mba.street);

    if (!needsPostal && !needsCity && !needsAddr) return;

    const patch: any = {};
    if (needsPostal) patch.postalCode = mba.postcode;
    if (needsCity) patch.location = mba.city || mba.locality || "";

    if (needsAddr) {
      const candidate =
        (typeof mba.address === "string" && mba.address) ||
        (typeof mba.street === "string" && mba.street) ||
        (typeof mba.complete === "string" && mba.complete) ||
        "";
      patch.address = firstAddressLine(candidate);
    }

    if (Object.keys(patch).length > 0) {
      setBuildingInfoSanitized(patch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeSavedProject,
    building?.postalCode,
    building?.location,
    building?.address,
    setBuildingInfoSanitized,
  ]);

  useEffect(() => {
    if (building?.buildingType) return;
    const headerType =
      activeSavedProject?.quote?.buildingType ??
      (activeSavedProject as any)?.quote?.building?.buildingType ??
      (activeSavedProject as any)?.buildingType ??
      (activeSavedProject as any)?.project?.buildingType;
    if (!headerType) return;
    const normalized = normalizeHeaderBuildingTypeToGerman(headerType);
    if (!normalized) return;
    setBuildingInfoSanitized({ buildingType: normalized });
  }, [activeSavedProject, building?.buildingType, setBuildingInfoSanitized]);

  const { results: calcResults, runCalculation } = useCalculationResults();

  useEffect(() => {
    if (!initialQuoteId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await httpClient.get(`/heat-load`, {
          params: { quoteId: initialQuoteId },
          ...makeAuthConfig(),
        });
        if (cancelled) return;

        const doc = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!doc) return;

        const b = doc.building || {};
        const buildingDE = {
          ...b,
          address: firstAddressLine(b.address),
          domesticHotWater: mapVal(b.domesticHotWater, E2D.domesticHotWater),
          shielding: mapVal(b.shielding, E2D.shielding),
        };
        if (Object.keys(b).length) setBuildingInfoSanitized(buildingDE);

        const floorsFromApi: AppFloor[] = (doc.floors || []).map((fl: any) => ({
          id: fl.id,
          name: fl.name,
          rooms: (fl.rooms || []).map((room: any) => ({
            ...room,
            ceilingConfig: room.ceilingConfig
              ? { ...room.ceilingConfig, roofType: mapVal(room.ceilingConfig.roofType, E2D.roofType) }
              : room.ceilingConfig,
            floorConfig: room.floorConfig
              ? { ...room.floorConfig, floorType: mapVal(room.floorConfig.floorType, E2D.floorType) }
              : room.floorConfig,
            heaters: (room.heaters || []).map((h: any) => ({
              ...h,
              subType: mapVal(h.subType, E2D.heaterSubType),
            })),
          })),
        }));

        if (floorsFromApi.length > 0) {
          reorderFloors(floorsFromApi);
          const firstRoomId = floorsFromApi[0]?.rooms?.[0]?.id ?? null;
          if (firstRoomId) selectRoom(firstRoomId);
        }
      } catch {
        // ignore load errors here
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuoteId]);

  const designT =
    (building?.manualDesignOutdoorTempC ?? null) ?? (building?.designOutdoorTempC ?? null) ?? -10;

  useEffect(() => {
    if (activeStep !== 2) return;
    runCalculation(designT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, designT]);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [firstIssue, setFirstIssue] = useState<{ floor: string; room: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  const selectedRoom = useMemo(
    () =>
      floors
        .flatMap((fl) => fl.rooms.map((r) => ({ ...r, floorId: fl.id })))
        .find((r) => r.id === selectedRoomId) || null,
    [floors, selectedRoomId]
  );

  const findRoomById = useCallback(
    (id: string | undefined | null) => floors.flatMap((fl) => fl.rooms).find((r) => r.id === id),
    [floors]
  );

  const getEta = (v: any): number => {
    const candidates = [
      v?.etaHRV,
      v?.heatRecoveryEfficiency,
      v?.heatRecovery,
      typeof v?.heatRecoveryPercent === "number" ? v.heatRecoveryPercent / 100 : undefined,
    ];
    const eta = candidates.find((x) => typeof x === "number" && isFinite(x) && x >= 0 && x <= 1);
    return typeof eta === "number" ? eta : 0;
  };

  const getFlowM3h = (v: any, volumeM3: number): number => {
    const candidates = [v?.airVolumeFlowM3h, v?.flowM3h, v?.supplyFlowM3h, v?.extractFlowM3h].map((x) =>
      typeof x === "number" && isFinite(x) && x > 0 ? x : undefined
    );
    const found = candidates.find((x) => typeof x === "number");
    if (typeof found === "number") return found;
    const ach =
      typeof v?.airChangesPerHour === "number" && v.airChangesPerHour > 0
        ? v.airChangesPerHour
        : typeof v?.ach === "number" && v.ach > 0
        ? v.ach
        : typeof v?.airExchangeRate === "number" && v.airExchangeRate > 0
        ? v.airExchangeRate
        : typeof v?.infiltrationACH === "number" && v.infiltrationACH > 0
        ? v.infiltrationACH
        : 0;
    return ach > 0 && volumeM3 > 0 ? ach * volumeM3 : 0;
  };

  const computeVentLossKW = (roomId: string | undefined | null): number => {
    const room = roomId ? findRoomById(roomId) : undefined;
    if (!room) return 0;
    const v = (room as any).ventilation || {};
    const enabled = v?.enabled ?? v?.active ?? v?.includeInCalc ?? true;
    if (!enabled) return 0;

    const area = Number(room.area) || 0;
    const height = Number(room.height) || 0;
    const volumeM3 = area > 0 && height > 0 ? area * height : 0;
    if (volumeM3 <= 0) return 0;

    const flowM3h = getFlowM3h(v, volumeM3);
    if (!(flowM3h > 0)) return 0;

    const eta = getEta(v);
    const tIn = Number(room.targetTemperature) || 20;
    const dT = tIn - Number(designT || -10);
    if (!(dT > 0)) return 0;

    const Qw = 0.33 * flowM3h * dT * (1 - eta);
    return Math.max(0, Qw / 1000);
  };

  let summaryResults:
    | null
    | {
        totalRooms: number;
        totalLoad: number;
        totalArea: number;
        energyClass: string;
        recommendation: string;
        roomBreakdown: SummaryRow[];
      } = null;

  if (calcResults) {
    const rows: SummaryRow[] = calcResults.perRoomLoads.map((r) => {
      const floorName = floors.find((fl) => fl.rooms.some((rm) => rm.id === r.roomId))?.name || "";
      const ventKW =
        typeof r.ventilationLoss === "number" && r.ventilationLoss > 0
          ? r.ventilationLoss
          : computeVentLossKW(r.roomId);

      return {
        floor: floorName,
        room: r.roomName,
        transmissionLoss: r.transmissionLoss,
        ventilationLoss: ventKW,
        thermalBridgeLoss: r.thermalBridgeLoss,
        safetyMargin: r.safetyMargin,
        roomHeatLoad: r.roomHeatLoad,
        area: r.area,
      };
    });

    const totalArea = rows.reduce((sum, rr) => sum + (rr.area || 0), 0);
    const totalLoadKW = calcResults.totalHeatLoadKW || 0;
    summaryResults = {
      totalRooms: rows.length,
      totalLoad: totalLoadKW,
      totalArea,
      energyClass: "A",
      recommendation: "Keine Empfehlung",
      roomBreakdown: rows,
    };
  }

  const rFromU = (u?: number) =>
    Number.isFinite(u as number) && (u as number) > 0 ? 1 / (u as number) : undefined;
  const rArray = (r?: number) => (typeof r === "number" && isFinite(r) && r > 0 ? [r] : []);

  const makeEnvelopeElementsForRoom = (room: AppFloor["rooms"][number]): ApiEnvelopeElement[] => {
    const ceilingArea = room.ceilingConfig?.area ?? room.area ?? 0;
    const floorArea = room.floorConfig?.area ?? room.area ?? 0;

    const elements: ApiEnvelopeElement[] = [
      ...room.walls.map<ApiEnvelopeElement>((w) => ({
        name: (w.name ?? "").trim() || "Wand",
        area: w.area ?? 0,
        layerRValues: rArray(
          rFromU((w as any).uValue ?? ((w as any).rValue ? 1 / (w as any).rValue! : undefined))
        ),
      })),
      {
        name: "Decke",
        area: ceilingArea,
        layerRValues: rArray(rFromU(room.ceilingConfig?.uValue)) ?? (room.ceilingConfig?.layerRValues ?? []),
      },
      {
        name: "Boden",
        area: floorArea,
        layerRValues: rArray(rFromU(room.floorConfig?.uValue)) ?? (room.floorConfig?.layerRValues ?? []),
      },
      ...room.windows.map<ApiEnvelopeElement>((win) => ({
        name: String(win.type ?? "Fenster"),
        area: win.area ?? 0,
        layerRValues: rArray(rFromU(win.uValue)),
      })),
      ...room.doors.map<ApiEnvelopeElement>((door) => ({
        name: "Tür",
        area: door.area ?? 0,
        layerRValues: rArray(rFromU(door.uValue)),
      })),
    ].filter((el) => {
      const areaOk = (el?.area ?? 0) > 0;
      const hasLayers = Array.isArray(el?.layerRValues) && el.layerRValues!.length > 0;
      return areaOk && hasLayers;
    });

    return elements;
  };

  type RoomIssue = { floor: string; room: string; problem: string };

  const findIncompleteRooms = (allFloors: AppFloor[]): RoomIssue[] => {
    const issues: RoomIssue[] = [];
    allFloors.forEach((fl) =>
      fl.rooms.forEach((r) => {
        const fname = fl.name || "Unbenannte Etage";
        const rname = r.name?.trim() || "Unbenannter Raum";

        if (!r.name?.trim()) issues.push({ floor: fname, room: rname, problem: "kein Name" });
        if (!r.area || r.area <= 0) issues.push({ floor: fname, room: rname, problem: "Fläche fehlt" });
        if (!r.height || r.height <= 0) issues.push({ floor: fname, room: rname, problem: "Raumhöhe fehlt" });

        const env = makeEnvelopeElementsForRoom(r);
        if (env.length === 0)
          issues.push({
            floor: fname,
            room: rname,
            problem: "keine Bauteile mit U-Wert/Fläche erfasst",
          });
      })
    );
    return issues;
  };

  const handleFinish = useCallback(async () => {
    setSaveError(null);
    setFirstIssue(null);
    setSaving(true);
    try {
      const issues = findIncompleteRooms(floors);
      if (issues.length) {
        const first = issues[0];
        setFirstIssue({ floor: first.floor, room: first.room });
        throw new Error(
          `Unvollständige Eingaben: Raum „${first.room}“ in „${first.floor}“ – ${first.problem}. ` +
            (issues.length > 1 ? `(${issues.length} Probleme gefunden) ` : "") +
            `Bitte fehlende Daten ergänzen und anschließend neu berechnen.`
        );
      }

      if (!calcResults) {
        throw new Error("Keine Ergebnisse vorhanden. Bitte zur Seite „Ergebnisse“ wechseln und neu berechnen.");
      }

      const buildingEN = {
        ...building,
        address: firstAddressLine((building as any)?.address),
        domesticHotWater: mapVal(building.domesticHotWater, D2E.domesticHotWater),
        shielding: mapVal(building.shielding, D2E.shielding),
      };

      const envelopeElements: ApiEnvelopeElement[] = floors.flatMap((floor) =>
        floor.rooms.flatMap((room) => makeEnvelopeElementsForRoom(room))
      );

      const apiFloors: ApiFloor[] = floors.map((floor) => ({
        id: floor.id,
        name: floor.name,
        rooms: floor.rooms.map((room) => ({
          id: room.id,
          name: room.name?.trim() ?? "",
          area: room.area,
          height: room.height,
          targetTemperature: room.targetTemperature,

          walls: room.walls.map<WallDetail>((w) => ({
            id: w.id,
            name: (w.name ?? "").trim(),
            type: w.type,
            material: w.material,
            customMaterial: w.customMaterial,
            isExterior: w.isExterior,
            rValue: rFromU(w.uValue) ?? (w as any).rValue ?? 0,
            area: w.area,
            length: w.length,
          })),

          windows: room.windows.map<WindowDetail>((win) => ({
            id: win.id,
            type: win.type,
            area: win.area ?? 0,
            uValue: win.uValue ?? 0,
            orientation: win.orientation,
          })),

          doors: room.doors.map<DoorDetail>((door) => ({
            id: door.id,
            area: door.area ?? 0,
            toUnheated: door.toUnheated,
            uValue: door.uValue ?? 0,
          })),

          ceilingConfig: {
            ...(room.ceilingConfig ?? { area: 0 }),
            area: room.ceilingConfig?.area ?? 0,
            uValue: room.ceilingConfig?.uValue ?? 0,
            roofType: room.ceilingConfig?.roofType
              ? D2E.roofType[room.ceilingConfig.roofType] ?? room.ceilingConfig.roofType
              : undefined,
            insulationStandard: room.ceilingConfig?.insulationStandard,
            kniestockHeight: room.ceilingConfig?.kniestockHeight,
            dachfenster: room.ceilingConfig?.dachfenster,
            gauben: room.ceilingConfig?.gauben,
          } as any,

          floorConfig: {
            ...(room.floorConfig ?? { area: 0 }),
            area: room.floorConfig?.area ?? 0,
            uValue: room.floorConfig?.uValue ?? 0,
            floorType: mapVal(room.floorConfig?.floorType, D2E.floorType),
            material: room.floorConfig?.material,
            insulated: room.floorConfig?.insulated,
          } as any,

          ventilation: room.ventilation,

          heaters: (room.heaters || []).map((h) => ({
            ...h,
            subType: mapVal(h.subType, D2E.heaterSubType),
          })) as any,

          thermalBridges: (room.thermalBridges || []).map((tb) => ({
            id: tb.id,
            name: tb.name,
            psiValue: tb.psiValue,
            length: tb.length,
          })),
        })),
      }));

      const payload: HeatLoadPayload = {
        quoteId: initialQuoteId,
        location: buildingEN.location,
        building: buildingEN as any,
        pvHeatPump: building.pvHeatPump as PVHeatPumpSettings,
        envelopeElements,
        floors: apiFloors,
        results: calcResults,
      };

      await httpClient.post("/heat-load", payload, makeAuthConfig());

      if (!mountedRef.current) return;
      setSaving(false);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setSaveError(err?.response?.data?.message || err?.message || "Unbekannter Fehler");
      setSaving(false);
    }
  }, [initialQuoteId, building, floors, calcResults]);

  const handleFormSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault();
      handleFinish();
    },
    [handleFinish]
  );

  const jumpToFirstIssue = useCallback(() => {
    if (!firstIssue) return;
    goToStep(1);
    const floor = floors.find((f) => f.name === firstIssue.floor);
    const room = floor?.rooms.find((r) => r.name === firstIssue.room);
    if (room) selectRoom(room.id);
  }, [firstIssue, floors, goToStep, selectRoom]);

  const getAlertContainerSx = (step: number, isError: boolean) => {
    const topPlacement =
      step <= 1
        ? {
            top: `calc(16px + env(safe-area-inset-top))`,
            left: isMdUp ? SIDEBAR_W + GUTTER : 16,
            right: GUTTER,
          }
        : null;

    const bottomPlacement = {
      bottom: `calc(${isError ? 80 : 120}px + env(safe-area-inset-bottom))`,
      left: isMdUp ? SIDEBAR_W + GUTTER : 16,
      right: GUTTER,
    };

    return topPlacement ?? bottomPlacement;
  };

  const reapplyPresetsToAllRooms = useCallback(() => {
    const era = (building as any)?.buildingEra;
    const ins = (building as any)?.insulationLevel;

    floors.forEach((fl) =>
      (fl.rooms || []).forEach((r) => {
        const updated =
          (applyPresetUValues as any)(r, { buildingEra: era, insulationLevel: ins }) ??
          (applyPresetUValues as any)(r, building);
        if (updated) replaceRoom(updated);
      })
    );
  }, [floors, building, replaceRoom]);

  return (
    <Box display="flex" width="100%" minHeight="100vh" sx={{ bgcolor: theme.palette.background.default }}>
      {isMdUp && (
        <Box
          width={SIDEBAR_W}
          sx={{
            bgcolor: theme.palette.background.paper,
            p: 2,
            boxShadow: `inset -1px 0 0 ${theme.palette.divider}`,
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: 0,
            height: "100vh",
            gap: 16,
          }}
        >
          <ChecklistSidebar step={activeStep} onStepSelect={goToStep} />
          {/* Sidebar "Zurück" removed to avoid duplicates; a floating button is rendered below */}
        </Box>
      )}

      {activeStep === 0 && (
        <Box flex={1} p={3} overflow="auto">
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <FullDemoFillButtons
              mode="setters"
              setters={{
                setBuilding: setBuildingInfoSanitized,
                setFloors: reorderFloors,
                setSelectedRoomId: selectRoom,
                setActiveStep: goToStep,
              }}
            />
          </Box>

          <BuildingInformationCard metadata={building} setMetadata={setBuildingInfoSanitized} />
        </Box>
      )}

      {activeStep === 1 && (
        <Box display="flex" width="100%" height="100%">
          <Box width={isMdUp ? 400 : "100%"} sx={{ bgcolor: theme.palette.background.paper, p: 2, overflow: "auto" }}>
            <FloorRoomTree
              floors={floors}
              selectedRoomId={selectedRoomId}
              onAddFloor={addFloor}
              onAddRoom={addRoom}
              onDeleteFloor={removeFloor}
              onDeleteRoom={removeRoom}
              onRenameFloor={renameFloor}
              onRenameRoom={renameRoom}
              onRoomSelect={selectRoom}
              onReorderFloors={reorderFloors}
              onReorderRooms={reorderRooms}
            />
          </Box>

          <Box flex={1} p={3} overflow="auto" sx={{ bgcolor: theme.palette.background.paper }}>
            {selectedRoom ? (
              <RoomPanel room={selectedRoom} updateRoom={replaceRoom} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Bitte wählen Sie einen Raum aus.
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {activeStep === 2 && (
        <Box id="heatload-finish-form" component="form" onSubmit={handleFormSubmit} flex={1} p={3} overflow="auto">
          {summaryResults ? (
            <ResultPanel results={summaryResults} metadata={building} floors={floors} />
          ) : (
            <Typography>Keine Ergebnisse verfügbar.</Typography>
          )}
        </Box>
      )}

      {activeStep === 3 && (
        <Box flex={1} p={3} overflow="auto" sx={{ bgcolor: theme.palette.background.paper }}>
          <GrundmaterialienPanel
            metadata={building}
            floors={floors}
            onApplyBuildingPresets={reapplyPresetsToAllRooms}
          />
        </Box>
      )}

      {/* Floating "Zurück" — visible on steps > 0, fixed bottom-left */}
      {activeStep > 0 && (
        <Box
          position="fixed"
          sx={{
            bottom: `calc(20px + env(safe-area-inset-bottom))`,
            left: isMdUp ? SIDEBAR_W + GUTTER : 20,
            zIndex: (t) => t.zIndex.appBar + 1,
          }}
        >
          <PillButton onClick={prevStep} size="small">Zurück</PillButton>
        </Box>
      )}

      {/* Bottom action (Weiter/Fertig) — unchanged, fixed bottom-right */}
      <Box
        position="fixed"
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        sx={{
          bottom: `calc(20px + env(safe-area-inset-bottom))`,
          right: { xs: 20 + CHAT_BUBBLE_OFFSET, sm: 24 + CHAT_BUBBLE_OFFSET, md: GUTTER + CHAT_BUBBLE_OFFSET },
          zIndex: (t) => t.zIndex.appBar + 1,
        }}
      >
        {activeStep < steps.length - 1 && activeStep !== 2 && (
          <PrimaryButton disableRipple onClick={nextStep} disabled={saving}>
            Weiter
          </PrimaryButton>
        )}
        {activeStep === 2 && (
          <PrimaryButton disableRipple type="submit" form="heatload-finish-form" disabled={saving}>
            {saving ? <Spin size="small" /> : "Fertig"}
          </PrimaryButton>
        )}
        {activeStep === 3 && (
          <PrimaryButton disableRipple onClick={handleFinish} disabled={saving}>
            {saving ? <Spin size="small" /> : "Fertig"}
          </PrimaryButton>
        )}
      </Box>

      {saveOk && (
        <Box
          position="fixed"
          sx={{
            zIndex: (t) => t.zIndex.modal + 1,
            ...getAlertContainerSx(activeStep, /* isError */ false),
          }}
        >
          <Alert
            type="success"
            message="Gespeichert"
            description="Die Heizlast wurde erfolgreich gespeichert."
            showIcon
            style={{ borderRadius: 9999 }}
          />
        </Box>
      )}

      {saveError && (
        <Box
          position="fixed"
          sx={{
            zIndex: (t) => t.zIndex.modal + 1,
            ...getAlertContainerSx(activeStep, /* isError */ true),
          }}
        >
          <Alert
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            message="Fehler beim Speichern"
            description={saveError}
            action={
              firstIssue ? (
                <PillButton size="small" onClick={jumpToFirstIssue}>
                  Zum Fehler springen
                </PillButton>
              ) : null
            }
            closable
            closeIcon={<CloseOutlined style={{ fontSize: 12, lineHeight: 1 }} />}
            onClose={() => setSaveError(null)}
            style={{
              borderRadius: 9999,
              overflow: "hidden",
              border: "1px solid #fecaca",
              background: "#fff7f7",
            }}
          />
        </Box>
      )}
    </Box>
  );
}
