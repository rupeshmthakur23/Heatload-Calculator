// src/pages/projectView/components/HeatLoadCalculator/useCalculationResults.ts

import { useCallback } from "react";
import { useAppState, useAppActions } from "./useAppState";
import { calculateDinSections } from "./utils/calculateRoomBreakdown";
import type { CalculationResults, DinSections } from "./types";
import {
  DESIGN_OUTDOOR_TEMP_C,
  THERMAL_BRIDGE_DEFAULT_FACTOR,
} from "./defaults/defaults";

/** Local lightweight helper that matches what this hook expects */
function calcRoomBreakdownInline(
  elements: Array<{ name: string; area: number; uValue: number }>,
  ach: number,
  roomArea: number,
  height: number,
  indoorTemp: number,
  outdoorTemp: number
): {
  perElement: Array<{ name: string; area: number; uValue: number; QT: number }>;
  ventilation: { QV: number };
} {
  const dT = Math.max(0, (indoorTemp ?? 20) - (outdoorTemp ?? 0));
  const perElement = elements.map((el) => {
    const A = Number.isFinite(el.area) ? el.area : 0;
    const U = Number.isFinite(el.uValue) ? el.uValue : 0;
    return { ...el, QT: A * U * dT };
  });

  const volume =
    (Number.isFinite(roomArea) ? roomArea : 0) *
    (Number.isFinite(height) ? height : 0); // m³
  const vdot_m3_s = ach > 0 && volume > 0 ? (volume * ach) / 3600 : 0; // m³/s
  // Air properties (same as defaults.ts)
  const rho = 1.204; // kg/m³
  const cp = 1005; // J/(kg·K)
  const QV = vdot_m3_s * rho * cp * dT; // W

  return { perElement, ventilation: { QV } };
}

const FALLBACKS = {
  wallU: 1.1,
  winU: 0.95,
  doorU: 1.5,
  roofU: 0.18,
  floorU: {
    beheizt: 0.2,
    unbeheizt: 0.3,
    erdreich: 0.35,
    aussenluft: 0.25,
    heated: 0.2,
    unheated: 0.3,
    ground: 0.35,
    outside_air: 0.25,
    default: 0.3,
  } as Record<string, number>,
  ach: 0.5,
  hrv: 0.8,
};

const toNum = (v: unknown) =>
  typeof v === "number" && isFinite(v) ? (v as number) : undefined;
const W_TO_KW = (w: number) => w / 1000;

const getU = (uValue?: number, rValue?: number, fallback?: number) => {
  const u = toNum(uValue);
  if (u && u > 0) return u;
  const r = toNum(rValue);
  if (r && r > 0) return 1 / r;
  return fallback ?? 1.0;
};

const normalizeHRV = (raw: unknown) => {
  const n = toNum(raw);
  if (n === undefined) return 0;
  const frac = n <= 1 ? n : n / 100;
  return Math.max(0, Math.min(frac, 0.95));
};

/**
 * Convert DHW need (L/person/day) into a continuous kW allowance.
 * Assumptions:
 *  - Specific energy ≈ 0.046 kWh per liter for ~40–45 K temperature rise
 *  - Spread over 24h for equipment-sizing conservatism unless you decide to use a peak factor
 */
function computeDHWAllowanceKW(
  residents?: number,
  dhwLitersPerPersonPerDay?: number
): number {
  const n = toNum(residents) ?? 0;
  const L = toNum(dhwLitersPerPersonPerDay) ?? 0;
  if (n <= 0 || L <= 0) return 0;

  const kWhPerDay = n * L * 0.046; // energy per day
  const kW_continuous = kWhPerDay / 24; // average continuous
  return Math.max(0, kW_continuous);
}

