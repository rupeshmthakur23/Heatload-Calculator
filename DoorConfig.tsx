// src/pages/ApplicationPage/components/HeatLoadCalculator/room/sections/DoorConfig.tsx

import React, { useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Tooltip,
  SxProps,
  Theme,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import InfoIcon from "@mui/icons-material/Info";
import { Door } from "../../types";
import { v4 as uuidv4 } from "uuid";


// Shared UI components
import CardContainer from "../../CardContainer";
import PrimaryButton from "../../PrimaryButton";
import PillButton from "../../PillButton";

interface DoorConfigProps {
  doors: Door[];
  onChange: (newDoors: Door[]) => void;
}

const DEFAULT_DOOR_U_VALUE = 1.5;

/** Compact padding only — keep labels external so nothing gets clipped */
const inputPadding: SxProps<Theme> = {
  "& .MuiInputBase-input": {
    py: 1,
    px: 1.5,
  },
};

/** Checkbox styling */
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

/** Small, always-visible label to avoid floating label clipping */
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography
    variant="caption"
    color="text.secondary"
    sx={{ display: "block", mb: 0.5 }}
  >
    {children}
  </Typography>
);

export default function DoorConfig({ doors, onChange }: DoorConfigProps) {
  const [editingDoor, setEditingDoor] = useState<Door | null>(null);
  const [inlineOpen, setInlineOpen] = useState(false);

  const handleAdd = () => {
    setEditingDoor({
      id: uuidv4(),
      area: 0,
      toUnheated: false,
      uValue: DEFAULT_DOOR_U_VALUE,
    });
    setInlineOpen(true);
  };

  const handleEdit = (door: Door) => {
    setEditingDoor({
      ...door,
      uValue:
        typeof door.uValue === "number" && isFinite(door.uValue) && door.uValue > 0
          ? door.uValue
          : DEFAULT_DOOR_U_VALUE,
      area: Number(door.area) || 0,
      toUnheated: !!door.toUnheated,
    });
    setInlineOpen(true);
  };

  const handleDelete = (id: string) => {
    onChange(doors.filter((d) => d.id !== id));
    if (editingDoor?.id === id) {
      setInlineOpen(false);
      setEditingDoor(null);
    }
  };

  const handleSave = (door: Door) => {
    const sanitized: Door = {
      ...door,
      area: Number(door.area) || 0,
      uValue:
        typeof door.uValue === "number" && door.uValue > 0
          ? Number(door.uValue)
          : DEFAULT_DOOR_U_VALUE,
      toUnheated: !!door.toUnheated,
    };

    const updated = doors.some((d) => d.id === sanitized.id)
      ? doors.map((d) => (d.id === sanitized.id ? sanitized : d))
      : [...doors, sanitized];

    onChange(updated);
    setInlineOpen(false);
    setEditingDoor(null);
  };

  const saveDisabled =
    !editingDoor ||
    (editingDoor.area ?? 0) <= 0 ||
    !(((editingDoor.uValue ?? 0) as number) > 0);

  return (
    <Box mb={4}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1">Türen</Typography>
        <PrimaryButton size="small" startIcon={<AddIcon />} onClick={handleAdd}>
          Neue Tür
        </PrimaryButton>
      </Box>

      {/* Inline Form */}
      {inlineOpen && editingDoor && (
        <CardContainer
          sx={{
            mb: 2,
            p: { xs: 2, sm: 3, md: 4 },
            minWidth: 0,
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          <Box
            component="form"
            id="door-form-inline"
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              if (!saveDisabled) handleSave(editingDoor);
            }}
            sx={{ width: "100%", minWidth: 0 }}
          >
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {/* Area */}
              <Grid item xs={12} sm={6}>
                <FieldLabel>
                  Fläche&nbsp;
                  <Tooltip title="Türfläche für Wärmeverlustberechnung">
                    <InfoIcon fontSize="inherit" />
                  </Tooltip>
                  &nbsp;(m²)
                </FieldLabel>
                <TextField
                  placeholder="0"
                  type="number"
                  size="small"
                  fullWidth
                  sx={inputPadding}
                  value={editingDoor.area}
                  onChange={(e) =>
                    setEditingDoor((prev) =>
                      prev ? { ...prev, area: parseFloat(e.target.value) || 0 } : prev
                    )
                  }
                  inputProps={{ min: 0, step: 0.1 }}
                  required
                />
              </Grid>

              {/* U-value */}
              <Grid item xs={12} sm={6}>
                <FieldLabel>U-Wert</FieldLabel>
                <TextField
                  placeholder="z. B. 1.5"
                  type="number"
                  size="small"
                  fullWidth
                  sx={inputPadding}
                  value={editingDoor.uValue ?? ""}
                  onChange={(e) =>
                    setEditingDoor((prev) =>
                      prev ? { ...prev, uValue: parseFloat(e.target.value) || 0 } : prev
                    )
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">W/m²K</InputAdornment>,
                  }}
                  helperText="Typische Haustür: ~1.0–1.8 W/m²K"
                  inputProps={{ min: 0, step: 0.1 }}
                  required
                />
              </Grid>

              {/* Checkbox */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!editingDoor.toUnheated}
                      onChange={(e) =>
                        setEditingDoor((prev) =>
                          prev ? { ...prev, toUnheated: e.target.checked } : prev
                        )
                      }
                      sx={checkboxSx}
                    />
                  }
                  label="Zu unbeheiztem Bereich?"
                />
              </Grid>
            </Grid>

            {/* Actions */}
            <Box mt={2} textAlign="right">
              <PillButton
                size="small"
                onClick={() => {
                  setInlineOpen(false);
                  setEditingDoor(null);
                }}
                sx={{ mr: 1 }}
              >
                Abbrechen
              </PillButton>
              <PrimaryButton size="small" type="submit" form="door-form-inline" disabled={saveDisabled}>
                {doors.some((d) => d.id === editingDoor.id) ? "Speichern" : "Hinzufügen"}
              </PrimaryButton>
            </Box>
          </Box>
        </CardContainer>
      )}

      {/* Door List */}
      {doors.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Keine Türen definiert.
        </Typography>
      ) : (
        <List disablePadding>
          {doors.map((door, idx) => (
            <React.Fragment key={door.id}>
              <ListItem
                disableGutters
                button
                onClick={() => handleEdit(door)}
                secondaryAction={
                  <>
                    <IconButton edge="end" onClick={() => handleEdit(door)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(door.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={`Fläche: ${Number(door.area || 0).toFixed(1)} m²  •  U=${Number(
                    door.uValue || 0
                  ).toFixed(2)} W/m²K`}
                  secondary={door.toUnheated ? "Unbeheizter Bereich" : undefined}
                />
              </ListItem>
              {idx < doors.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
}
