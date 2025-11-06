import type { BuildingMetadata, Floor, Heater } from "../types";
import { computeFlowLpsFromHeater } from "./kvRecommendation";
import { kvPresetFor } from "./kvRecommendation";

function deltaTWater(regime: string | undefined): number {
  const r = regime ?? "75/65/20";
  const [ts, tr] = r.split("/").map((x) => Number(x));
  const dT = (Number.isFinite(ts) ? ts : 75) - (Number.isFinite(tr) ? tr : 65);
  return dT > 0 ? dT : 10;
}

// Try to infer brand from the free-text valve type; fall back to Heimeier.
function detectKvBrand(valveType?: string): "Heimeier" | "Oventrop" | "Danfoss" {
  const v = (valveType ?? "").toLowerCase();
  if (v.includes("oventrop")) return "Oventrop";
  if (v.includes("danfoss")) return "Danfoss";
  return "Heimeier";
}

export function exportBalancingCSV(
  metadata: BuildingMetadata,
  floors: Floor[],
  defaultBrand: "Heimeier" | "Oventrop" | "Danfoss" = "Heimeier"
) {
  const header = [
    "Floor",
    "Room",
    "Radiator",
    "Target_W",
    "DeltaT_water_K",
    "Flow_L_h",
    "Suggested_Preset",
  ];

  const rows: string[][] = [header];

  floors.forEach((fl) => {
    fl.rooms.forEach((room) => {
      (room.heaters ?? []).forEach((h: Heater) => {
        if (h.type !== "radiator") return;

        const flowLps = computeFlowLpsFromHeater(h);
        const flowLph = Math.round(flowLps * 3600);
        const dTw = deltaTWater(h.standardRegime);
        const label = `${h.brand ?? ""} ${h.series ?? ""} ${h.height ?? ""}x${h.width ?? ""}`.trim();
        const brand = detectKvBrand(h.valveType) || defaultBrand;
        const preset = kvPresetFor(flowLps, brand);

        rows.push([
          fl.name ?? "",
          room.name ?? "",
          label || "Radiator",
          String(Math.round(h.output ?? 0)),
          String(dTw),
          String(flowLph),
          `${brand} ${preset}`,
        ]);
      });
    });
  });

  const csv = rows.map((r) => r.join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "hydraulic-balancing.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
