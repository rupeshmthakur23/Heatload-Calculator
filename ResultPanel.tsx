// src/pages/projectView/components/HeatLoadCalculator/results/ResultPanel.tsx

import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  useTheme,
} from "@mui/material";
import { ExportOptions, SummaryRow, BuildingMetadata, Floor } from "../types";
import { exportToPDF } from "../utils/exportToPDF";
import { exportGeometryJSON } from "../utils/exportGeometry";
import { exportBalancingCSV } from "../utils/exportBalancingCSV";
import { exportBalancingJSON } from "../utils/exportBalancingJSON";
import {
  exportToCSV,                 // ⬅️ use this for the room CSV
  exportHydraulicCSV,
  exportHydraulicJSON,
} from "../utils/exportToCSV";
import PrimaryButton from "../PrimaryButton";
import OverviewPanel from "./OverviewPanel";
import { colors, spacing, radii, fontSizes } from "../designTokens";

interface ResultPanelProps {
  results: {
    totalRooms: number;
    totalLoad: number | string; // kW (may come as string)
    totalArea?: number | string;
    energyClass: string;
    recommendation: string;
    roomBreakdown?: SummaryRow[];
  };
  metadata: BuildingMetadata;
  floors: Floor[];
}

/* ───────── helpers ───────── */

const toNum = (v: unknown) =>
  typeof v === "string" ? Number(v.replace(",", ".")) : (v as number) ?? 0;

const fx1 = (n?: number) =>
  Number.isFinite(n as number) ? (n as number).toFixed(1) : "0.0";

/** UI formatter for kW cells */
const formatKW = (n?: number) => {
  const v = typeof n === "number" && isFinite(n) ? n : 0;
  if (v > 0 && v < 0.1) return "<0,1 kW";
  const opts =
    v < 10
      ? { minimumFractionDigits: 1, maximumFractionDigits: 1 }
      : { maximumFractionDigits: 0 };
  return `${v.toLocaleString("de-DE", opts)} kW`;
};

/* ───────── component ───────── */

const ResultPanel: React.FC<ResultPanelProps> = ({ results, metadata, floors }) => {
  const theme = useTheme();

  const hasExplicitTotalArea =
    results.totalArea !== undefined && results.totalArea !== null;

  const totalArea = hasExplicitTotalArea
    ? toNum(results.totalArea)
    : results.roomBreakdown?.reduce((sum, r) => sum + toNum(r.area), 0) ?? 0;

  const wattsPerSqm =
    totalArea > 0 ? (toNum(results.totalLoad) * 1000) / totalArea : 0;

  // ✅ Use robust CSV util (adds BOM + sep=; and proper locale formatting)
  const handleCSVExport = () => {
    exportToCSV({
      totalLoad: toNum(results.totalLoad),
      totalArea,
      wattsPerSqm,
      energyClass: results.energyClass,
      recommendation: results.recommendation,
      roomBreakdown: results.roomBreakdown || [],
    });
  };

  const handlePDFExport = () => {
    const opts: ExportOptions = {
      totalLoad: toNum(results.totalLoad),
      totalArea,
      wattsPerSqm,
      energyClass: results.energyClass,
      recommendation: results.recommendation,
      roomBreakdown: results.roomBreakdown || [],
    };
    exportToPDF(opts);
  };

  const handleGeometryExport = () => exportGeometryJSON(metadata, floors);
  const handleBalancingCSV = () => exportBalancingCSV(metadata, floors);
  const handleBalancingJSON = () => exportBalancingJSON(metadata, floors);
  const handleHydraulicCSV = () => exportHydraulicCSV(metadata, floors);
  const handleHydraulicJSON = () => exportHydraulicJSON(metadata, floors);

  return (
    <Box sx={{ pb: 8 }}>
      <Typography
        variant="h5"
        sx={{
          mb: spacing.md,
          color: colors.textMain,
          fontWeight: 700,
          fontSize: { xs: fontSizes.lg, sm: "1.35rem" },
        }}
      >
        Heizlast Gesamtübersicht
      </Typography>

      {/* Summary cards */}
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: spacing.md,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${colors.grayBorder}`,
          borderRadius: radii.lg,
        }}
      >
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Gesamtfläche
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {fx1(totalArea)} m²
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Heizlast pro m²
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {fx1(wattsPerSqm)} W/m²
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Effizienzbewertung
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {wattsPerSqm < 30
                ? "Sehr effizient"
                : wattsPerSqm < 50
                ? "Effizient"
                : "Ineffizient"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Room table */}
      {results.roomBreakdown && (
        <>
          <Typography
            variant="h6"
            sx={{ mt: spacing.md, mb: spacing.sm, fontWeight: 600, color: colors.textMain }}
          >
            Raumweise Verluste
          </Typography>
          <TableContainer
            component={Paper}
            sx={{
              mb: spacing.lg,
              border: `1px solid ${colors.grayBorder}`,
              borderRadius: radii.lg,
              overflow: "hidden",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: colors.grayLight,
                    "& th": { fontWeight: 600, color: colors.textMain },
                  }}
                >
                  <TableCell>Raum</TableCell>
                  <TableCell>Transmissionsverluste (kW)</TableCell>
                  <TableCell>Lüftungsverluste (kW)</TableCell>
                  <TableCell>Heizlast (inkl. Zuschlag) (kW)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.roomBreakdown.map((r, idx) => {
                  const trans = toNum(r.transmissionLoss);
                  const vent = toNum(r.ventilationLoss);
                  const tb = toNum((r as any).thermalBridgeLoss);
                  const base = trans + vent + tb;
                  const final = r.roomHeatLoad != null ? toNum(r.roomHeatLoad) : base;

                  return (
                    <TableRow key={idx} hover sx={{ "&:last-of-type td": { borderBottom: 0 } }}>
                      <TableCell>{`${r.floor} – ${r.room}`}</TableCell>
                      <TableCell>{formatKW(trans)}</TableCell>
                      <TableCell>{formatKW(vent)}</TableCell>
                      <TableCell>{formatKW(final)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Building overview (header exports hidden) */}
      <Box mt={spacing.lg}>
        <OverviewPanel
          metadata={metadata}
          floors={floors}
          roomResults={results.roomBreakdown || []}
          showHeaderExports={false}
        />
      </Box>

      {/* Unified export buttons at the very bottom (all 7) */}
      <Divider sx={{ my: spacing.md, borderColor: colors.grayBorder }} />
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          justifyContent: { xs: "center", md: "flex-end" },
          pt: 1,
        }}
      >
        <PrimaryButton onClick={handlePDFExport} size="small">
          PDF exportieren
        </PrimaryButton>
        <PrimaryButton onClick={handleCSVExport} size="small">
          CSV exportieren
        </PrimaryButton>
        <PrimaryButton onClick={handleGeometryExport} size="small">
          Geometrie (JSON)
        </PrimaryButton>
        <PrimaryButton onClick={handleBalancingCSV} size="small">
          Balancing CSV
        </PrimaryButton>
        <PrimaryButton onClick={handleBalancingJSON} size="small">
          Balancing JSON
        </PrimaryButton>
        <PrimaryButton onClick={handleHydraulicCSV} size="small">
          CSV: Hydraulischer Abgleich
        </PrimaryButton>
        <PrimaryButton onClick={handleHydraulicJSON} size="small">
          JSON: Hydraulik
        </PrimaryButton>
      </Box>
    </Box>
  );
};

export default ResultPanel;
