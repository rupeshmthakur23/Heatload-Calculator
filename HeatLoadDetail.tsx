// src/pages/projectView/components/HeatLoadCalculator/HeatLoadDetail.tsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spin, Alert } from "antd";
import { Box, Typography, Divider } from "@mui/material";
import HeatLoadAPI from "api/heatLoad/heatLoadApi";
import { HeatLoadResponse } from "api/heatLoad/heatLoad.types";
import CardContainer from "./CardContainer";
import { colors } from "./designTokens";

export default function HeatLoadDetail() {
  const { id } = useParams<{ id: string }>();
  const [calc, setCalc] = useState<HeatLoadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No calculation ID provided.");
      setLoading(false);
      return;
    }

    HeatLoadAPI.getHeatLoad(id)
      .then((res) => setCalc(res.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setError("Calculation not found.");
        } else {
          setError(err.message || "Failed to load calculation.");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Spin tip="Loading calculation…" size="large" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ m: 2 }}>
        <Alert message="Error" description={error} type="error" showIcon />
      </Box>
    );
  }

  // ---- TS-safe derivations for fields not declared on HeatLoadResponse ----
  // Some APIs put `location` at the root; others nest it under `building`.
  const locationStr =
    ((calc as any)?.location as string | undefined) ??
    calc!.building?.location ??
    "—";

  // Some payloads return per-room loads at root; others inside results.perRoomLoads.
  const perRoomLoads =
    (calc as any)?.perRoomLoads ??
    calc!.results?.perRoomLoads ??
    null;

  const roomsCount = Array.isArray(perRoomLoads) ? perRoomLoads.length : "—";

  // ------------------------------------------------------------------------

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" color="text.primary" fontWeight={700}>
          Calculation Details
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Created on {new Date(calc!.createdAt).toLocaleString()} by user{" "}
          {String(calc!.user)}
        </Typography>
      </Box>

      {/* Building */}
      <CardContainer header="Building" sx={{ mb: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Address
            </Typography>
            <Typography variant="body1" color="text.primary">
              {calc!.building?.address || "—"}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Location
            </Typography>
            <Typography variant="body1" color="text.primary">
              {locationStr}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Floors
            </Typography>
            <Typography variant="body1" color="text.primary">
              {Array.isArray(calc!.floors) ? calc!.floors.length : 0}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              DHW (domestic hot water)
            </Typography>
            <Typography variant="body1" color="text.primary">
              {calc!.building?.domesticHotWater ?? "—"}
            </Typography>
          </Box>
        </Box>
      </CardContainer>

      {/* Results */}
      <CardContainer header="Results" sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center" }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Total Load
            </Typography>
            <Typography variant="h5" color="text.primary" fontWeight={700}>
              {calc!.results?.totalHeatLoadKW ?? 0} kW
            </Typography>
          </Box>

          <Divider flexItem orientation="vertical" />

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Rooms Calculated
            </Typography>
            <Typography variant="h6" color="text.primary">
              {roomsCount}
            </Typography>
          </Box>
        </Box>
      </CardContainer>

      {/* Raw JSON */}
      <CardContainer header="Raw Data">
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 2,
            bgcolor: colors.grayLight,
            border: `1px solid ${colors.grayBorder}`,
            borderRadius: 1,
            overflowX: "auto",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {JSON.stringify(calc, null, 2)}
        </Box>
      </CardContainer>
    </Box>
  );
}
