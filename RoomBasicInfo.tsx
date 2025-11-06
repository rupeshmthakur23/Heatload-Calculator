// src/pages/projectView/components/HeatLoadCalculator/room/RoomBasicInfo.tsx
import React from "react";
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  SxProps,
  Theme,
} from "@mui/material";
import { colors, radii, spacing } from "../../designTokens";

interface RoomBasicInfoProps {
  basic: {
    name: string;
    area: number;
    height: number;
    targetTemperature: number;
  };
  onChange: (partial: {
    name?: string;
    area?: number;
    height?: number;
    targetTemperature?: number;
  }) => void;
}

const inputSx: SxProps<Theme> = {
  "& .MuiInputBase-input": { py: 1, px: 1.5 },
};

// Borderless-at-rest input (consistent with RoomPanel)
const softInputSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    borderRadius: radii.md,
    backgroundColor: "transparent",
    "& fieldset": { borderColor: "transparent" },              // rest
    "&:hover fieldset": { borderColor: colors.grayBorder },    // hover
    "&.Mui-focused fieldset": {                                // focus
      borderColor: colors.primaryBlue,
      borderWidth: 1.5,
    },
    "&.Mui-error": { backgroundColor: "rgba(220,38,38,0.06)" },
    "&.Mui-error fieldset": { borderColor: "transparent" },
  },
  "& .MuiFormHelperText-root": { mt: 0.5 },
};

const RoomBasicInfo: React.FC<RoomBasicInfoProps> = ({ basic, onChange }) => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Raumname */}
        <Grid item xs={12} md={3}>
          <TextField
            label="Raumname"
            placeholder="z. B. Wohnzimmer"
            variant="outlined"
            size="small"
            value={basic.name}
            onChange={(e) => onChange({ name: e.target.value })}
            fullWidth
            sx={{ ...inputSx, ...softInputSx }}
            helperText={" "}
          />
        </Grid>

        {/* Fläche */}
        <Grid item xs={6} md={3}>
          <TextField
            label="Fläche"
            placeholder="z. B. 20"
            type="number"
            variant="outlined"
            size="small"
            value={basic.area}
            onChange={(e) => onChange({ area: parseFloat(e.target.value) || 0 })}
            fullWidth
            InputProps={{
              inputProps: { min: 0, step: 0.1 },
              endAdornment: (
                <InputAdornment position="end" sx={{ alignSelf: "center", color: "text.secondary", mr: 0 }}>
                  m²
                </InputAdornment>
              ),
            }}
            sx={{ ...inputSx, ...softInputSx }}
            helperText={" "}
          />
        </Grid>

        {/* Raumhöhe */}
        <Grid item xs={6} md={3}>
          <TextField
            label="Raumhöhe"
            placeholder="z. B. 2.5"
            type="number"
            variant="outlined"
            size="small"
            value={basic.height}
            onChange={(e) => onChange({ height: parseFloat(e.target.value) || 0 })}
            fullWidth
            InputProps={{
              inputProps: { min: 0, step: 0.1 },
              endAdornment: (
                <InputAdornment position="end" sx={{ alignSelf: "center", color: "text.secondary", mr: 0 }}>
                  m
                </InputAdornment>
              ),
            }}
            sx={{ ...inputSx, ...softInputSx }}
            helperText={" "}
          />
        </Grid>

        {/* Soll-Temperatur */}
        <Grid item xs={6} md={3}>
          <TextField
            label="Soll-Temperatur"
            placeholder="z. B. 20"
            type="number"
            variant="outlined"
            size="small"
            value={basic.targetTemperature}
            onChange={(e) => onChange({ targetTemperature: parseFloat(e.target.value) || 0 })}
            fullWidth
            InputProps={{
              inputProps: { min: 5, max: 30, step: 0.5 },
              endAdornment: (
                <InputAdornment position="end" sx={{ alignSelf: "center", color: "text.secondary", mr: 0 }}>
                  °C
                </InputAdornment>
              ),
            }}
            InputLabelProps={{ sx: { whiteSpace: "normal" } }}
            sx={{ ...inputSx, ...softInputSx }}
            helperText={" "}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default RoomBasicInfo;
