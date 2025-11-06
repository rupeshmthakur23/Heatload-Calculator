// src/pages/projectView/components/HeatLoadCalculator/room/sections/CeilingSummaryPanel.tsx
import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import { CeilingConfigType } from "../../types";
import { colors, spacing, radii, fontSizes } from "../../designTokens";

interface CeilingSummaryPanelProps {
  ceilingConfig?: CeilingConfigType; // optional
}

export default function CeilingSummaryPanel({ ceilingConfig }: CeilingSummaryPanelProps) {
  if (!ceilingConfig) return null;

  const {
    area = 0,
    insulationStandard = "standard",
    roofType = "Flachdach",
    kniestockHeight = 0,
    dachfenster = false,
    gauben = false,
  } = ceilingConfig;

  const infoRow = (label: string, value: string | number | boolean) => (
    <Box display="flex" justifyContent="space-between" mb={spacing.sm}>
      <Typography variant="body2" fontWeight={500} color={colors.textMain}>
        {label}
      </Typography>
      <Typography variant="body2" color={colors.textMain}>
        {typeof value === "boolean" ? (value ? "Ja" : "Nein") : value}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        p: spacing.lg,
        backgroundColor: colors.grayLight,
        borderRadius: radii.md,
        mb: spacing.lg,
        minWidth: 0,
        width: "100%",
      }}
    >
      <Typography
        variant="subtitle1"
        gutterBottom
        fontWeight={600}
        fontSize={fontSizes.base}
        color={colors.textMain}
      >
        Deckenübersicht
      </Typography>

      <Divider sx={{ mb: spacing.md, borderColor: colors.grayBorder }} />

      {infoRow("Fläche", `${area.toFixed(1)} m²`)}
      {infoRow("Dämmstandard", insulationStandard)}
      {infoRow("Dachtyp", roofType)}
      {infoRow("Kniestockhöhe", `${kniestockHeight} m`)}
      {infoRow("Dachfenster", dachfenster)}
      {infoRow("Gauben", gauben)}
    </Box>
  );
}
