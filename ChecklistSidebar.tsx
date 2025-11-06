// src/pages/projectView/components/HeatLoadCalculator/checklist/ChecklistSidebar.tsx
import React from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  useTheme,
  SxProps,
  Theme,
  ListItemIcon,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

import CardContainer from "../CardContainer";
import { colors, spacing, radii, fontSizes } from "../designTokens";
import { useAppState } from "../useAppState";

export interface ChecklistSidebarProps {
  step: number;
  onStepSelect: (step: number) => void;
}

// Display order: (card 1) Gebäude, Stockwerke, Ergebnisse  • (card 2) Grundmaterialien
const MAIN_STEPS = ["Gebäude", "Stockwerke", "Ergebnisse"] as const;
const MATERIALS_STEP = "Grundmaterialien" as const;

const headerSx: SxProps<Theme> = {
  fontWeight: 700,
  color: colors.textMain,
  fontSize: fontSizes.lg,
  mb: spacing.sm,
};

/* ---------------------- Completion checks per step ---------------------- */
function isBuildingComplete(state: ReturnType<typeof useAppState>) {
  const b = state.building;
  const hasAddress = (b.address ?? "").trim().length > 0;
  const hasType = (b.buildingType ?? "").trim().length > 0;
  const hasEra = !!b.buildingEra;
  const hasInsulation = !!b.insulationLevel;
  return hasAddress && hasType && hasEra && hasInsulation;
}

function isFloorsComplete(state: ReturnType<typeof useAppState>) {
  if (!state.floors.length) return false;
  const rooms = state.floors.flatMap((f) => f.rooms || []);
  if (!rooms.length) return false;

  const everyRoomHasBasics = rooms.every((r) => {
    const hasArea = Number(r.area) > 0;
    const hasHeight = Number(r.height) > 0;
    const hasTemp =
      r.targetTemperature !== undefined && r.targetTemperature !== null;
    const hasEnvelope =
      (r.walls?.length ?? 0) +
        (r.windows?.length ?? 0) +
        (r.doors?.length ?? 0) >
        0 ||
      (!!r.ceilingConfig && !!r.floorConfig);
    return hasArea && hasHeight && hasTemp && hasEnvelope;
  });

  return everyRoomHasBasics;
}

function isResultsComplete(state: ReturnType<typeof useAppState>) {
  return !!state.calculationResults;
}

function isMaterialsComplete(state: ReturnType<typeof useAppState>) {
  const rooms = state.floors.flatMap((f) => f.rooms || []);
  return rooms.length > 0;
}
/* ---------------------------------------------------------------------- */

const ChecklistSidebar: React.FC<ChecklistSidebarProps> = ({
  step,
  onStepSelect,
}) => {
  const theme = useTheme();
  const topOffset = theme.spacing(12.5);
  const state = useAppState();

  const completeFlags = [
    isBuildingComplete(state), // 0
    isFloorsComplete(state),   // 1
    isResultsComplete(state),  // 2
    isMaterialsComplete(state) // 3
  ];

  const hasRooms = state.floors.flatMap((f) => f.rooms || []).length > 0;
  const canOpenResults = completeFlags[0] && completeFlags[1];

  const renderItem = (label: string, idx: number, disabled: boolean) => {
    const isActive = step === idx;
    const isComplete = completeFlags[idx];
    const isMaterials = label === MATERIALS_STEP;

    const handleClick = () => {
      if (!disabled) onStepSelect(idx);
    };

    return (
      <ListItemButton
        key={label}
        onClick={handleClick}
        disabled={disabled}
        sx={{
          pl: isMaterials ? spacing.sm : spacing.sm,
          pr: isMaterials ? spacing.sm : spacing.lg,
          py: spacing.sm,
          borderRadius: radii.md,
          gap: isMaterials ? 0 : spacing.sm,
          position: "relative",
          transition:
            "background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease",
          backgroundColor: isActive ? colors.yellowSubtle : "transparent",
          border: isActive ? `1px solid ${colors.grayBorder}` : "1px solid transparent",
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
          justifyContent: isMaterials ? "center" : "flex-start", // ⬅ center Grundmaterialien
          "&:hover": !disabled
            ? { backgroundColor: colors.yellowSubtle, borderColor: colors.grayBorder }
            : undefined,
          "&:hover .edit-step": { visibility: disabled ? "hidden" : "visible" },
        }}
      >
        {/* No left icon for Grundmaterialien */}
        {!isMaterials && (
          <ListItemIcon
            sx={{
              minWidth: 28,
              mr: spacing.xs,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {(isActive || isComplete) ? (
              <CheckCircleIcon fontSize="small" sx={{ color: colors.primaryBlue }} />
            ) : (
              <RadioButtonUncheckedIcon fontSize="small" sx={{ color: colors.grayText }} />
            )}
          </ListItemIcon>
        )}

        <ListItemText
          sx={{ flex: isMaterials ? "0 0 auto" : "1 1 auto" }} // ⬅ prevent stretching so centering works
          primaryTypographyProps={{
            sx: {
              fontWeight: 600,
              color: colors.textMain,
              fontSize: fontSizes.base,
              textAlign: isMaterials ? "center" : "left", // ⬅ center text
            },
          }}
          primary={label}
        />

        {/* Hide edit for Grundmaterialien */}
        {!disabled && !isMaterials && (
          <IconButton
            size="small"
            className="edit-step"
            sx={{
              visibility: "hidden",
              position: "absolute",
              right: spacing.xs,
              color: colors.primaryBlue,
              backgroundColor: "transparent",
              "&:hover": { backgroundColor: colors.yellowSubtle },
            }}
            aria-label={`Edit ${label}`}
          >
            <EditIcon fontSize="small" htmlColor={colors.primaryBlue} />
          </IconButton>
        )}
      </ListItemButton>
    );
  };

  return (
    <Box
      sx={{
        position: "sticky",
        top: topOffset,
        alignSelf: "flex-start",
        minWidth: 240,
        display: "flex",
        flexDirection: "column",
        gap: spacing.sm,
      }}
    >
      {/* Card 1: Core checklist (3 steps) */}
      <CardContainer
        dense
        sx={{
          overflow: "visible",
          backgroundColor: theme.palette.background.paper,
          px: spacing.md,
          pt: spacing.md,
          pb: spacing.lg,
        }}
      >
        <Typography variant="h6" sx={headerSx}>
          Checklist
        </Typography>

        <List disablePadding>
          {MAIN_STEPS.map((label, i) => {
            const globalIndex = i;
            const disabled =
              globalIndex === 2 && !canOpenResults;
            return renderItem(label, globalIndex, disabled);
          })}
        </List>
      </CardContainer>

      {/* Card 2: Grundmaterialien */}
      <CardContainer
        dense
        sx={{
          overflow: "visible",
          backgroundColor: theme.palette.background.paper,
          px: spacing.md,
          pt: spacing.xs,
          pb: spacing.md,
        }}
      >
        <List disablePadding>
          {renderItem(MATERIALS_STEP, 3, !hasRooms)}
        </List>
      </CardContainer>
    </Box>
  );
};

export default ChecklistSidebar;
