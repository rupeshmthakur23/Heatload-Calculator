// src/pages/projectView/components/HeatLoadCalculator/utils/materials.ts
import type {
  BuildingMetadata,
  Floor,
  Room,
  Wall,
  Window,
  Door,
  Heater,
} from "../types";

/** A generic BOM/material/spec line */
export interface MaterialLine {
  category:
    | "Wall"
    | "Window"
    | "Door"
    | "Ceiling"
    | "Floor"
    | "Radiator"
    | "Ventilation";
  name: string;        // human-readable line item (or SKU/series+size for radiators)
  unit: "m²" | "pcs" | "m" | "W" | "L/h";
  qty: number;         // summed quantity in unit above
  roomId?: string;
  roomName?: string;
  notes?: string;      // optional (U-value, kv preset, etc.)
  sku?: string;        // optional SKU if you later map types → SKUs
}

/** Collect per-room material/spec lines (no grouping yet) */
export function collectMaterials(
  floors: Floor[],
  meta?: BuildingMetadata
): MaterialLine[] {
  const lines: MaterialLine[] = [];

  const push = (line: MaterialLine) => {
    // skip zero/NaN
    if (!Number.isFinite(line.qty) || line.qty <= 0) return;
    lines.push(line);
  };

  const addWalls = (room: Room) => {
    (room.walls ?? []).forEach((w: Wall) => {
      push({
        category: "Wall",
        name: `${w.name}${w.material ? ` (${w.material})` : ""}`,
        unit: "m²",
        qty: w.area ?? 0,
        roomId: room.id,
        roomName: room.name,
        notes: w.uValue ? `U=${w.uValue.toFixed(2)} W/m²K` : undefined,
      });
    });
  };

  const addWindows = (room: Room) => {
    (room.windows ?? []).forEach((win: Window, i) => {
      const name = `Fenster #${i + 1}${win.type ? ` (${win.type})` : ""}`;
      push({
        category: "Window",
        name,
        unit: "m²",
        qty: win.area ?? 0,
        roomId: room.id,
        roomName: room.name,
        notes: [
          win.orientation ? `Orientierung ${win.orientation}` : null,
          Number.isFinite(win.uValue) ? `U=${(win.uValue as number).toFixed(2)} W/m²K` : null,
        ]
          .filter(Boolean)
          .join(" • ") || undefined,
      });
    });
  };

  const addDoors = (room: Room) => {
    (room.doors ?? []).forEach((d: Door, i) => {
      push({
        category: "Door",
        name: `Tür #${i + 1}`,
        unit: "m²",
        qty: d.area ?? 0,
        roomId: room.id,
        roomName: room.name,
        notes: Number.isFinite(d.uValue)
          ? `U=${(d.uValue as number).toFixed(2)} W/m²K`
          : undefined,
      });
    });
  };

  const addCeilingFloor = (room: Room) => {
    if (room.ceilingConfig?.area) {
      push({
        category: "Ceiling",
        name: "Decke",
        unit: "m²",
        qty: room.ceilingConfig.area,
        roomId: room.id,
        roomName: room.name,
        notes:
          Number.isFinite(room.ceilingConfig.uValue) ?
            `U=${(room.ceilingConfig.uValue as number).toFixed(2)} W/m²K` :
            undefined,
      });
    }
    if (room.floorConfig?.area) {
      push({
        category: "Floor",
        name: "Boden",
        unit: "m²",
        qty: room.floorConfig.area,
        roomId: room.id,
        roomName: room.name,
        notes:
          Number.isFinite(room.floorConfig.uValue) ?
            `U=${(room.floorConfig.uValue as number).toFixed(2)} W/m²K` :
            undefined,
      });
    }
  };

  const addHeaters = (room: Room) => {
    (room.heaters ?? []).forEach((h: Heater, i) => {
      const isRad = h.type === "radiator";
      const title = isRad
        ? `${h.brand ?? "Heizkörper"} ${h.series ?? ""} ${h.height ?? "?"}x${h.width ?? "?"}`
        : "Fußbodenheizung-Kreis";

      // the radiator piece itself
      push({
        category: "Radiator",
        name: title.trim().replace(/\s+/g, " "),
        unit: "pcs",
        qty: 1,
        roomId: room.id,
        roomName: room.name,
        notes: [
          Number.isFinite(h.output) ? `${h.output} W` : null,
          h.standardRegime ? `Regime ${h.standardRegime}` : null,
          h.kvPresetLabel ? `kv ${h.kvPresetLabel}${h.kvValue != null ? ` (${h.kvValue})` : ""}` : null,
        ]
          .filter(Boolean)
          .join(" • ") || undefined,
      });

      // flow as a separate spec line (helps installers)
      if (Number.isFinite(h.flowLps) && (h.flowLps as number) > 0) {
        const lph = Math.round((h.flowLps as number) * 3600);
        push({
          category: "Radiator",
          name: `${title.trim().replace(/\s+/g, " ")} – Volumenstrom`,
          unit: "L/h",
          qty: lph,
          roomId: room.id,
          roomName: room.name,
        });
      }
    });
  };

  floors.forEach((fl) => {
    fl.rooms.forEach((room) => {
      addWalls(room);
      addWindows(room);
      addDoors(room);
      addCeilingFloor(room);
      addHeaters(room);
    });
  });

  return lines;
}

/** Simple grouping: sum by (category + name + unit). */
export function groupMaterials(lines: MaterialLine[]): MaterialLine[] {
  const map = new Map<string, MaterialLine>();
  for (const line of lines) {
    const key = `${line.category}|${line.name}|${line.unit}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...line });
    } else {
      map.set(key, { ...prev, qty: prev.qty + line.qty });
    }
  }
  return Array.from(map.values());
}

/** CSV export for BOM/spec */
export function exportMaterialsCSV(lines: MaterialLine[], filename = "materialliste.csv") {
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;

  const header = ["Kategorie", "Bezeichnung", "Menge", "Einheit", "Notizen"];
  const body = lines.map((l) => [
    l.category,
    l.name,
    Number.isFinite(l.qty) ? (l.qty as number).toLocaleString("de-DE", { maximumFractionDigits: 2 }) : "0",
    l.unit,
    l.notes ?? "",
  ]);

  const csv = ["\uFEFF" + header.map(esc).join(";")]
    .concat(body.map((row) => row.map(esc).join(";")))
    .join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** JSON export (for apps/ERP imports) */
export function exportMaterialsJSON(
  lines: MaterialLine[],
  meta?: BuildingMetadata,
  filename = "materialliste.json"
) {
  const payload = {
    project: {
      address: meta?.address,
      constructionYear: meta?.constructionYear,
      buildingType: meta?.buildingType,
      postalCode: meta?.postalCode,
    },
    items: lines,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
