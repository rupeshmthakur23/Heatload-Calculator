// src/pages/projectView/components/HeatLoadCalculator/room/sections/HeaterList.tsx

import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import type { Heater } from "../../types";
import CardContainer from "../../CardContainer";
import PrimaryButton from "../../PrimaryButton";
import HeaterEditModal from "./HeaterEditModal";

// Flow + Kv helpers
import {
  computeFlowLpsFromHeater,
  kvPresetFor,
  formatFlowLps,
} from "../../utils/kvRecommendation";

type Props = {
  heaters: Heater[];
  onChange: (next: Heater[]) => void;
};

// Try to infer valve brand from the free-text valveType.
// Falls back to "Heimeier" (common in DE) if unknown.
function detectKvBrand(valveType?: string): "Heimeier" | "Oventrop" | "Danfoss" {
  const v = (valveType ?? "").toLowerCase();
  if (v.includes("oventrop")) return "Oventrop";
  if (v.includes("danfoss")) return "Danfoss";
  return "Heimeier";
}

const HeaterList: React.FC<Props> = ({ heaters, onChange }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Heater | null>(null);

  const totalW = useMemo(
    () => heaters.reduce((s, h) => s + (Number(h.output) || 0), 0),
    [heaters]
  );

  const totalFlowLps = useMemo(
    () => heaters.reduce((s, h) => s + (Number(h.flowLps) || 0), 0),
    [heaters]
  );
  const totalFlowLph = totalFlowLps * 3600;

  const beginAdd = () => {
    setEditing(null); // modal starts empty (catalog-backed)
    setOpen(true);
  };

  const beginEdit = (idx: number) => {
    setEditing({ ...heaters[idx] });
    setOpen(true);
  };

  const handleDelete = (idx: number) => {
    const next = heaters.filter((_, i) => i !== idx);
    onChange(next);
  };

  const handleSave = (h: Heater) => {
    // Compute & persist flow for radiators. For underfloor, keep provided flow if any.
    const flowLps =
      h.type === "radiator" ? computeFlowLpsFromHeater(h) : (Number(h.flowLps) || 0);

    const withFlow: Heater = { ...h, flowLps };

    const existsIdx = heaters.findIndex((x) => x.id === withFlow.id && !!withFlow.id);
    const next =
      existsIdx >= 0
        ? heaters.map((x, i) => (i === existsIdx ? withFlow : x))
        : [...heaters, withFlow];

    onChange(next);
    setOpen(false);
    setEditing(null);
  };

  return (
    <CardContainer sx={{ mb: 3, p: { xs: 2, sm: 3, md: 4 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1" fontWeight={600}>
          Heizkörper
        </Typography>
        <PrimaryButton size="small" startIcon={<AddIcon />} onClick={beginAdd}>
          Neuer Heizkörper
        </PrimaryButton>
      </Box>

      {heaters.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Keine Heizkörper definiert.
        </Typography>
      ) : (
        <List dense>
          {heaters.map((h, idx) => {
            const flowLpsStored = Number(h.flowLps) || 0;
            const flowLps = flowLpsStored || computeFlowLpsFromHeater(h);
            const flowLph = flowLps * 3600;

            const primary =
              h.type === "radiator"
                ? `${h.brand ?? "?"} ${h.series ?? ""} ${h.height ?? "?"}x${h.width ?? "?"} — ${h.output ?? 0} W`
                : `Fußbodenheizung — ${h.output ?? 0} W`;

            const secondaryParts: string[] = [];

            if (h.type === "radiator" && h.nominalOutputAtStandard) {
              secondaryParts.push(
                `Nominal ${h.nominalOutputAtStandard} W @ ${h.standardRegime ?? "75/65/20"}`
              );
            }

            if (h.kvPresetLabel) {
              secondaryParts.push(
                `kv: ${h.kvPresetLabel}${h.kvValue != null ? ` (${h.kvValue})` : ""}`
              );
            }

            // Rule-based Kv suggestion from target flow
            if (h.type === "radiator" && flowLps > 0) {
              const brand = detectKvBrand(h.valveType);
              const preset = kvPresetFor(flowLps, brand);
              secondaryParts.push(`Vorschlag: Voreinstellung ${preset} (${brand})`);
            }

            secondaryParts.push(
              `Volumenstrom: ${formatFlowLps(flowLps)} (${Math.round(flowLph)} L/h)`
            );

            return (
              <React.Fragment key={h.id || idx}>
                <ListItem divider>
                  <ListItemText primary={primary} secondary={secondaryParts.join(" • ")} />

                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={() => beginEdit(idx)}
                      sx={{ color: "text.secondary", "&:hover": { color: "#2A61E2" } }}
                      aria-label="Bearbeiten"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(idx)}
                      sx={{ color: "text.secondary", "&:hover": { color: "#E53935" }, ml: 0.5 }}
                      aria-label="Löschen"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            );
          })}
        </List>
      )}

      <Box mt={1}>
        <Typography variant="body2" color="text.secondary">
          Summe Heizkörperleistung: <b>{totalW}</b> W
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Summe Volumenstrom:{" "}
          <b>
            {totalFlowLps.toFixed(3)} L/s ({Math.round(totalFlowLph)} L/h)
          </b>
        </Typography>
      </Box>

      <HeaterEditModal
        open={open}
        value={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
    </CardContainer>
  );
};

export default HeaterList;
