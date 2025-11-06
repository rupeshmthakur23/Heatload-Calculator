// src/styles/designTokens.ts

// Derived from installer-panel/src/theme.ts and index.css
export const colors = {
  // Brand
  yellowMain: "#FFD75D",
  yellowHover: "#FFC845",
  yellowSubtle: "#FFF4D6",

  // Brand/Dark blue (text, icons, accents)
  primaryBlue: "#2D4764",

  // Text
  textMain: "#2D4764",
  grayText: "#666666",

  // Neutrals
  grayLight: "#F8F8F8",
  grayBorder: "#E6E7EA",
  grayStroke: "#E6E7EA",

  // Controls
  checkboxInactive: "#A0A0A0",

  // Utilities
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#DC2626",
  info: "#2563EB",

  // Surfaces
  panelBg: "#FFFFFF",
  pageBg: "#F8F8F8",
};

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "24px",
  xxl: "32px",
};

export const fontSizes = {
  xs: "12px",
  sm: "14px",
  base: "16px",
  lg: "18px",
  xl: "20px",
};

export const radii = {
  pill: "9999px",
  sm: "4px",
  md: "8px",
  lg: "12px",
};

export const shadows = {
  light: "0 1px 4px rgba(0,0,0,0.05)",
  hover: "0 2px 6px rgba(0,0,0,0.15)",
  medium: "0 6px 16px rgba(0,0,0,0.10)",
};

export const zIndex = {
  header: 1100,
  sidebar: 1000,
  dropdown: 1200,
  modal: 1300,
  tooltip: 1400,
};

export const transitions = {
  fast: "150ms ease",
  base: "200ms ease",
  slow: "300ms ease",
};
