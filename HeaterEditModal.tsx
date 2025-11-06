// src/pages/projectView/components/HeatLoadCalculator/room/sections/HeaterEditModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Typography,
  Divider,
  InputAdornment,
  SxProps,
  Theme,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { v4 as uuidv4 } from "uuid";

import type { Heater, RadiatorRegime } from "../../types";
import {
  listBrands,
  listSeries,
  listHeights,
  listWidths,
  getRadiatorNominalW,
  getItem,
} from "./radiatorCatalog";

/* NEW: Segmented pills control */
import SegmentedPills from "../../SegmentedPills";

/* ✅ NEW: shared valve brand options */
import { valveBrandOptions } from "./options";

type Props = {
  open: boolean;
  value?: Heater | null;
  onClose: () => void;
  onSave: (h: Heater) => void;
};

const REGIMES: RadiatorRegime[] = ["75/65/20", "70/55/20", "65/55/20", "55/45/20"];

/** Keep a small name map for known brands; falls back to a generic option */
const VALVE_NAMES: Record<string, string[]> = {
  Danfoss: ["RA-N", "RA-K", "RA-URX"],
  Heimeier: ["K", "V-exact", "Eclipse"],
  Oventrop: ["AV6", "Q-tech"],
  Resideo: ["V2000", "V5000"], // (Honeywell Home)
  Kermi: ["Standard"],
};
const VALVE_DIMENSIONS = ["10", "12", "15", "20", "25"];
const VALVE_FORMS = ["Eck", "Durchgang", "Axial"];

/** Preset types + free entry via Autocomplete */
const VALVE_TYPES = [
  "Thermostatisch",
  "Manuell",
  "Voreinstellbar",
  "Druckunabhängig (PICV)",
  "Zonenventil",
];

const makeEmptyHeater = (): Heater => ({
  id: "",
  type: "radiator",
  subType: "platten",
  height: undefined,
  width: undefined,
  output: 0,
  valveType: "Thermostatisch",
  roomTemp: 20,
  replacement: false,
  standardTemp: 55,
  brand: undefined,
  series: undefined,
  pressureDrop: 0,
  standardRegime: "75/65/20",
  nominalOutputAtStandard: undefined,
  kvPresetLabel: undefined,
  kvValue: undefined,
  // Valve details
  valveBrand: undefined,
  valveName: undefined,
  valveDimension: undefined,
  valveForm: undefined,
});

// TS-safe UUID
function safeUuid(): string {
  try {
    const c: any = (globalThis as any).crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {}
  return uuidv4();
}

const sectionTitle = (label: string) => (
  <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 1 }} variant="subtitle1">
    {label}
  </Typography>
);

const subtleHelp = (text: string) => (
  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
    {text}
  </Typography>
);

/** Uniform input styling to make text perfectly centered vertically */
const fieldSx: SxProps<Theme> = {
  // Affects TextField, Select (via FormControl), and Autocomplete
  "& .MuiOutlinedInput-root": {
    height: 40,
    minHeight: 40,
    borderRadius: 2,
    alignItems: "center", // centers content inside the input
    "& .MuiOutlinedInput-input": {
      padding: "8px 12px",
      lineHeight: "24px",
    },
    "& .MuiSelect-select": {
      padding: "8px 12px",
      lineHeight: "24px",
      display: "flex",
      alignItems: "center",
    },
  },
  // Autocomplete’s inner input needs its own rule (otherwise it sits ~2px off)
  "& .MuiAutocomplete-input": {
    padding: "8px 12px !important",
    lineHeight: "24px",
  },
  "& .MuiInputAdornment-root": { alignSelf: "center" },
};

