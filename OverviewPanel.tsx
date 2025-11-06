import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Grid,
  Tooltip,
  useTheme,
  Paper,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  TextField,
  InputAdornment,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoIcon from "@mui/icons-material/Info";
import { BuildingMetadata, Floor, SummaryRow } from "../types";
import { colors, spacing, radii } from "../designTokens";
import { calculateRoomBreakdown } from "../utils/calculateRoomBreakdown";
import PrimaryButton from "../PrimaryButton";
import { exportHydraulicCSV, exportHydraulicJSON } from "../utils/exportToCSV";
import { exportGeometryJSON } from "../utils/exportGeometry";

/* ───────────────────────── Props ───────────────────────── */
interface Props {
  metadata: BuildingMetadata;
  floors: Floor[];
  roomResults: SummaryRow[];
  /** Show the three header export buttons (CSV Hydraulischer Abgleich, JSON Hydraulik, JSON Geometrie) */
  showHeaderExports?: boolean;
}

/* ───────────────────────── Helpers ───────────────────────── */

// Coerce possible string inputs like "12" or "1,5" → number
const toNum = (v: unknown) =>
  typeof v === "string" ? Number(v.replace(",", ".")) : (v as number) ?? 0;

/* Number formatting (de-DE) */
const nf0 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n: number) => nf0.format(Number(n) || 0);
const fmt1 = (n: number) => nf1.format(Number(n) || 0);
const fmt2 = (n: number) => nf2.format(Number(n) || 0);

/* Indicative conversion: Design load → Annual energy
   Jahresenergie (kWh)       ≈ Heizlast_kW × EFLH_h
   Jahresenergie (kWh/m²·a)  ≈ (W/m² × EFLH / 1000)
   Default: 800 h/a (anpassbar)
*/
const EFLH_DEFAULT = 800;

/** Efficiency bands used for legend and label */
const BANDS = [
  { label: "Sehr effizient", max: 30,  color: "#2ecc71" },
  { label: "Effizient",       max: 50,  color: "#93d36f" },
  { label: "Mittel",          max: 100, color: "#d6dc6b" },
  { label: "Erhöht",          max: 150, color: "#f1c75a" },
  { label: "Hoher Verbrauch", max: 250, color: "#e74c3c" },
];

function bandFor(wm2: number) {
  return BANDS.find(b => wm2 <= b.max) ?? BANDS[BANDS.length - 1];
}

/* ───────────────────────── Component ───────────────────────── */

