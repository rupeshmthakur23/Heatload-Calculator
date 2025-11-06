import React from "react";
import {
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Wall } from "../../types";
import { WALL_TYPES } from "./wallTypes";
import { colors, spacing, radii, fontSizes } from "../../designTokens";

interface WallListProps {
  walls: Wall[];
  onEdit: (wall: Wall) => void;
  onDelete: (wallId: string) => void;
}

const WallList: React.FC<WallListProps> = ({ walls, onEdit, onDelete }) => {
  if (walls.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Keine Wände definiert.
      </Typography>
    );
  }

  return (
    <List disablePadding>
      {walls.map((wall, idx) => {
        const def = WALL_TYPES.find((w) => w.key === wall.type);
        const typeLabel = def ? def.label : wall.type;
        const uValueText =
          typeof wall.uValue === "number" ? `${wall.uValue.toFixed(2)} W/m²K` : "–";
        const materialLabel = wall.customMaterial || wall.material || "–";

        return (
          <React.Fragment key={wall.id}>
            <ListItem
              onClick={() => onEdit(wall)}
              // Use MUI v5 `secondaryAction` to avoid absolute-position overlap
              secondaryAction={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconButton
                    edge="end"
                    aria-label="Bearbeiten"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(wall);
                    }}
                    size="small"
                    sx={{
                      color: colors.grayText,
                      "&:hover": { color: colors.primaryBlue, backgroundColor: colors.grayLight },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    edge="end"
                    aria-label="Löschen"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(wall.id);
                    }}
                    size="small"
                    sx={{
                      color: colors.grayText,
                      "&:hover": { color: "#DC2626", backgroundColor: colors.grayLight },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
              sx={{
                px: spacing.sm,
                py: 1.25,
                borderRadius: radii.md,
                transition: "background-color 150ms ease",
                "&:hover": { backgroundColor: colors.grayLight },
              }}
            >
              <ListItemText
                primaryTypographyProps={{
                  fontSize: fontSizes.base,
                  fontWeight: 600,
                  color: colors.textMain,
                  lineHeight: 1.3,
                }}
                secondaryTypographyProps={{
                  fontSize: fontSizes.sm,
                  color: "text.secondary",
                  lineHeight: 1.4,
                }}
                primary={`${wall.name} (${typeLabel})`}
                secondary={`Material: ${materialLabel} • Fläche: ${wall.area.toFixed(
                  1
                )} m² • U-Wert: ${uValueText}`}
              />
            </ListItem>

            {idx < walls.length - 1 && (
              <Divider component="li" sx={{ borderColor: colors.grayBorder, my: spacing.xs }} />
            )}
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default WallList;
