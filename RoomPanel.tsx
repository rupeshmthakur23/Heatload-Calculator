// src/pages/projectView/components/HeatLoadCalculator/room/RoomPanel.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import {
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Tooltip,
  TextField,
  useTheme,
  SxProps,
  Theme,
  Box,
  InputAdornment,
  IconButton,
  Button,
  Snackbar,
  Alert as MuiAlert,
} from "@mui/material";
import type { SystemStyleObject } from "@mui/system";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoIcon from "@mui/icons-material/Info";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuidv4 } from "uuid";

import {
  Room as RoomType,
  VentilationConfigType,
  Wall,
  Door,
  Window,
  CeilingConfigType,
  FloorConfigType,
  ThermalBridge,
  Heater,
} from "../types";
import { useAppActions, useAppState } from "../useAppState";
import PrimaryButton from "../PrimaryButton";
import CardContainer from "../CardContainer";
import { colors, radii, spacing } from "../designTokens";

import WallConfig from "./sections/WallConfig";
import WindowConfig from "./sections/WindowConfig";
import DoorConfig from "./sections/DoorConfig";
import CeilingConfig from "./sections/CeilingConfig";
import FloorConfig from "./sections/FloorConfig";
import HeaterList from "./sections/HeaterList";
const VentilationConfig = React.lazy(() => import("./sections/VentilationConfig"));

/** UI Defaults (placeholders only) */
const PLACEHOLDER = {
  roofU: 0.18,
  floorU: 0.30,
  wallU: 1.10,
  windowU: 0.95,
  doorU: 1.50,
  ach: 0.5,
  hrv: 0.8,
  gains: 80,
};

const DEFAULT_VENT: VentilationConfigType = {
  roomType: "living",
  targetTemp: 20,
  airExchangeRate: 0.5,
  ventilationSystem: false,
  heatRecoveryEfficiency: 0,
  internalGainsW: 0,
};

const headerSx: SxProps<Theme> = {
  fontSize: "0.95rem",
  fontWeight: 600,
  color: "text.primary",
};

const labelMap: Record<"name" | "area" | "height" | "targetTemperature", string> = {
  name: "Name",
  area: "Fläche (m²)",
  height: "Höhe (m)",
  targetTemperature: "Solltemperatur (°C)",
};

const toNum = (raw: string | number, fallback = 0) => {
  const n = typeof raw === "number" ? raw : parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
};

// Deep-clone to refresh refs for React state updates
const cloneRoomForState = (base: any): any => ({
  ...base,
  walls: [...(base.walls || [])],
  windows: [...(base.windows || [])],
  doors: [...(base.doors || [])],
  heaters: [...(base.heaters || [])],
  thermalBridges: [...(base.thermalBridges || [])],
  ceilingConfig: base.ceilingConfig ? { ...base.ceilingConfig } : base.ceilingConfig,
  floorConfig: base.floorConfig ? { ...base.floorConfig } : base.floorConfig,
  ventilation: base.ventilation ? { ...base.ventilation } : base.ventilation,
});

interface RoomPanelProps {
  room: RoomType & { floorId?: string };
  updateRoom: (room: RoomType & { floorId?: string }) => void;
}

/** Compact shell (general) */
const compactShellSx: SystemStyleObject<Theme> = {
  "& .MuiAccordion-root": { marginBottom: "0px" },
  "& .MuiAccordionSummary-root": {
    minHeight: 30,
    paddingLeft: "6px",
    paddingRight: "6px",
  },
  "& .MuiAccordionSummary-content": { margin: 0 },
  "& .MuiAccordionDetails-root": {
    paddingTop: "4px",
    paddingBottom: "6px",
    paddingLeft: "6px",
    paddingRight: "6px",
  },
  "& .MuiOutlinedInput-root": {
    height: 30,
    borderRadius: 8,
    "& .MuiInputBase-input": { padding: "4px 8px" },
  },
  "& .MuiInputAdornment-root": { marginRight: 0, color: "text.secondary" },
  "& .MuiFormHelperText-root": { marginTop: "2px" },
  "& .MuiButton-root": { minHeight: 28, padding: "4px 8px", borderRadius: 16 },
  "& .MuiListItem-root": { paddingTop: "4px", paddingBottom: "4px" },
};

