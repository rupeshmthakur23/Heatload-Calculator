import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Tooltip,
  TextField,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";
import InfoIcon from "@mui/icons-material/Info";
import AddIcon from "@mui/icons-material/Add";

import { Wall } from "../../types";
import WallList from "./WallList";
import PrimaryButton from "../../PrimaryButton";
import { WALL_TYPES } from "./wallTypes";
import { WALL_U_VALUES } from "./wallUValues";
import { colors, radii, spacing } from "../../designTokens";
import { v4 as uuidv4 } from "uuid";
import UValueVisualizer from "../UValueVisualizer";

interface WallConfigProps {
  walls: Wall[];
  onChange: (newWalls: Wall[]) => void;
}

const tightFieldSx: SystemStyleObject<Theme> = {
  maxWidth: "100%",
  "& .MuiOutlinedInput-root": {
    height: 36,
    borderRadius: radii.md,
    backgroundColor: "transparent",
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: colors.grayBorder },
    "&.Mui-focused fieldset": { borderColor: colors.primaryBlue, borderWidth: 1.5 },
  },
  "& .MuiInputBase-input": { padding: "8px 12px" },
  "& .MuiInputAdornment-root": { color: "text.secondary" },
};

const typeWidthSx: SystemStyleObject<Theme> = {
  width: { xs: "100%", sm: 280 },
  flex: "0 0 auto",
  minWidth: 0,
};

const numWidthSx: SystemStyleObject<Theme> = {
  width: { xs: "100%", sm: 170 },
  flex: "0 0 auto",
  minWidth: 0,
};

const fullWidthSx: SystemStyleObject<Theme> = { width: "100%", minWidth: 0 };

const rowSx: SystemStyleObject<Theme> = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-end",
  gap: 2,
  minWidth: 0,
  width: "100%",
  overflowX: "hidden",
};

