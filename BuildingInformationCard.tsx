// src/pages/projectView/components/HeatLoadCalculator/checklist/BuildingInformationCard.tsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Divider,
  Slider,
  Select,
  FormControl,
  Tooltip,
  InputAdornment,
  SxProps,
  Theme,
  Snackbar,
  Alert as MuiAlert,
  Collapse,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import {
  BuildingMetadata,
  PVHeatPumpSettings,
  BuildingEra,
  InsulationLevel,
} from "../types";
import PVHeatPumpConfig from "../room/sections/PVHeatPumpConfig";
import { colors, fontSizes, spacing } from "../designTokens";
import CardContainer from "../CardContainer";
import PrimaryButton from "../PrimaryButton";
import {
  BuildingEraOptions,
  InsulationLevelOptions,
} from "../room/sections/applyPresetUValues";
import YellowSwitch from "../ui/YellowSwitch";
import { useAppState, useAppActions } from "../useAppState";

// ⬇️ If you already have this helper elsewhere, DELETE this block and import it.
//    Example import:  import { fetchDesignOutdoorTemp } from "shared/api/climate";
import httpClient from "shared/utils/httpClient";
const CLIMATE_ROUTE = "/climate/design-temp";
async function fetchDesignOutdoorTemp(address: string) {
  const { data } = await httpClient.get(CLIMATE_ROUTE, { params: { address } });
  return {
    designTempC: data.designTempC as number,
    meta: {
      method: data.method as string | undefined,
      provider: data.provider as string | undefined,
      geocode: data.geocode as any,
      computedAt: data.computedAt as string | undefined,
    },
  };
}
/* =========================================================
   Tiny, reusable “stacked label” inputs (no floating labels)
   ========================================================= */

const topLabel: SxProps<Theme> = {
  display: "block",
  mb: 0.5,
  pl: 1,
  color: "text.secondary",
  fontSize: 12,
  lineHeight: 1.2,
  fontWeight: 600,
};

const capsule: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    height: 44,
    borderRadius: 9999,
    backgroundColor: "#fff",
    alignItems: "center",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: colors.grayBorder,
      borderRadius: 9999,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: colors.grayBorder,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: colors.primaryBlue,
      borderWidth: 2,
    },
    "& .MuiOutlinedInput-input": {
      padding: "10px 14px",
      lineHeight: 1.3,
    },
  },
  "& .MuiInputAdornment-root": { color: "text.secondary" },
};

const capsuleSelect: SxProps<Theme> = {
  ...capsule,
  "& .MuiSelect-select": {
    padding: "10px 40px 10px 14px",
    lineHeight: 1.3,
    borderRadius: 9999,
    backgroundColor: "transparent",
    minHeight: 0,
    display: "flex",
    alignItems: "center",
  },
};

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography component="span" sx={topLabel}>
    {children}
  </Typography>
);

const LabeledTextField: React.FC<
  React.ComponentProps<typeof TextField> & { labelText: React.ReactNode }
> = ({ labelText, sx, ...rest }) => (
  <Box>
    <FieldLabel>{labelText}</FieldLabel>
    <TextField
      fullWidth
      size="small"
      variant="outlined"
      sx={{ ...capsule, ...(sx as object) }}
      {...rest}
    />
  </Box>
);

