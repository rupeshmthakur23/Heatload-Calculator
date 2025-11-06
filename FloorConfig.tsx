// src/pages/projectView/components/HeatLoadCalculator/room/sections/FloorConfig.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Checkbox,
  FormControlLabel,
  SxProps,
  Theme,
  TextField,
  InputAdornment,
  Button,
  MenuItem,
} from "@mui/material";
import { Room } from "../../types";
import UValueVisualizer from "../UValueVisualizer";
import { colors } from "../../designTokens";

/* Segmented pills */
import SegmentedPills from "../../SegmentedPills";
import { insulationAddonOptions } from "./options"; // ✅ NEW

type FloorType = "beheizt" | "unbeheizt" | "erdreich" | "aussenluft";

interface FloorConfigProps {
  floorConfig: Room["floorConfig"];
  onChange: (partial: Partial<Room["floorConfig"]>) => void;
}

/** Added more material choices per floor type */
const MATERIAL_OPTIONS: Record<FloorType, { label: string; uValue: number }[]> = {
  beheizt: [
    { label: "Betonplatte", uValue: 0.30 },
    { label: "Holzbalkendecke (gedämmt)", uValue: 0.22 },
    { label: "Stahlbetondecke (gedämmt)", uValue: 0.20 },
    { label: "Massivholzplatte", uValue: 0.35 },
    { label: "Estrich auf Dämmung", uValue: 0.25 },
  ],
  unbeheizt: [
    { label: "Ziegeldecke", uValue: 0.50 },
    { label: "Holzbalkendecke (ungedämmt)", uValue: 0.70 },
    { label: "Stahlbetondecke (ungedämmt)", uValue: 0.65 },
    { label: "Trapezblech + Aufbau", uValue: 0.80 },
    { label: "Leichtbau (Gips/OSB)", uValue: 0.90 },
  ],
  erdreich: [
    { label: "Stahlbeton (ohne Dämmung)", uValue: 0.60 },
    { label: "Bodenplatte + 60 mm Dämmung", uValue: 0.35 },
    { label: "Bodenplatte + 100 mm Dämmung", uValue: 0.25 },
    { label: "Kellerdecke gedämmt (unten)", uValue: 0.28 },
    { label: "Kellerdecke ungedämmt", uValue: 0.55 },
  ],
  aussenluft: [
    { label: "Holz (ungedämmt)", uValue: 0.80 },
    { label: "Holz + 60 mm Dämmung", uValue: 0.40 },
    { label: "Holz + 100 mm Dämmung", uValue: 0.28 },
    { label: "Stahlbeton + Dämmung", uValue: 0.35 },
    { label: "Leichtbau (gedämmt)", uValue: 0.38 },
  ],
};

const inputSx: SxProps<Theme> = {
  "& .MuiInputBase-input": { py: 1, px: 1.5 },
  "& .MuiOutlinedInput-root": { borderRadius: 9999 },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grayBorder },
  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: colors.primaryBlue,
    borderWidth: 1.5,
  },
};

const selectPillSx: SxProps<Theme> = {
  ...inputSx,
  "& .MuiSelect-select": { py: 1, px: 1.5, borderRadius: 9999 },
};

const checkboxSx: SxProps<Theme> = {
  color: "#A0A0A0",
  "&.Mui-checked": { color: "#2A61E2" },
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
      border: "1.5px solid #C2C2C2",
      borderRadius: "4px",
    },
  },
};

