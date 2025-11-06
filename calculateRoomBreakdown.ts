// src/pages/projectView/components/HeatLoadCalculator/utils/calculateRoomBreakdown.ts

import {
  AIR_PROPERTIES,
  DEFAULT_MVHR_EFFICIENCY,
  DESIGN_OUTDOOR_TEMP_C,
  THERMAL_BRIDGE_DEFAULT_FACTOR,
  ROOM_DESIGN_TEMPS,
} from "../defaults/defaults";
import type {
  DinSections,
  DinTransmissionSurface,
  DinThermalBridgeItem,
} from "../types";

/** ───────────────────────── Helpers ───────────────────────── */

/** Parse like "1,5" → 1.5, returns undefined if not a finite number. */
const parseNum = (v: any): number | undefined => {
  if (v === null || v === undefined) return undefined;
  const s =
    typeof v === "string" ? v.replace(",", ".").replace(/\s+/g, "").trim() : v;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

/** Coerce anything to a non-negative number (locale aware); fallback 0. */
const k = (v: any): number => {
  const n = parseNum(v);
  return n !== undefined ? Math.max(0, n) : 0;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** English → German mapping for UI labels */
const KIND_LABELS: Record<string, string> = {
  wall: "Wand",
  window: "Fenster",
  door: "Tür",
  ceiling: "Decke",
  floor: "Boden",
};

/** ───────────────────────── DIN calculation (hardened + extras) ───────────────────────── */

export function calculateDinSections(room: any, projectMeta?: any): DinSections {
  // Prefer manual override, then computed, then default
  const manualDT = parseNum(projectMeta?.manualDesignOutdoorTempC);
  const autoDT = parseNum(projectMeta?.designOutdoorTempC);
  const designOutdoor = manualDT ?? autoDT ?? DESIGN_OUTDOOR_TEMP_C;

  const targetTemp =
    k(room?.targetTemperature) ||
    ROOM_DESIGN_TEMPS[
      (room?.ventilation?.roomType as keyof typeof ROOM_DESIGN_TEMPS) ??
        "custom"
    ] ||
    20;

  const dT = targetTemp - designOutdoor;

  const surfaces: DinTransmissionSurface[] = [];

  (room?.walls ?? []).forEach((w: any, idx: number) => {
    const area = k(w?.area);
    const u = k(w?.uValue ?? w?.uValueOverride);
    surfaces.push({
      kind: "wall",
      name: w?.name ?? `Wand ${idx + 1}`,
      area,
      uValue: u,
      deltaT: dT,
      qW: area * u * dT,
    });
  });

  (room?.windows ?? []).forEach((win: any, idx: number) => {
    const area = k(win?.area);
    const u = k(win?.uValue ?? win?.uValueOverride);
    surfaces.push({
      kind: "window",
      name: win?.name ?? `Fenster ${idx + 1}`,
      area,
      uValue: u,
      deltaT: dT,
      qW: area * u * dT,
    });
  });

  (room?.doors ?? []).forEach((d: any, idx: number) => {
    const area = k(d?.area);
    const u = k(d?.uValue ?? d?.uValueOverride);
    surfaces.push({
      kind: "door",
      name: d?.name ?? `Tür ${idx + 1}`,
      area,
      uValue: u,
      deltaT: dT,
      qW: area * u * dT,
    });
  });

  if (room?.ceilingConfig) {
    const c = room.ceilingConfig;
    const area = k(c?.area ?? room?.area ?? 0);
    const u = k(c?.uValue);
    surfaces.push({
      kind: "ceiling",
      name: "Decke",
      area,
      uValue: u,
      deltaT: dT,
      qW: area * u * dT,
    });
  }

  if (room?.floorConfig) {
    const f = room.floorConfig;
    const area = k(f?.area ?? room?.area ?? 0);
    const u = k(f?.uValue);
    surfaces.push({
      kind: "floor",
      name: "Boden",
      area,
      uValue: u,
      deltaT: dT,
      qW: area * u * dT,
    });
  }

  const transmissionSum = surfaces.reduce((s, x) => s + k(x.qW), 0);

  // Thermal bridges (psi list or factor)
  const tbItems: DinThermalBridgeItem[] = [];
  let tbSum = 0;
  const hasPsiList =
    Array.isArray(room?.thermalBridges) &&
    (room.thermalBridges?.length ?? 0) > 0;

  if (hasPsiList) {
    for (const tb of room.thermalBridges) {
      const psi = k(tb?.psiValue);
      const L = k(tb?.length);
      const q = psi * L * dT;
      tbItems.push({
        id: tb?.id ?? "",
        name: tb?.name ?? "Wärmebrücke",
        psiValue: psi,
        length: L,
        deltaT: dT,
        qW: q,
      });
      tbSum += q;
    }
  } else {
    // Use project factor or default (e.g., 5 %)
    const rawFactor =
      parseNum(projectMeta?.thermalBridgeFactor) ??
      THERMAL_BRIDGE_DEFAULT_FACTOR;
    const factor = Math.max(0, rawFactor); // no negatives
    tbSum = transmissionSum * factor;
  }

  // Room volume
  const volume = k(room?.area) * k(room?.height); // m³

  // Mechanical ventilation (with MVHR)
  const vConfig = room?.ventilation ?? {};
  const achMech = k(vConfig?.airExchangeRate); // 1/h
  const vdot_mech_m3_s = achMech > 0 && volume > 0 ? (volume * achMech) / 3600 : 0;

  const mvhrEnabled = !!vConfig?.ventilationSystem;
  const eta = mvhrEnabled
    ? clamp01(k(vConfig?.heatRecoveryEfficiency ?? DEFAULT_MVHR_EFFICIENCY))
    : 0;
  const effectiveDT = dT * (1 - eta);
  const qVent =
    vdot_mech_m3_s * AIR_PROPERTIES.rho * AIR_PROPERTIES.cp * effectiveDT;

  // ── NEW: Infiltration (air leakage, no heat recovery)
  const achInf =
    k(vConfig?.infiltrationACH) || k(projectMeta?.infiltrationACH); // 1/h
  const vdot_inf_m3_s = achInf > 0 && volume > 0 ? (volume * achInf) / 3600 : 0;
  const qInf = vdot_inf_m3_s * AIR_PROPERTIES.rho * AIR_PROPERTIES.cp * dT;

  // ── NEW: Optional internal gains (subtract, but never below 0)
  const internalGains = k(room?.internalGainsW);

  // Base total (W) before intermittent factor
  let totalBeforeFactor =
    transmissionSum + tbSum + qVent + qInf - internalGains;
  if (totalBeforeFactor < 0) totalBeforeFactor = 0;

  // ── NEW: Intermittent heating factor (building-level)
  const interFactor = Math.max(1, k(projectMeta?.intermittentFactor) || 1);
  const total = totalBeforeFactor * interFactor;

  return {
    transmission: { surfaces, sumW: transmissionSum },
    thermalBridge: {
      items: tbItems,
      sumW: tbSum,
      factorApplied: hasPsiList
        ? undefined
        : parseNum(projectMeta?.thermalBridgeFactor) ??
          THERMAL_BRIDGE_DEFAULT_FACTOR,
    },
    ventilation: {
      vdot_m3_s: vdot_mech_m3_s,
      effectiveDT,
      efficiency: eta,
      qW: qVent,
    },
    totalW: total,
  };
}

/** ───────────────────────── UI breakdown wrapper ───────────────────────── */

// Use German labels for the UI-facing kind
export type SurfaceKind = "Wand" | "Fenster" | "Tür" | "Decke" | "Boden";
export type SurfaceBreakdownItem = {
  /** German display label, e.g. "Wand" */
  kind: SurfaceKind;
  name: string;
  area: number;
  U: number;
  deltaT: number;
  q: number; // W
};

/**
 * Map DIN surfaces → UI-friendly breakdown format with German labels.
 */
export function calculateRoomBreakdown(
  room: any,
  projectMeta?: any
): {
  perElement: SurfaceBreakdownItem[];
  ventilation: { vdot_m3_s: number; effectiveDT: number; qW: number };
  totalW: number;
} {
  const din = calculateDinSections(room, projectMeta);
  const perElement: SurfaceBreakdownItem[] = din.transmission.surfaces.map(
    (s) => ({
      // Translate kind to German for display
      kind: (KIND_LABELS[s.kind as keyof typeof KIND_LABELS] ??
        s.kind) as SurfaceKind,
      name: s.name,
      area: k(s.area),
      U: k(s.uValue),
      deltaT: s.deltaT,
      q: k(s.qW),
    })
  );
  return {
    perElement,
    ventilation: {
      vdot_m3_s: din.ventilation.vdot_m3_s,
      effectiveDT: din.ventilation.effectiveDT,
      qW: din.ventilation.qW,
    },
    totalW: din.totalW,
  };
}
