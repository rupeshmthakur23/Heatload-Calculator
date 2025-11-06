import React from "react";
import { TextField, Switch, FormControlLabel, Grid } from "@mui/material";
// NOTE: use the hooks path that matches your project:
// your useAppState file is in "hooks/useAppState.tsx" inside HeatLoadCalculator.
import { useAppState, useAppActions } from "../../useAppState";

export default function TariffAndDimensioningCard() {
  const { projectMeta } = useAppState();
  const { setTariff, setAltHeating, setDimensioning, setPlannedDate } = useAppActions();

  const tariff = projectMeta.tariff;
  const alt = projectMeta.altHeating;
  const dim = projectMeta.dimensioning;

  return (
    <Grid container spacing={2}>
      {/* Wärmepumpentarif */}
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={tariff.hpTariffEnabled}
              onChange={(e) =>
                setTariff({ ...tariff, hpTariffEnabled: e.target.checked })
              }
            />
          }
          label="Wärmepumpentarif aktivieren?"
        />
      </Grid>

      {/* Stromkosten ct/kWh */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Stromkosten des Heizsystems (ct/kWh)"
          type="number"
          value={tariff.electricityPriceCt}
          onChange={(e) =>
            setTariff({ ...tariff, electricityPriceCt: Number(e.target.value) })
          }
          inputProps={{ min: 0, step: 0.1 }}
          fullWidth
        />
      </Grid>

      {/* Vergleich mit alternativer Heizung */}
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={alt.compareAlternativeHeating}
              onChange={(e) =>
                setAltHeating({ ...alt, compareAlternativeHeating: e.target.checked })
              }
            />
          }
          label="Vergleich mit alternativer Heizung"
        />
      </Grid>

      {alt.compareAlternativeHeating && (
        <>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Kosten der alternativen Heizung (€)"
              type="number"
              value={alt.altHeatingCostEUR ?? 0}
              onChange={(e) =>
                setAltHeating({ ...alt, altHeatingCostEUR: Number(e.target.value) })
              }
              inputProps={{ min: 0, step: 1 }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Austausch nach (Jahren)"
              type="number"
              value={alt.altHeatingReplacementYears ?? 0}
              onChange={(e) =>
                setAltHeating({
                  ...alt,
                  altHeatingReplacementYears: Number(e.target.value),
                })
              }
              inputProps={{ min: 0, step: 1 }}
              fullWidth
            />
          </Grid>
        </>
      )}

      {/* Dimensionierung */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Heizlast (W)"
          type="number"
          value={dim.heatLoadW}
          onChange={(e) =>
            setDimensioning({ ...dim, heatLoadW: Number(e.target.value) })
          }
          inputProps={{ min: 0, step: 10 }}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Bewohner"
          type="number"
          value={dim.residents}
          onChange={(e) =>
            setDimensioning({ ...dim, residents: Number(e.target.value) })
          }
          inputProps={{ min: 1, step: 1 }}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Warmwasserbedarf pro Bewohner (L/Tag)"
          type="number"
          value={dim.dhwPerResidentLPerDay}
          onChange={(e) =>
            setDimensioning({
              ...dim,
              dhwPerResidentLPerDay: Number(e.target.value),
            })
          }
          inputProps={{ min: 0, step: 1 }}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Bivalenztemperatur (°C)"
          type="number"
          value={dim.bivalenceTemperatureC}
          onChange={(e) =>
            setDimensioning({
              ...dim,
              bivalenceTemperatureC: Number(e.target.value),
            })
          }
          inputProps={{ step: 0.5 }}
          fullWidth
        />
      </Grid>

      {/* Geplantes Installationsdatum */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Geplantes Installationsdatum"
          type="date"
          value={projectMeta.plannedInstallationDate ?? ""}
          onChange={(e) => setPlannedDate(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </Grid>
  );
}