export default function FloorConfig({ floorConfig, onChange }: FloorConfigProps) {
  const [floorType, setFloorType] = useState<FloorType>(
    (floorConfig.floorType as FloorType) || "erdreich"
  );
  const [material, setMaterial] = useState<string>(floorConfig.material || "");
  const [uValue, setUValue] = useState<number>(
    typeof floorConfig.uValue === "number" && isFinite(floorConfig.uValue) && floorConfig.uValue > 0
      ? floorConfig.uValue
      : 0
  );
  const [insulated, setInsulated] = useState<boolean>(!!floorConfig.insulated);
  const [area, setArea] = useState<number>(floorConfig.area ?? 0);

  const options = useMemo(() => MATERIAL_OPTIONS[floorType] || [], [floorType]);

  useEffect(() => {
    const current = options.find((o) => o.label === material);
    const fallback = options[0];

    if (!current && fallback) {
      setMaterial(fallback.label);
      const nextU = fallback.uValue;
      setUValue(nextU);
      onChange({ floorType, material: fallback.label, uValue: nextU });
      return;
    }

    if (current && !(uValue > 0)) {
      setUValue(current.uValue);
      onChange({ floorType, material: current.label, uValue: current.uValue });
    } else {
      onChange({ floorType });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorType, options.length]);

  const handlePickFloorType = (ft: FloorType) => setFloorType(ft);

  const handleMaterialChange = (value: string) => {
    setMaterial(value);
    const found = options.find((o) => o.label === value);
    const nextU = found?.uValue ?? uValue;
    setUValue(nextU);
    onChange({ material: value, uValue: nextU });
  };

  const handleUValueChange = (value: string) => {
    const v = parseFloat(value);
    const safe = isFinite(v) && v >= 0 ? v : 0;
    setUValue(safe);
    onChange({ uValue: safe });
  };

  const handleInsulated = (checked: boolean) => {
    setInsulated(checked);
    onChange({ insulated: checked });
  };

  const handleAreaChange = (value: string) => {
    const v = parseFloat(value);
    const safe = isFinite(v) && v >= 0 ? v : 0;
    setArea(safe);
    onChange({ area: safe });
  };

  return (
    <Box mb={4} sx={{ minWidth: 0, width: "100%" }}>
      <Typography variant="subtitle1" gutterBottom>
        Fußboden
      </Typography>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Floor Type selector (pill buttons) */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Raum unterhalb
          </Typography>

          <SegmentedPills
            options={[
              { value: "beheizt", label: "Beheizter Raum" },
              { value: "unbeheizt", label: "Unbeheizter Raum" },
              { value: "erdreich", label: "Erdreich" },
              { value: "aussenluft", label: "Außenluft" },
            ]}
            value={[floorType]}
            onChange={(next) => {
              const v = (next[0] ?? floorType) as FloorType;
              handlePickFloorType(v);
            }}
          />
        </Grid>

        {/* Area */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Fläche"
            placeholder="Fläche"
            InputLabelProps={{ shrink: true }}
            type="number"
            size="small"
            fullWidth
            sx={inputSx}
            value={area || ""}
            onChange={(e) => handleAreaChange(e.target.value)}
            InputProps={{
              inputProps: { min: 0, step: 0.1 },
              endAdornment: <InputAdornment position="end">m²</InputAdornment>,
            }}
          />
        </Grid>

        {/* Material */}
        <Grid item xs={12} md={6}>
          <TextField
            select
            label="Material"
            placeholder="Material"
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
            value={material || ""}
            onChange={(e) => handleMaterialChange(e.target.value)}
            sx={selectPillSx}
          >
            {options.map((o) => (
              <MenuItem key={o.label} value={o.label}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* ✅ NEW: Zusatzdämmung */}
        <Grid item xs={12} md={6}>
          <TextField
            select
            label="Zusatzdämmung"
            placeholder="Zusatzdämmung"
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
            value={floorConfig.addon ?? ""}
            onChange={(e) => onChange({ addon: e.target.value || undefined })}
            sx={selectPillSx}
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

        {/* Insulated toggle */}
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={insulated}
                onChange={(e) => handleInsulated(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label="Gedämmt?"
          />
        </Grid>

        {/* Editable U-value */}
        <Grid item xs={12} md={6}>
          <TextField
            label="U-Wert"
            placeholder="U-Wert"
            InputLabelProps={{ shrink: true }}
            type="number"
            size="small"
            fullWidth
            sx={inputSx}
            value={uValue || ""}
            onChange={(e) => handleUValueChange(e.target.value)}
            InputProps={{
              inputProps: { min: 0, step: 0.01 },
              endAdornment: <InputAdornment position="end">W/m²K</InputAdornment>,
            }}
            helperText="Standard wird nach Material gesetzt, kann hier überschrieben werden."
          />
        </Grid>

        {/* Read-only preview */}
        <Grid item xs={12}>
          <UValueVisualizer label="U-Wert (Vorschau)" value={uValue} editable={false} />
        </Grid>
      </Grid>
    </Box>
  );
}
