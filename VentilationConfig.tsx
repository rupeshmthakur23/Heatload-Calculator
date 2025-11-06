// src/pages/projectView/components/HeatLoadCalculator/room/sections/VentilationConfig.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  MenuItem,
  Tooltip,
  InputAdornment,
  SxProps,
  Theme,
} from "@mui/material";
import { VentilationConfigType } from "../../types";
import InfoIcon from "@mui/icons-material/Info";
import { colors, radii } from "../../designTokens";

/* -------------------- Defaults (unchanged) -------------------- */
const DEFAULTS: Record<
  NonNullable<VentilationConfigType["roomType"]>,
  { temp: number; ach: number }
> = {
  living: { temp: 20, ach: 0.5 },
  bathroom: { temp: 24, ach: 1.0 },
  bedroom: { temp: 18, ach: 0.3 },
  kitchen: { temp: 20, ach: 0.6 },
  hallway: { temp: 15, ach: 0.3 },
  storage: { temp: 12, ach: 0.2 },
  basement: { temp: 10, ach: 0.2 },
  custom: { temp: 20, ach: 0.5 },
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  living: "Wohnen",
  bedroom: "Schlafen",
  kitchen: "Küche",
  bathroom: "Bad",
  hallway: "Flur",
  storage: "Abstell",
  basement: "Keller",
  custom: "Andere",
};

/* -------------------- UI-only styles (pill / brand) -------------------- */
const pillFieldSx: SxProps<Theme> = {
  minWidth: { xs: 180, md: 0 }, // avoid ultra-narrow fields that can clip label
  "& .MuiOutlinedInput-root": {
    borderRadius: 9999,
    backgroundColor: "transparent",
    "& fieldset": { borderColor: "rgba(0,0,0,0.12)" },
    "&:hover fieldset": { borderColor: colors.grayBorder },
    "&.Mui-focused fieldset": { borderColor: colors.primaryBlue, borderWidth: 1.5 },
    "&.Mui-error": { backgroundColor: "rgba(220,38,38,0.06)" },
    "&.Mui-error fieldset": { borderColor: "transparent" },
  },
  "& .MuiInputBase-input": { padding: "8px 14px" },
  "& .MuiFormHelperText-root": { marginTop: 4 },
};

const checkboxSx: SxProps<Theme> = {
  color: colors.checkboxInactive,
  "&.Mui-checked": { color: colors.primaryBlue },
  "& .MuiSvgIcon-root": {
    borderRadius: radii.sm,
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: -2,
      border: `1.5px solid ${colors.grayStroke}`,
      borderRadius: radii.sm,
    },
  },
};

// Use the same InputLabel props on long labels to prevent clipping
const labelChipProps = {
  shrink: true,
  sx: {
    bgcolor: "background.paper",
    px: 0.5,
    mr: 0.5,
    whiteSpace: "nowrap",
  },
} as const;

interface VentilationConfigProps {
  ventilation?: VentilationConfigType;
  onChange: (partial: Partial<VentilationConfigType>) => void;
}

