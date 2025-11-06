// src/pages/projectView/components/HeatLoadCalculator/checklist/GrundmaterialienPanel.tsx
import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Tooltip,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { colors, spacing, radii } from "../designTokens";
import type { BuildingMetadata, Floor } from "../types";

/**
 * Grundmaterialien – Gesamtübersicht
 * - Aggregation nur nach Material/Typ (keine einzelnen Bauteile)
 * - U-Werte sind flächengewichtet
 * - Balken sind ausgerichtet & responsiv; Chips zeigen Summen (+ Anteil)
 */

type Props = {
  metadata: BuildingMetadata;
  floors: Floor[];
  onApplyBuildingPresets: () => void;
};

/* ---------------- kleine Helfer ---------------- */
const fmt = (v: number | undefined, digits = 2) =>
  typeof v === "number" && isFinite(v) ? v.toFixed(digits) : "–";
const fmtInt = (v: number | undefined) =>
  typeof v === "number" && isFinite(v) ? Math.round(v).toString() : "–";
const sum = (arr: number[]) =>
  arr.reduce((a, b) => a + (Number.isFinite(b) ? (b as number) : 0), 0);
const avg = (arr: number[]) => {
  const list = arr.filter((n) => Number.isFinite(n) && (n as number) > 0) as number[];
  return list.length ? sum(list) / list.length : 0;
};
const byAreaDesc = <T extends { area: number }>(arr: T[]) =>
  [...arr].sort((a, b) => (b.area || 0) - (a.area || 0));

/* ---------------- U-Wert-Balken ---------------- */
const U_MIN = 0.2;
const U_MAX = 4.0;

// Feste Desktop-Spaltenbreiten, damit Balken exakt ausgerichtet sind
const LABEL_COL_PX = 220; // Label-Spalte
const BAR_COL_PX = 420;   // Balken-Spalte

function UValueBar({ value, label }: { value: number; label: string }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const v = Math.max(U_MIN, Math.min(U_MAX, value || 0));
  const leftPct = ((v - U_MIN) / (U_MAX - U_MIN)) * 100;

  return (
    <Box
      aria-label={`U-Wert ${fmt(value, 2)} Watt pro Quadratmeter Kelvin für ${label}`}
      sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          minWidth: isMdUp ? BAR_COL_PX : 180,
        }}
      >
        <Box
          sx={{
            height: 10,
            borderRadius: 9999,
            background:
              "linear-gradient(90deg,#81c784 0%,#b2df8a 30%,#f7e37a 55%,#f4a261 75%,#e76f51 100%)",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: -2,
            left: `${leftPct}%`,
            transform: "translateX(-50%)",
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "#0b1727",
            boxShadow: "0 0 0 2px #fff",
          }}
        />
      </Box>
      <Chip
        size="small"
        label={`${fmt(value, 2)} W/m²K`}
        sx={{ fontWeight: 600, bgcolor: "#fff" }}
        variant="outlined"
      />
    </Box>
  );
}

/* ---------------- Meta-Chips (rechte Seite) ---------------- */
const AreaChip = ({
  area,
  sectionTotal,
  label = "Σ Fläche",
}: {
  area: number;
  sectionTotal: number;
  label?: string;
}) => {
  const pct = sectionTotal > 0 ? Math.round((area / sectionTotal) * 100) : 0;
  return (
    <Chip
      size="small"
      className="meta-label"
      variant="outlined"
      label={`${label}: ${fmtInt(area)} m²${sectionTotal ? ` • ${pct}%` : ""}`}
      sx={{ bgcolor: "#fff" }}
    />
  );
};
const LengthChip = ({ length }: { length: number }) => (
  <Chip
    size="small"
    className="meta-label"
    variant="outlined"
    label={`Länge: ${fmtInt(length)} m`}
    sx={{ bgcolor: "#fff" }}
  />
);
const PiecesChip = ({ count }: { count: number }) => (
  <Chip
    size="small"
    className="meta-label"
    variant="outlined"
    label={`Anzahl: ${fmtInt(count)}`}
    sx={{ bgcolor: "#fff" }}
  />
);