export function useCalculationResults() {
  const { building, floors, calculationResults, projectMeta } = useAppState();
  const { setCalculationResults } = useAppActions();

  const runCalculation = useCallback(
    (outdoorTempInput: number) => {
      // Pull project-level meta (bivalence, DHW, etc.)
      const dim = projectMeta?.dimensioning;
      const bivalenceC = toNum(dim?.bivalenceTemperatureC);

      // For sizing the heat pump, clamp to bivalence temperature
      // i.e., we calculate the load the HP must cover down to the bivalence point.
      const outdoorTemp =
        bivalenceC !== undefined
          ? Math.max(outdoorTempInput, bivalenceC)
          : outdoorTempInput;

      const projectCalcMeta = {
        designOutdoorTemp:
          building?.designOutdoorTempC ?? DESIGN_OUTDOOR_TEMP_C,
        thermalBridgeFactor: THERMAL_BRIDGE_DEFAULT_FACTOR,
        bivalenceAppliedC: bivalenceC,
        effectiveOutdoorTempC: outdoorTemp,
      };

      const perRoomLoads = floors.flatMap((floor) =>
        floor.rooms.map((room) => {
          const indoorTemp =
            toNum(room.targetTemperature) ??
            toNum(building?.temperaturePreference) ??
            20;

          const roomArea = toNum(room.area) ?? 0;
          const height = toNum(room.height) ?? 2.5;

          const wallElements = (room.walls ?? []).map((w) => {
            const U = getU((w as any).uValue, (w as any).rValue, FALLBACKS.wallU);
            return {
              name: w.name ?? "Wand",
              area: toNum(w.area) ?? 0,
              uValue: U,
            };
          });

          const windowElements = (room.windows ?? []).map((win) => {
            const U = getU(win.uValue, undefined, FALLBACKS.winU);
            return {
              name: String(win.type ?? "Fenster"),
              area: toNum(win.area) ?? 0,
              uValue: U,
            };
          });

          const doorElements = (room.doors ?? []).map((door) => {
            const U = getU(door.uValue, undefined, FALLBACKS.doorU);
            return { name: "Tür", area: toNum(door.area) ?? 0, uValue: U };
          });

          const ceilArea = toNum(room?.ceilingConfig?.area) ?? roomArea;
          const ceilU = getU(
            room?.ceilingConfig?.uValue,
            undefined,
            FALLBACKS.roofU
          );
          const ceilingElement =
            ceilArea > 0
              ? { name: "Decke", area: ceilArea, uValue: ceilU }
              : null;

          const floorArea = toNum(room?.floorConfig?.area) ?? roomArea;
          const ft = (room?.floorConfig as any)?.floorType as
            | string
            | undefined;
          const floorFallbackU =
            FALLBACKS.floorU[ft || ""] ?? FALLBACKS.floorU.default;
          const floorU = getU(
            room?.floorConfig?.uValue,
            undefined,
            floorFallbackU
          );
          const floorElement =
            floorArea > 0
              ? { name: "Boden", area: floorArea, uValue: floorU }
              : null;

          const elements = [
            ...wallElements,
            ...(ceilingElement ? [ceilingElement] : []),
            ...(floorElement ? [floorElement] : []),
            ...windowElements,
            ...doorElements,
          ];

          const v = room.ventilation ?? ({} as any);
          const ach = toNum(v.airExchangeRate) ?? FALLBACKS.ach;
          const mvhr = !!v.ventilationSystem;
          const eff = mvhr
            ? normalizeHRV(v.heatRecoveryEfficiency ?? FALLBACKS.hrv)
            : 0;

          // Transmission & Ventilation for this room at effective outdoor temp
          const { perElement, ventilation } = calcRoomBreakdownInline(
            elements,
            ach,
            roomArea,
            height,
            indoorTemp,
            outdoorTemp
          );

          const transmissionLossW = perElement.reduce(
            (sum: number, e) =>
              sum +
              (typeof e.QT === "number" && isFinite(e.QT)
                ? (e.QT as number)
                : 0),
            0
          );

          const ventilationLossW_raw =
            typeof ventilation?.QV === "number" && isFinite(ventilation.QV)
              ? ventilation.QV
              : 0;
          const ventilationLossW = ventilationLossW_raw * (1 - eff);

          const dT = Math.max(0, (indoorTemp ?? 20) - (outdoorTemp ?? 0));
          const thermalBridgeLossW =
            (room.thermalBridges ?? []).reduce((sum: number, tb) => {
              const psi = toNum(tb.psiValue) ?? 0;
              const L = toNum(tb.length) ?? 0;
              return sum + psi * L * dT;
            }, 0) || 0;

          const totalW =
            transmissionLossW + ventilationLossW + thermalBridgeLossW;
          const safetyW = totalW * 0.1;
          const roomHeatLoadW = totalW + safetyW;

          // DIN sections use original utilities but we pass design meta
          const din: DinSections = calculateDinSections(room, {
            designOutdoorTemp: projectCalcMeta.designOutdoorTemp,
            thermalBridgeFactor: projectCalcMeta.thermalBridgeFactor,
          });

          return {
            roomId: room.id,
            roomName: room.name ?? "Raum",
            transmissionLoss: W_TO_KW(transmissionLossW),
            ventilationLoss: W_TO_KW(ventilationLossW),
            thermalBridgeLoss: W_TO_KW(thermalBridgeLossW),
            safetyMargin: W_TO_KW(safetyW),
            roomHeatLoad: W_TO_KW(roomHeatLoadW),
            area: roomArea,
            din,
          };
        })
      );

      // Space heating total (kW)
      const totalSpaceKW = perRoomLoads.reduce(
        (s: number, r) => s + (r.roomHeatLoad || 0),
        0
      );

      // DHW continuous allowance (kW) from project meta
      const dhwAllowanceKW = computeDHWAllowanceKW(
        toNum(dim?.residents),
        toNum(dim?.dhwPerResidentLPerDay)
      );

      // Final total (kW) = Space + DHW allowance
      const totalHeatLoadKW = totalSpaceKW + dhwAllowanceKW;

      const dinTotals = perRoomLoads.reduce(
        (
          acc: {
            transmissionW: number;
            thermalBridgeW: number;
            ventilationW: number;
            totalW: number;
          },
          r
        ) => {
          acc.transmissionW += r.din?.transmission.sumW ?? 0;
          acc.thermalBridgeW += r.din?.thermalBridge.sumW ?? 0;
          acc.ventilationW += r.din?.ventilation.qW ?? 0;
          acc.totalW += r.din?.totalW ?? 0;
          return acc;
        },
        { transmissionW: 0, thermalBridgeW: 0, ventilationW: 0, totalW: 0 }
      );

      setCalculationResults({
        perRoomLoads,
        totalHeatLoadKW,
        dinTotals,
        // extras (optional, for UI/reporting)
        meta: {
          effectiveOutdoorTempC: projectCalcMeta.effectiveOutdoorTempC,
          bivalenceAppliedC: projectCalcMeta.bivalenceAppliedC,
          dhwAllowanceKW,
          totalSpaceKW,
        },
      } as CalculationResults & {
        dinTotals: {
          transmissionW: number;
          thermalBridgeW: number;
          ventilationW: number;
          totalW: number;
        };
        meta?: {
          effectiveOutdoorTempC?: number;
          bivalenceAppliedC?: number;
          dhwAllowanceKW?: number;
          totalSpaceKW?: number;
        };
      });
    },
    [floors, building, projectMeta, setCalculationResults]
  );

  return {
    results: calculationResults,
    runCalculation,
  };
}
