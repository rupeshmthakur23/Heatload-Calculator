// src/pages/projectView/components/HeatLoadCalculator/utils/exportToPDF.ts
import jsPDF from "jspdf";
import type { ExportOptions, SummaryRow, BuildingMetadata } from "../types";

/* ───────────────────────── Helpers ───────────────────────── */

const parseNum = (v: any): number | undefined => {
  if (v === null || v === undefined) return undefined;
  const s =
    typeof v === "string" ? v.replace(",", ".").replace(/\s+/g, "").trim() : v;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};
const toNum = (v: any): number => {
  const n = parseNum(v);
  return n !== undefined ? Math.max(0, n) : 0;
};

const fmt0 = (n?: number) =>
  Number.isFinite(n as number)
    ? (n as number).toLocaleString("de-DE", { maximumFractionDigits: 0 })
    : "0";

const fmt1 = (n?: number) =>
  Number.isFinite(n as number)
    ? (n as number).toLocaleString("de-DE", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    : "0,0";

const fmt2 = (n?: number) =>
  Number.isFinite(n as number)
    ? (n as number).toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0,00";

const today = () =>
  new Date()
    .toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", "");

/** Truncate to fit width and add ellipsis if needed */
function ellipsize(doc: jsPDF, text: string, maxWidth: number) {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const part = text.slice(0, mid) + "…";
    if (doc.getTextWidth(part) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + "…";
}

/* ───────────────────────── Export ───────────────────────── */

export function exportToPDF(
  options: Partial<ExportOptions> & {
    metadata?: BuildingMetadata;
    title?: string;
    eflh?: number; // optional
  }
) {
  const {
    title = "Heizlast Gesamtbericht",
    metadata,
    roomBreakdown = [],
    totalLoad = 0,
    totalArea = 0,
    wattsPerSqm: wattsPerSqmIn,
    energyClass = "–",
    recommendation = "–",
    eflh,
  } = options;

  const totalLoadKW = toNum(totalLoad);
  const totalAreaM2 = toNum(totalArea);
  const wattsPerSqm =
    wattsPerSqmIn !== undefined
      ? toNum(wattsPerSqmIn)
      : totalAreaM2 > 0
      ? (totalLoadKW * 1000) / totalAreaM2
      : 0;

  // PDF + layout constants
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setProperties({
    title,
    subject: "Ergebnisübersicht Heizlastberechnung",
    creator: "HeatLoadCalculator",
  });

  const M = { left: 14, right: 14, top: 16, bottom: 16 };
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - M.left - M.right;

  // Colors
  const GRID = 220;
  const HEAD_BG = [242, 244, 248] as const;
  const ZEBRA = [250, 252, 255] as const;
  const FLOOR_BG = [246, 248, 250] as const;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(title, M.left, M.top + 4);

  let y = M.top + 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Address (if present)
  if (metadata) {
    const addr = [metadata.address, metadata.postalCode, metadata.location]
      .filter(Boolean)
      .join(", ");
    if (addr) {
      doc.setTextColor(70);
      doc.text(addr, M.left, y);
      doc.setTextColor(0);
      y += 6;
    }
  }

  // KPIs (left)
  const kpiLabelX = M.left;
  const kpiValueX = M.left + 42;
  const kpi = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, kpiLabelX, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, kpiValueX, y);
    y += 6;
  };
  kpi("Gesamtlast", `${fmt1(totalLoadKW)} kW`);
  kpi("Gesamtfläche", `${fmt1(totalAreaM2)} m²`);
  kpi("Heizlast pro m²", `${fmt2(wattsPerSqm)} W/m²`);
  kpi("Energieklasse", energyClass);
  kpi("Empfehlung", recommendation);

  // Assumptions box (right) with wrapping & dynamic height
  const legendX = M.left + contentW * 0.55;
  const legendW = contentW * 0.45;
  const legendY = M.top + 22;

  // Build wrapped lines (ASCII-friendly to avoid font oddities)
  doc.setFont("helvetica", "bold");
  const titleLine = "Annahmen & Herleitung";
  const titleH = 5; // one line height

  doc.setFont("helvetica", "normal");
  const wrap = (t: string) => doc.splitTextToSize(t, legendW - 4);
  const bodyLines = [
    ...wrap(`Summe Heizlast: ${fmt0(totalLoadKW * 1000)} W`),
    ...wrap(
      `Gesamtfläche: ${fmt1(totalAreaM2)} m^2${
        typeof eflh === "number" ? ` • EFLH: ${fmt0(eflh)} h/a` : ""
      }`
    ),
    ...wrap("W/m^2 = (Summe Heizlast_W) / Flaeche_m^2"),
    ...wrap("kWh/m^2*a ~ (W/m^2 * EFLH) / 1000"),
  ];
  const lineH = 5;
  const legendH = 4 + titleH + 3 + bodyLines.length * lineH + 2; // padding

  // If the box would overflow, push to next page (unlikely here)
  if (legendY + legendH > pageH - M.bottom) {
    doc.addPage();
    y = M.top;
  }

  // Draw box
  doc.setDrawColor(GRID);
  doc.setFillColor(248, 248, 248);
  doc.rect(legendX, legendY, legendW, legendH, "FD");

  // Title + body
  doc.setFont("helvetica", "bold");
  doc.text(titleLine, legendX + 2, legendY + 4 + titleH);
  doc.setFont("helvetica", "normal");

  let ly = legendY + 4 + titleH + 3;
  bodyLines.forEach((ln) => {
    doc.text(ln, legendX + 2, ly);
    ly += lineH;
  });

  y = Math.max(y, legendY + legendH + 8);

  /* ───────────── Table (fits printable width) ───────────── */

  type Col = {
    key: string;
    label: string;
    unit: string;
    width: number;
    right?: boolean;
  };
  const cols: Col[] = [
    { key: "room", label: "Raum", unit: "", width: 50 },
    { key: "trans", label: "Transmission", unit: "(kW)", width: 22, right: true },
    { key: "vent", label: "Lüftung", unit: "(kW)", width: 20, right: true },
    { key: "tb", label: "Wärmebrücken", unit: "(kW)", width: 27, right: true },
    { key: "safety", label: "Zuschlag", unit: "(kW)", width: 20, right: true },
    { key: "heat", label: "Heizlast", unit: "(kW)", width: 22, right: true },
    { key: "area", label: "Fläche", unit: "(m²)", width: 21, right: true },
  ];
  const tableX = M.left;
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  const headerH = 10;
  const rowH = 7;

  const drawHeader = (yy: number) => {
    doc.setFillColor(...HEAD_BG);
    doc.setDrawColor(GRID);
    doc.rect(tableX, yy, tableW, headerH, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    let x = tableX + 2;
    cols.forEach((c) => {
      if (c.right) {
        doc.text(c.label, x + c.width - 2, yy + 4, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text(c.unit, x + c.width - 2, yy + 8, { align: "right" });
        doc.setFont("helvetica", "bold");
      } else {
        doc.text(c.label, x, yy + 4);
        doc.setFont("helvetica", "normal");
        doc.text(c.unit, x, yy + 8);
        doc.setFont("helvetica", "bold");
      }
      x += c.width;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const ensureSpace = (need: number) => {
    if (y + need <= pageH - M.bottom) return;
    doc.addPage();
    y = M.top;
    drawHeader(y);
    y += headerH;
  };

  // Start table
  ensureSpace(headerH);
  drawHeader(y);
  y += headerH;

  // Group rows by floor
  const groups = (roomBreakdown as SummaryRow[]).reduce<Record<string, SummaryRow[]>>(
    (acc, r) => {
      const key = (r.floor ?? "").trim() || "—";
      (acc[key] ||= []).push(r);
      return acc;
    },
    {}
  );

  const floorKeys = Object.keys(groups);

  for (const floor of floorKeys) {
    const rows = groups[floor];

    // floor header
    ensureSpace(rowH);
    doc.setFillColor(...FLOOR_BG);
    doc.setDrawColor(GRID);
    doc.rect(tableX, y, tableW, rowH, "FD");
    doc.setFont("helvetica", "bold");
    doc.text(floor, tableX + 2, y + 5);
    doc.setFont("helvetica", "normal");
    y += rowH;

    let zebra = false;
    let floorHeat = 0;
    let floorArea = 0;

    rows.forEach((r) => {
      const trans = toNum(r.transmissionLoss);
      const vent = toNum(r.ventilationLoss);
      const tb = toNum((r as any).thermalBridgeLoss);
      const safety = toNum(r.safetyMargin);
      const base = toNum((r as any).totalLoss) || trans + vent + tb;
      const final = r.roomHeatLoad != null ? toNum(r.roomHeatLoad) : base + safety;
      const area = toNum(r.area);

      floorHeat += final;
      floorArea += area;

      ensureSpace(rowH);

      if (zebra) {
        doc.setFillColor(...ZEBRA);
        doc.rect(tableX, y, tableW, rowH, "F");
      }
      zebra = !zebra;

      doc.setDrawColor(240);
      doc.line(tableX, y + rowH, tableX + tableW, y + rowH);

      let x = tableX + 2;
      const cells: Array<{ v: string; w: number; right?: boolean }> = [
        { v: ellipsize(doc, r.room ?? "", cols[0].width - 4), w: cols[0].width - 4 },
        { v: fmt1(trans), w: cols[1].width - 4, right: true },
        { v: fmt1(vent), w: cols[2].width - 4, right: true },
        { v: fmt1(tb), w: cols[3].width - 4, right: true },
        { v: fmt1(safety), w: cols[4].width - 4, right: true },
        { v: fmt1(final), w: cols[5].width - 4, right: true },
        { v: fmt1(area), w: cols[6].width - 4, right: true },
      ];

      cells.forEach((c, idx) => {
        if (c.right) doc.text(c.v, x + c.w, y + 5, { align: "right" });
        else doc.text(c.v, x, y + 5);
        x += cols[idx].width;
      });

      y += rowH;
    });

    // floor subtotal
    ensureSpace(rowH);
    doc.setFont("helvetica", "bold");
    doc.setDrawColor(GRID);
    doc.setFillColor(248, 248, 248);
    doc.rect(tableX, y, tableW, rowH, "FD");

    const labelRight =
      tableX + cols.slice(0, 5).reduce((s, c) => s + c.width, 0) - 2;
    const heatCellRight =
      tableX + cols.slice(0, 6).reduce((s, c) => s + c.width, 0) - 2;
    const areaCellRight = tableX + tableW - 2;

    doc.text("Zwischensumme:", labelRight, y + 5, { align: "right" });
    doc.text(fmt1(floorHeat), heatCellRight, y + 5, { align: "right" });
    doc.text(fmt1(floorArea), areaCellRight, y + 5, { align: "right" });

    doc.setFont("helvetica", "normal");
    y += rowH + 1;
  }

  // Overall total
  ensureSpace(rowH + 2);
  doc.setFont("helvetica", "bold");
  doc.setDrawColor(GRID);
  doc.setFillColor(240, 243, 248);
  doc.rect(tableX, y, tableW, rowH, "FD");

  const totalLabelRight =
    tableX + cols.slice(0, 5).reduce((s, c) => s + c.width, 0) - 2;
  const totalHeatRight =
    tableX + cols.slice(0, 6).reduce((s, c) => s + c.width, 0) - 2;

  doc.text("Gesamt Heizlast:", totalLabelRight, y + 5, { align: "right" });
  doc.text(fmt1(totalLoadKW), totalHeatRight, y + 5, { align: "right" });

  doc.setFont("helvetica", "normal");
  y += rowH + 3;

  // Note
  ensureSpace(10);
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(
    "Hinweis: Abschätzung aus Auslegungs-Heizlast * ggf. EFLH. Für einen offiziellen Energieausweis sind normgerechte Verfahren (z. B. DIN/EN) erforderlich.",
    tableX,
    y,
    { maxWidth: tableW }
  );
  doc.setTextColor(0);

  // Footer on each page
  const pages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120);

    const left =
      "Erstellt: " +
      today() +
      (metadata?.address ? ` • ${metadata.address}` : "");
    doc.text(left, M.left, pageH - 6);

    const right = `Seite ${i} / ${pages}`;
    doc.text(right, pageW - M.right, pageH - 6, { align: "right" });

    doc.setTextColor(0);
  }

  doc.save("heizlast-bericht.pdf");
}