const HeaterEditModal: React.FC<Props> = ({ open, value, onClose, onSave }) => {
  const [draft, setDraft] = useState<Heater>(value ?? makeEmptyHeater());

  useEffect(() => {
    setDraft(value ? { ...makeEmptyHeater(), ...value } : makeEmptyHeater());
  }, [value, open]);

  // Catalog option lists
  const brands = useMemo(() => listBrands(), []);
  const series = useMemo(() => listSeries(draft.brand), [draft.brand]);
  const heights = useMemo(() => listHeights(draft.brand, draft.series), [draft.brand, draft.series]);
  const widths = useMemo(() => listWidths(draft.brand, draft.series), [draft.brand, draft.series]);
  const item = useMemo(() => getItem(draft.brand, draft.series), [draft.brand, draft.series]);

  // Keep output mirrored to nominal while user hasn't overridden it
  useEffect(() => {
    if (draft.type !== "radiator") return;
    const nominal = getRadiatorNominalW(
      draft.brand,
      draft.series,
      draft.height,
      draft.width,
      draft.standardRegime ?? "75/65/20"
    );

    setDraft((prev) => {
      const next: Heater = { ...prev, nominalOutputAtStandard: nominal ?? undefined };
      const prevNominal = prev.nominalOutputAtStandard ?? 0;
      const userOverrode = prev.output !== prevNominal && prevNominal !== 0;
      if (!userOverrode) next.output = nominal ?? 0;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.brand, draft.series, draft.height, draft.width, draft.standardRegime]);

  const handleSave = () => {
    const id = draft.id && draft.id.length > 0 ? draft.id : safeUuid();
    onSave({ ...draft, id });
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        mt: 2,
        p: { xs: 2, sm: 2.5, md: 3 },
        border: (t) => `1px solid ${t.palette.divider}`,
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h6" fontWeight={700}>
          Heizkörper bearbeiten
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {/* TYPE / SUBTYPE */}
      {sectionTitle("Neuen Heizkörper anlegen")}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Grid item xs={12} md="auto">
          {/* Segmented pills: Type */}
          <SegmentedPills
            options={[
              { value: "radiator", label: "Heizkörper" },
              { value: "underfloor", label: "Fußbodenheizung" },
            ]}
            value={[draft.type]}
            onChange={(next) => {
              const val = next[0] as Heater["type"] | undefined;
              if (!val) return;
              setDraft((d) => ({
                ...d,
                type: val,
                ...(val === "radiator"
                  ? { subType: d.subType ?? "platten" }
                  : {
                      brand: undefined,
                      series: undefined,
                      height: undefined,
                      width: undefined,
                      nominalOutputAtStandard: undefined,
                      kvPresetLabel: undefined,
                      kvValue: undefined,
                      subType: undefined,
                      valveBrand: undefined,
                      valveName: undefined,
                      valveDimension: undefined,
                      valveForm: undefined,
                    }),
              }));
            }}
          />
        </Grid>

        {draft.type === "radiator" && (
          <Grid item xs>
            {/* Segmented pills: Radiator subType */}
            <SegmentedPills
              options={[
                { value: "platten", label: "Plattenheizkörper" },
                { value: "glieder", label: "Glieder-/Säulenheizkörper" },
                { value: "bad", label: "Badezimmerheizkörper" },
              ]}
              value={[draft.subType ?? "platten"]}
              onChange={(next) => {
                const val = next[0] as NonNullable<Heater["subType"]> | undefined;
                if (val) setDraft((d) => ({ ...d, subType: val }));
              }}
            />
          </Grid>
        )}
      </Grid>

      {/* RADIATOR FIELDS */}
      {draft.type === "radiator" ? (
        <>
          {sectionTitle("Geometrie & Katalog")}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>Marke</InputLabel>
                <Select
                  label="Marke"
                  value={draft.brand ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      brand: (e.target.value as string) || undefined,
                      series: undefined,
                      height: undefined,
                      width: undefined,
                      kvPresetLabel: undefined,
                      kvValue: undefined,
                      nominalOutputAtStandard: undefined,
                    }))
                  }
                >
                  {brands.map((b) => (
                    <MenuItem key={b} value={b}>
                      {b}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" disabled={!draft.brand} sx={fieldSx}>
                <InputLabel>Serie</InputLabel>
                <Select
                  label="Serie"
                  value={draft.series ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      series: (e.target.value as string) || undefined,
                      height: undefined,
                      width: undefined,
                      kvPresetLabel: undefined,
                      kvValue: undefined,
                      nominalOutputAtStandard: undefined,
                    }))
                  }
                >
                  {series.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={2.5}>
              <FormControl fullWidth size="small" disabled={!draft.series} sx={fieldSx}>
                <InputLabel>Höhe (mm)</InputLabel>
                <Select
                  label="Höhe (mm)"
                  value={draft.height ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      height: Number(e.target.value) || undefined,
                      nominalOutputAtStandard: undefined,
                    }))
                  }
                >
                  {heights.map((h) => (
                    <MenuItem key={h} value={h}>
                      {h}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={2.5}>
              <FormControl fullWidth size="small" disabled={!draft.height} sx={fieldSx}>
                <InputLabel>Breite (mm)</InputLabel>
                <Select
                  label="Breite (mm)"
                  value={draft.width ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      width: Number(e.target.value) || undefined,
                      nominalOutputAtStandard: undefined,
                    }))
                  }
                >
                  {widths.map((w) => (
                    <MenuItem key={w} value={w}>
                      {w}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box mt={2}>
            {sectionTitle("Betriebspunkt")}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel>Regime</InputLabel>
                  <Select
                    label="Regime"
                    value={draft.standardRegime ?? "75/65/20"}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, standardRegime: e.target.value as RadiatorRegime }))
                    }
                  >
                    {REGIMES.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {item?.kvPresets && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel>Ventil (kv-Voreinstellung)</InputLabel>
                    <Select
                      label="Ventil (kv-Voreinstellung)"
                      value={draft.kvPresetLabel ?? ""}
                      onChange={(e) => {
                        const label = e.target.value as string;
                        const kv = item.kvPresets?.[label];
                        setDraft((d) => ({ ...d, kvPresetLabel: label || undefined, kvValue: kv }));
                      }}
                    >
                      {Object.keys(item.kvPresets).map((label) => (
                        <MenuItem key={label} value={label}>
                          {label} {`(${item.kvPresets![label]})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nominal (bei Regime)"
                  size="small"
                  fullWidth
                  value={draft.nominalOutputAtStandard ?? 0}
                  InputProps={{
                    readOnly: true,
                    endAdornment: <InputAdornment position="end">W</InputAdornment>,
                  }}
                  sx={fieldSx}
                />
                {subtleHelp("Wird aus Katalog (Größe + Regime) befüllt")}
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Auslegung / Output"
                  type="number"
                  size="small"
                  fullWidth
                  value={draft.output}
                  onChange={(e) => setDraft((d) => ({ ...d, output: Number(e.target.value) || 0 }))}
                  InputProps={{ endAdornment: <InputAdornment position="end">W</InputAdornment> }}
                  sx={fieldSx}
                />
                {subtleHelp("Darf vom Nominalwert abweichen")}
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Druckverlust"
                  type="number"
                  size="small"
                  fullWidth
                  value={draft.pressureDrop ?? 0}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, pressureDrop: Number(e.target.value) || 0 }))
                  }
                  InputProps={{ endAdornment: <InputAdornment position="end">Pa</InputAdornment> }}
                  sx={fieldSx}
                />
              </Grid>

              {/* Ventiltyp with selectable options + free text (Autocomplete) */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={VALVE_TYPES}
                  value={draft.valveType ?? ""}
                  onInputChange={(_, newValue) =>
                    setDraft((d) => ({ ...d, valveType: newValue || "" }))
                  }
                  renderInput={(params) => <TextField {...params} label="Ventiltyp" sx={fieldSx} />}
                  sx={fieldSx}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Valve details block */}
          <Box mt={2}>
            {sectionTitle("Ventil (Details)")}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel>Marke</InputLabel>
                  <Select
                    label="Marke"
                    value={draft.valveBrand ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        valveBrand: e.target.value as string,
                        valveName: "",
                      }))
                    }
                  >
                    {valveBrandOptions.map((b) => (
                      <MenuItem key={b} value={b}>
                        {b}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" disabled={!draft.valveBrand} sx={fieldSx}>
                  <InputLabel>Name</InputLabel>
                  <Select
                    label="Name"
                    value={draft.valveName ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, valveName: e.target.value as string }))}
                  >
                    {(VALVE_NAMES[draft.valveBrand ?? ""] ?? ["RA-N"]).map((n) => (
                      <MenuItem key={n} value={n}>
                        {n}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel>Dimension</InputLabel>
                  <Select
                    label="Dimension"
                    value={draft.valveDimension ?? "15"}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, valveDimension: e.target.value as string }))
                    }
                  >
                    {VALVE_DIMENSIONS.map((dv) => (
                      <MenuItem key={dv} value={dv}>
                        {dv}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel>Bauform</InputLabel>
                  <Select
                    label="Bauform"
                    value={draft.valveForm ?? "Eck"}
                    onChange={(e) => setDraft((d) => ({ ...d, valveForm: e.target.value as string }))}
                  >
                    {VALVE_FORMS.map((f) => (
                      <MenuItem key={f} value={f}>
                        {f}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </>
      ) : (
        // UNDERFLOOR minimal fields
        <>
          {sectionTitle("Fußbodenheizung")}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Auslegung / Output"
                type="number"
                size="small"
                fullWidth
                value={draft.output}
                onChange={(e) => setDraft((d) => ({ ...d, output: Number(e.target.value) || 0 }))}
                InputProps={{ endAdornment: <InputAdornment position="end">W</InputAdornment> }}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Soll-Temperatur"
                type="number"
                size="small"
                fullWidth
                value={draft.roomTemp ?? 20}
                onChange={(e) => setDraft((d) => ({ ...d, roomTemp: Number(e.target.value) || 20 }))}
                InputProps={{ endAdornment: <InputAdornment position="end">°C</InputAdornment> }}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                size="small"
                options={VALVE_TYPES}
                value={draft.valveType ?? ""}
                onInputChange={(_, newValue) =>
                  setDraft((d) => ({ ...d, valveType: newValue || "" }))
                }
                renderInput={(params) => <TextField {...params} label="Ventiltyp" sx={fieldSx} />}
                sx={fieldSx}
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* ACTIONS */}
      <Box display="flex" justifyContent="flex-end" gap={1.5} mt={2}>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" onClick={handleSave}>
          Speichern
        </Button>
      </Box>
    </Box>
  );
};

export default HeaterEditModal;
