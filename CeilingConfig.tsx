// src/pages/projectView/components/HeatLoadCalculator/room/sections/CeilingConfig.tsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  SxProps,
  Theme,
  InputAdornment,
} from "@mui/material";
import { Room } from "../../types";
import UValueVisualizer from "../UValueVisualizer";
import { CEILING_U_VALUES } from "./ceilingUValues";
import { colors, radii, spacing, fontSizes } from "../../designTokens";
import { insulationAddonOptions } from "./options"; // ✅ NEW

interface CeilingConfigProps {
  ceilingConfig: Room["ceilingConfig"];
  onChange: (partial: Partial<Room["ceilingConfig"]>) => void;
}

function midpointU(
  insulation: Room["ceilingConfig"]["insulationStandard"]
): number {
  const [min, max] = CEILING_U_VALUES[insulation] ?? [0.5, 0.5];
  return Number(((min + max) / 2).toFixed(2));
}

/** NEW: Typical ceiling/roof build-ups with approximate U-values (W/m²K). */
const MATERIAL_OPTIONS: { label: string; uValue: number }[] = [
  { label: "Stahlbetondecke (ungedämmt)", uValue: 1.20 },
  { label: "Holzbalkendecke (ungedämmt)", uValue: 0.90 },
  { label: "Holzbalkendecke + 60 mm Dämmung", uValue: 0.45 },
  { label: "Holzbalkendecke + 100 mm Dämmung", uValue: 0.30 },
  { label: "Stahlbetondecke + 80 mm Dämmung", uValue: 0.35 },
  { label: "Stahlbetondecke + 120 mm Dämmung", uValue: 0.25 },
  { label: "Sparrendach + 140 mm Dämmung", uValue: 0.22 },
  { label: "Sparrendach + 200 mm Dämmung (gut)", uValue: 0.17 },
  { label: "Warmdach (Flachdach) Standard", uValue: 0.25 },
  { label: "Passivhaus-Aufbau (sehr gut)", uValue: 0.10 },
];

