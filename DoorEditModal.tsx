import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Switch,
  SxProps,
  Theme,
} from "@mui/material";
import UValueVisualizer from "../UValueVisualizer";
import { DOOR_U_VALUES } from "./doorUValues";
import { Door } from "../../types";
import { v4 as uuidv4 } from "uuid";


import PrimaryButton from "../../PrimaryButton";
import PillButton from "../../PillButton";

interface DoorEditModalProps {
  initialDoor: Door | null;
  onSave: (d: Door) => void;
  onClose: () => void;
}

const tightFieldSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    height: 36,
  },
  "& .MuiInputBase-input": {
    py: 1,
    px: 1.5,
  },
};

export default function DoorEditModal({
  initialDoor,
  onSave,
  onClose,
}: DoorEditModalProps) {
  const isEditing = Boolean(initialDoor);

  const [area, setArea] = useState<number>(initialDoor?.area || 0);
  const [toUnheated, setToUnheated] = useState<boolean>(
    initialDoor?.toUnheated || false
  );
  const [uValue, setUValue] = useState<number>(0);

  useEffect(() => {
    const key = toUnheated ? "unheated" : "heated";
    const range = DOOR_U_VALUES[key] ?? [1.0, 2.0];
    const mid = Number(((range[0] + range[1]) / 2).toFixed(2));
    setUValue(mid);
  }, [toUnheated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoor: Door = {
      id: initialDoor?.id || uuidv4(),
      area,
      toUnheated,
      uValue,
    };
    onSave(newDoor);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: (theme) => theme.zIndex.modal,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          bgcolor: "background.paper",
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          width: { xs: "90%", sm: 400 },
          boxShadow: 24,
          overflowX: "hidden",
          minWidth: 0,
        }}
      >
        <Typography variant="h6" gutterBottom>
          {isEditing ? "Tür bearbeiten" : "Neue Tür hinzufügen"}
        </Typography>

        <TextField
          label="Fläche (m²)"
          type="number"
          size="small"
          fullWidth
          sx={{ mb: 2, ...tightFieldSx }}
          value={area}
          onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
          inputProps={{ min: 0.1, step: 0.1 }}
          required
        />

        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
          <Switch
            checked={toUnheated}
            onChange={(e) => setToUnheated(e.target.checked)}
          />
          <Typography ml={1}>Zu unbeheiztem Bereich?</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            U-Wert
          </Typography>
          <UValueVisualizer label="U-Wert" value={uValue} editable={false} />
        </Box>

        <Box display="flex" justifyContent="flex-end" gap={1}>
          <PillButton size="small" onClick={onClose}>
            Abbrechen
          </PillButton>
          <PrimaryButton size="small" type="submit">
            {isEditing ? "Speichern" : "Hinzufügen"}
          </PrimaryButton>
        </Box>
      </Box>
    </Box>
  );
}