/* ---------------- Abschnitt-Container ---------------- */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: `1px solid ${colors.grayBorder}`,
        borderRadius: radii.md,
        backgroundColor: "#fff",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, color: colors.textMain, mb: 1 }}
      >
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

/* ---------------- Aggregation ---------------- */
type WallGroup = { label: string; u: number; area: number; length: number };
type WinGroup = { label: string; u: number; area: number; count: number };
type DoorGroup = { label: string; u: number; area: number; count: number };
type FlatGroup = { label: string; u: number; area: number };

function collectAll(floors: Floor[]) {
  const walls: WallGroup[] = [];
  const wins: WinGroup[] = [];
  const doors: DoorGroup[] = [];
  const ceilings: FlatGroup[] = [];
  const floorsRows: FlatGroup[] = [];

  floors.forEach((fl) =>
    fl.rooms.forEach((r) => {
      // Außenwände
      r.walls?.forEach((w) => {
        if (!w.isExterior) return;
        const material = (w.material || "Mauerwerk").toString();
        walls.push({
          label: material,
          u: Number(w.uValue || 0),
          area: Number(w.area || 0),
          length: Number(w.length || 0),
        });
      });

      // Fenster
      r.windows?.forEach((win) => {
        const type = (win.type || "Standardfenster").toString();
        wins.push({
          label: type,
          u: Number(win.uValue || 0),
          area: Number(win.area || 0),
          count: 1,
        });
      });

      // Türen
      r.doors?.forEach((d) => {
        const type = d.toUnheated ? "Außentür" : "Innentür";
        doors.push({
          label: type,
          u: Number(d.uValue || 0),
          area: Number(d.area || 0),
          count: 1,
        });
      });

      // Decken (Dach)
      if (r.ceilingConfig) {
        const roofLabel = (r.ceilingConfig.roofType as string) || "Flachdach";
        ceilings.push({
          label: roofLabel,
          u: Number(r.ceilingConfig.uValue || 0),
          area: Number(r.ceilingConfig.area || r.area || 0),
        });
      }

      // Böden
      if (r.floorConfig) {
        const ft = r.floorConfig.floorType || "beheizt";
        const ftLabel =
          ft === "erdreich"
            ? "zum Erdreich"
            : ft === "aussenluft"
            ? "über Außenluft"
            : ft === "unbeheizt"
            ? "über unbeheiztem Raum"
            : "über beheiztem Raum";
        floorsRows.push({
          label: ftLabel,
          u: Number(r.floorConfig.uValue || 0),
          area: Number(r.floorConfig.area || r.area || 0),
        });
      }
    })
  );

  // gruppieren/zusammenfassen nach Label
  const group = <T extends { label: string }>(arr: T[]) =>
    Object.values(
      arr.reduce<Record<string, T[]>>((acc, it) => {
        acc[it.label] = acc[it.label] || [];
        acc[it.label].push(it);
        return acc;
      }, {})
    );

  const wallsAgg = group(walls).map((list) => {
    const area = sum(list.map((x: any) => x.area));
    const length = sum(list.map((x: any) => x.length));
    const u =
      area > 0
        ? sum(list.map((x: any) => x.u * x.area)) / area
        : avg(list.map((x: any) => x.u));
    return { label: list[0].label, u, area, length } as WallGroup;
  });

  const winsAgg = group(wins).map((list) => {
    const area = sum(list.map((x: any) => x.area));
    const count = sum(list.map((x: any) => x.count));
    const u =
      area > 0
        ? sum(list.map((x: any) => x.u * x.area)) / area
        : avg(list.map((x: any) => x.u));
    return { label: list[0].label, u, area, count } as WinGroup;
  });

  const doorsAgg = group(doors).map((list) => {
    const area = sum(list.map((x: any) => x.area));
    const count = sum(list.map((x: any) => x.count));
    const u =
      area > 0
        ? sum(list.map((x: any) => x.u * x.area)) / area
        : avg(list.map((x: any) => x.u));
    return { label: list[0].label, u, area, count } as DoorGroup;
  });

  const ceilingsAgg = group(ceilings).map((list) => {
    const area = sum(list.map((x: any) => x.area));
    const u =
      area > 0
        ? sum(list.map((x: any) => x.u * x.area)) / area
        : avg(list.map((x: any) => x.u));
    return { label: list[0].label, u, area } as FlatGroup;
  });

  const floorsAgg = group(floorsRows).map((list) => {
    const area = sum(list.map((x: any) => x.area));
    const u =
      area > 0
        ? sum(list.map((x: any) => x.u * x.area)) / area
        : avg(list.map((x: any) => x.u));
    return { label: list[0].label, u, area } as FlatGroup;
  });

  return {
    wallsAgg: byAreaDesc(wallsAgg),
    winsAgg: byAreaDesc(winsAgg),
    doorsAgg: byAreaDesc(doorsAgg),
    ceilingsAgg: byAreaDesc(ceilingsAgg),
    floorsAgg: byAreaDesc(floorsAgg),
  };
}

