// src/pages/projectView/components/HeatLoadCalculator/utils/exportGeometry.ts
// Minimal geometry exporter (rooms + envelope elements) for downstream apps.

import { BuildingMetadata, Floor } from "../types";

function downloadText(filename: string, text: string, mime = "application/json;charset=utf-8;") {
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

/** Build and download a compact geometry JSON payload. */
export function exportGeometryJSON(metadata: BuildingMetadata, floors: Floor[], filename = "heizlast-geometry.json") {
  const payload = {
    building: {
      address: metadata.address,
      postalCode: metadata.postalCode,
      location: metadata.location,
      buildingType: metadata.buildingType,
      era: metadata.buildingEra ?? null,
      insulationLevel: metadata.insulationLevel ?? null,
      floors: metadata.floors,
      residents: metadata.residents,
    },
    floors: floors.map((fl) => ({
      id: fl.id,
      name: fl.name,
      rooms: fl.rooms.map((r) => ({
        id: r.id,
        name: r.name,
        area_m2: r.area,
        height_m: r.height,
        targetTemp_C: r.targetTemperature,
        walls: (r.walls || []).map((w) => ({
          id: w.id,
          name: w.name,
          type: w.type,
          isExterior: w.isExterior,
          area_m2: w.area,
          u_W_m2K: w.uValue ?? null,
          length_m: w.length,
          material: w.material ?? null,
        })),
        windows: (r.windows || []).map((w) => ({
          id: w.id,
          type: w.type,
          area_m2: w.area,
          u_W_m2K: w.uValue ?? null,
          orientation: w.orientation ?? null,
        })),
        doors: (r.doors || []).map((d) => ({
          id: d.id,
          area_m2: d.area,
          toUnheated: d.toUnheated,
          u_W_m2K: d.uValue ?? null,
        })),
        ceiling: r.ceilingConfig
          ? {
              area_m2: r.ceilingConfig.area,
              u_W_m2K: r.ceilingConfig.uValue ?? null,
              roofType: r.ceilingConfig.roofType,
              insulationStandard: r.ceilingConfig.insulationStandard,
            }
          : null,
        floor: r.floorConfig
          ? {
              area_m2: r.floorConfig.area,
              u_W_m2K: r.floorConfig.uValue ?? null,
              floorType: r.floorConfig.floorType,
              insulated: r.floorConfig.insulated,
            }
          : null,
      })),
    })),
  };

  downloadText(filename, JSON.stringify(payload, null, 2));
}