export default function CeilingConfig({
  ceilingConfig,
  onChange,
}: CeilingConfigProps) {
  // keep selected material locally; we only write its U-value into the model
  const [materialIndex, setMaterialIndex] = useState<number | "">("");

  useEffect(() => {
    if (
      !(
        typeof ceilingConfig.uValue === "number" &&
        isFinite(ceilingConfig.uValue) &&
        ceilingConfig.uValue > 0
      )
    ) {
      onChange({ uValue: midpointU(ceilingConfig.insulationStandard) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInsulationChange = (
    insulation: Room["ceilingConfig"]["insulationStandard"]
  ) => {
    onChange({
      insulationStandard: insulation,
      uValue: midpointU(insulation),
    });
    // reset material selection because uValue now follows insulation preset
    setMaterialIndex("");
  };

  const handleMaterialPick = (indexStr: string) => {
    if (indexStr === "") {
      setMaterialIndex("");
      return;
    }
    const idx = parseInt(indexStr, 10);
    const opt = MATERIAL_OPTIONS[idx];
    setMaterialIndex(idx);
    if (opt) onChange({ uValue: opt.uValue });
  };

  // 🔵 One pill style used on ALL fields (text + select)
  const pillFieldSx: SxProps<Theme> = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 9999, // <- makes the field oval
      "& fieldset": { borderColor: "rgba(0,0,0,0.12)" },
      "&:hover fieldset": { borderColor: colors.grayBorder },
      "&.Mui-focused fieldset": { borderColor: colors.primaryBlue, borderWidth: 1.5 },
    },
    "& .MuiInputBase-input": { padding: "8px 14px" },
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
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        border: `1.5px solid ${colors.grayStroke}`,
        borderRadius: radii.sm,
      },
    },
  };

  const uValue =
    typeof ceilingConfig.uValue === "number" ? ceilingConfig.uValue : 0;

  return (
    <Box mb={spacing.lg} sx={{ minWidth: 0, width: "100%" }}>
      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ fontWeight: 600, fontSize: fontSizes.base, color: colors.textMain }}
      >
        Decke
      </Typography>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Fläche */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Fläche"
            type="number"
            variant="outlined"
            size="small"
            fullWidth
            sx={pillFieldSx}
            value={ceilingConfig.area ?? 0}
            onChange={(e) => onChange({ area: parseFloat(e.target.value) || 0 })}
            InputProps={{
              inputProps: { min: 0.1, step: 0.1 },
              endAdornment: <InputAdornment position="end">m²</InputAdornment>,
            }}
          />
        </Grid>

        {/* Dämmstandard */}
        <Grid item xs={12} md={6}>
          <TextField
            select
            label="Dämmstandard"
            variant="outlined"
            size="small"
            fullWidth
            sx={pillFieldSx}
            value={ceilingConfig.insulationStandard}
            onChange={(e) =>
              handleInsulationChange(
                e.target.value as Room["ceilingConfig"]["insulationStandard"]
              )
            }
          >
            <MenuItem value="none">Ungedämmt</MenuItem>
            <MenuItem value="standard">Standard</MenuItem>
            <MenuItem value="passive">Passivhaus</MenuItem>
          </TextField>
        </Grid>

        {/* NEW: Zusatzdämmung (stored as string on ceilingConfig.addon) */}
        <Grid item xs={12} md={6}>
          <TextField
            select
            label="Zusatzdämmung"
            variant="outlined"
            size="small"
            fullWidth
            sx={pillFieldSx}
            value={ceilingConfig.addon ?? ""}
            onChange={(e) => onChange({ addon: e.target.value || undefined })}
            helperText="Optional. Dokumentiert zusätzliche Dämmstärke."
          >
            <MenuItem value="">
              <em>Keine Auswahl</em>
            </MenuItem>
            {insulationAddonOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Material (typisch) presets -> sets U-value */}
        <Grid item xs={12} md={6}>
          <TextField
            select
            label="Material (typisch)"
            variant="outlined"
            size="small"
            fullWidth
            sx={pillFieldSx}
            value={materialIndex}
            onChange={(e) => handleMaterialPick(e.target.value)}
            helperText="Auswahl setzt den U-Wert automatisch. Danach manuell anpassbar."
          >
            <MenuItem value="">– Kein Preset –</MenuItem>
            {MATERIAL_OPTIONS.map((opt, idx) => (
              <MenuItem key={opt.label} value={idx.toString()}>
                {opt.label} · {opt.uValue} W/m²K
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* U-Wert (editable) */}
        <Grid item xs={12} md={6}>
          <TextField
            label="U-Wert"
            type="number"
            variant="outlined"
            size="small"
            fullWidth
            sx={pillFieldSx}
            value={uValue || ""}
            onChange={(e) => onChange({ uValue: parseFloat(e.target.value) || 0 })}
            InputProps={{
              inputProps: { min: 0, step: 0.01 },
              endAdornment: <InputAdornment position="end">W/m²K</InputAdornment>,
            }}
            helperText="Kann vom Dämmstandard oder Material-Preset abweichen (manuelle Eingabe möglich)."
          />
        </Grid>

        {/* Visual helper */}
        <Grid item xs={12} md={6}>
          <UValueVisualizer
            label="U-Wert (Vorschau)"
            value={uValue}
            editable={false}
          />
        </Grid>

        {/* Dachtyp */}
        <Grid item xs={12} md={6}>
          <TextField
            select
            label="Dachtyp"
            variant="outlined"
            size="small"
            fullWidth
            sx={pillFieldSx}
            value={ceilingConfig.roofType}
            onChange={(e) =>
              onChange({
                roofType: e.target.value as Room["ceilingConfig"]["roofType"],
              })
            }
          >
            <MenuItem value="Flachdach">Flachdach</MenuItem>
            <MenuItem value="Satteldach">Satteldach</MenuItem>
            <MenuItem value="Walmdach">Walmdach</MenuItem>
          </TextField>
        </Grid>

        {/* Kniestockhöhe */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Kniestockhöhe"
            type="number"
            variant="outlined"
            size="small"
            fullWidth
            sx={pillFieldSx}
            value={ceilingConfig.kniestockHeight ?? 0}
            onChange={(e) =>
              onChange({ kniestockHeight: parseFloat(e.target.value) || 0 })
            }
            InputProps={{
              inputProps: { min: 0, step: 0.1 },
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
        </Grid>

        {/* Dachfenster */}
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!ceilingConfig.dachfenster}
                onChange={(e) => onChange({ dachfenster: e.target.checked })}
                sx={checkboxSx}
              />
            }
            label="Dachfenster vorhanden?"
          />
        </Grid>

        {/* Gauben */}
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!ceilingConfig.gauben}
                onChange={(e) => onChange({ gauben: e.target.checked })}
                sx={checkboxSx}
              />
            }
            label="Gauben vorhanden?"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
