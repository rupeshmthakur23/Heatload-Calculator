import React from "react";
import { Typography, Box } from "@mui/material";
import { colors, spacing, fontSizes, radii } from "../designTokens";

type Props = {
  label: string;          // e.g. "U-Wert"
  value: number;          // current U-value
  min?: number;           // scale start (default 0.2)
  max?: number;           // scale end   (default 2.0)
};

const zoneLabel = (u: number) => {
  if (u <= 0.5) return "Optimale Dämmung";
  if (u <= 1.0) return "Mittlere Dämmung";
  return "Schlechte Dämmung";
};

const zoneColor = (u: number) => {
  if (u <= 0.5) return "#53c171";
  if (u <= 1.0) return "#f9c74f";
  return "#ef6565";
};

const UValueChart: React.FC<Props> = ({ label, value, min = 0.2, max = 2.0 }) => {
  const span = Math.max(0.0001, max - min);
  // clamp to [min, max] for marker position
  const clamped = Math.min(max, Math.max(min, value));
  const percent = ((clamped - min) / span) * 100;

  return (
    <Box mb={spacing.md}>
      <Typography fontWeight={600} fontSize={fontSizes.base} sx={{ mb: spacing.sm }}>
        {label}: {value.toFixed(2)} W/m²K
      </Typography>

      {/* gradient rail */}
      <Box
        sx={{
          position: "relative",
          height: 10,
          borderRadius: 9999,
          background:
            "linear-gradient(to right, #53c171 0%, #f9c74f 50%, #ef6565 100%)",
        }}
      >
        {/* rounded marker */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: `${percent}%`,
            transform: "translate(-50%, -50%)",
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: "#fff",
            border: `2px solid ${colors.textMain}`,
            boxShadow: "0 0 0 2px rgba(0,0,0,0.06)",
          }}
        />
      </Box>

      <Typography
        variant="body2"
        sx={{
          mt: 0.75,
          fontSize: fontSizes.sm,
          color: zoneColor(value),
          opacity: 0.9,
        }}
      >
        {zoneLabel(value)}
      </Typography>
    </Box>
  );
};

export default UValueChart;
