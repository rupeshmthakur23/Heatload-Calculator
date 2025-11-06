// src/pages/projectView/components/HeatLoadCalculator/checklist/FloorRoomTree.tsx

import React, { useMemo, useState, useEffect } from "react";
import {
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  useTheme,
  Box,
  Collapse,
  Tooltip,
  Chip,
  Stack,
  Paper,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import LayersIcon from "@mui/icons-material/Layers";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";

import { Floor, Room } from "../types";
import PrimaryButton from "../PrimaryButton";
import CardContainer from "../CardContainer";
import { colors, spacing, fontSizes, radii } from "../designTokens";

export interface FloorRoomTreeProps {
  floors: Floor[];
  selectedRoomId: string | null;
  onAddFloor: () => void;
  onAddRoom: (floorId: string) => void;
  onDeleteFloor: (floorId: string) => void;
  onDeleteRoom: (roomId: string, floorId: string) => void;
  onRenameFloor: (floorId: string, newName: string) => void;
  onRenameRoom: (roomId: string, floorId: string, newName: string) => void;
  onRoomSelect: (roomId: string) => void;
  onReorderFloors: (floors: Floor[]) => void;
  onReorderRooms: (floorId: string, rooms: Room[]) => void;
}

export default function FloorRoomTree({
  floors,
  selectedRoomId,
  onAddFloor,
  onAddRoom,
  onDeleteFloor,
  onDeleteRoom,
  onRenameFloor,
  onRenameRoom,
  onRoomSelect,
  onReorderFloors,
  onReorderRooms,
}: FloorRoomTreeProps) {
  const theme = useTheme();

  const initial = useMemo<Record<string, boolean>>(
    () => Object.fromEntries(floors.map((f) => [f.id, true])),
    []
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>(initial);

  // Local inline-edit state for floor names
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editingFloorName, setEditingFloorName] = useState<string>("");

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const f of floors) if (next[f.id] === undefined) next[f.id] = true;
      return next;
    });

    // If currently editing a floor that no longer exists, cancel edit
    if (editingFloorId && !floors.find((f) => f.id === editingFloorId)) {
      setEditingFloorId(null);
      setEditingFloorName("");
    }
  }, [floors, editingFloorId]);

  const toggleExpanded = (floorId: string) =>
    setExpanded((p) => ({ ...p, [floorId]: !p[floorId] }));

  const startEditing = (floorId: string, currentName: string) => {
    setEditingFloorId(floorId);
    setEditingFloorName(currentName);
  };

  const commitRename = () => {
    if (!editingFloorId) return;
    const trimmed = editingFloorName.trim();
    const floor = floors.find((f) => f.id === editingFloorId);
    if (floor && trimmed && trimmed !== floor.name) {
      onRenameFloor(editingFloorId, trimmed);
    }
    setEditingFloorId(null);
    setEditingFloorName("");
  };

  const cancelEditing = () => {
    setEditingFloorId(null);
    setEditingFloorName("");
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    if (type === "FLOOR") {
      const newFloors = Array.from(floors);
      const [moved] = newFloors.splice(source.index, 1);
      newFloors.splice(destination.index, 0, moved);
      onReorderFloors(newFloors);
      return;
    }

    if (type.startsWith("ROOMS")) {
      const floorId = type.split("-")[1];
      const floor = floors.find((f) => f.id === floorId);
      if (!floor) return;
      const newRooms = Array.from(floor.rooms);
      const [moved] = newRooms.splice(source.index, 1);
      newRooms.splice(destination.index, 0, moved);
      onReorderRooms(floorId, newRooms);
    }
  };

  const band = (idx: number) => (idx % 2 === 0 ? "#F7FAFF" : "#FDF8E7");

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <CardContainer
        sx={{
          p: { xs: 2, sm: 3 },
          position: "sticky",
          top: theme.spacing(1),
          alignSelf: "flex-start",
          maxHeight: `calc(100vh - ${theme.spacing(2)})`,
          overflowY: "auto",
        }}
      >
        <Typography
          sx={{
            fontSize: fontSizes.lg,
            fontWeight: 700,
            color: colors.textMain,
            mb: spacing.sm,
          }}
        >
          Stockwerke & Räume
        </Typography>
        <Divider sx={{ mb: spacing.md, borderColor: colors.grayBorder }} />

        <Droppable droppableId="floor-list" type="FLOOR">
          {(floorProvided) => (
            <List
              disablePadding
              ref={floorProvided.innerRef}
              {...floorProvided.droppableProps}
            >
              {floors.map((floor, fIdx) => {
                const totalArea =
                  floor.rooms?.reduce((sum, r) => sum + (r.area || 0), 0) || 0;
                const isExpanded = expanded[floor.id] ?? true;
                const isEditing = editingFloorId === floor.id;

                return (
                  <Draggable key={floor.id} draggableId={floor.id} index={fIdx}>
                    {(floorDraggable) => (
                      <Box
                        ref={floorDraggable.innerRef}
                        {...floorDraggable.draggableProps}
                        sx={{
                          mb: spacing.md,
                          borderRadius: radii.lg,
                          border: `1px solid ${colors.grayBorder}`,
                          backgroundColor: band(fIdx),
                        }}
                      >
                        {/* Floor header */}
                        <Box
                          sx={{
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                            px: spacing.sm,
                            py: spacing.sm,
                            borderTopLeftRadius: radii.lg,
                            borderTopRightRadius: radii.lg,
                            borderBottom: `1px solid ${colors.grayBorder}`,
                            backgroundColor: band(fIdx),
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: spacing.sm,
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
                              <Box
                                {...floorDraggable.dragHandleProps}
                                sx={{ cursor: "grab", color: colors.grayText, lineHeight: 0 }}
                                aria-label="Stockwerk verschieben"
                              >
                                <DragIndicatorIcon fontSize="small" />
                              </Box>

                              {/* Floor index badge */}
                              <Paper
                                elevation={0}
                                sx={{
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 999,
                                  backgroundColor: "#FFFFFF",
                                  border: `1px solid ${colors.grayBorder}`,
                                  minWidth: 26,
                                  textAlign: "center",
                                }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                  {fIdx + 1}
                                </Typography>
                              </Paper>

                              <LayersIcon fontSize="small" htmlColor={colors.grayText} />

                              <Tooltip title={isEditing ? "" : "Zum Umbenennen klicken"}>
                                <Box
                                  sx={{ cursor: isEditing ? "text" : "pointer", minWidth: 0 }}
                                  onClick={() => {
                                    if (!isEditing) startEditing(floor.id, floor.name);
                                  }}
                                >
                                  {isEditing ? (
                                    <TextField
                                      value={editingFloorName}
                                      onChange={(e) => setEditingFloorName(e.target.value)}
                                      variant="standard"
                                      size="small"
                                      autoFocus
                                      onBlur={commitRename}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          commitRename();
                                        } else if (e.key === "Escape") {
                                          e.preventDefault();
                                          cancelEditing();
                                        }
                                      }}
                                      inputProps={{
                                        "aria-label": "Stockwerkname bearbeiten",
                                        sx: {
                                          fontWeight: 700,
                                          color: colors.textMain,
                                          lineHeight: 1.2,
                                          fontSize: theme.typography.subtitle1.fontSize,
                                        },
                                      }}
                                    />
                                  ) : (
                                    <Typography
                                      variant="subtitle1"
                                      sx={{ fontWeight: 700, color: colors.textMain, lineHeight: 1.2 }}
                                    >
                                      {floor.name}
                                    </Typography>
                                  )}

                                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                    <Chip
                                      size="small"
                                      label={`${floor.rooms.length} Räume`}
                                      variant="outlined"
                                    />
                                    <Chip size="small" label={`${totalArea} m²`} variant="outlined" />
                                  </Stack>
                                </Box>
                              </Tooltip>
                            </Box>

                            {/* Right-side actions */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: spacing.xs }}>
                              <Tooltip title={isExpanded ? "Einklappen" : "Ausklappen"}>
                                <IconButton
                                  size="small"
                                  onClick={() => toggleExpanded(floor.id)}
                                  aria-label={isExpanded ? "Einklappen" : "Ausklappen"}
                                  sx={{ color: colors.grayText }}
                                >
                                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Stockwerk löschen">
                                <IconButton
                                  size="small"
                                  onClick={() => onDeleteFloor(floor.id)}
                                  aria-label="Stockwerk löschen"
                                  sx={{ color: colors.grayText, "&:hover": { color: "#DC2626" } }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Box>

                        {/* Rooms */}
                        <Droppable droppableId={`rooms-${floor.id}`} type={`ROOMS-${floor.id}`}>
                          {(roomProvided) => (
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <List
                                disablePadding
                                ref={roomProvided.innerRef}
                                {...roomProvided.droppableProps}
                                sx={{
                                  // removed the rail that caused the thin line on the left:
                                  // ml: 1,
                                  // borderLeft: `2px solid ${colors.grayBorder}`,
                                  pl: 2,
                                  pb: spacing.sm,
                                }}
                              >
                                {floor.rooms.map((room, rIdx) => {
                                  const selected = room.id === selectedRoomId;
                                  return (
                                    <Draggable key={room.id} draggableId={room.id} index={rIdx}>
                                      {(roomDraggable) => (
                                        <ListItemButton
                                          ref={roomDraggable.innerRef}
                                          {...roomDraggable.draggableProps}
                                          {...roomDraggable.dragHandleProps}
                                          selected={selected}
                                          aria-selected={selected}
                                          onClick={() => onRoomSelect(room.id)}
                                          sx={{
                                            borderRadius: radii.lg,
                                            pl: 2.25,
                                            pr: 1,
                                            py: 1,
                                            mb: 0.75,
                                            alignItems: "center",
                                            backgroundColor: selected ? colors.yellowSubtle : "#FFF",
                                            border: `1px solid ${
                                              selected ? colors.grayBorder : "transparent"
                                            }`,
                                            boxShadow: selected
                                              ? "0 0 0 0 rgba(0,0,0,0)"
                                              : "0px 1px 2px rgba(0,0,0,0.06)",
                                            transition:
                                              "background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                                            "&:hover": {
                                              backgroundColor: colors.yellowSubtle,
                                              boxShadow: "0px 1px 2px rgba(0,0,0,0.08)",
                                            },
                                          }}
                                        >
                                          <MeetingRoomIcon
                                            fontSize="small"
                                            htmlColor={colors.grayText}
                                            sx={{ mr: 1 }}
                                          />
                                          <ListItemText
                                            primary={
                                              <Typography
                                                variant="body1"
                                                sx={{ fontWeight: 600, color: colors.textMain, lineHeight: 1.2 }}
                                              >
                                                {room.name}
                                              </Typography>
                                            }
                                            secondary={
                                              <Typography variant="body2" sx={{ color: colors.grayText, mt: "2px" }}>
                                                {room.area} m² • {room.walls.length} Wände
                                              </Typography>
                                            }
                                            primaryTypographyProps={{ component: "div" }}
                                            secondaryTypographyProps={{ component: "div" }}
                                            sx={{ mr: 0.5 }}
                                          />

                                          <Tooltip title="Raum löschen">
                                            <IconButton
                                              size="small"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteRoom(room.id, floor.id);
                                              }}
                                              aria-label="Raum löschen"
                                              sx={{ color: colors.grayText, "&:hover": { color: "#DC2626" } }}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </ListItemButton>
                                      )}
                                    </Draggable>
                                  );
                                })}

                                {roomProvided.placeholder}

                                {/* The only place to add a room now (centered and aligned) */}
                                <Box sx={{ mt: spacing.sm, display: "flex", justifyContent: "center" }}>
                                  <PrimaryButton
                                    startIcon={<AddIcon htmlColor={colors.primaryBlue} />}
                                    size="small"
                                    onClick={() => onAddRoom(floor.id)}
                                    sx={{
                                      borderRadius: radii.pill,
                                      fontSize: fontSizes.sm,
                                      py: spacing.sm,
                                      px: spacing.lg,
                                    }}
                                  >
                                    Raum hinzufügen
                                  </PrimaryButton>
                                </Box>
                              </List>
                            </Collapse>
                          )}
                        </Droppable>
                      </Box>
                    )}
                  </Draggable>
                );
              })}

              {floorProvided.placeholder}

              <Box sx={{ textAlign: "center", mt: spacing.md }}>
                <PrimaryButton
                  startIcon={<AddIcon htmlColor={colors.primaryBlue} />}
                  size="small"
                  onClick={onAddFloor}
                >
                  Stockwerk hinzufügen
                </PrimaryButton>
              </Box>
            </List>
          )}
        </Droppable>
      </CardContainer>
    </DragDropContext>
  );
}
