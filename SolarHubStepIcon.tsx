// src/pages/projectView/components/HeatLoadCalculator/branding/SolarHubStepIcon.tsx
import React from "react";
import { Box, Typography } from "@mui/material";
import {
  colors,
  shadows,
  transitions,
} from "../designTokens";

interface SolarHubStepIconProps {
  active?: boolean;
  completed?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const SolarHubStepIcon: React.FC<SolarHubStepIconProps> = ({
  active = false,
  completed = false,
  icon,
  className,
}) => {
  const isOn = active || completed;
  const bgColor = isOn ? colors.primaryBlue : colors.grayBorder;
  const fgColor = isOn ? "#FFFFFF" : colors.grayText;

  return (
    <Box
      className={className}
      sx={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bgColor,
        color: fgColor,
        boxShadow: isOn ? shadows.light : "none",
        transition: `background-color ${transitions.base}, box-shadow ${transitions.base}, transform ${transitions.fast}`,
        ...(active && {
          boxShadow: `${shadows.hover}, 0 0 0 3px ${colors.yellowSubtle}`,
          transform: "translateZ(0)",
        }),
      }}
      aria-current={active ? "step" : undefined}
    >
      <Typography component="span" sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>
        {icon}
      </Typography>
    </Box>
  );
};

export default SolarHubStepIcon;