/** Slightly taller inputs just for the Wärmebrücken section (to add vertical room) */
const bridgeFieldSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    height: 36,
    borderRadius: 8,
    "& .MuiInputBase-input": { padding: "6px 10px" },
  },
  "& .MuiInputAdornment-root": { marginRight: 0 },
};

export default function RoomPanel({ room, updateRoom }: RoomPanelProps) {
  const theme = useTheme();
  const { replaceRoom } = useAppActions();
  useAppState(); // keep hooked to app state (e.g., to display meta in future)

  const [values, setValues] = useState<RoomType & { floorId?: string }>(
    cloneRoomForState({
      ...room,
      walls: room.walls ?? [],
      windows: room.windows ?? [],
      doors: room.doors ?? [],
      heaters: room.heaters ?? [],
      ceilingConfig: room.ceilingConfig!,
      floorConfig: room.floorConfig!,
      ventilation: room.ventilation ?? DEFAULT_VENT,
      thermalBridges: room.thermalBridges ?? [],
    })
  );

  const [expanded, setExpanded] = useState<string | false>("basic");
  const [isDirty, setIsDirty] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false); // single success toast
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset local state when switching rooms
  useEffect(() => {
    setValues(
      cloneRoomForState({
        ...room,
        walls: room.walls ?? [],
        windows: room.windows ?? [],
        doors: room.doors ?? [],
        heaters: room.heaters ?? [],
        ceilingConfig: room.ceilingConfig!,
        floorConfig: room.floorConfig!,
        ventilation: room.ventilation ?? DEFAULT_VENT,
        thermalBridges: room.thermalBridges ?? [],
      })
    );
    setExpanded("basic");
    setIsDirty(false);
  }, [room.id, room.floorId]);

  // Merge updates for same room id (parent changed)
  useEffect(() => {
    setValues((prev) =>
      cloneRoomForState({
        ...prev,
        ...room,
        walls: room.walls ?? prev.walls ?? [],
        windows: room.windows ?? prev.windows ?? [],
        doors: room.doors ?? prev.doors ?? [],
        heaters: room.heaters ?? prev.heaters ?? [],
        ceilingConfig: room.ceilingConfig ?? prev.ceilingConfig,
        floorConfig: room.floorConfig ?? prev.floorConfig,
        ventilation: room.ventilation ?? prev.ventilation ?? DEFAULT_VENT,
        thermalBridges: room.thermalBridges ?? prev.thermalBridges ?? [],
      })
    );
  }, [room]);

  const setField = useCallback((key: keyof RoomType, val: any) => {
    setValues((prev) => cloneRoomForState({ ...prev, [key]: val as any }));
    setIsDirty(true);
  }, []);

  const handleAccordionChange = useCallback(
    (panel: string) => (_: unknown, isExp: boolean) =>
      setExpanded(isExp ? panel : false),
    []
  );

  const onWallsChange = useCallback((ws: Wall[]) => setField("walls", ws as any), [setField]);
  const onWindowsChange = useCallback((ws: Window[]) => setField("windows", ws as any), [setField]);
  const onDoorsChange = useCallback((ds: Door[]) => setField("doors", ds as any), [setField]);
  const onHeatersChange = useCallback((hs: Heater[]) => setField("heaters", hs as any), [setField]);
  const onCeilingChange = useCallback(
    (cfg: Partial<CeilingConfigType>) =>
      setField("ceilingConfig", { ...values.ceilingConfig, ...cfg } as any),
    [setField, values.ceilingConfig]
  );
  const onFloorChange = useCallback(
    (cfg: Partial<FloorConfigType>) =>
      setField("floorConfig", { ...values.floorConfig, ...cfg } as any),
    [setField, values.floorConfig]
  );
  const onVentChange = useCallback(
    (cfg: Partial<VentilationConfigType>) =>
      setField("ventilation", { ...(values.ventilation ?? DEFAULT_VENT), ...cfg } as any),
    [setField, values.ventilation]
  );

  // Thermal bridges CRUD
  const addThermalBridge = useCallback(() => {
    const next: ThermalBridge = { id: uuidv4(), name: "", psiValue: 0, length: 0 };
    setField("thermalBridges", [...(values.thermalBridges ?? []), next] as any);
  }, [setField, values.thermalBridges]);

  const updateThermalBridge = useCallback(
    (id: string, field: keyof ThermalBridge, value: string | number) => {
      const list = (values.thermalBridges ?? []).map((tb) =>
        tb.id === id
          ? { ...tb, [field]: field === "name" ? String(value) : toNum(value, 0) }
          : tb
      );
      setField("thermalBridges", list as any);
    },
    [setField, values.thermalBridges]
  );

  const removeThermalBridge = useCallback(
    (id: string) => {
      const list = (values.thermalBridges ?? []).filter((tb) => tb.id !== id);
      setField("thermalBridges", list as any);
    },
    [setField, values.thermalBridges]
  );

  // Debounced writes to global state (include floorId)
  useEffect(() => {
    if (!isDirty) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      replaceRoom({ ...(values as any), floorId: (room as any).floorId });
      debounceRef.current = null;
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isDirty, values, replaceRoom, room.floorId]);

  /* ---------- Validation FIRST (before onSubmit) ---------- */
  const errors = useMemo(() => {
    const err: Partial<Record<keyof RoomType, string>> = {};
    if (!values.name?.trim()) err.name = "Bitte einen Raumnamen eingeben.";
    if ((values.area ?? 0) <= 0) err.area = "Fläche muss > 0 m² sein.";
    if ((values.height ?? 0) < 2 || (values.height ?? 0) > 4) err.height = "Übliche Raumhöhe 2–4 m.";
    if ((values.targetTemperature ?? 0) < 5 || (values.targetTemperature ?? 0) > 30)
      err.targetTemperature = "Sinnvoller Bereich: 5–30 °C.";
    return err;
  }, [values.name, values.area, values.height, values.targetTemperature]);

  const isRoomValid =
    !errors.name && !errors.area && !errors.height && !errors.targetTemperature;

  /* ---------- Submit AFTER validation is available ---------- */
  const onSubmit = useCallback(() => {
    if (!isRoomValid) return; // button is disabled anyway
    const payload = { ...(values as any), floorId: (room as any).floorId };
    updateRoom(payload);
    replaceRoom(payload);
    setIsDirty(false);
    setSavedOpen(true); // show single confirmation toast here
  }, [updateRoom, replaceRoom, values, room.floorId, isRoomValid]);

  /** UI-only styles */
  const softInputSx: SxProps<Theme> = useMemo(
    () => ({
      "& .MuiOutlinedInput-root": {
        borderRadius: radii.md,
        backgroundColor: "transparent",
        "& fieldset": { borderColor: "transparent" },
        "&:hover fieldset": { borderColor: colors.grayBorder },
        "&.Mui-focused fieldset": {
          borderColor: colors.primaryBlue,
          borderWidth: 1.5,
        },
        "&.Mui-error": { backgroundColor: "rgba(220,38,38,0.06)" },
        "&.Mui-error fieldset": { borderColor: "transparent" },
      },
      "& .MuiFormHelperText-root": { marginTop: "2px" },
    }),
    []
  );

  const inputSx: SxProps<Theme> = useMemo(() => ({ "& .MuiInputBase-input": { py: 0.5, px: 1 } }), []);

  const sectionAccordionSx: SxProps<Theme> = useMemo(
    () => ({
      border: 0,
      boxShadow: "none",
      borderRadius: 0,
      backgroundColor: "transparent",
      "&::before": { display: "none" },
      "&.Mui-expanded": { margin: 0 },
      mb: 0,
    }),
    []
  );

  const summarySx: SxProps<Theme> = {
    minHeight: 30,
    px: "6px",
    borderBottom: `1px solid ${colors.grayBorder}`,
    backgroundColor: theme.palette.background.paper,
    borderRadius: 0,
    "& .MuiAccordionSummary-content": {
      my: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs,
    },
    ".MuiAccordionSummary-expandIconWrapper": { color: colors.grayText },
    "&:hover .MuiAccordionSummary-expandIconWrapper": { color: colors.primaryBlue },
    "&.Mui-expanded": {
      backgroundColor: colors.grayLight,
      ".MuiAccordionSummary-expandIconWrapper": { color: colors.primaryBlue },
    },
  };

  // Slightly more room inside details; we’ll add local mt where needed
  const detailsSx: SxProps<Theme> = { pt: 0.5, pb: 0.75, px: "6px" };

  // Reusable prop: keep labels shrunk to act as column headers
  const shrinkLabel = { InputLabelProps: { shrink: true } as const };

  const ids = {
    basic: { heading: "roompanel-basic-header", region: "roompanel-basic-region" },
    envelope: { heading: "roompanel-envelope-header", region: "roompanel-envelope-region" },
    heaters: { heading: "roompanel-heaters-header", region: "roompanel-heaters-region" },
    bridges: { heading: "roompanel-bridges-header", region: "roompanel-bridges-region" },
    ceilingFloor: { heading: "roompanel-ceilingfloor-header", region: "roompanel-ceilingfloor-region" },
    ventilation: { heading: "roompanel-ventilation-header", region: "roompanel-ventilation-region" },
  };

  return (
    <CardContainer noPadding>
      <Box sx={{ p: 0.5, ...compactShellSx }}>
        {/* BASISDATEN */}
        <Accordion
          expanded={expanded === "basic"}
          onChange={handleAccordionChange("basic")}
          aria-labelledby={ids.basic.heading}
          sx={sectionAccordionSx}
        >
          <AccordionSummary
            id={ids.basic.heading}
            aria-controls={ids.basic.region}
            expandIcon={<ExpandMoreIcon />}
            sx={summarySx}
          >
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography sx={headerSx}>Basisdaten</Typography>
              <Tooltip title="Allgemeine Raumeigenschaften">
                <InfoIcon fontSize="small" />
              </Tooltip>
            </Box>
          </AccordionSummary>
          <AccordionDetails
            id={ids.basic.region}
            role="region"
            aria-labelledby={ids.basic.heading}
            sx={detailsSx}
          >
            <Grid container spacing={0.75} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label={labelMap.name}
                  type="text"
                  value={values.name ?? ""}
                  fullWidth
                  size="small"
                  onChange={(e) => setField("name", e.target.value as any)}
                  sx={{ ...inputSx, ...softInputSx }}
                  error={!!errors.name}
                  helperText={errors.name || " "}
                  {...shrinkLabel}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label={labelMap.area}
                  type="number"
                  value={values.area ?? ""}
                  fullWidth
                  size="small"
                  onChange={(e) => setField("area", toNum(e.target.value, 0) as any)}
                  sx={{ ...inputSx, ...softInputSx }}
                  InputProps={{
                    inputProps: { min: 0, step: 0.1 },
                    endAdornment: (
                      <InputAdornment position="end" sx={{ color: "text.secondary", mr: 0 }}>
                        m²
                      </InputAdornment>
                    ),
                  }}
                  error={!!errors.area}
                  helperText={errors.area || " "}
                  {...shrinkLabel}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label={labelMap.height}
                  type="number"
                  value={values.height ?? ""}
                  fullWidth
                  size="small"
                  onChange={(e) => setField("height", toNum(e.target.value, 2.5) as any)}
                  sx={{ ...inputSx, ...softInputSx }}
                  InputProps={{
                    inputProps: { min: 2, max: 4, step: 0.1 },
                    endAdornment: (
                      <InputAdornment position="end" sx={{ color: "text.secondary", mr: 0 }}>
                        m
                      </InputAdornment>
                    ),
                  }}
                  error={!!errors.height}
                  helperText={errors.height || " "}
                  {...shrinkLabel}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label={labelMap.targetTemperature}
                  type="number"
                  value={values.targetTemperature ?? 20}
                  fullWidth
                  size="small"
                  onChange={(e) => setField("targetTemperature", toNum(e.target.value, 20) as any)}
                  sx={{ ...inputSx, ...softInputSx }}
                  InputProps={{
                    inputProps: { min: 5, max: 30, step: 0.5 },
                    endAdornment: (
                      <InputAdornment position="end" sx={{ color: "text.secondary", mr: 0 }}>
                        °C
                      </InputAdornment>
                    ),
                  }}
                  error={!!errors.targetTemperature}
                  helperText={errors.targetTemperature || " "}
                  {...shrinkLabel}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* HÜLLE */}
        <Accordion
          expanded={expanded === "envelope"}
          onChange={handleAccordionChange("envelope")}
          aria-labelledby={ids.envelope.heading}
          sx={sectionAccordionSx}
        >
          <AccordionSummary
            id={ids.envelope.heading}
            aria-controls={ids.envelope.region}
            expandIcon={<ExpandMoreIcon />}
            sx={summarySx}
          >
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography sx={headerSx}>Hülle (mit U-Werten)</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails
            id={ids.envelope.region}
            role="region"
            aria-labelledby={ids.envelope.heading}
            sx={detailsSx}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Hinweis: Wenn leer, verwenden wir U<sub>Wand</sub>={PLACEHOLDER.wallU}, U<sub>Fenster</sub>={PLACEHOLDER.windowU}, U<sub>Tür</sub>={PLACEHOLDER.doorU}.
            </Typography>
            <Box mb={0.25}>
              <WallConfig walls={values.walls} onChange={onWallsChange} />
            </Box>
            <Box mb={0.25}>
              <WindowConfig windows={values.windows} onChange={onWindowsChange} />
            </Box>
            <Box>
              <DoorConfig doors={values.doors} onChange={onDoorsChange} />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* HEIZKÖRPER */}
        <Accordion
          expanded={expanded === "heaters"}
          onChange={handleAccordionChange("heaters")}
          aria-labelledby={ids.heaters.heading}
          sx={sectionAccordionSx}
        >
          <AccordionSummary
            id={ids.heaters.heading}
            aria-controls={ids.heaters.region}
            expandIcon={<ExpandMoreIcon />}
            sx={summarySx}
          >
            <Typography sx={headerSx}>Heizkörper</Typography>
          </AccordionSummary>
        <AccordionDetails
            id={ids.heaters.region}
            role="region"
            aria-labelledby={ids.heaters.heading}
            sx={detailsSx}
          >
            <HeaterList heaters={values.heaters ?? []} onChange={onHeatersChange} />
          </AccordionDetails>
        </Accordion>

        {/* WÄRMEBRÜCKEN */}
        <Accordion
          expanded={expanded === "bridges"}
          onChange={handleAccordionChange("bridges")}
          aria-labelledby={ids.bridges.heading}
          sx={sectionAccordionSx}
        >
          <AccordionSummary
            id={ids.bridges.heading}
            aria-controls={ids.bridges.region}
            expandIcon={<ExpandMoreIcon />}
            sx={summarySx}
          >
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography sx={headerSx}>Wärmebrücken</Typography>
              <Tooltip title="Ψ [W/m·K] × Länge [m] × ΔT">
                <InfoIcon fontSize="small" />
              </Tooltip>
            </Box>
          </AccordionSummary>
          <AccordionDetails
            id={ids.bridges.region}
            role="region"
            aria-labelledby={ids.bridges.heading}
            // extra breathing room (top & bottom) so the first row isn't glued to the header
            sx={{ ...detailsSx, pt: 1.25, pb: 1.25 }}
          >
            {(values.thermalBridges ?? []).length === 0 ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={0.75}
                sx={{ mt: 1 }}   // more top gap (matches other sections)
              >
                <Typography variant="body2" color="text.secondary">
                  Keine Wärmebrücken definiert.
                </Typography>
                <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={addThermalBridge}>
                  Neue Wärmebrücke
                </Button>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={1} sx={{ mt: 1 }}>
                {(values.thermalBridges ?? []).map((tb) => (
                  <Grid container spacing={0.75} alignItems="center" key={tb.id}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Bezeichnung"
                        size="small"
                        fullWidth
                        value={tb.name}
                        onChange={(e) => updateThermalBridge(tb.id, "name", e.target.value)}
                        sx={{ ...softInputSx, ...bridgeFieldSx }}
                        {...shrinkLabel}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="W/m·K"
                        size="small"
                        type="number"
                        fullWidth
                        value={tb.psiValue}
                        onChange={(e) => updateThermalBridge(tb.id, "psiValue", e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end" sx={{ color: "text.secondary", mr: 0 }}>
                              W/m·K
                            </InputAdornment>
                          ),
                          inputProps: { step: 0.01 },
                        }}
                        sx={{ ...softInputSx, ...bridgeFieldSx }}
                        {...shrinkLabel}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Länge"
                        size="small"
                        type="number"
                        fullWidth
                        value={tb.length}
                        onChange={(e) => updateThermalBridge(tb.id, "length", e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end" sx={{ color: "text.secondary", mr: 0 }}>
                              m
                            </InputAdornment>
                          ),
                          inputProps: { step: 0.1, min: 0 },
                        }}
                        sx={{ ...softInputSx, ...bridgeFieldSx }}
                        {...shrinkLabel}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <IconButton
                        aria-label="Wärmebrücke entfernen"
                        color="error"
                        size="small"
                        onClick={() => removeThermalBridge(tb.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
                <Box>
                  <Button startIcon={<AddIcon />} size="small" onClick={addThermalBridge}>
                    Weitere Wärmebrücke
                  </Button>
                </Box>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {/* DECKE & BODEN */}
        <Accordion
          expanded={expanded === "ceilingFloor"}
          onChange={handleAccordionChange("ceilingFloor")}
          aria-labelledby={ids.ceilingFloor.heading}
          sx={sectionAccordionSx}
        >
          <AccordionSummary
            id={ids.ceilingFloor.heading}
            aria-controls={ids.ceilingFloor.region}
            expandIcon={<ExpandMoreIcon />}
            sx={summarySx}
          >
            <Typography sx={headerSx}>Decke &amp; Boden (mit U-Werten)</Typography>
          </AccordionSummary>
          <AccordionDetails
            id={ids.ceilingFloor.region}
            role="region"
            aria-labelledby={ids.ceilingFloor.heading}
            sx={detailsSx}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Hinweis: Wenn leer, verwenden wir U<sub>Dach</sub>={PLACEHOLDER.roofU}, U<sub>Boden</sub>={PLACEHOLDER.floorU}, und Flächen&nbsp;= Raumfläche.
            </Typography>
            <Box mb={0.25}>
              <CeilingConfig ceilingConfig={values.ceilingConfig} onChange={onCeilingChange} />
            </Box>
            <Box>
              <FloorConfig floorConfig={values.floorConfig} onChange={onFloorChange} />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* LÜFTUNG */}
        <Accordion
          expanded={expanded === "ventilation"}
          onChange={handleAccordionChange("ventilation")}
          aria-labelledby={ids.ventilation.heading}
          sx={sectionAccordionSx}
        >
          <AccordionSummary
            id={ids.ventilation.heading}
            aria-controls={ids.ventilation.region}
            expandIcon={<ExpandMoreIcon />}
            sx={summarySx}
          >
            <Typography sx={headerSx}>Lüftung</Typography>
          </AccordionSummary>
          <AccordionDetails
            id={ids.ventilation.region}
            role="region"
            aria-labelledby={ids.ventilation.heading}
            sx={detailsSx}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Hinweis: Wenn leer, verwenden wir ACH={PLACEHOLDER.ach}, MVHR={PLACEHOLDER.hrv}, interne Lasten={PLACEHOLDER.gains} W.
            </Typography>
            <Suspense fallback={<div>…</div>}>
              <VentilationConfig ventilation={values.ventilation} onChange={onVentChange} />
            </Suspense>
          </AccordionDetails>
        </Accordion>

        {/* Footer action */}
        <Box textAlign="right" mt={0.25}>
          <PrimaryButton disabled={!isRoomValid} onClick={onSubmit}>
            Raum speichern
          </PrimaryButton>
        </Box>

        {/* ✅ Success toast moved to TOP */}
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
            Raum gespeichert
          </MuiAlert>
        </Snackbar>
      </Box>
    </CardContainer>
  );
}
