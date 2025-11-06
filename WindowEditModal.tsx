// src/pages/ApplicationPage/components/HeatLoadCalculator/room/sections/WindowEditModal.tsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  SxProps,
  Theme,
} from "@mui/material";

import { Window as WindowType } from "../../types";
import { WINDOW_TYPES } from "./windowTypes";
import { WINDOW_U_VALUES, WindowTypeKey } from "./windowUValues";
import UValueVisualizer from "../UValueVisualizer";
import { v4 as uuidv4 } from "uuid";

// Shared wrappers & buttons
import CardContainer from "../../CardContainer";
import PrimaryButton from "../../PrimaryButton";
import PillButton from "../../PillButton";

// Compact input padding (UI only)
const inputSx: SxProps<Theme> = {
  "& .MuiInputBase-input": {
    py: 1,
    px: 1.5,
  },
};

// Compute midpoint U-value from range
const getUValue = (type: WindowTypeKey): number => {
  const range = WINDOW_U_VALUES[type];
  if (!range) return 2.5;
  const [min, max] = range;
  return Number(((min + max) / 2).toFixed(2));
};

interface WindowEditModalProps {
  initialWindow: WindowType | null;
  onSave: (w: WindowType) => void;
  onClose: () => void;
}

export default function WindowEditModal({
  initialWindow,
  onSave,
  onClose,
}: WindowEditModalProps) {
  const defaultType = WINDOW_TYPES[0].key as WindowTypeKey;

  const [formData, setFormData] = useState<WindowType>({
    id: uuidv4(),
    area: 0,
    type: defaultType,
    uValue: getUValue(defaultType),
    orientation: "North",
    ...initialWindow,
  });

  // Re-init when the modal opens with a different item
  useEffect(() => {
    if (initialWindow) {
      setFormData({ ...initialWindow });
    } else {
      setFormData({
        id: uuidv4(),
        area: 0,
        type: defaultType,
        uValue: getUValue(defaultType),
        orientation: "North",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWindow]);

  // Auto-update U-value on type change (UI helper)
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      uValue: getUValue(prev.type as WindowTypeKey),
    }));
  }, [formData.type]);

  const handleChange = (field: keyof WindowType, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <CardContainer sx={{ mb: 2, p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box
        sx={{
          mb: 2,
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          {initialWindow ? "Fenster bearbeiten" : "Neues Fenster hinzufügen"}
        </Typography>
      </Box>

      <Box
        component="form"
        id="window-form"
        onSubmit={handleSubmit}
        sx={{ "& .MuiTextField-root": { mb: 2 } }}
      >
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Fläche */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              label="Fläche"
              type="number"
              value={formData.area}
              onChange={(e) => {
                // allow German comma input
                const raw = e.target.value.replace(",", ".");
                const num = parseFloat(raw);
                handleChange("area", Number.isFinite(num) ? num : 0);
              }}
              inputMode="decimal"
              inputProps={{ min: 0, step: "any" }} // no browser step validation hints
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">m²</InputAdornment>
                ),
              }}
              sx={inputSx}
            />
          </Grid>

          {/* Fenstertyp */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              size="small"
              variant="outlined"
              label="Fenstertyp"
              value={formData.type}
              onChange={(e) =>
                handleChange("type", e.target.value as WindowTypeKey)
              }
              sx={inputSx}
            >
              {WINDOW_TYPES.map((t) => (
                <MenuItem key={t.key} value={t.key}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* U-Wert (read-only visual; auto from type) */}
          <Grid item xs={12}>
            <UValueVisualizer
              label="U-Wert"
              value={formData.uValue ?? 0}
              editable={false}
            />
          </Grid>

          {/* Ausrichtung */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              size="small"
              variant="outlined"
              label="Ausrichtung"
              value={formData.orientation}
              onChange={(e) => handleChange("orientation", e.target.value)}
              sx={inputSx}
            >
              {[
                { label: "Norden", value: "North" },
                { label: "Osten", value: "East" },
                { label: "Süden", value: "South" },
                { label: "Westen", value: "West" },
              ].map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {/* Actions */}
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <PillButton onClick={onClose} sx={{ mr: 1 }}>
            Abbrechen
          </PillButton>
          <PrimaryButton type="submit" form="window-form">
            {initialWindow ? "Speichern" : "Hinzufügen"}
          </PrimaryButton>
        </Box>
      </Box>
    </CardContainer>
  );
}