export default function WallConfig({ walls, onChange }: WallConfigProps) {
  const getMidpointUValue = (type: string): number => {
    const range = WALL_U_VALUES[type];
    if (!range || range.length < 2) return 0.5;
    const [min, max] = range;
    return Number(((min + max) / 2).toFixed(2));
  };

  const defaultType = WALL_TYPES[0].key;

  const [editingWall, setEditingWall] = useState<Wall | null>(null);
  const [inlineOpen, setInlineOpen] = useState(false);

  useEffect(() => {
    if (!editingWall) return;
    setEditingWall((w) => (w ? { ...w, uValue: getMidpointUValue(w.type) } : w));
  }, [editingWall?.type]);

  const makeDefaultName = (): string => {
    const base = "Wand";
    let n = walls.length + 1;
    let candidate = `${base} ${n}`;
    const names = new Set(walls.map((w) => (w.name || "").trim()));
    while (names.has(candidate)) {
      n += 1;
      candidate = `${base} ${n}`;
    }
    return candidate;
  };

  const onAdd = () => {
    setEditingWall({
      id: uuidv4(),
      name: makeDefaultName(),
      type: defaultType,
      material: "",
      customMaterial: "",
      isExterior: true,
      uValue: getMidpointUValue(defaultType),
      area: 0,
      length: 0,
    });
    setInlineOpen(true);
  };

  const onEdit = (w: Wall) => {
    setEditingWall({
      ...w,
      name: (w.name || makeDefaultName()).trim(),
      uValue:
        typeof w.uValue === "number" && isFinite(w.uValue) && w.uValue > 0
          ? w.uValue
          : getMidpointUValue(w.type),
    });
    setInlineOpen(true);
  };

  const onCancel = () => {
    setInlineOpen(false);
    setEditingWall(null);
  };

  const onSave = (w: Wall) => {
    const sanitized: Wall = {
      ...w,
      name: (w.name || makeDefaultName()).trim(),
      area: Number(w.area) || 0,
      length: Number(w.length) || 0,
      uValue: Number(w.uValue) || 0,
    };

    const updated = walls.some((x) => x.id === sanitized.id)
      ? walls.map((x) => (x.id === sanitized.id ? sanitized : x))
      : [...walls, sanitized];

    onChange(updated);
    setInlineOpen(false);
    setEditingWall(null);
  };

  const onDelete = (id: string) => onChange(walls.filter((x) => x.id !== id));

  const currentRange =
    editingWall && WALL_U_VALUES[editingWall.type]
      ? WALL_U_VALUES[editingWall.type]
      : undefined;

  const numericInvalid =
    !editingWall ||
    (editingWall.area ?? 0) <= 0 ||
    (editingWall.length ?? 0) <= 0 ||
    !(((editingWall.uValue ?? 0) as number) > 0);

  const [minU, maxU] = currentRange ?? [0.1, 3];

  return (
    <Box mb={4} sx={{ minWidth: 0 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={spacing.xs}>
        <Box display="flex" alignItems="center" gap={spacing.xs}>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Wände
          </Typography>
          <Tooltip title="Definieren Sie für jede Wand Fläche und U-Wert.">
            <InfoIcon fontSize="small" />
          </Tooltip>
        </Box>
        <PrimaryButton size="small" startIcon={<AddIcon />} onClick={onAdd}>
          Neue Wand
        </PrimaryButton>
      </Box>

      {inlineOpen && editingWall && (
        <Box
          mb={spacing.md}
          p={spacing.md}
          sx={{
            border: `1px solid ${colors.grayBorder}`,
            borderRadius: radii.md,
            backgroundColor: "background.paper",
            overflowX: "hidden",
            minWidth: 0,
          }}
        >
          <Box sx={{ mb: 1, minWidth: 0 }}>
            <TextField
              label="Name der Wand"
              size="small"
              margin="dense"
              value={editingWall.name}
              onChange={(e) =>
                setEditingWall((w) => (w ? { ...w, name: e.target.value } : w))
              }
              sx={[tightFieldSx, fullWidthSx]}
            />
          </Box>

          <Box sx={rowSx}>
            <TextField
              label="Wandtyp"
              select
              size="small"
              margin="dense"
              value={editingWall.type}
              onChange={(e) =>
                setEditingWall((w) => (w ? { ...w, type: e.target.value } : w))
              }
              required
              sx={[tightFieldSx, typeWidthSx]}
            >
              {WALL_TYPES.map((t) => (
                <MenuItem key={t.key} value={t.key}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>

            {/* 🎨 Colored U-value chart (editable) replaces plain number input */}
            <Box sx={[fullWidthSx]} mt={1}>
              <UValueVisualizer
                label="U-Wert (W/m²K)"
                value={editingWall.uValue ?? minU}
                onChange={(val: number) =>
                  setEditingWall((w) => (w ? { ...w, uValue: Number(val) } : w))
                }
                min={minU}
                max={maxU}
                editable
              />
              {currentRange && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  Empfohlen: {currentRange[0]}–{currentRange[1]} W/m²K
                </Typography>
              )}
            </Box>

            <TextField
              label="Fläche"
              type="number"
              size="small"
              margin="dense"
              value={editingWall.area}
              onChange={(e) =>
                setEditingWall((w) => (w ? { ...w, area: Number(e.target.value) } : w))
              }
              inputProps={{ min: 0, step: 0.1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">m²</InputAdornment>,
              }}
              required
              sx={[tightFieldSx, numWidthSx]}
            />

            <TextField
              label="Länge"
              type="number"
              size="small"
              margin="dense"
              value={editingWall.length}
              onChange={(e) =>
                setEditingWall((w) => (w ? { ...w, length: Number(e.target.value) } : w))
              }
              inputProps={{ min: 0, step: 0.1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">m</InputAdornment>,
              }}
              required
              sx={[tightFieldSx, numWidthSx]}
            />
          </Box>

          <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
            <PrimaryButton size="small" onClick={onCancel}>
              Abbrechen
            </PrimaryButton>
            <PrimaryButton
              size="small"
              onClick={() => editingWall && onSave(editingWall)}
              disabled={numericInvalid}
            >
              {walls.some((x) => x.id === editingWall.id) ? "Speichern" : "Hinzufügen"}
            </PrimaryButton>
          </Box>
        </Box>
      )}

      <WallList walls={walls} onEdit={onEdit} onDelete={onDelete} />
    </Box>
  );
}
