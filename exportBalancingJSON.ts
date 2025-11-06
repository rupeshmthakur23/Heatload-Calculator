import type { BuildingMetadata, Floor, Heater } from "../types";
import { computeFlowLpsFromHeater, kvPresetFor } from "./kvRecommendation";

function deltaTWater(regime?: string): number {
  const r = regime ?? "75/65/20";
  const [ts, tr] = r.split("/").map((x) => Number(x));
  const dT = (Number.isFinite(ts) ? ts : 75) - (Number.isFinite(tr) ? tr : 65);
  return dT > 0 ? dT : 10;
}

function detectKvBrand(valveType?: string): "Heimeier" | "Oventrop" | "Danfoss" {
  const v = (valveType ?? "").toLowerCase();
  if (v.includes("oventrop")) return "Oventrop";
  if (v.includes("danfoss")) return "Danfoss";
  return "Heimeier";
}

export function exportBalancingJSON(
  metadata: BuildingMetadata,
  floors: Floor[],
  defaultBrand: "Heimeier" | "Oventrop" | "Danfoss" = "Heimeier"
) {
  const payload = {
    building: {
      address: metadata.address,
      constructionYear: metadata.constructionYear,
      type: metadata.buildingType,
    },
    radiators: [] as Array<{
      floor: string;
      room: string;
      heaterId: string;
      brand?: string;
      series?: string;
      size?: string;
      output_W: number;
      regime: string;
      deltaTwater_K: number;
      flow_L_s: number;
      flow_L_h: number;
      suggestedPreset: { brand: string; preset: string };
    }>,
  };

  floors.forEach((fl) => {
    fl.rooms.forEach((room) => {
      (room.heaters ?? []).forEach((h: Heater) => {
        if (h.type !== "radiator") return;

        const flowLps = computeFlowLpsFromHeater(h);
        const flowLph = flowLps * 3600;
        const regime = h.standardRegime ?? "75/65/20";
        const dTw = deltaTWater(regime);
        const brand = detectKvBrand(h.valveType) || defaultBrand;
        const preset = kvPresetFor(flowLps, brand);

        payload.radiators.push({
          floor: fl.name ?? "",
          room: room.name ?? "",
          heaterId: h.id,
          brand: h.brand,
          series: h.series,
          size: h.height && h.width ? `${h.height}x${h.width}` : undefined,
          output_W: Math.round(h.output ?? 0),
          regime,
          deltaTwater_K: dTw,
          flow_L_s: +flowLps.toFixed(4),
          flow_L_h: Math.round(flowLph),
          suggestedPreset: { brand, preset },
        });
      });
    });
  });

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "hydraulic-balancing.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
