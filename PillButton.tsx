// src/pages/projectView/components/HeatLoadCalculator/PillButton.tsx
import React from "react";
import { Button, ButtonProps } from "@mui/material";
import {
  colors,
  radii,
  fontSizes,
  shadows,
  spacing,
  transitions,
} from "./designTokens";

type PillButtonProps = ButtonProps;

const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ children, sx, fullWidth, ...rest }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outlined"
        disableRipple
        fullWidth={fullWidth}
        {...rest}
        sx={{
          borderRadius: radii.pill,
          px: spacing.md,
          py: spacing.sm,
          fontSize: fontSizes.sm,
          fontWeight: 500,
          borderColor: colors.grayBorder,
          color: colors.textMain,
          backgroundColor: colors.grayLight,
          boxShadow: "none",
          minHeight: "40px",
          transition: transitions.base,
          "&:hover": {
            backgroundColor: colors.yellowSubtle,
            color: colors.textMain,
            boxShadow: shadows.hover,
            borderColor: colors.grayBorder,
          },
          "&:focus:not(:focus-visible)": { outline: "none" },
          "&:focus-visible": { boxShadow: `0 0 0 2px ${colors.yellowSubtle}` },
          "&.Mui-disabled": {
            color: colors.grayText,
            borderColor: colors.grayBorder,
            backgroundColor: "#F9FAFB",
            boxShadow: "none",
            opacity: 0.7,
          },
          ...sx,
        }}
      >
        {children}
      </Button>
    );
  }
);

PillButton.displayName = "PillButton";
export default PillButton;
