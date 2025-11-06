import { createTheme } from "@mui/material/styles";
import { colors, spacing, fontSizes, radii, shadows, transitions } from "./designTokens";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: colors.yellowMain,
      contrastText: colors.primaryBlue,
    },
    secondary: {
      main: colors.primaryBlue,
      contrastText: "#FFFFFF",
    },
    // 🔁 Make the whole app white
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: colors.textMain,
      secondary: colors.grayText,
    },
    divider: colors.grayBorder,
    info: { main: colors.grayBorder },
  },

  typography: {
    fontFamily:
      'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    fontSize: 14,
    h1: { fontSize: "2.25rem", fontWeight: 700, color: colors.textMain },
    h2: { fontSize: "1.75rem", fontWeight: 600, color: colors.textMain },
    h3: { fontSize: "1.5rem", fontWeight: 600, color: colors.textMain },
    h4: { fontSize: "1.25rem", fontWeight: 600, color: colors.textMain },
    h5: { fontSize: "1.1rem", fontWeight: 600, color: colors.textMain },
    h6: { fontSize: "1rem", fontWeight: 600, color: colors.textMain },
    subtitle1: { fontSize: "0.95rem", fontWeight: 600, color: colors.textMain },
    subtitle2: { fontSize: "0.85rem", fontWeight: 500, color: colors.grayText },
    body1: { fontSize: "0.9rem", fontWeight: 400, color: colors.textMain },
    body2: { fontSize: "0.8rem", fontWeight: 400, color: colors.textMain },
    caption: { fontSize: fontSizes.xs, color: colors.grayText },
    button: { fontWeight: 600, textTransform: "none" },
  },

  shape: { borderRadius: 8 },

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: radii.md,
          fontWeight: 600,
          padding: `${spacing.sm} ${spacing.md}`,
          transition: transitions.base,
        },
        containedPrimary: {
          backgroundColor: colors.yellowMain,
          color: colors.primaryBlue,
          "&:hover": { backgroundColor: colors.yellowHover, boxShadow: shadows.hover },
          "&:active": { boxShadow: shadows.light },
        },
        containedSecondary: {
          backgroundColor: colors.primaryBlue,
          color: "#fff",
          "&:hover": { opacity: 0.95, boxShadow: shadows.hover },
        },
        outlinedSecondary: {
          borderColor: colors.primaryBlue,
          color: colors.primaryBlue,
          "&:hover": { backgroundColor: colors.grayLight },
        },
      },
    },

    // Inputs/selects should be white-filled instead of grey
    MuiSelect: {
      styleOverrides: {
        select: {
          padding: "10px 14px",
          backgroundColor: "#ffffff", // ← was colors.panelBg
        },
        icon: { color: colors.primaryBlue },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff", // ← was colors.panelBg
          borderRadius: radii.md,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grayBorder },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.primaryBlue },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: colors.primaryBlue,
            borderWidth: 1.5,
          },
          "& input[type=number]": { MozAppearance: "textfield" },
          "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
            { WebkitAppearance: "none", margin: 0 },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          color: colors.textMain,
          "&.Mui-focused": { color: colors.primaryBlue },
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        root: { padding: 8 },
        switchBase: {
          color: colors.checkboxInactive,
          "&.Mui-checked": {
            color: colors.primaryBlue,
            "& + .MuiSwitch-track": { backgroundColor: colors.primaryBlue, opacity: 1 },
          },
        },
        track: {
          backgroundColor: colors.grayBorder,
          opacity: 1,
          borderRadius: 9999,
        },
      },
    },

    MuiSlider: {
      styleOverrides: {
        root: { height: 10 },
        thumb: {
          width: 14,
          height: 14,
          backgroundColor: "#fff",
          border: `2px solid ${colors.primaryBlue}`,
          boxShadow: "none",
        },
        track: { backgroundColor: colors.primaryBlue, height: 10 },
        rail: { height: 10, backgroundColor: "#E5E7EB" },
        valueLabel: { backgroundColor: colors.primaryBlue },
      },
    },

    // Cards / panels should be white too
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          padding: spacing.md,
          backgroundColor: "#ffffff", // ← was colors.panelBg
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: "0.85rem",
          borderBottom: `1px solid ${colors.grayBorder}`,
          color: colors.textMain,
        },
        head: {
          backgroundColor: colors.grayLight,
          fontWeight: 700,
          color: colors.textMain,
        },
      },
    },

    MuiDivider: { styleOverrides: { root: { borderColor: colors.grayBorder } } },

    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: "0.8rem", backgroundColor: "#111" },
        arrow: { color: "#111" },
      },
    },

    MuiAccordion: {
      styleOverrides: {
        root: {
          border: `1px solid ${colors.grayBorder}`,
          borderRadius: 12,
          boxShadow: "none",
          "&::before": { display: "none" },
          "&.Mui-expanded": { margin: 0 },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 56,
          padding: `0 ${spacing.md}`,
          "& .MuiAccordionSummary-content": {
            margin: `${spacing.sm} 0`,
            alignItems: "center",
            gap: spacing.sm,
            color: colors.textMain,
          },
        },
        expandIconWrapper: {
          color: colors.grayStroke,
          "&.Mui-expanded": { color: colors.primaryBlue },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: { root: { padding: spacing.md, paddingTop: spacing.sm } },
    },
  },
});

export default theme;
