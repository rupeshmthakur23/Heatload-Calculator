// src/pages/ApplicationPage/components/HeatLoadCalculator/room/sections/PVHeatPumpConfig.tsx

import React from "react";
import {
  Box,
  Typography,
  Grid,
  FormControlLabel,
  Checkbox,
  TextField,
  MenuItem,
  Tooltip,
  InputAdornment,
  SxProps,
  Theme,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

import CardContainer from "../../CardContainer";
import { spacing, colors } from "../../designTokens";
import { PVHeatPumpSettings } from "../../types";

interface PVHeatPumpConfigProps {
  pvhp?: PVHeatPumpSettings;
  onChange: (partial: Partial<PVHeatPumpSettings>) => void;
}

/** Pill/oval textfield styling to match the rest of the app */
const pillSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    height: 40,
    borderRadius: 9999,
    alignItems: "center",
    backgroundColor: colors.grayLight,
    "& fieldset": { borderColor: colors.grayBorder },
    "&:hover fieldset": { borderColor: colors.grayBorder },
    "&.Mui-focused fieldset": { borderColor: colors.primaryBlue, borderWidth: 2 },
    "& .MuiOutlinedInput-input": { padding: "8px 12px", lineHeight: 1.3 },
    "& .MuiSelect-select": { padding: "8px 36px 8px 12px", borderRadius: 9999, lineHeight: 1.3 },
  },
  "& .MuiInputAdornment-root": { color: "text.secondary", mr: 0 },
};

/** Brand checkbox look (SolarHub blue) */
const checkboxSx: SxProps<Theme> = {
  color: colors.primaryBlue,
  "&.Mui-checked": { color: colors.primaryBlue },
  "& .MuiSvgIcon-root": {
    borderRadius: "4px",
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      top: -2,
      left: -2,
      right: -2,
      bottom: -2,
      border: `1.5px solid ${colors.grayBorder}`,
      borderRadius: "4px",
    },
  },
  // subtle, accessible focus ring
  "&.Mui-focusVisible": {
    outline: `2px solid ${colors.primaryBlue}`,
    outlineOffset: 2,
    borderRadius: 4,
  },
};

export default function PVHeatPumpConfig({
  pvhp = {
    hasPV: false,
    hasHeatPump: false,
    bufferTank: false,
  },
  onChange,
}: PVHeatPumpConfigProps) {
  return (
    <CardContainer sx={{ mb: spacing.lg }}>
      <Typography variant="h6" sx={{ mb: spacing.sm }}>
        PV & Wärmepumpe
      </Typography>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* PV vorhanden? */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={pvhp.hasPV}
                onChange={(e) =>
                  onChange({
                    hasPV: e.target.checked,
                    pvKwp: pvhp.pvKwp ?? 0,
                  })
                }
                sx={checkboxSx}
              />
            }
            label="PV-System vorhanden?"
          />
        </Grid>

        {/* PV-Leistung */}
        {pvhp.hasPV && (
          <Grid item xs={12} md={6}>
            <TextField
              sx={pillSx}
              variant="outlined"
              size="small"
              fullWidth
              type="number"
              placeholder="z. B. 5"
              label={
                <>
                  PV-Leistung (kWp)&nbsp;
                  <Tooltip title="Maximale elektrische Leistung unter Standard-Testbedingungen in kWp">
                    <InfoIcon fontSize="small" />
                  </Tooltip>
                </>
              }
              value={pvhp.pvKwp ?? ""}
              onChange={(e) => {
                const raw = parseFloat(e.target.value);
                const v = Number.isFinite(raw) ? raw : 0;
                const clamped = Math.max(0, Math.min(100, v));
                onChange({ pvKwp: clamped });
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ alignSelf: "center" }}>
                    kWp
                  </InputAdornment>
                ),
                inputProps: { min: 0, max: 100, step: 0.1 },
              }}
            />
          </Grid>
        )}

        {/* Wärmepumpe vorhanden? */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={pvhp.hasHeatPump}
                onChange={(e) =>
                  onChange({
                    hasHeatPump: e.target.checked,
                    ...(e.target.checked ? {} : { hpType: undefined, bufferTank: false }),
                  })
                }
                sx={checkboxSx}
              />
            }
            label="Wärmepumpe vorhanden/geplant?"
          />
        </Grid>

        {/* Wärmepumpentyp */}
        {pvhp.hasHeatPump && (
          <Grid item xs={12} md={6}>
            <TextField
              sx={pillSx}
              select
              variant="outlined"
              size="small"
              fullWidth
              label="Typ der Wärmepumpe"
              value={pvhp.hpType ?? ""}
              onChange={(e) => onChange({ hpType: e.target.value as PVHeatPumpSettings["hpType"] })}
            >
              <MenuItem value="air-water">Luft-Wasser</MenuItem>
              <MenuItem value="ground-water">Sole-Wasser</MenuItem>
              <MenuItem value="water-water">Wasser-Wasser</MenuItem>
              <MenuItem value="direct-evap">Direktverdampfer</MenuItem>
            </TextField>
          </Grid>
        )}

        {/* Pufferspeicher vorhanden */}
        {pvhp.hasHeatPump && (
          <>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={pvhp.bufferTank}
                    onChange={(e) => onChange({ bufferTank: e.target.checked })}
                    sx={checkboxSx}
                  />
                }
                label="Pufferspeicher vorhanden?"
              />
            </Grid>

            {pvhp.bufferTank && (
              <Grid item xs={12} md={6}>
                <TextField
                  sx={pillSx}
                  variant="outlined"
                  size="small"
                  fullWidth
                  type="number"
                  placeholder="z. B. 300"
                  label={
                    <>
                      Pufferspeicher Volumen (Liter)&nbsp;
                      <Tooltip title="Bruttovolumen des Pufferspeichers in Litern">
                        <InfoIcon fontSize="small" />
                      </Tooltip>
                    </>
                  }
                  value={pvhp.bufferSizeLiters ?? ""}
                  onChange={(e) => {
                    const raw = parseFloat(e.target.value);
                    const v = Number.isFinite(raw) ? raw : 0;
                    const clamped = Math.max(0, Math.min(2000, v));
                    onChange({ bufferSizeLiters: clamped });
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end" sx={{ alignSelf: "center" }}>
                        L
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, max: 2000, step: 10 },
                  }}
                />
              </Grid>
            )}
          </>
        )}
      </Grid>
    </CardContainer>
  );
}
