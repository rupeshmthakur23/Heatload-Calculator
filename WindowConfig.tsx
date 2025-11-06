// src/pages/ApplicationPage/components/HeatLoadCalculator/room/sections/WindowConfig.tsx

import React, { useState } from "react";
import { Box, Typography, Tooltip, useTheme } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import AddIcon from "@mui/icons-material/Add";
import { Window as WindowType } from "../../types";
import WindowList from "./WindowList";
import WindowEditModal from "./WindowEditModal";
import PrimaryButton from "../../PrimaryButton";
import { v4 as uuidv4 } from "uuid";


// If you keep window helpers, use them to prefill u-values:
import { WINDOW_TYPES } from "./windowTypes";
import { WINDOW_U_VALUES } from "./windowUValues";

interface WindowConfigProps {
  windows: WindowType[];
  onChange: (newWindows: WindowType[]) => void;
}

// Defaults
const defaultType = WINDOW_TYPES?.[0]?.key ?? "doublePane";

// Pick midpoint of known U-range (fallback 1.3 W/m²K)
const midpointU = (type: string): number => {
  const range = (WINDOW_U_VALUES as Record<string, [number, number] | undefined>)[type];
  if (!range || range.length < 2) return 1.3;
  const [min, max] = range;
  return Number(((min + max) / 2).toFixed(2));
};

export default function WindowConfig({ windows, onChange }: WindowConfigProps) {
  const theme = useTheme();
  const [editingWindow, setEditingWindow] = useState<WindowType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAdd = () => {
    setEditingWindow({
      id: uuidv4(),
      type: defaultType,
      area: 0,
      uValue: midpointU(defaultType),
      orientation: "South",
    } as WindowType);
    setIsModalOpen(true);
  };

  const handleEdit = (win: WindowType) => {
    const ensured: WindowType = {
      ...win,
      uValue:
        typeof win.uValue === "number" && isFinite(win.uValue) && win.uValue > 0
          ? win.uValue
          : midpointU(win.type ?? defaultType),
      type: win.type ?? defaultType,
      orientation: (win.orientation as any) ?? "South",
      area: Number(win.area) || 0,
    };
    setEditingWindow(ensured);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    onChange(windows.filter((w) => w.id !== id));
  };

  const handleSave = (updated: WindowType) => {
    const norm: WindowType = {
      ...updated,
      type: (updated.type ?? defaultType) as any,
      area: Number(updated.area) || 0,
      uValue:
        typeof updated.uValue === "number" && updated.uValue > 0
          ? Number(updated.uValue)
          : midpointU(updated.type ?? defaultType),
      orientation: (updated.orientation as any) ?? "South",
    };

    const newList = windows.some((w) => w.id === norm.id)
      ? windows.map((w) => (w.id === norm.id ? norm : w))
      : [...windows, norm];

    onChange(newList);
    setIsModalOpen(false);
    setEditingWindow(null);
  };

  return (
    <Box mb={4}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          mb: 1.5,
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle1" color="text.primary" fontWeight={700}>
            Fenster
          </Typography>
          <Tooltip title="Definieren Sie für jedes Fenster Fläche (m²), Ausrichtung und U-Wert.">
            <InfoIcon fontSize="small" />
          </Tooltip>
        </Box>

        <PrimaryButton
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ minHeight: 36 }}
        >
          Neues Fenster
        </PrimaryButton>
      </Box>

      {/* List */}
      <WindowList windows={windows} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Modal */}
      {isModalOpen && editingWindow && (
        <WindowEditModal
          initialWindow={editingWindow}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false);
            setEditingWindow(null);
          }}
        />
      )}
    </Box>
  );
}
