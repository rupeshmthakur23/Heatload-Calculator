// src/pages/projectView/components/HeatLoadCalculator/room/sections/WindowList.tsx

import React from "react";
import {
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Window as WindowType } from "../../types";
import { WINDOW_TYPES } from "./windowTypes";

interface WindowListProps {
  windows: WindowType[];
  onEdit: (windowObj: WindowType) => void;
  onDelete: (windowId: string) => void;
}

// Map orientation to German label
const orientationLabel = (orientation: string) => {
  switch (orientation) {
    case "North":
      return "Norden";
    case "South":
      return "Süden";
    case "East":
      return "Osten";
    case "West":
      return "Westen";
    default:
      return "–";
  }
};

const WindowList: React.FC<WindowListProps> = ({ windows, onEdit, onDelete }) => {
  if (windows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Keine Fenster definiert.
      </Typography>
    );
  }

  return (
    <List disablePadding>
      {windows.map((win, idx) => {
        const def = WINDOW_TYPES.find((t) => t.key === win.type);
        const typeLabel = def ? def.label : "Unbekannt";
        const uValueText =
          typeof win.uValue === "number" ? `${win.uValue.toFixed(2)} W/m²K` : "–";

        return (
          <React.Fragment key={win.id}>
            <ListItem
              disableGutters
              secondaryAction={
                <Box sx={{ display: "flex", gap: 1 }}>
                  <IconButton
                    edge="end"
                    aria-label="Fenster bearbeiten"
                    onClick={() => onEdit(win)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="Fenster löschen"
                    onClick={() => onDelete(win.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemButton onClick={() => onEdit(win)} sx={{ px: 0 }}>
                <ListItemText
                  primary={`Typ: ${typeLabel}`}
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      component="span"
                    >
                      <Box component="span">Fläche: {win.area.toFixed(1)} m²</Box>
                      {" • "}
                      <Box component="span">U-Wert: {uValueText}</Box>
                      {" • "}
                      <Box component="span">
                        Ausrichtung: {orientationLabel(win.orientation ?? "")}
                      </Box>
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>

            {idx < windows.length - 1 && <Divider component="li" />}
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default WindowList;