/* ---------------- Hauptkomponente ---------------- */
export default function GrundmaterialienPanel({
  metadata,
  floors,
  onApplyBuildingPresets,
}: Props) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const { wallsAgg, winsAgg, doorsAgg, ceilingsAgg, floorsAgg } = useMemo(
    () => collectAll(floors),
    [floors]
  );

  // Bereichssummen für Prozent-Chips
  const totals = {
    wallsArea: sum(wallsAgg.map((x) => x.area)),
    winsArea: sum(winsAgg.map((x) => x.area)),
    doorsArea: sum(doorsAgg.map((x) => x.area)),
    ceilingsArea: sum(ceilingsAgg.map((x) => x.area)),
    floorsArea: sum(floorsAgg.map((x) => x.area)),
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        border: `1px solid ${colors.grayBorder}`,
        borderRadius: radii.lg,
        backgroundColor: "#fff",
      }}
    >
      {/* Ausserhalb sichtbarer Bereich – Legende für Screenreader */}
      <Box
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(1px,1px,1px,1px)",
        }}
      >
        Legende U-Wert-Balken: links (grün) niedriger U-Wert (bessere Dämmung),
        rechts (rot) höherer U-Wert (schlechtere Dämmung).
      </Box>

      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={spacing.sm}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: colors.textMain }}>
          Grundmaterialien – Gesamtübersicht
        </Typography>

        <Tooltip title="Aktuelle Gebäude-Voreinstellungen (Baujahr, Dämmniveau) erneut auf alle Räume anwenden.">
          <span>
            <Button variant="outlined" onClick={onApplyBuildingPresets} sx={{ borderRadius: 9999 }}>
              Werte aus dem Gebäude übernehmen
            </Button>
          </span>
        </Tooltip>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: spacing.md }}>
        Aggregation nur nach <b>Material/Typ</b> (keine einzelnen Bauteile). U-Werte sind
        flächengewichtet.
      </Typography>

      <Stack spacing={2}>
        {/* Wände */}
        <Section title="Außenwände — nach Material">
          {wallsAgg.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Keine Daten (0 m²).
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {wallsAgg.map((row) => (
                <Box
                  key={row.label}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: isMdUp
                      ? `${LABEL_COL_PX}px ${BAR_COL_PX}px 1fr`
                      : "1fr",
                    alignItems: "center",
                    gap: 12 / 8,
                    px: 1,
                    py: 1,
                    borderRadius: 1,
                    bgcolor: "#fafafa",
                  }}
                >
                  <Typography noWrap title={row.label} sx={{ fontWeight: 500 }}>
                    {row.label}
                  </Typography>

                  <UValueBar value={row.u} label={`Wände ${row.label}`} />

                  <Stack direction="row" spacing={0.75} sx={{ justifySelf: "end" }}>
                    <AreaChip area={row.area} sectionTotal={totals.wallsArea} />
                    {row.length > 0 && <LengthChip length={row.length} />}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Section>

        {/* Fenster */}
        <Section title="Fenster — nach Typ">
          {winsAgg.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Keine Daten (0 m²).
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {winsAgg.map((row) => (
                <Box
                  key={row.label}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: isMdUp
                      ? `${LABEL_COL_PX}px ${BAR_COL_PX}px 1fr`
                      : "1fr",
                    alignItems: "center",
                    gap: 12 / 8,
                    px: 1,
                    py: 1,
                    borderRadius: 1,
                    bgcolor: "#fafafa",
                  }}
                >
                  <Typography noWrap title={row.label} sx={{ fontWeight: 500 }}>
                    {row.label}
                  </Typography>

                  <UValueBar value={row.u} label={`Fenster ${row.label}`} />

                  <Stack direction="row" spacing={0.75} sx={{ justifySelf: "end" }}>
                    <AreaChip area={row.area} sectionTotal={totals.winsArea} />
                    <PiecesChip count={row.count} />
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Section>

        {/* Türen */}
        <Section title="Türen — nach Typ">
          {doorsAgg.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Keine Daten (0 m²).
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {doorsAgg.map((row) => (
                <Box
                  key={row.label}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: isMdUp
                      ? `${LABEL_COL_PX}px ${BAR_COL_PX}px 1fr`
                      : "1fr",
                    alignItems: "center",
                    gap: 12 / 8,
                    px: 1,
                    py: 1,
                    borderRadius: 1,
                    bgcolor: "#fafafa",
                  }}
                >
                  <Typography noWrap title={row.label} sx={{ fontWeight: 500 }}>
                    {row.label}
                  </Typography>

                  <UValueBar value={row.u} label={`Türen ${row.label}`} />

                  <Stack direction="row" spacing={0.75} sx={{ justifySelf: "end" }}>
                    <AreaChip area={row.area} sectionTotal={totals.doorsArea} />
                    <PiecesChip count={row.count} />
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Section>

        {/* Decken */}
        <Section title="Decken — nach Dachtyp">
          {ceilingsAgg.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Keine Daten (0 m²).
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {ceilingsAgg.map((row) => (
                <Box
                  key={row.label}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: isMdUp
                      ? `${LABEL_COL_PX}px ${BAR_COL_PX}px 1fr`
                      : "1fr",
                    alignItems: "center",
                    gap: 12 / 8,
                    px: 1,
                    py: 1,
                    borderRadius: 1,
                    bgcolor: "#fafafa",
                  }}
                >
                  <Typography noWrap title={row.label} sx={{ fontWeight: 500 }}>
                    {row.label}
                  </Typography>

                  <UValueBar value={row.u} label={`Decken ${row.label}`} />

                  <Stack direction="row" spacing={0.75} sx={{ justifySelf: "end" }}>
                    <AreaChip area={row.area} sectionTotal={totals.ceilingsArea} />
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Section>

        {/* Böden */}
        <Section title="Böden — nach Aufbau/Position">
          {floorsAgg.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Keine Daten (0 m²).
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {floorsAgg.map((row) => (
                <Box
                  key={row.label}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: isMdUp
                      ? `${LABEL_COL_PX}px ${BAR_COL_PX}px 1fr`
                      : "1fr",
                    alignItems: "center",
                    gap: 12 / 8,
                    px: 1,
                    py: 1,
                    borderRadius: 1,
                    bgcolor: "#fafafa",
                  }}
                >
                  <Typography noWrap title={row.label} sx={{ fontWeight: 500 }}>
                    {row.label}
                  </Typography>

                  <UValueBar value={row.u} label={`Böden ${row.label}`} />

                  <Stack direction="row" spacing={0.75} sx={{ justifySelf: "end" }}>
                    <AreaChip area={row.area} sectionTotal={totals.floorsArea} />
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Section>
      </Stack>
    </Paper>
  );
}
