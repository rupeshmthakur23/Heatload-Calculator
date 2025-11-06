// src/pages/projectView/components/HeatLoadCalculator/utils/exportToCSV.ts

import { BuildingMetadata, Floor, Heater, ExportOptions, SummaryRow } from "../types";
import { computeFlowLpsFromHeater, kvPresetFor } from "./kvRecommendation";

/* ─────────────────────────── Helpers ─────────────────────────── */

/** Parse locale-ish inputs like "1,5" → 1.5. Returns undefined if not finite. */
const parseNum = (v: any): number | undefined => {
  if (v === null || v === undefined) return undefined;
  const s = typeof v === "string" ? v.replace(",", ".").replace(/\s+/g, "").trim() : v;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

/** Coerce to non-negative number; fallback 0. */
const toNum = (v: any): number => {
  const n = parseNum(v);
  return n !== undefined ? Math.max(0, n) : 0;
};

/** Excel-proof download: UTF-16LE + BOM, tab-separated (works with umlauts/m²). */
function downloadExcelFriendly(filename: string, lines: string[][], sep: string = "\t") {
  // Optional "sep=" header helps Excel detect the separator reliably
  const sepHint = `sep=${sep === "\t" ? "\\t" : sep}\r\n`;

  const body = lines.map(row => row.join(sep)).join("\r\n");
  const content = "\uFEFF" + sepHint + body; // BOM + content

  // Encode to UTF-16LE for maximum Excel compatibility on Windows
  const buf = new Uint16Array(content.length);
  for (let i = 0; i < content.length; i++) buf[i] = content.charCodeAt(i);

  const blob = new Blob([buf], { type: "text/csv;charset=utf-16le;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Plain text/JSON download (UTF-8 is fine here). */
function downloadText(filename: string, text: string, mime = "text/plain;charset=utf-8;") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** ΔT_w = T_flow – T_return extracted from regime like "75/65/20". */
function deltaTWater(regime?: string): number {
  const r = (regime ?? "75/65/20").split("/");
  const tFlow = toNum(r[0] ?? 75);
  const tReturn = toNum(r[1] ?? 65);
  const dt = (tFlow || 75) - (tReturn || 65);
  return dt > 0 ? dt : 10;
}

/** Detect valve brand from the free-text valveType field (very rough). */
function detectValveBrand(valveType?: string): "Heimeier" | "Oventrop" | "Danfoss" {
  const vt = (valveType ?? "").toLowerCase();
  if (vt.includes("oventrop")) return "Oventrop";
  if (vt.includes("danfoss")) return "Danfoss";
  return "Heimeier";
}

/* ─────────────────────────── CSV #1 (existing summary) ───────────────────────────
   Now emitted as UTF-16LE + tab-separated for Excel. Umlauts/superscripts render correctly.
------------------------------------------------------------------ */
export function exportToCSV(options: Partial<ExportOptions>) {
  const totalLoadKW = toNum(options.totalLoad); // kW
  const totalArea = toNum(options.totalArea);   // m²
  const wattsPerSqm =
    options.wattsPerSqm !== undefined
      ? toNum(options.wattsPerSqm)
      : totalArea > 0
      ? (totalLoadKW * 1000) / totalArea
      : 0;

  const energyClass = options.energyClass ?? "–";
  const recommendation = options.recommendation ?? "–";
  const roomBreakdown = (options.roomBreakdown as SummaryRow[]) ?? [];

  const num = (n?: number) =>
    Number.isFinite(n as number)
      ? (n as number).toLocaleString("de-DE", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : "0,0";

  const lines: string[][] = [];

  // Meta block (two columns)
  lines.push(["Gesamtlast (kW)", num(totalLoadKW)]);
  lines.push(["Gesamtfläche (m²)", num(totalArea)]);
  lines.push(["Heizlast pro m² (W/m²)", num(wattsPerSqm)]);
  lines.push(["Energieklasse", energyClass]);
  lines.push(["Empfehlung", recommendation]);
  lines.push([]); // blank line

  // Header
  lines.push([
    "Stockwerk/Raum",
    "Transmissionsverluste (kW)",
    "Lüftungsverluste (kW)",
    "Wärmebrücken (kW)",
    "Sicherheitszuschlag (kW)",
    "Heizlast inkl. Zuschlag (kW)",
    "Fläche (m²)",
    "Basislast ohne Zuschlag (kW)",
  ]);

  // Rows
  roomBreakdown.forEach((r) => {
    const trans = toNum(r.transmissionLoss);
    const vent = toNum(r.ventilationLoss);
    const tb = toNum((r as any).thermalBridgeLoss);
    const safety = toNum(r.safetyMargin);
    const base = toNum(r.totalLoss) || trans + vent + tb;
    const final = r.roomHeatLoad != null ? toNum(r.roomHeatLoad) : base + safety;

    lines.push([
      `${r.floor ?? ""} – ${r.room ?? ""}`,
      num(trans),
      num(vent),
      num(tb),
      num(safety),
      num(final),
      num(toNum(r.area)),
      num(base),
    ]);
  });

  // Save (UTF-16LE + BOM + tab-separated)
  downloadExcelFriendly("heizlast-bericht.csv", lines, "\t");
}

/* ─────────────────────────── CSV #2 (hydraulic balancing) ───────────────────────────
   Floor, Room, Radiator, Target_W, DeltaT_water_K, Flow_L_h, Suggested_Preset
   (ASCII headers; no umlauts — UTF-8 CSV is fine here.)
------------------------------------------------------------------ */
export function exportHydraulicCSV(
  metadata: BuildingMetadata,
  floors: Floor[],
  filename = "hydraulischer-abgleich.csv"
) {
  // Use semicolon for German Excel; machine-friendly dot-decimals as requested.
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  const rows: string[] = [];
  rows.push(
    ["Floor", "Room", "Radiator", "Target_W", "DeltaT_water_K", "Flow_L_h", "Suggested_Preset"]
      .map(esc)
      .join(";")
  );

  floors.forEach((fl) => {
    fl.rooms.forEach((room) => {
      const rads = (room.heaters || []).filter((h) => h.type === "radiator") as Heater[];
      rads.forEach((h) => {
        const regime = h.standardRegime ?? "75/65/20";
        const dtK = deltaTWater(regime);
        const flowLps = computeFlowLpsFromHeater(h); // hardened already
        const flowLh = flowLps * 3600;
        const brand = detectValveBrand(h.valveType);
        const preset = flowLps > 0 ? kvPresetFor(flowLps, brand) : "—";

        const label = `${h.brand ?? "?"} ${h.series ?? ""} ${h.height ?? "?"}x${h.width ?? "?"}`.trim();
        rows.push(
          [
            fl.name,
            room.name,
            label,
            toNum(h.output).toFixed(0), // Target_W
            dtK.toFixed(1),
            flowLh.toFixed(0),
            preset,
          ].map(esc).join(";")
        );
      });
    });
  });

  const csv = "\uFEFF" + rows.join("\r\n");
  downloadText(filename, csv, "text/csv;charset=utf-8;");
}

/* ─────────────────────────── JSON (hydraulic dataset for apps) ─────────────────────────── */
export function exportHydraulicJSON(
  metadata: BuildingMetadata,
  floors: Floor[],
  filename = "hydraulischer-abgleich.json"
) {
  const payload = {
    building: {
      address: metadata.address,
      postalCode: metadata.postalCode,
      location: metadata.location,
      buildingType: metadata.buildingType,
      era: metadata.buildingEra ?? null,
      insulationLevel: metadata.insulationLevel ?? null,
    },
    radiators: [] as Array<{
      floor: string;
      room: string;
      label: string;
      outputW: number;
      regime: string;
      deltaT_water_K: number;
      flow_L_s: number;
      flow_L_h: number;
      brandDetected: "Heimeier" | "Oventrop" | "Danfoss";
      suggestedPreset: string;
      existingPreset?: { label?: string; kv?: number };
      id?: string;
    }>,
  };

  floors.forEach((fl) => {
    fl.rooms.forEach((room) => {
      const rads = (room.heaters || []).filter((h) => h.type === "radiator") as Heater[];
      rads.forEach((h) => {
        const regime = h.standardRegime ?? "75/65/20";
        const dtK = deltaTWater(regime);
        const flowLps = computeFlowLpsFromHeater(h);
        const brand = detectValveBrand(h.valveType);
        const suggested = flowLps > 0 ? kvPresetFor(flowLps, brand) : "—";

        payload.radiators.push({
          floor: fl.name,
          room: room.name,
          label: `${h.brand ?? "?"} ${h.series ?? ""} ${h.height ?? "?"}x${h.width ?? "?"}`.trim(),
          outputW: toNum(h.output),
          regime,
          deltaT_water_K: dtK,
          flow_L_s: flowLps,
          flow_L_h: flowLps * 3600,
          brandDetected: brand,
          suggestedPreset: suggested,
          existingPreset:
            h.kvPresetLabel || h.kvValue != null ? { label: h.kvPresetLabel, kv: h.kvValue } : undefined,
          id: h.id,
        });
      });
    });
  });

  downloadText(filename, JSON.stringify(payload, null, 2), "application/json;charset=utf-8;");
}
