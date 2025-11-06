// src/pages/projectView/components/HeatLoadCalculator/PrimaryButton.tsx
import React from "react";
import { Button, ButtonProps } from "@mui/material";
import {
  colors,
  fontSizes,
  radii,
  shadows,
  spacing,
  transitions,
} from "./designTokens";

type PrimaryButtonProps = ButtonProps;

const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ children, sx, fullWidth, ...rest }, ref) => {
    return (
      <Button
        ref={ref}
        variant="contained"
        disableElevation
        disableRipple
        fullWidth={fullWidth}
        {...rest}
        sx={{
          backgroundColor: colors.yellowMain,
          color: colors.primaryBlue,
          fontWeight: 600,
          borderRadius: radii.pill,
          px: spacing.lg,
          py: spacing.sm,
          textTransform: "none",
          fontSize: fontSizes.sm,
          boxShadow: shadows.light,
          minHeight: "44px",
          transition: transitions.base,
          "&:hover": { backgroundColor: colors.yellowHover, boxShadow: shadows.hover },
          "&:focus:not(:focus-visible)": { outline: "none" },
          "&:focus-visible": { boxShadow: `0 0 0 2px ${colors.yellowSubtle}` },
          "&.Mui-disabled": {
            backgroundColor: colors.yellowSubtle,
            color: colors.grayText,
            boxShadow: "none",
          },
          ...sx,
        }}
      >
        {children}
      </Button>
    );
  }
);

PrimaryButton.displayName = "PrimaryButton";
export default PrimaryButton;