type LabeledSelectProps = {
  labelText: React.ReactNode;
  value: any;
  onValue: (v: string) => void;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Select>, "value" | "onChange" | "label">;

const LabeledSelect: React.FC<LabeledSelectProps> = ({
  labelText,
  value,
  onValue,
  children,
  sx,
  ...rest
}) => (
  <Box>
    <FieldLabel>{labelText}</FieldLabel>
    <FormControl fullWidth size="small" sx={{ ...capsuleSelect, ...(sx as object) }}>
      <Select value={value} displayEmpty onChange={(e) => onValue(String(e.target.value))} {...rest}>
        {children}
      </Select>
    </FormControl>
  </Box>
);

/* ========================================================= */

type PVHPConfig = PVHeatPumpSettings;

const headerSx: SxProps<Theme> = {
  fontSize: fontSizes.base,
  lineHeight: "1.375rem",
  fontWeight: 700,
  color: colors.textMain,
};

const subheaderSx: SxProps<Theme> = {
  fontSize: fontSizes.base,
  lineHeight: "1.375rem",
  fontWeight: 700,
  color: colors.textMain,
  mt: spacing.md,
  mb: spacing.xs,
};

const buildingTypes = [
  "Einfamilienhaus",
  "Mehrfamilienhaus",
  "Reihenhaus",
  "Doppelhaushälfte",
  "Wohnung",
  "Bürogebäude",
];

const heatingSystems = [
  "Gasheizung",
  "Ölheizung",
  "Fernwärme",
  "Wärmepumpe",
  "Pelletheizung",
  "Holzofen",
  "Elektroheizung",
];

const warmWaterOptions: Array<
  "Durchlauferhitzer" | "Boiler" | "Kombitherme" | "Keine"
> = ["Durchlauferhitzer", "Boiler", "Kombitherme", "Keine"];

// A) Shielding options
const shieldingOptions: Array<"Hoch" | "Normal" | "Keine"> = [
  "Hoch",
  "Normal",
  "Keine",
];

const aboveChoices = [
  "Beheizter Raum",
  "Unbeheizter Dachraum / Kaltdach",
  "Dachterrasse / Außenluft",
  "Freie Außenluft",
];
const belowChoices = [
  "Beheizter Raum",
  "Keller (unbeheizt)",
  "Erdreich",
  "Außenluft (Stützen / Durchfahrt)",
];

type Props = {
  metadata: BuildingMetadata;
  setMetadata: (update: Partial<BuildingMetadata>) => void;
  onValidChange?: (isValid: boolean) => void;
};

export const BuildingInformationCard: React.FC<Props> = ({
  metadata,
  setMetadata,
  onValidChange,
}) => {
  const defaultEra = (BuildingEraOptions[0]?.value ?? "pre1978") as BuildingEra;
  const defaultIns = (InsulationLevelOptions[0]?.value ?? "none") as InsulationLevel;

  // Pull floors (for Floor Management sync) and actions
  const { projectMeta, floors } = useAppState();
  const {
    setTariff,
    setAltHeating,
    setDimensioning,
    setPlannedDate,
    addFloor,
    removeFloor,
  } = useAppActions();

  const getBaseDefaultMetadata = (): BuildingMetadata => ({
    constructionYear: 2000,
    floors: 1,
    residents: 1,
    temperaturePreference: 20,
    professionalInput: false,
    solarThermal: false,
    woodFireplace: false,

    // Keep legacy boolean for compatibility; see dropdown below
    airtightnessTest: false,
    // New typed selector
    airtightnessTestType: "none" as any,
    n50Value: undefined,
    volumetricFlowM3PerH: undefined,

    interiorWallToHeated: false,
    postalCode: "",
    location: "",
    address: "",
    buildingType: "",
    pvHeatPump: {
      hasPV: false,
      hasHeatPump: false,
      bufferTank: false,
      pvKwp: undefined,
      hpType: undefined,
      bufferSizeLiters: undefined,
    },
    renovationYear: undefined,
    oldHeatingType: undefined,
    oldHeatingYear: undefined,
    domesticHotWater: undefined,
    annualGasConsumption: undefined,
    annualElectricConsumption: undefined,
    buildingLength: undefined,
    buildingWidth: undefined,
    exteriorWallLength: undefined,
    aboveContext: undefined,
    belowContext: undefined,
    shielding: undefined,
    specialFeatures: undefined,
    groundDepth: undefined,

    // Expert preset default
    thermalBridgePreset: "standard" as any,

    buildingEra: (metadata?.buildingEra as BuildingEra) ?? defaultEra,
    insulationLevel: (metadata?.insulationLevel as InsulationLevel) ?? defaultIns,

    designOutdoorTempC: metadata?.designOutdoorTempC ?? undefined,
    manualDesignOutdoorTempC: metadata?.manualDesignOutdoorTempC ?? undefined,
  });

  const [form, setForm] = useState<BuildingMetadata>(() => {
    const d = getBaseDefaultMetadata();
    return {
      ...d,
      ...metadata,
      location: metadata.location ?? "",
      pvHeatPump: { ...d.pvHeatPump, ...metadata.pvHeatPump },
    };
  });

  const [savedOpen, setSavedOpen] = useState(false);

  // Keep local form in sync if parent metadata changes
  useEffect(() => {
    const d = getBaseDefaultMetadata();
    setForm({
      ...d,
      ...metadata,
      location: metadata.location ?? "",
      pvHeatPump: { ...d.pvHeatPump, ...metadata.pvHeatPump },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata]);

  const handleChange = (
    key: keyof BuildingMetadata,
    value: string | number | boolean | Partial<PVHPConfig> | undefined
  ) => {
    setForm((prev) => {
      if (key === "location") return { ...prev, location: value as string };
      if (key === "pvHeatPump") {
        const merged: PVHPConfig = { ...prev.pvHeatPump, ...(value as Partial<PVHPConfig>) };
        return { ...prev, pvHeatPump: merged };
      }
      if (typeof (prev as any)[key] === "number" && typeof value === "string") {
        const parsed = value === "" ? undefined : Number(value);
        return { ...prev, [key]: parsed as any };
      }
      if (
        (key === "domesticHotWater" ||
          key === "shielding" ||
          key === "oldHeatingType") &&
        value === ""
      ) {
        return { ...prev, [key]: undefined as any };
      }
      if (typeof value === "boolean") return { ...prev, [key]: value };
      return { ...prev, [key]: value as any };
    });

    if (key === "address" || key === "postalCode" || key === "location") {
      setMetadata({ [key]: value as any });
    }
    if (key === "manualDesignOutdoorTempC") {
      setMetadata({ manualDesignOutdoorTempC: value as any });
    }
    if (key === "buildingEra" || key === "insulationLevel") {
      setMetadata({ [key]: value as any });
    }
  };

  const isValid =
    form.buildingType !== "" &&
    form.constructionYear !== undefined &&
    form.constructionYear >= 1800 &&
    form.floors !== undefined &&
    form.floors >= 1 &&
    form.residents !== undefined &&
    form.residents >= 1 &&
    form.temperaturePreference !== undefined &&
    form.temperaturePreference >= 15 &&
    form.temperaturePreference <= 26 &&
    form.postalCode !== "" &&
    form.address !== "";

  useEffect(() => {
    onValidChange?.(isValid);
  }, [isValid, onValidChange]);

  // 🔥 Auto-fetch climate design temperature when address/PLZ/Ort change (if NOT manually overridden)
  useEffect(() => {
    if (form.manualDesignOutdoorTempC != null) return; // manual value present → don't auto fetch

    const addr = (form.address || "").trim();
    const zip = (form.postalCode || "").trim();
    const city = (form.location || "").trim();
    const query = [addr, zip, city].filter(Boolean).join(", ");

    if (!query) return;

    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const { designTempC, meta } = await fetchDesignOutdoorTemp(query);
        if (cancelled) return;
        if (Number.isFinite(designTempC)) {
          setMetadata({
            designOutdoorTempC: designTempC,
            designOutdoorTempMeta: meta,
          });
        }
      } catch (e) {
        // Keep silent; UI will fall back and/or allow manual entry
        console.warn("Climate lookup failed", e);
      }
    }, 400); // debounce

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.address, form.postalCode, form.location, form.manualDesignOutdoorTempC]);

  const handleSubmit = () => {
    if (!isValid) return;

    // Keep climate-provided value if present in metadata but not filled in form
    const payload: BuildingMetadata = { ...form };

    // If no manual value provided, ensure manual is not carried unintentionally
    if (form.manualDesignOutdoorTempC == null) {
      payload.manualDesignOutdoorTempC = undefined;
    }

    if (
      metadata.designOutdoorTempC != null &&
      (form.designOutdoorTempC == null || (form as any).designOutdoorTempC === "")
    ) {
      payload.designOutdoorTempC = metadata.designOutdoorTempC;
      payload.designOutdoorTempMeta = metadata.designOutdoorTempMeta;
    }

    // 🔗 Sync floors to Floor Management
    const desired = Math.max(1, Number(form.floors ?? 1));
    const current = floors?.length ?? 0;
    if (desired > current) {
      for (let i = 0; i < desired - current; i++) addFloor();
    } else if (desired < current) {
      for (let i = current - 1; i >= desired; i--) removeFloor(floors[i].id);
    }

    setMetadata(payload);
    setSavedOpen(true);
  };

  const adorn = (text: string) => (
    <InputAdornment position="end" sx={{ alignSelf: "center" }}>
      {text}
    </InputAdornment>
  );

  const effectiveDesignTemp =
    form.manualDesignOutdoorTempC ?? form.designOutdoorTempC ?? "";

  const tariff = projectMeta.tariff;
  const alt = projectMeta.altHeating;
  const dim = projectMeta.dimensioning;

  return (
    <CardContainer sx={{ p: { xs: 2, sm: 3, md: 4 }, width: "100%", mx: 0 }}>
      <Typography sx={headerSx} gutterBottom>
        🏠 Gebäudeinformationen (Erweitert)
      </Typography>
      <Divider sx={{ mb: spacing.md, borderColor: colors.grayBorder }} />

      <Box
        component="form"
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          handleSubmit();
        }}
        sx={{ width: "100%" }}
      >
        <Grid container spacing={2} alignItems="flex-start">
          {/* Row 1 */}
          <Grid item xs={12} md={6}>
            <LabeledTextField
              labelText="Postleitzahl *"
              value={form.postalCode ?? ""}
              onChange={(e) => handleChange("postalCode", (e.target as HTMLInputElement).value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <LabeledTextField
              labelText="Ort (PLZ oder Stadt)"
              value={form.location ?? ""}
              onChange={(e) => handleChange("location", (e.target as HTMLInputElement).value)}
            />
          </Grid>

          {/* Row 2 */}
          <Grid item xs={12}>
            <LabeledTextField
              labelText="Adresse *"
              value={form.address ?? ""}
              onChange={(e) => handleChange("address", (e.target as HTMLInputElement).value)}
            />
          </Grid>

          {/* Row 3 – Design outside temperature (always editable) */}
          <Grid item xs={12} md={6}>
            <FieldLabel>
              <Box display="inline-flex" alignItems="center" gap={0.5}>
                <span>Auslegungs-Außentemperatur</span>
                <Tooltip
                  title={
                    form.designOutdoorTempMeta
                      ? `${form.designOutdoorTempMeta?.geocode?.name ?? ""} • ${
                          form.designOutdoorTempMeta?.method ?? ""
                        } • ${form.designOutdoorTempMeta?.provider ?? ""}`
                      : "Automatisch ermittelter Wert (falls verfügbar). Sie können ihn hier direkt anpassen."
                  }
                >
                  <InfoIcon fontSize="inherit" />
                </Tooltip>
              </Box>
            </FieldLabel>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              sx={capsule}
              type="number"
              value={effectiveDesignTemp}
              onChange={(e) => {
                const raw = (e.target as HTMLInputElement).value;
                // Allow clearing the field to revert to the climate value
                if (raw === "") {
                  handleChange("manualDesignOutdoorTempC", undefined);
                  return;
                }
                const n = Number(String(raw).replace(",", "."));
                const clamped =
                  Number.isFinite(n) ? Math.max(-50, Math.min(15, n)) : undefined;
                handleChange("manualDesignOutdoorTempC", clamped as number | undefined);
              }}
              InputProps={{
                endAdornment: adorn("°C"),
              }}
            />
          </Grid>

          {/* Row 4 */}
          <Grid item xs={12} md={6}>
            <LabeledSelect
              labelText="Gebäudetyp *"
              value={form.buildingType}
              onValue={(v) => handleChange("buildingType", v)}
            >
              <MenuItem value="">
                <em>Bitte wählen</em>
              </MenuItem>
              {buildingTypes.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </LabeledSelect>
          </Grid>

          <Grid item xs={12} md={3}>
            <LabeledSelect
              labelText="Baualter (Ära)"
              value={(form.buildingEra as any) ?? defaultEra}
              onValue={(v) => handleChange("buildingEra", v as BuildingEra)}
            >
              {BuildingEraOptions.map((opt) => (
                <MenuItem key={String(opt.value)} value={opt.value as any}>
                  {opt.label}
                </MenuItem>
              ))}
            </LabeledSelect>
          </Grid>
          <Grid item xs={12} md={3}>
            <LabeledSelect
              labelText="Dämmniveau"
              value={(form.insulationLevel as any) ?? defaultIns}
              onValue={(v) => handleChange("insulationLevel", v as InsulationLevel)}
            >
              {InsulationLevelOptions.map((opt) => (
                <MenuItem key={String(opt.value)} value={opt.value as any}>
                  {opt.label}
                </MenuItem>
              ))}
            </LabeledSelect>
          </Grid>

          {/* Row 5 */}
          <Grid item xs={12} md={6}>
            <LabeledTextField
              labelText="Baujahr *"
              type="number"
              value={form.constructionYear ?? ""}
              onChange={(e) => handleChange("constructionYear", (e.target as HTMLInputElement).value)}
              InputProps={{ endAdornment: adorn("Jahr") }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <LabeledTextField
              labelText="Sanierungsjahr"
              type="number"
              value={form.renovationYear ?? ""}
              onChange={(e) => handleChange("renovationYear", (e.target as HTMLInputElement).value)}
              InputProps={{ endAdornment: adorn("Jahr") }}
            />
          </Grid>

          {/* Row 6 */}
          <Grid item xs={12} md={6}>
            <LabeledTextField
              labelText="Anzahl Stockwerke *"
              type="number"
              value={form.floors ?? ""}
              onChange={(e) => handleChange("floors", (e.target as HTMLInputElement).value)}
              InputProps={{ endAdornment: adorn("Stk.") }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <LabeledTextField
              labelText="Anzahl Bewohner *"
              type="number"
              value={form.residents ?? ""}
              onChange={(e) => handleChange("residents", (e.target as HTMLInputElement).value)}
              InputProps={{ endAdornment: adorn("Pers.") }}
            />
          </Grid>

          {/* Temperature preference */}
          <Grid item xs={12} md={5}>
            <FieldLabel>Temperaturpräferenz (°C): {form.temperaturePreference}</FieldLabel>
            <Box sx={{ mt: 0.5, width: "100%", maxWidth: "100%" }}>
              <Slider
                size="small"
                value={form.temperaturePreference ?? 20}
                min={15}
                max={26}
                step={1}
                onChange={(_, v) =>
                  handleChange("temperaturePreference", Array.isArray(v) ? v[0] : (v as number))
                }
                sx={{
                  height: 8,
                  color: "transparent",
                  "& .MuiSlider-rail": {
                    height: 8,
                    opacity: 1,
                    borderRadius: 9999,
                    background:
                      "linear-gradient(90deg,#43A047 0%, #A6CE39 33%, #F0B429 66%, #E53935 100%)",
                  },
                  "& .MuiSlider-track": { height: 8, border: "none", backgroundColor: "transparent" },
                  "& .MuiSlider-thumb": {
                    width: 14,
                    height: 14,
                    backgroundColor: "#fff",
                    border: "1px solid #c9c9c9",
                    boxShadow: "0 0 0 2px #fff",
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Professional input toggle */}
          <Grid item xs={12}>
            <YellowSwitch
              checked={form.professionalInput}
              onChange={(checked) => handleChange("professionalInput", checked)}
              label={<Typography variant="body2">Professionelle Eingabe</Typography>}
              labelPlacement="end"
            />
          </Grid>

          {/* Advanced fields */}
          <Collapse in={!!form.professionalInput} unmountOnExit>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              {/* Tarif & Kosten */}
              <Grid item xs={12}>
                <Typography sx={subheaderSx}>Tarif &amp; Kosten</Typography>
              </Grid>

              <Grid item xs={12}>
                <YellowSwitch
                  checked={tariff.hpTariffEnabled}
                  onChange={(checked) => setTariff({ ...tariff, hpTariffEnabled: checked })}
                  label={<Typography variant="body2">Wärmepumpentarif aktivieren?</Typography>}
                  labelPlacement="end"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <LabeledTextField
                  labelText="Stromkosten des Heizsystems (ct/kWh)"
                  type="number"
                  value={tariff.electricityPriceCt}
                  onChange={(e) =>
                    setTariff({ ...tariff, electricityPriceCt: Number((e.target as HTMLInputElement).value) })
                  }
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>

              <Grid item xs={12}>
                <YellowSwitch
                  checked={alt.compareAlternativeHeating}
                  onChange={(checked) => setAltHeating({ ...alt, compareAlternativeHeating: checked })}
                  label={<Typography variant="body2">Vergleich mit alternativer Heizung</Typography>}
                  labelPlacement="end"
                />
              </Grid>

              {alt.compareAlternativeHeating && (
                <>
                  <Grid item xs={12} md={6}>
                    <LabeledTextField
                      labelText="Kosten der alternativen Heizung (€)"
                      type="number"
                      value={alt.altHeatingCostEUR ?? 0}
                      onChange={(e) =>
                        setAltHeating({ ...alt, altHeatingCostEUR: Number((e.target as HTMLInputElement).value) })
                      }
                      inputProps={{ min: 0, step: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <LabeledTextField
                      labelText="Austausch nach (Jahren)"
                      type="number"
                      value={alt.altHeatingReplacementYears ?? 0}
                      onChange={(e) =>
                        setAltHeating({
                          ...alt,
                          altHeatingReplacementYears: Number((e.target as HTMLInputElement).value),
                        })
                      }
                      inputProps={{ min: 0, step: 1 }}
                    />
                  </Grid>
                </>
              )}

              {/* Dimensionierung & Planung */}
              <Grid item xs={12}>
                <Typography sx={subheaderSx}>Dimensionierung &amp; Planung</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <LabeledTextField
                  labelText="Heizlast (W)"
                  type="number"
                  value={dim.heatLoadW}
                  onChange={(e) => setDimensioning({ ...dim, heatLoadW: Number((e.target as HTMLInputElement).value) })}
                  inputProps={{ min: 0, step: 10 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <LabeledTextField
                  labelText="Warmwasserbedarf pro Bewohner (L/Tag)"
                  type="number"
                  value={dim.dhwPerResidentLPerDay}
                  onChange={(e) =>
                    setDimensioning({
                      ...dim,
                      dhwPerResidentLPerDay: Number((e.target as HTMLInputElement).value),
                    })
                  }
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <LabeledTextField
                  labelText="Bivalenztemperatur (°C)"
                  type="number"
                  value={dim.bivalenceTemperatureC}
                  onChange={(e) =>
                    setDimensioning({
                      ...dim,
                      bivalenceTemperatureC: Number((e.target as HTMLInputElement).value),
                    })
                  }
                  inputProps={{ step: 0.5 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <LabeledTextField
                  labelText="Geplantes Installationsdatum"
                  type="date"
                  value={projectMeta.plannedInstallationDate ?? ""}
                  onChange={(e) => setPlannedDate((e.target as HTMLInputElement).value)}
                />
              </Grid>

              {/* Existing advanced fields */}
              <Grid item xs={12} md={6}>
                <LabeledSelect
                  labelText="Altes Heizsystem"
                  value={form.oldHeatingType || ""}
                  onValue={(v) => handleChange("oldHeatingType", v)}
                >
                  <MenuItem value="">
                    <em>Keine Angabe</em>
                  </MenuItem>
                  {heatingSystems.map((sys) => (
                    <MenuItem key={sys} value={sys}>
                      {sys}
                    </MenuItem>
                  ))}
                </LabeledSelect>
              </Grid>

              <Grid item xs={12} md={6}>
                <LabeledTextField
                  labelText="Installationsjahr Altes Heizsystem"
                  type="number"
                  value={form.oldHeatingYear ?? ""}
                  onChange={(e) => handleChange("oldHeatingYear", (e.target as HTMLInputElement).value)}
                  InputProps={{ endAdornment: adorn("Jahr") }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <YellowSwitch
                  checked={form.solarThermal}
                  onChange={(checked) => handleChange("solarThermal", checked)}
                  label={<Typography variant="body2">Solarthermie</Typography>}
                  labelPlacement="end"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <YellowSwitch
                  checked={form.woodFireplace}
                  onChange={(checked) => handleChange("woodFireplace", checked)}
                  label={<Typography variant="body2">Ofen/Kamin</Typography>}
                  labelPlacement="end"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <LabeledSelect
                  labelText="Warmwasser"
                  value={form.domesticHotWater || ""}
                  onValue={(v) =>
                    handleChange("domesticHotWater", v as (typeof warmWaterOptions)[number] | "")
                  }
                >
                  <MenuItem value="">
                    <em>Keine Angabe</em>
                  </MenuItem>
                  {warmWaterOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </LabeledSelect>
              </Grid>

              <Grid item xs={12} md={6}>
                <LabeledTextField
                  labelText="Jährlicher Gasverbrauch"
                  type="number"
                  value={form.annualGasConsumption ?? ""}
                  onChange={(e) =>
                    handleChange("annualGasConsumption", (e.target as HTMLInputElement).value)
                  }
                  InputProps={{ endAdornment: adorn("kWh") }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <LabeledTextField
                  labelText="Jährlicher Stromverbrauch"
                  type="number"
                  value={form.annualElectricConsumption ?? ""}
                  onChange={(e) =>
                    handleChange("annualElectricConsumption", (e.target as HTMLInputElement).value)
                  }
                  InputProps={{ endAdornment: adorn("kWh") }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <LabeledTextField
                  labelText="Gebäudelänge"
                  type="number"
                  value={form.buildingLength ?? ""}
                  onChange={(e) => handleChange("buildingLength", (e.target as HTMLInputElement).value)}
                  InputProps={{ endAdornment: adorn("m") }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <LabeledTextField
                  labelText="Gebäudebreite"
                  type="number"
                  value={form.buildingWidth ?? ""}
                  onChange={(e) => handleChange("buildingWidth", (e.target as HTMLInputElement).value)}
                  InputProps={{ endAdornment: adorn("m") }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <LabeledTextField
                  labelText="Außenwandlänge"
                  type="number"
                  value={form.exteriorWallLength ?? ""}
                  onChange={(e) =>
                    handleChange("exteriorWallLength", (e.target as HTMLInputElement).value)
                  }
                  InputProps={{ endAdornment: adorn("m") }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <LabeledSelect
                  labelText="Was ist über dem Gebäude?"
                  value={form.aboveContext || ""}
                  onValue={(v) => handleChange("aboveContext", v)}
                >
                  <MenuItem value="">
                    <em>Keine Angabe</em>
                  </MenuItem>
                  {aboveChoices.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </LabeledSelect>
              </Grid>
              <Grid item xs={12} md={6}>
                <LabeledSelect
                  labelText="Was ist unter dem Gebäude?"
                  value={form.belowContext || ""}
                  onValue={(v) => handleChange("belowContext", v)}
                >
                  <MenuItem value="">
                    <em>Keine Angabe</em>
                  </MenuItem>
                  {belowChoices.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </LabeledSelect>
              </Grid>

              {/* A) Shielding select */}
              <Grid item xs={12} md={6}>
                <LabeledSelect
                  labelText="Abschirmung"
                  value={form.shielding || ""}
                  onValue={(v) => handleChange("shielding", v)}
                >
                  {shieldingOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </LabeledSelect>
              </Grid>

              {/* B) Airtightness test — dropdown with variants */}
              <Grid item xs={12} md={6}>
                <LabeledSelect
                  labelText="Luftdichtigkeitsprüfung"
                  value={form.airtightnessTestType || "none"}
                  onValue={(v) => {
                    handleChange("airtightnessTestType", v as any);
                    // keep boolean in sync for older code paths:
                    handleChange("airtightnessTest", v !== "none");
                  }}
                >
                  <MenuItem value="none">Nein</MenuItem>
                  <MenuItem value="n50Known">Ja, N50 Wert bekannt</MenuItem>
                  <MenuItem value="flowKnown">Ja, Volumenstrom bekannt</MenuItem>
                  <MenuItem value="yesUnknown">Ja, kein Wert bekannt</MenuItem>
                </LabeledSelect>
              </Grid>

              {/* Conditionally show fields based on selection */}
              {form.airtightnessTestType === "n50Known" && (
                <Grid item xs={12} md={6}>
                  <LabeledTextField
                    labelText="n50-Wert"
                    type="number"
                    value={form.n50Value ?? ""}
                    onChange={(e) => {
                      const raw = parseFloat((e.target as HTMLInputElement).value);
                      const clamped = Number.isFinite(raw)
                        ? Math.max(0, Math.min(10, raw))
                        : undefined;
                      handleChange("n50Value", clamped);
                    }}
                    InputProps={{
                      inputProps: { min: 0, max: 10, step: 0.1 },
                      endAdornment: adorn("1/h"),
                    }}
                  />
                </Grid>
              )}

              {form.airtightnessTestType === "flowKnown" && (
                <Grid item xs={12} md={6}>
                  <LabeledTextField
                    labelText="Volumenstrom"
                    type="number"
                    value={form.volumetricFlowM3PerH ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "volumetricFlowM3PerH",
                        Number((e.target as HTMLInputElement).value)
                      )
                    }
                    InputProps={{ endAdornment: adorn("m³/h") }}
                  />
                </Grid>
              )}

              {/* C) Expert settings */}
              <Grid item xs={12}>
                <Typography sx={subheaderSx}>⚗️ ExpertEinstellungen</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <LabeledSelect
                  labelText="Wärmebrückenzuschlag"
                  value={form.thermalBridgePreset || "standard"}
                  onValue={(v) => handleChange("thermalBridgePreset", v as any)}
                >
                  <MenuItem value="standard">Standard (0,10 W/m²K)</MenuItem>
                  <MenuItem value="dinA005">
                    DIN 4108 Kategorie A erfüllt (0,05 W/m²K)
                  </MenuItem>
                  <MenuItem value="dinA003">
                    DIN 4108 Kategorie A erfüllt (0,03 W/m²K)
                  </MenuItem>
                  <MenuItem value="interiorInsulation">
                    Innenliegende Dämmung (0,15 W/m²K)
                  </MenuItem>
                </LabeledSelect>
              </Grid>

              <Grid item xs={12} md={6}>
                <LabeledTextField
                  labelText="Normtemperatur (aus Klima)"
                  type="number"
                  value={form.designOutdoorTempC ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "designOutdoorTempC",
                      (e.target as HTMLInputElement).value
                    )
                  }
                  InputProps={{ readOnly: true, endAdornment: adorn("°C") }}
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: spacing.md }}>
                <Typography sx={headerSx} gutterBottom>
                  PV &amp; Wärmepumpe
                </Typography>
                <PVHeatPumpConfig
                  pvhp={form.pvHeatPump}
                  onChange={(p) => handleChange("pvHeatPump", p as Partial<PVHPConfig>)}
                />
              </Grid>
            </Grid>
          </Collapse>
        </Grid>

        <Box sx={{ mt: spacing.lg, textAlign: "right", width: "100%" }}>
          <PrimaryButton type="submit" size="small" disabled={!isValid}>
            Speichern
          </PrimaryButton>
        </Box>
      </Box>

      {/* ✅ Moved to TOP */}
      <Snackbar
        open={savedOpen}
        autoHideDuration={2400}
        onClose={() => setSavedOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          mt: "calc(env(safe-area-inset-top, 0px) + 8px)",
          zIndex: (t) => t.zIndex.snackbar + 2,
        }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity="success"
          onClose={() => setSavedOpen(false)}
          sx={{
            borderRadius: 9999,
            px: 2.25,
            py: 1,
            fontWeight: 600,
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
          }}
        >
          Gespeichert
        </MuiAlert>
      </Snackbar>
    </CardContainer>
  );
};

export default BuildingInformationCard;
