// src/pages/projectView/components/HeatLoadCalculator/results/ReportPage.tsx

import React from "react";
import { useLocation, useHistory } from "react-router-dom";
import {
  Container,
  Typography,
  Divider,
  Grid,
  Box,
  useTheme,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import ResultPanel from "./ResultPanel";
import type { SummaryRow, Floor, BuildingMetadata } from "../types";
import PrimaryButton from "../PrimaryButton";
import CardContainer from "../CardContainer";
import { colors, spacing, fontSizes, radii } from "../designTokens";
import { calculateRoomBreakdown } from "../utils/calculateRoomBreakdown";
import { useAppState } from "../useAppState"; // <-- added

interface RoomResult {
  floor: string;
  room: string;
  transmissionLoss: number;
  ventilationLoss: number;
  totalLoss: number;
  area?: number;
  thermalBridgeLoss?: number;
  safetyMargin?: number;
  roomHeatLoad?: number;
}

interface ResultSummary {
  totalRooms: number;
  totalLoad: number;
  totalArea?: number;
  energyClass: string;
  recommendation: string;
  roomBreakdown?: RoomResult[];
}

interface LocationState {
  results?: ResultSummary;
  metadata: BuildingMetadata;
  floors: Floor[];
}

const ReportPage: React.FC = () => {
  const theme = useTheme();
  const history = useHistory();
  const locationState = useLocation().state as LocationState;

  const { results, metadata, floors } = locationState || {};
  const { projectMeta } = useAppState(); // <-- get app meta

  if (!results || !metadata || !floors) {
    return (
      <Container
        disableGutters
        maxWidth={false}
        sx={{
          width: "100%",
          px: { xs: 2, sm: 3, md: 6 },
          py: { xs: 4, md: 6 },
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Typography variant="h6" color="error" sx={{ fontWeight: 600 }}>
          Kein Bericht verfügbar. Bitte führen Sie zuerst eine Berechnung durch.
        </Typography>
        <Box sx={{ mt: spacing.sm }}>
          <PrimaryButton onClick={() => history.goBack()} size="small">
            Zurück
          </PrimaryButton>
        </Box>
      </Container>
    );
  }

  const roomBreakdown: SummaryRow[] | undefined = results.roomBreakdown?.map(
    (r) => ({
      floor: r.floor,
      room: r.room,
      transmissionLoss: r.transmissionLoss,
      ventilationLoss: r.ventilationLoss,
      totalLoss: r.totalLoss,
      area: r.area ?? 0,
      thermalBridgeLoss: r.thermalBridgeLoss ?? 0,
      safetyMargin: r.safetyMargin ?? 0,
      roomHeatLoad: r.roomHeatLoad ?? 0,
    })
  );

  const panelProps = {
    totalRooms: results.totalRooms,
    totalLoad: results.totalLoad,
    totalArea: results.totalArea,
    energyClass: results.energyClass,
    recommendation: results.recommendation,
    roomBreakdown,
  };

  // helpers
  const dim = projectMeta?.dimensioning;
  const t = projectMeta?.tariff;
  const fmt = (v: unknown, suffix = "") =>
    v === null || v === undefined || v === "" ? "—" : `${v}${suffix}`;

  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{
        width: "100%",
        px: { xs: 2, sm: 3, md: 6 },
        py: { xs: 4, md: 6 },
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      {/* Top toolbar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: spacing.sm,
        }}
      >
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => history.goBack()}
          sx={{ borderRadius: 9999 }}
        >
          Zurück
        </Button>
      </Box>

      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontSize: {
            xs: fontSizes.lg,
            sm: "1.75rem",
            md: "2rem",
          },
          fontWeight: 700,
          color: colors.textMain,
        }}
      >
        Vollständiger Heizlastbericht
      </Typography>

      <Divider sx={{ mb: spacing.lg, borderColor: colors.grayBorder }} />

      {/* Project parameters summary */}
      <CardContainer sx={{ mb: { xs: 2, md: 4 }, p: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Projektparameter
        </Typography>
        <ul style={{ margin: 0, paddingInlineStart: 20, lineHeight: 1.7 }}>
          <li>Bivalenztemperatur: {fmt(dim?.bivalenceTemperatureC, " °C")}</li>
          <li>Wärmepumpentarif: {t?.hpTariffEnabled ? "Ja" : "Nein"}</li>
          <li>Stromkosten: {fmt(t?.electricityPriceCt, " ct/kWh")}</li>
          <li>Heizlast: {fmt(dim?.heatLoadW, " W")}</li>
          <li>Bewohner: {fmt(dim?.residents)}</li>
          <li>WW-Bedarf/Person: {fmt(dim?.dhwPerResidentLPerDay, " L/Tag")}</li>
          <li>
            Geplantes Installationsdatum:{" "}
            {projectMeta?.plannedInstallationDate || "—"}
          </li>
        </ul>
      </CardContainer>

      <CardContainer
        sx={{
          mb: { xs: 2, md: 4 },
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: radii.lg,
        }}
      >
        <ResultPanel results={panelProps} metadata={metadata} floors={floors} />
      </CardContainer>

      {/* Per-surface breakdown */}
      <Box sx={{ mt: spacing.lg }}>
        <CardContainer>
          <Typography variant="h6" sx={{ mb: 1 }}>
            🔍 Wärmeverlust nach Bauteil (pro Raum)
          </Typography>

          {floors.map((fl) => (
            <Box key={fl.id} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {fl.name}
              </Typography>

              {fl.rooms.map((room) => {
                const { perElement } = calculateRoomBreakdown(
                  room as any,
                  metadata as any
                );
                return (
                  <Box key={room.id} sx={{ mb: 1.5 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {room.name}
                    </Typography>

                    <Box
                      component="table"
                      sx={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "6px 8px" }}>
                            Bauteil
                          </th>
                          <th style={{ textAlign: "left", padding: "6px 8px" }}>
                            Name
                          </th>
                          <th style={{ textAlign: "right", padding: "6px 8px" }}>
                            Fläche (m²)
                          </th>
                          <th style={{ textAlign: "right", padding: "6px 8px" }}>
                            U (W/m²K)
                          </th>
                          <th style={{ textAlign: "right", padding: "6px 8px" }}>
                            ΔT (K)
                          </th>
                          <th style={{ textAlign: "right", padding: "6px 8px" }}>
                            q (W)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {perElement.map((it, idx) => (
                          <tr
                            key={idx}
                            style={{ borderTop: "1px solid #e5e7eb" }}
                          >
                            <td style={{ padding: "6px 8px" }}>{it.kind}</td>
                            <td style={{ padding: "6px 8px" }}>{it.name}</td>
                            <td
                              style={{
                                padding: "6px 8px",
                                textAlign: "right",
                              }}
                            >
                              {(it.area ?? 0).toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: "6px 8px",
                                textAlign: "right",
                              }}
                            >
                              {(it.U ?? 0).toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: "6px 8px",
                                textAlign: "right",
                              }}
                            >
                              {(it.deltaT ?? 0).toFixed(1)}
                            </td>
                            <td
                              style={{
                                padding: "6px 8px",
                                textAlign: "right",
                              }}
                            >
                              {(it.q ?? 0).toFixed(0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))}
        </CardContainer>
      </Box>
    </Container>
  );
};

export default ReportPage;
