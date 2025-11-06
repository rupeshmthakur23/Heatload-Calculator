// src/pages/projectView/components/HeatLoadCalculator/branding/SolarHubConnector.tsx
import { styled } from "@mui/material/styles";
import StepConnector, { stepConnectorClasses } from "@mui/material/StepConnector";
import { colors, transitions } from "../designTokens";

const SolarHubConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: theme.spacing(2), // 16px
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: colors.grayBorder,
    borderRadius: 9999,
    transition: `background-color ${transitions.base}`,
  },
  [`&.${stepConnectorClasses.disabled} .${stepConnectorClasses.line}`]: {
    backgroundColor: colors.grayLight,
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}, &.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]:
    { backgroundColor: colors.primaryBlue },
}));

export default SolarHubConnector;
