// src/pages/projectView/components/HeatLoadCalculator/MaterialsOverview.tsx
import React, { useMemo } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import { colors, spacing, radii } from "./designTokens";
import type { Floor as AppFloor, Room } from "./types";

/**
 * Grundmaterialien – Gesamtübersicht
 * Aggregates all materials across the whole property and shows summed areas/lengths/counts.
 * U-values are visualized with a color bar and an accessible numeric label.
 */

type Props = {
  floors: AppFloor[];
  onApplyBuildingPresets?: () => void; // optional – show the button only if provided
};

/* ────────────────────────────────────────────────────────────────────────────
   Helpers: formatting & U-bar
   ──────────────────────────────────────────────────────────────────────────── */

const U_MIN = 0.2;
const U_MAX = 2.7;

const nf0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });

const safeNum = (n?: number) =>
  typeof n === "number" && isFinite(n) ? n : 0;

function UBar({
  value,
  min = U_MIN,
  max = U_MAX,
  height = 18,
}: {
  value?: number;
  min?: number;
  max?: number;
  height?: number;
}) {
  const theme = useTheme();
  const vOk = typeof value === "number" && isFinite(value);
  const v = vOk ? Math.min(max, Math.max(min, value!)) : min;
  const leftPct = ((v - min) / (max - min)) * 100;

  return (
    <Box
      role="img"
      aria-label={`U-Wert Skala, Wert: ${
        vOk ? value!.toFixed(2) : "unbekannt"
      } W pro Quadratmeter Kelvin`}
      sx={{ position: "relative", width: "100%" }}
    >
      <Box
        sx={{
          height,
          borderRadius: 9999,
          background:
            "linear-gradient(90deg,#8BC34A 0%,#A5D16D 25%,#F0C85C 50%,#F39C4C 75%,#E74C3C 100%)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: -2,
          left: `${leftPct}%`,
          transform: "translateX(-50%)",
          display: { xs: "none", sm: "flex" }, // hide bubble on tiny screens
          alignItems: "center",
          gap: 0.5,
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderBottom: `8px solid ${theme.palette.text.primary}`,
          }}
        />
        <Box
          sx={{
            ml: 0.25,
            px: 0.75,
            py: 0.25,
            fontSize: 12,
            lineHeight: 1,
            borderRadius: 9999,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${colors.grayBorder}`,
            whiteSpace: "nowrap",
          }}
        >
          {vOk ? `${value!.toFixed(2)} W/m²K` : "—"}
        </Box>
      </Box>
    </Box>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Aggregation
   ──────────────────────────────────────────────────────────────────────────── */

type RowCommon = {
  label: string;
  u?: number;
  area?: number;
  length?: number;
  count?: number;
};

type SectionDef = {
  title: string;
  columns: {
    hasLength?: boolean;
    hasCount?: boolean;
  };
  rows: RowCommon[];
};

function labelForFloorType(v?: Room["floorConfig"]["floorType"]) {
  switch (v) {
    case "beheizt":
      return "Boden • über beheiztem Raum";
    case "unbeheizt":
      return "Boden • über unbeheiztem Raum";
    case "erdreich":
      return "Bodenplatte (Erdreich)";
    case "aussenluft":
      return "Boden • über Außenluft";
    default:
      return "Boden";
  }
}

function labelForRoofType(v?: Room["ceilingConfig"]["roofType"]) {
  switch (v) {
    case "Flachdach":
      return "Decke • Flachdach";
    case "Satteldach":
      return "Decke • Satteldach";
    case "Walmdach":
      return "Decke • Walmdach";
    default:
      return "Decke";
  }
}

function key(label: string, u?: number) {
  return `${label}__${typeof u === "number" ? u.toFixed(3) : "na"}`;
}

function aggregateWholeProperty(floors: AppFloor[]): SectionDef[] {
  const rooms = floors.flatMap((fl) => fl.rooms || []);

  // ── Walls (exterior) ───────────────────────────────────────
  const wallMap = new Map<string, RowCommon>();
  rooms.forEach((r) =>
    (r.walls || []).forEach((w) => {
      if (!w.isExterior) return;
      const lbl = (w.material || w.type || "Außenwand").trim();
      const u = typeof w.uValue === "number" ? w.uValue : undefined;
      const k = key(lbl, u);
      const prev = wallMap.get(k) || { label: lbl, u, area: 0, length: 0, count: 0 };
      prev.area = safeNum(prev.area) + safeNum(w.area);
      prev.length = safeNum(prev.length) + safeNum(w.length);
      prev.count = safeNum(prev.count) + 1;
      prev.u = u ?? prev.u;
      wallMap.set(k, prev);
    })
  );
  const walls = Array.from(wallMap.values()).sort(
    (a, b) =>
      a.label.localeCompare(b.label, "de") ||
      safeNum(a.u) - safeNum(b.u)
  );

  // ── Windows ────────────────────────────────────────────────
  const winMap = new Map<string, RowCommon>();
  rooms.forEach((r) =>
    (r.windows || []).forEach((w) => {
      const lbl = (w.type || "Fenster").trim();
      const u = typeof w.uValue === "number" ? w.uValue : undefined;
      const k = key(lbl, u);
      const prev = winMap.get(k) || { label: lbl, u, area: 0, count: 0 };
      prev.area = safeNum(prev.area) + safeNum(w.area);
      prev.count = safeNum(prev.count) + 1;
      prev.u = u ?? prev.u;
      winMap.set(k, prev);
    })
  );
  const windows = Array.from(winMap.values()).sort(
    (a, b) =>
      a.label.localeCompare(b.label, "de") ||
      safeNum(a.u) - safeNum(b.u)
  );

  // ── Doors (external + unheated) ────────────────────────────
  const doorMap = new Map<string, RowCommon>();
  rooms.forEach((r) =>
    (r.doors || []).forEach((d) => {
      const lbl = d.toUnheated ? "Außentür" : "Tür";
      const u = typeof d.uValue === "number" ? d.uValue : undefined;
      const k = key(lbl, u);
      const prev = doorMap.get(k) || { label: lbl, u, area: 0, count: 0 };
      prev.area = safeNum(prev.area) + safeNum(d.area);
      prev.count = safeNum(prev.count) + 1;
      prev.u = u ?? prev.u;
      doorMap.set(k, prev);
    })
  );
  const doors = Array.from(doorMap.values()).sort(
    (a, b) =>
      a.label.localeCompare(b.label, "de") ||
      safeNum(a.u) - safeNum(b.u)
  );

  // ── Ceilings (by roof type) ────────────────────────────────
  const ceilMap = new Map<string, RowCommon>();
  rooms.forEach((r) => {
    const c = r.ceilingConfig;
    if (!c) return;
    const lbl = labelForRoofType(c.roofType);
    const u = typeof c.uValue === "number" ? c.uValue : undefined;
    const area = typeof c.area === "number" && c.area > 0 ? c.area : r.area || 0;
    const k = key(lbl, u);
    const prev = ceilMap.get(k) || { label: lbl, u, area: 0, count: 0 };
    prev.area = safeNum(prev.area) + safeNum(area);
    prev.count = safeNum(prev.count) + 1;
    prev.u = u ?? prev.u;
    ceilMap.set(k, prev);
  });
  const ceilings = Array.from(ceilMap.values()).sort(
    (a, b) =>
      a.label.localeCompare(b.label, "de") ||
      safeNum(a.u) - safeNum(b.u)
  );

  // ── Floors (by floor type) ─────────────────────────────────
  const floorMap = new Map<string, RowCommon>();
  rooms.forEach((r) => {
    const f = r.floorConfig;
    if (!f) return;
    const lbl = labelForFloorType(f.floorType);
    const u = typeof f.uValue === "number" ? f.uValue : undefined;
    const area = typeof f.area === "number" && f.area > 0 ? f.area : r.area || 0;
    const k = key(lbl, u);
    const prev = floorMap.get(k) || { label: lbl, u, area: 0, count: 0 };
    prev.area = safeNum(prev.area) + safeNum(area);
    prev.count = safeNum(prev.count) + 1;
    prev.u = u ?? prev.u;
    floorMap.set(k, prev);
  });
  const floorsAgg = Array.from(floorMap.values()).sort(
    (a, b) =>
      a.label.localeCompare(b.label, "de") ||
      safeNum(a.u) - safeNum(b.u)
  );

  const sections: SectionDef[] = [
    { title: "Wände (Außen)", columns: { hasLength: true }, rows: walls },
    { title: "Fenster", columns: { hasCount: true }, rows: windows },
    { title: "Türen", columns: { hasCount: true }, rows: doors },
    { title: "Decken", columns: {}, rows: ceilings },
    { title: "Böden", columns: {}, rows: floorsAgg },
  ];

  return sections;
}

/* ────────────────────────────────────────────────────────────────────────────
   CSV export
   ──────────────────────────────────────────────────────────────────────────── */

function toCSV(sections: SectionDef[]) {
  const headers = [
    "Kategorie",
    "Bezeichnung",
    "U-Wert (W/m²K)",
    "Fläche (m²)",
    "Länge (m)",
    "Anzahl",
  ];
  const esc = (s: any) => {
    const v =
      s == null
        ? ""
        : typeof s === "number"
        ? nf2.format(s)
        : String(s);
    return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };

  const rows: string[] = [];
  rows.push(headers.join(";"));

  sections.forEach((sec) => {
    sec.rows.forEach((r) => {
      rows.push(
        [
          sec.title,
          r.label,
          typeof r.u === "number" ? r.u : "",
          safeNum(r.area),
          sec.columns.hasLength ? safeNum(r.length) : "",
          sec.columns.hasCount ? safeNum(r.count) : "",
        ]
          .map(esc)
          .join(";")
      );
    });
  });

  return rows.join("\n");
}

function downloadCSV(filename: string, csv: string) {
  const BOM = "\uFEFF"; // Excel friendly
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ────────────────────────────────────────────────────────────────────────────
   UI
   ──────────────────────────────────────────────────────────────────────────── */

function SectionTable({ section }: { section: SectionDef }) {
  const totalArea = section.rows.reduce((s, r) => s + safeNum(r.area), 0);
  const totalLen = section.rows.reduce((s, r) => s + safeNum(r.length), 0);
  const totalCnt = section.rows.reduce((s, r) => s + safeNum(r.count), 0);

  const hasData = section.rows.length > 0;

  return (
    <TableContainer
      sx={{
        border: `1px solid ${colors.grayBorder}`,
        borderRadius: radii.lg,
        maxHeight: 520,
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Material / Typ</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="left">
              U-Wert (W/m²K)
            </TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">
              Fläche (m²)
            </TableCell>
            {section.columns.hasLength && (
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Länge (m)
              </TableCell>
            )}
            {section.columns.hasCount && (
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Anzahl
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {!hasData && (
            <TableRow>
              <TableCell colSpan={section.columns.hasLength || section.columns.hasCount ? 4 : 3}>
                <Typography variant="body2" color="text.secondary">
                  Keine Daten vorhanden.
                </Typography>
              </TableCell>
            </TableRow>
          )}

          {section.rows.map((r) => (
            <TableRow key={key(r.label, r.u)}>
              <TableCell>{r.label}</TableCell>
              <TableCell sx={{ minWidth: 220 }}>
                {typeof r.u === "number" ? <UBar value={r.u} /> : "—"}
              </TableCell>
              <TableCell align="right">{nf2.format(safeNum(r.area))}</TableCell>
              {section.columns.hasLength && (
                <TableCell align="right">{nf2.format(safeNum(r.length))}</TableCell>
              )}
              {section.columns.hasCount && (
                <TableCell align="right">{nf0.format(safeNum(r.count))}</TableCell>
              )}
            </TableRow>
          ))}

          {hasData && (
            <TableRow sx={{ backgroundColor: colors.yellowSubtle }}>
              <TableCell sx={{ fontWeight: 700 }}>Summe</TableCell>
              <TableCell />
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {nf2.format(totalArea)}
              </TableCell>
              {section.columns.hasLength && (
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {nf2.format(totalLen)}
                </TableCell>
              )}
              {section.columns.hasCount && (
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {nf0.format(totalCnt)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const headerNoteSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.5,
  color: "text.secondary",
  fontSize: 12,
} as const;

export default function MaterialsOverview({ floors, onApplyBuildingPresets }: Props) {
  const theme = useTheme();
  const sections = useMemo(() => aggregateWholeProperty(floors), [floors]);

  const handleExport = () => {
    const csv = toCSV(sections);
    downloadCSV("grundmaterialien.csv", csv);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        border: `1px solid ${colors.grayBorder}`,
        borderRadius: radii.lg,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={spacing.sm}
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: colors.textMain }}>
          Grundmaterialien – Gesamtübersicht
        </Typography>

        <Box display="flex" gap={1}>
          {onApplyBuildingPresets && (
            <Tooltip title="Alle Räume erneut mit den aktuellen Gebäude-Vorgaben (Ära, Dämmniveau) befüllen.">
              <span>
                <Button
                  variant="outlined"
                  onClick={onApplyBuildingPresets}
                  sx={{ borderRadius: 9999 }}
                >
                  Werte aus dem Gebäude übernehmen
                </Button>
              </span>
            </Tooltip>
          )}

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ borderRadius: 9999 }}
          >
            CSV exportieren
          </Button>
        </Box>
      </Box>

      <Typography variant="caption" sx={headerNoteSx as any} mb={2}>
        <InfoOutlinedIcon fontSize="inherit" />
        Aggregierte Mengen über alle Räume des Objekts. Flächen/Längen und Stückzahlen sind summiert;
        U-Werte identisch gruppiert.
      </Typography>

      <Box display="grid" rowGap={spacing.md}>
        {sections.map((sec) => (
          <Box key={sec.title}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 700, color: colors.textMain }}
            >
              {sec.title}
            </Typography>
            <SectionTable section={sec} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