export default function VentilationConfig({
  ventilation: propVent,
  onChange,
}: VentilationConfigProps) {
  // Accept 0–1 or 0–100 and normalize to 0–1
  const normalizedEta =
    typeof propVent?.heatRecoveryEfficiency === "number"
      ? propVent!.heatRecoveryEfficiency > 1
        ? propVent!.heatRecoveryEfficiency / 100
        : propVent!.heatRecoveryEfficiency
      : 0;

  const [vent, setVent] = useState<VentilationConfigType>({
    roomType: propVent?.roomType ?? "living",
    targetTemp: propVent?.targetTemp ?? 20,
    airExchangeRate: propVent?.airExchangeRate ?? 0.5,
    ventilationSystem: !!propVent?.ventilationSystem,
    heatRecoveryEfficiency: normalizedEta,
    internalGainsW: propVent?.internalGainsW ?? 0,
  });

  const handleChange = <K extends keyof VentilationConfigType>(
    key: K,
    value: VentilationConfigType[K]
  ) => {
    setVent((v) => ({ ...v, [key]: value }));
    onChange({ [key]: value } as Pick<VentilationConfigType, K>);
  };

  // Update defaults when room type changes
  useEffect(() => {
    const def = DEFAULTS[vent.roomType || "custom"];
    if (!def) return;
    if (vent.targetTemp !== def.temp) handleChange("targetTemp", def.temp);
    if (vent.airExchangeRate !== def.ach) handleChange("airExchangeRate", def.ach);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vent.roomType]);

  // UI percent (0–95 %), stored as fraction (0–0.95)
  const etaPercent =
    Math.round(((vent.heatRecoveryEfficiency ?? 0) * 100 + Number.EPSILON) * 10) /
    10;

  return (
    <Box mb={4}>
      <Typography variant="subtitle1" color="text.primary" fontWeight={700} gutterBottom>
        Lüftungsdaten
      </Typography>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Raumtyp */}
        <Grid item xs={12} md={6}>
          <TextField
            select
            label="Raumtyp"
            size="small"
            fullWidth
            value={vent.roomType}
            onChange={(e) => handleChange("roomType", e.target.value as any)}
            sx={pillFieldSx}
            helperText=" "
            InputLabelProps={labelChipProps}
          >
            {Object.keys(DEFAULTS).map((key) => (
              <MenuItem key={key} value={key}>
                {ROOM_TYPE_LABELS[key] || key}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Soll-Temperatur */}
        <Grid item xs={12} md={3}>
          <TextField
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                Soll-Temperatur
                <Tooltip title="Ziel-Innentemperatur in °C">
                  <InfoIcon fontSize="small" />
                </Tooltip>
              </Box>
            }
            type="number"
            size="small"
            fullWidth
            value={vent.targetTemp}
            onChange={(e) =>
              handleChange("targetTemp", parseFloat(e.target.value) || 0)
            }
            InputProps={{
              inputProps: { min: 0, step: 0.5 },
              endAdornment: (
                <InputAdornment position="end" sx={{ color: "text.secondary", mr: 0 }}>
                  °C
                </InputAdornment>
              ),
            }}
            sx={pillFieldSx}
            helperText=" "
            InputLabelProps={labelChipProps}
          />
        </Grid>

        {/* Luftwechsel (ACH) */}
        <Grid item xs={12} md={3}>
          <TextField
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                Luftwechsel
                <Tooltip title="Anzahl der Luftwechsel pro Stunde (ACH)">
                  <InfoIcon fontSize="small" />
                </Tooltip>
              </Box>
            }
            type="number"
            size="small"
            fullWidth
            value={vent.airExchangeRate}
            onChange={(e) =>
              handleChange("airExchangeRate", parseFloat(e.target.value) || 0)
            }
            InputProps={{
              inputProps: { min: 0, max: 2, step: 0.1 }, // ✅ 0–2 1/h
              endAdornment: (
                <InputAdornment position="end" sx={{ color: "text.secondary", mr: 0 }}>
                  1/h
                </InputAdornment>
              ),
            }}
            sx={pillFieldSx}
            helperText=" "
            InputLabelProps={labelChipProps}
          />
        </Grid>

        {/* Lüftungsanlage vorhanden */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!vent.ventilationSystem}
                onChange={(e) => {
                  const checked = e.target.checked;
                  handleChange("ventilationSystem", checked);
                  if (!checked) handleChange("heatRecoveryEfficiency", 0);
                }}
                sx={checkboxSx}
              />
            }
            label="Lüftungsanlage vorhanden?"
          />
        </Grid>

        {/* Wärmerückgewinnung (UI percent, stored fraction) */}
        {vent.ventilationSystem && (
          <Grid item xs={12} md={6}>
            <TextField
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  Wärmerückgewinnung
                  <Tooltip title="Effizienz in %, intern als Anteil 0–1 gespeichert">
                    <InfoIcon fontSize="small" />
                  </Tooltip>
                </Box>
              }
              type="number"
              size="small"
              fullWidth
              value={etaPercent}
              onChange={(e) => {
                const raw = parseFloat(e.target.value);
                const clampedPct = Math.max(0, Math.min(95, isFinite(raw) ? raw : 0));
                handleChange("heatRecoveryEfficiency", clampedPct / 100);
              }}
              InputProps={{
                inputProps: { min: 0, max: 95, step: 1 }, // ✅ 0–95 %
                endAdornment: (
                  <InputAdornment position="end" sx={{ color: "text.secondary", mr: 0 }}>
                    %
                  </InputAdornment>
                ),
              }}
              sx={pillFieldSx}
              helperText="0–95 % üblich (intern 0–0,95)"
              InputLabelProps={labelChipProps}
            />
          </Grid>
        )}

        {/* Interne Wärmequellen */}
        <Grid item xs={12} md={6}>
          <TextField
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                Interne Wärmequellen
                <Tooltip title="Interne Lasten (Personen/Geräte) in Watt">
                  <InfoIcon fontSize="small" />
                </Tooltip>
              </Box>
            }
            type="number"
            size="small"
            fullWidth
            value={vent.internalGainsW}
            onChange={(e) =>
              handleChange("internalGainsW", parseFloat(e.target.value) || 0)
            }
            InputProps={{
              inputProps: { min: 0, step: 10 },
              endAdornment: (
                <InputAdornment position="end" sx={{ color: "text.secondary", mr: 0 }}>
                  W
                </InputAdornment>
              ),
            }}
            sx={pillFieldSx}
            helperText=" "
            InputLabelProps={labelChipProps}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
