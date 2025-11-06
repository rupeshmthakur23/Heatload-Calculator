// src/pages/projectView/components/HeatLoadCalculator/room/sections/AddonSelect.tsx
import React from "react";
import { Box, FormControl, Select, MenuItem, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { insulationAddonOptions } from "./options";

const topLabel: SxProps<Theme> = {
  display: "block",
  mb: 0.5,
  pl: 1,
  color: "text.secondary",
  fontSize: 12,
  lineHeight: 1.2,
  fontWeight: 600,
};

type Props = {
  value?: string;
  onValue: (v: string) => void;
  label?: string;
  sx?: SxProps<Theme>;
};

export default function AddonSelect({ value = "", onValue, label = "Zusatzdämmung", sx }: Props) {
  return (
    <Box sx={sx}>
      <Typography component="span" sx={topLabel}>{label}</Typography>
      <FormControl fullWidth size="small">
        <Select value={value} onChange={(e) => onValue(String(e.target.value))} displayEmpty>
          {insulationAddonOptions.map((opt) => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
