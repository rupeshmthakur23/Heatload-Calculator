// src/pages/ApplicationPage/components/HeatLoadCalculator/room/sections/UValueSlider.tsx
import React, { useEffect, useState } from "react";
import {
  Slider,
  Typography,
  TextField,
  Box,
  Tooltip,
  InputAdornment,
  SxProps,
  Theme,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { colors, spacing, fontSizes } from "../designTokens";

type Props = {
  label: string;
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Optional recommended band to highlight on the rail */
  recommended?: [number, number] | null;
};

const zoneColor = (u: number) => {
  if (u <= 0.5) return "#53c171";
  if (u <= 1.0) return "#f9c74f";
  return "#ef6565";
};

const zoneLabel = (u: number) => {
  if (u <= 0.5) return "Optimale Dämmung";
  if (u <= 1.0) return "Mittlere Dämmung";
  return "Schlechte Dämmung";
};

const pillSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    height: 40,
    borderRadius: 9999,
    alignItems: "center",
    backgroundColor: "#fff",
    "& fieldset": { borderColor: colors.grayBorder },
    "&:hover fieldset": { borderColor: colors.grayBorder },
    "&.Mui-focused fieldset": { borderColor: colors.primaryBlue, borderWidth: 2 },
    "& .MuiOutlinedInput-input": { padding: "8px 12px", lineHeight: 1.3 },
  },
  "& .MuiInputAdornment-root": { color: "text.secondary", mr: 0 },
};

const UValueSlider: React.FC<Props> = ({
  label,
  value,
  onChange,
  min = 0.2,
  max = 2.0,
  step = 0.01,
  recommended = null,
}) => {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const handleSlider = (_: Event, val: number | number[]) => {
    const nv = clamp(typeof val === "number" ? val : val[0]);
    setLocal(nv);
    onChange(nv);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value);
    if (Number.isFinite(raw)) {
      const nv = clamp(raw);
      setLocal(nv);
      onChange(nv);
    } else {
      setLocal(NaN);
    }
  };

  // positions for optional recommended band
  const span = Math.max(0.0001, max - min);
  const band =
    recommended && recommended.length === 2
      ? {
          left: `${((Math.max(min, recommended[0]) - min) / span) * 100}%`,
          width: `${((Math.min(max, recommended[1]) - Math.max(min, recommended[0])) / span) * 100}%`,
        }
      : null;

  return (
    <Box sx={{ mb: spacing.lg }}>
      {/* Single header line */}
      <Typography
        fontWeight={600}
        fontSize={fontSizes.base}
        sx={{ mb: spacing.sm, display: "flex", alignItems: "center", gap: spacing.sm }}
      >
        {label}: {value.toFixed(2)} W/m²K
        <Tooltip title="Farbskala: Grün = optimale Dämmung (≤0.5), Gelb = mittlere Dämmung (≤1.0), Rot = schlechte Dämmung (>1.0)">
          <InfoIcon fontSize="small" sx={{ cursor: "help", color: colors.primaryBlue }} />
        </Tooltip>
      </Typography>

      <Box sx={{ position: "relative" }}>
        {/* Optional recommended band behind the slider */}
        {band && (
          <Box
            sx={{
              position: "absolute",
              left: band.left,
              width: band.width,
              height: 10,
              top: "50%",
              transform: "translateY(-50%)",
              borderRadius: 9999,
              backgroundColor: "rgba(255,255,255,0.35)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
        )}

        <Slider
          valueLabelDisplay="off"
          marks={false}
          value={local}
          onChange={handleSlider}
          min={min}
          max={max}
          step={step}
          sx={{
            height: 10,
            zIndex: 1,
            "& .MuiSlider-rail": {
              opacity: 1,
              height: 10,
              borderRadius: 9999,
              background:
                "linear-gradient(90deg, #53c171 0%, #f9c74f 50%, #ef6565 100%)",
            },
            // Make the track invisible so we keep the full gradient behind
            "& .MuiSlider-track": {
              height: 10,
              border: "none",
              background: "transparent",
            },
            // Thumb style
            "& .MuiSlider-thumb": {
              width: 18,
              height: 18,
              borderRadius: "50%",
              backgroundColor: "#fff",
              border: `2px solid ${zoneColor(local)}`,
              boxShadow: "0 0 0 2px rgba(0,0,0,0.06)",
            },
            "& .MuiSlider-mark": { display: "none" },
          }}
        />
      </Box>

      <TextField
        label="U-Wert manuell eingeben"
        type="number"
        variant="outlined"
        size="small"
        fullWidth
        value={Number.isNaN(local) ? "" : local}
        onChange={handleInput}
        inputProps={{ min, max, step }}
        sx={pillSx}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end" sx={{ alignSelf: "center" }}>
              W/m²K
            </InputAdornment>
          ),
        }}
      />

      <Typography
        variant="body2"
        sx={{ color: zoneColor(local), fontSize: fontSizes.sm, mt: spacing.sm }}
      >
        {zoneLabel(local)}
      </Typography>
    </Box>
  );
};

export default UValueSlider;
