// src/pages/projectView/components/HeatLoadCalculator/room/sections/WallEditInline.tsx

import React, { useMemo, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Divider,
  InputAdornment,
  Typography,
  SxProps,
  Theme,
} from "@mui/material";

import CardContainer from "../../CardContainer";
import PrimaryButton from "../../PrimaryButton";
import PillButton from "../../PillButton";

import UValueVisualizer from "../UValueVisualizer";
import { WALL_TYPES } from "./wallTypes";
import { WALL_U_VALUES } from "./wallUValues";
import { Wall } from "../../types";
import { v4 as uuidv4 } from "uuid";
import { insulationAddonOptions } from "./options"; // NEW

interface WallEditInlineProps {
  initialWall: Wall | null;
  onSave: (w: Wall) => void;
  onClose: () => void;
}

/* compact input styling */
const inputSx: SxProps<Theme> = {
  "& .MuiInputBase-input": { padding: "8px 12px" },
};
const compactFormSx: SxProps<Theme> = {
  "& .MuiFormControl-root": { marginBottom: 12 },
  "& .MuiInputLabel-root": { fontSize: 13 },
};

/* helpers */
const parseDE = (v: string | number | undefined) => {
  if (v === undefined || v === null) return NaN;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};
const midpointU = (type: string): number => {
  const r = WALL_U_VALUES[type];
  if (!r) return 0.5;
  const [min, max] = r;
  return Number(((min + max) / 2).toFixed(2));
};

export default function WallEditInline({
  initialWall,
  onSave,
  onClose,
}: WallEditInlineProps) {
  const defaultType = WALL_TYPES[0].key;

  const [name, setName] = useState<string>(initialWall?.name ?? "");
  const [type, setType] = useState<string>(initialWall?.type ?? defaultType);
  const [uValue, setUValue] = useState<number>(
    initialWall?.uValue ?? midpointU(initialWall?.type ?? defaultType)
  );
  const [areaInput, setAreaInput] = useState<string>(
    initialWall?.area != null ? String(initialWall.area) : ""
  );
  const [lengthInput, setLengthInput] = useState<string>(
    initialWall?.length != null ? String(initialWall.length) : ""
  );
  const [addon, setAddon] = useState<string>(initialWall?.addon ?? ""); // NEW

  const area = parseDE(areaInput);
  const length = parseDE(lengthInput);
  const range = WALL_U_VALUES[type]; // recommended band, if present

  const canAdd = useMemo(
    () =>
      name.trim().length > 0 &&
      Number.isFinite(uValue) &&
      uValue > 0 &&
      Number.isFinite(area) &&
      area > 0 &&
      Number.isFinite(length) &&
      length > 0,
    [name, uValue, area, length]
  );

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setUValue(midpointU(newType));
  };

  const handleAdd = () => {
    if (!canAdd) return;
    const next: Wall = {
      id: initialWall?.id ?? uuidv4(),
      name: name.trim(),
      type,
      material: initialWall?.material ?? "",
      customMaterial: initialWall?.customMaterial ?? "",
      isExterior: initialWall?.isExterior ?? true,
      uValue: Number(uValue),
      area: Number(area),
      length: Number(length),
      addon: addon || undefined, // NEW
    };
    onSave(next);
  };

  return (
    <CardContainer sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h6" gutterBottom>
        Wand bearbeiten
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Box sx={compactFormSx}>
        <Grid container spacing={{ xs: 2, md: 2.5 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Name der Wand"
              required
              size="small"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={inputSx}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Wandtyp"
              required
              size="small"
              fullWidth
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              sx={inputSx}
            >
              {WALL_TYPES.map((t) => (
                <MenuItem key={t.key} value={t.key}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Colored chart / slider */}
          <Grid item xs={12}>
            <UValueVisualizer
              label="U-Wert (W/m²K)"
              value={uValue}
              editable
              onChange={(v) => setUValue(Number(v.toFixed(2)))}
              min={0}
              max={3.5}
            />
          </Grid>

          {/* Manual numeric input */}
          <Grid item xs={12}>
            <TextField
              label="U-Wert manuell eingeben"
              type="number"
              size="small"
              fullWidth
              value={Number.isFinite(uValue) ? uValue : ""}
              onChange={(e) => setUValue(parseDE(e.target.value) || 0)}
              InputProps={{
                inputProps: { step: 0.01, min: 0 },
                endAdornment: (
                  <InputAdornment position="end">W/m²K</InputAdornment>
                ),
              }}
              sx={inputSx}
            />
            {range && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Empfohlen: {range[0]}–{range[1]} W/m²K
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Fläche"
              required
              size="small"
              fullWidth
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              InputProps={{
                inputMode: "decimal",
                endAdornment: (
                  <InputAdornment position="end">m²</InputAdornment>
                ),
              }}
              error={areaInput !== "" && (!Number.isFinite(area) || area <= 0)}
              helperText={
                areaInput !== "" && (!Number.isFinite(area) || area <= 0)
                  ? "Muss > 0 sein"
                  : " "
              }
              sx={inputSx}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Länge"
              required
              size="small"
              fullWidth
              value={lengthInput}
              onChange={(e) => setLengthInput(e.target.value)}
              InputProps={{
                inputMode: "decimal",
                endAdornment: (
                  <InputAdornment position="end">m</InputAdornment>
                ),
              }}
              error={
                lengthInput !== "" && (!Number.isFinite(length) || length <= 0)
              }
              helperText={
                lengthInput !== "" && (!Number.isFinite(length) || length <= 0)
                  ? "Muss > 0 sein"
                  : " "
              }
              sx={inputSx}
            />
          </Grid>

          {/* NEW: Zusatzdämmung */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Zusatzdämmung"
              size="small"
              fullWidth
              value={addon}
              onChange={(e) => setAddon(e.target.value)}
              sx={inputSx}
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
        </Grid>

        <Box display="flex" justifyContent="flex-end" mt={2}>
          <PillButton onClick={onClose} sx={{ mr: 1 }}>
            Abbrechen
          </PillButton>
          <PrimaryButton onClick={handleAdd} disabled={!canAdd}>
            Hinzufügen
          </PrimaryButton>
        </Box>
      </Box>
    </CardContainer>
  );
}