const OverviewPanel: React.FC<Props> = ({ metadata, floors, roomResults, showHeaderExports = true }) => {
  const theme = useTheme();

  // -------- Derived totals (from per-room results) --------
  const totalArea = useMemo(
    () => roomResults.reduce((sum, r) => sum + toNum(r.area), 0),
    [roomResults]
  );
  const totalLoadKW = useMemo(
    () => roomResults.reduce((sum, r) => sum + toNum(r.roomHeatLoad ?? r.totalLoss ?? 0), 0),
    [roomResults]
  );
  const totalLoadW = totalLoadKW * 1000;
  const wattsPerSqm = totalArea > 0 ? totalLoadW / totalArea : 0;

  // -------- Editable assumption: EFLH --------
  const [eflh, setEflh] = useState<number>(EFLH_DEFAULT);
  const setEflhFromInput = (raw: string) => {
    const v = Number(raw);
    if (!Number.isFinite(v)) return;
    setEflh(Math.max(200, Math.min(3000, v))); // guardrails
  };

  // Annual indicators (indicative, not EPC)
  const annualKWhTotal = totalLoadKW * eflh; // kWh/a
  const annualKWhPerM2 = totalArea > 0 ? (wattsPerSqm * eflh) / 1000 : 0; // kWh/m²·a

  // ---------- Heat-load density scale (W/m²) ----------
  const scaleMin = 0;
  const scaleMax = 250;
  const ticks = [0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250];
  const clamped = Math.max(scaleMin, Math.min(wattsPerSqm, scaleMax));
  const markerLeftPct = ((clamped - scaleMin) / (scaleMax - scaleMin)) * 100;
  const band = bandFor(clamped);

  return (
    <Box mt={spacing.md}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={spacing.xs}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: colors.textMain }}>
            🏠 Gebäudeübersicht
          </Typography>

          {/* Quick explainer tooltip */}
          <Tooltip
            title={
              <Box sx={{ p: 0.5 }}>
                <Typography variant="caption" sx={{ display: "block", fontWeight: 600 }}>
                  Was wird gezeigt?
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                  Der Balken zeigt die <strong>Wärmeleistungsdichte</strong> in <strong>W/m²</strong> bei Auslegungsbedingungen.
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                  <em>W/m²</em> = (Σ Raum-Heizlast in W) / Gesamtfläche in m²
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                  <em>kWh/m²·a</em> ≈ (W/m² × EFLH) / 1000
                </Typography>
              </Box>
            }
          >
            <InfoIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </Tooltip>
        </Box>

        {showHeaderExports && (
          <Stack direction="row" spacing={1}>
            <PrimaryButton size="small" onClick={() => exportHydraulicCSV(metadata, floors)}>
              CSV: Hydraulischer Abgleich
            </PrimaryButton>
            <PrimaryButton size="small" onClick={() => exportHydraulicJSON(metadata, floors)}>
              JSON: Hydraulik
            </PrimaryButton>
            <PrimaryButton size="small" onClick={() => exportGeometryJSON(metadata, floors)}>
              JSON: Geometrie
            </PrimaryButton>
          </Stack>
        )}
      </Box>

      <Divider sx={{ my: spacing.sm, borderColor: colors.grayBorder }} />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          border: `1px solid ${colors.grayBorder}`,
          borderRadius: radii.lg,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {/* KPIs + EFLH */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6} lg={4}>
            <Typography variant="body2">Gesamtfläche: {fmt1(totalArea)} m²</Typography>
            <Typography variant="body2">Σ Heizlast: {fmt0(totalLoadW)} W</Typography>
            <Typography variant="body2">
              Wärmeleistungsdichte: <strong>{fmt1(wattsPerSqm)} W/m²</strong>
            </Typography>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                Annahme EFLH
              </Typography>
              <Tooltip title="Äquivalente Volllaststunden pro Jahr (h/a). Multipliziert die Auslegungs-Heizlast zu einer jährlichen Energieabschätzung. Region & Nutzung können 400–1800 h/a variieren.">
                <InfoIcon fontSize="small" />
              </Tooltip>
            </Box>
            <Box sx={{ mt: 0.5 }}>
              <Slider
                size="small"
                min={400}
                max={1800}
                step={20}
                value={eflh}
                onChange={(_, v) => setEflh(Array.isArray(v) ? v[0] : v)}
              />
              <TextField
                size="small"
                value={eflh}
                onChange={(e) => setEflhFromInput(e.target.value)}
                type="number"
                sx={{ width: 140, mt: 0.5 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">h/a</InputAdornment>,
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Typography variant="body2">
              Jahresenergie (gesamt): <strong>{fmt0(annualKWhTotal)}</strong> kWh/a
            </Typography>
            <Typography variant="body2">
              Spezifischer Wärmebedarf: <strong>{fmt1(annualKWhPerM2)}</strong> kWh/m²·a
            </Typography>
          </Grid>
        </Grid>

        {/* 🔥 Heat bar ABOVE the accordions, now with clear labels/legend */}
        <Divider sx={{ my: spacing.md, borderColor: colors.grayBorder }} />
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: colors.textMain }}>
            🔥 Heizenergie-Indikator
          </Typography>
          {/* Current value + band */}
          <Chip
            size="small"
            label={`${fmt1(wattsPerSqm)} W/m² • ${band.label}`}
            sx={{
              fontWeight: 600,
              bgcolor: theme.palette.mode === "light" ? "#f8fafc" : "transparent",
              border: `1px solid ${colors.grayBorder}`,
            }}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Tooltip title={`Position relativ zu ${scaleMin}–${scaleMax} W/m²`}>
              <Box sx={{ position: "relative", pt: 3, pb: 1 }}>
                {/* Gradient scale */}
                <Box
                  sx={{
                    height: 26,
                    borderRadius: 9999,
                    background:
                      "linear-gradient(90deg, #2ecc71 0%, #93d36f 20%, #d6dc6b 40%, #f1c75a 60%, #f39c4c 80%, #e74c3c 100%)",
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                  }}
                />
                {/* Marker with small callout */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: `${markerLeftPct}%`,
                    transform: "translateX(-50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.25,
                      mb: 0.5,
                      borderRadius: 9999,
                      border: `1px solid ${colors.grayBorder}`,
                      bgcolor: theme.palette.background.paper,
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmt1(wattsPerSqm)} W/m²
                  </Box>
                  <Box
                    sx={{
                      width: 0,
                      height: 0,
                      borderLeft: "7px solid transparent",
                      borderRight: "7px solid transparent",
                      borderTop: "10px solid " + theme.palette.text.primary,
                    }}
                  />
                </Box>

                {/* Axis ticks + unit */}
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.75, px: 0.5 }}>
                  {ticks.map((t) => (
                    <Typography key={t} variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      {t}
                    </Typography>
                  ))}
                </Box>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: "block", textAlign: "right", mt: 0.25 }}>
                  W/m²
                </Typography>
              </Box>
            </Tooltip>

            {/* Band legend with ranges */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
              {BANDS.map((b, i) => {
                const from = i === 0 ? 0 : BANDS[i - 1].max;
                return (
                  <Box key={b.label} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mr: 1.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: b.color, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)" }} />
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      {b.label} ({from}–{b.max} W/m²)
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Grid>

          {/* Assumptions & formulas – right side */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Annahmen & Herleitung
            </Typography>
            <Typography variant="body2">Σ Heizlast: <strong>{fmt0(totalLoadW)} W</strong></Typography>
            <Typography variant="body2">Gesamtfläche: <strong>{fmt1(totalArea)} m²</strong></Typography>
            <Typography variant="body2">EFLH: <strong>{fmt0(eflh)} h/a</strong></Typography>

            <Box sx={{ mt: 1, p: 1, borderRadius: radii.md, border: `1px solid ${colors.grayBorder}`, bgcolor: theme.palette.mode === "light" ? "#f8fafc" : "transparent" }}>
              <Typography variant="caption" sx={{ display: "block" }}>
                <strong>W/m²</strong> = Σ Heizlast<sub>W</sub> / Fläche<sub>m²</sub>
              </Typography>
              <Typography variant="caption" sx={{ display: "block", mt: 0.25 }}>
                <strong>kWh/m²·a</strong> ≈ (W/m² × EFLH) / 1000
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
              Hinweis: Abschätzung aus Auslegungs-Heizlast × EFLH. Für einen offiziellen Energieausweis sind
              normgerechte Verfahren (z. B. DIN/EN) erforderlich.
            </Typography>
          </Grid>
        </Grid>

        {/* Accordions */}
        <Divider sx={{ my: spacing.md, borderColor: colors.grayBorder }} />

        <Accordion
          defaultExpanded={false}
          disableGutters
          sx={{
            boxShadow: "none",
            border: `1px solid ${colors.grayBorder}`,
            borderRadius: radii.lg,
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.textMain }}>
              🧱 Bauteile & U-Werte
            </Typography>
          </AccordionSummary>

          <AccordionDetails sx={{ pt: 0 }}>
            {floors.map((floor) => (
              <Box key={floor.id} mt={spacing.sm}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {floor.name}
                </Typography>

                {floor.rooms.map((room) => (
                  <Box
                    key={room.id}
                    sx={{
                      pl: 2,
                      mt: 1,
                      borderLeft: `2px solid ${colors.grayBorder}`,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      🏠 Raum: {room.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fläche: {fmt1(toNum(room.area))} m² • Zieltemperatur: {fmt0(toNum(room.targetTemperature))}°C
                    </Typography>

                    {/* Walls */}
                    {room.walls?.length > 0 && (
                      <>
                        <Typography variant="body2" mt={1} sx={{ fontWeight: 600 }}>
                          🧱 Wände:
                        </Typography>
                        {room.walls.map((w) => (
                          <Typography
                            key={w.id}
                            variant="caption"
                            sx={{ ml: 2, display: "block", color: colors.textMain }}
                          >
                            - {w.name} {w.material ? `(${w.material})` : ""}: {fmt2(toNum(w.uValue))} W/m²K
                          </Typography>
                        ))}
                      </>
                    )}

                    {/* Windows */}
                    {room.windows?.length > 0 && (
                      <>
                        <Typography variant="body2" mt={1} sx={{ fontWeight: 600 }}>
                          🪟 Fenster:
                        </Typography>
                        {room.windows.map((win) => (
                          <Typography
                            key={win.id}
                            variant="caption"
                            sx={{ ml: 2, display: "block", color: colors.textMain }}
                          >
                            - {win.type}{" "}
                            {win.orientation ? `(${win.orientation})` : ""}: {fmt2(toNum(win.uValue))} W/m²K
                          </Typography>
                        ))}
                      </>
                    )}

                    {/* Ceiling & Floor */}
                    {room.ceilingConfig && room.floorConfig && (
                      <>
                        <Typography variant="body2" mt={1} sx={{ fontWeight: 600 }}>
                          🧱 Decke & Boden:
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ ml: 2, display: "block", color: colors.textMain }}
                        >
                          - Decke Dämmstandard: {room.ceilingConfig.insulationStandard}, Dachtyp:{" "}
                          {room.ceilingConfig.roofType}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ ml: 2, display: "block", color: colors.textMain }}
                        >
                          - Boden U-Wert: {fmt2(toNum(room.floorConfig.uValue))} W/m²K
                        </Typography>
                      </>
                    )}
                  </Box>
                ))}
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: spacing.md, borderColor: colors.grayBorder }} />

        <Accordion
          defaultExpanded={false}
          disableGutters
          sx={{
            boxShadow: "none",
            border: `1px solid ${colors.grayBorder}`,
            borderRadius: radii.lg,
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.textMain }}>
              🔍 Wärmeverlust nach Bauteil (pro Raum)
            </Typography>
          </AccordionSummary>

        <AccordionDetails sx={{ pt: 0 }}>
            {floors.map((fl) => (
              <Box key={fl.id} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {fl.name}
                </Typography>

                {fl.rooms.map((room) => {
                  const { perElement } = calculateRoomBreakdown(room as any, metadata as any);
                  return (
                    <Box key={room.id} sx={{ mb: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                        {room.name}
                      </Typography>

                      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: "6px 8px" }}>Bauteil</th>
                            <th style={{ textAlign: "left", padding: "6px 8px" }}>Name</th>
                            <th style={{ textAlign: "right", padding: "6px 8px" }}>Fläche (m²)</th>
                            <th style={{ textAlign: "right", padding: "6px 8px" }}>U (W/m²K)</th>
                            <th style={{ textAlign: "right", padding: "6px 8px" }}>ΔT (K)</th>
                            <th style={{ textAlign: "right", padding: "6px 8px" }}>q (W)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perElement.map((it, idx) => (
                            <tr key={idx} style={{ borderTop: `1px solid ${colors.grayBorder}` }}>
                              <td style={{ padding: "6px 8px" }}>{it.kind}</td>
                              <td style={{ padding: "6px 8px" }}>{it.name}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right" }}>{fmt2(toNum(it.area))}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right" }}>{fmt2(toNum(it.U))}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right" }}>{fmt1(toNum(it.deltaT))}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right" }}>{fmt0(toNum(it.q))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
};

export default OverviewPanel;
