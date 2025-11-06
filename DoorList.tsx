import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import { Door as DoorType } from "../../types";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface DoorListProps {
  doors: DoorType[];
  onEdit: (d: DoorType) => void;
  onDelete: (id: string) => void;
}

export default function DoorList({ doors, onEdit, onDelete }: DoorListProps) {
  if (doors.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" fontStyle="italic">
        Keine Türen definiert.
      </Typography>
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 400 }}>
        <TableHead>
          <TableRow>
            <TableCell>Fläche (m²)</TableCell>
            <TableCell>Unbeheizt?</TableCell>
            <TableCell>U-Wert (W/m²K)</TableCell>
            <TableCell align="right">Aktionen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {doors.map((d) => (
            <TableRow key={d.id} hover>
              <TableCell>{d.area.toFixed(1)}</TableCell>
              <TableCell>{d.toUnheated ? "Ja" : "Nein"}</TableCell>
              <TableCell>{d.uValue?.toFixed(2) ?? "–"}</TableCell>
              <TableCell align="right">
                <IconButton
                  onClick={() => onEdit(d)}
                  size="small"
                  sx={{ color: "#F7B500" }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => onDelete(d.id)}
                  size="small"
                  sx={{ ml: 1, color: "#E53935" }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
