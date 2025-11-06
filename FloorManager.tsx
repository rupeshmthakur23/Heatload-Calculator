// src/pages/projectView/components/HeatLoadCalculator/floor/FloorManager.tsx

import React from "react";
import { Box, Typography, Divider, useTheme, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FloorRoomTree from "../checklist/FloorRoomTree";
import { useAppState, useAppActions } from "../useAppState";

import PrimaryButton from "../PrimaryButton";
import CardContainer from "../CardContainer";

const FloorManager: React.FC = () => {
  const theme = useTheme();

  const { floors, selectedRoomId } = useAppState();

  const {
    addFloor,
    removeFloor,
    addRoom,
    removeRoom,
    renameFloor,
    renameRoom,
    selectRoom,
    reorderFloors,
    reorderRooms,
  } = useAppActions();

  return (
    <CardContainer
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        mb: { xs: 2, sm: 3, md: 4 },
        mt: 0,          // ⬅️ ensure no top margin
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Stockwerke &amp; Räume
        </Typography>

        <PrimaryButton
          size="small"
          startIcon={<AddIcon />}
          onClick={addFloor}
          sx={{ whiteSpace: "nowrap" }}
        >
          Stockwerk hinzufügen
        </PrimaryButton>
      </Box>

      <Divider sx={{ mb: 1 }} />

      {/* Sticky only ≥ md; top=0 so there is ZERO gap */}
      <Box
        sx={{
          position: { xs: "static", md: "sticky" },
          top: 0, // ⬅️ no offset → no visible gap
          maxHeight: { md: "calc(100vh)" },
          overflowY: { md: "auto" },
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          p: 1,

          // Center regular buttons rendered by the tree
          "& .MuiButton-root": {
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
          },
        }}
      >
        {floors.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              m: 1.5,
              borderRadius: 2,
              textAlign: "center",
              border: `1px dashed ${theme.palette.divider}`,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Noch keine Stockwerke vorhanden.
            </Typography>
            <PrimaryButton size="small" startIcon={<AddIcon />} onClick={addFloor}>
              Stockwerk hinzufügen
            </PrimaryButton>
          </Paper>
        ) : (
          <FloorRoomTree
            floors={floors}
            selectedRoomId={selectedRoomId}
            onRoomSelect={selectRoom}
            onAddFloor={addFloor}
            onAddRoom={addRoom}
            onDeleteFloor={removeFloor}
            onDeleteRoom={(roomId) => removeRoom(roomId)}
            onRenameFloor={renameFloor}
            onRenameRoom={renameRoom}
            onReorderFloors={reorderFloors}
            onReorderRooms={reorderRooms}
          />
        )}
      </Box>
    </CardContainer>
  );
};

export default FloorManager;
