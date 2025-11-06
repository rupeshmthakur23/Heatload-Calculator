import React, { ReactNode } from "react";
import { Box, Paper, PaperProps, useTheme } from "@mui/material";
import { colors, radii, shadows, spacing, transitions } from "./designTokens";

interface CardContainerProps extends PaperProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  noPadding?: boolean;
  dense?: boolean;
  hoverable?: boolean;
}

const CardContainer: React.FC<CardContainerProps> = ({
  children,
  header,
  footer,
  noPadding = false,
  dense = false,
  hoverable = false,
  elevation = 0,
  sx,
  ...paperProps
}) => {
  const theme = useTheme();

  const basePadding = noPadding
    ? 0
    : dense
    ? { xs: spacing.sm, sm: spacing.md }
    : { xs: spacing.md, sm: spacing.lg };

  return (
    <Paper
      elevation={elevation}
      sx={{
        borderRadius: radii.md,
        bgcolor: theme.palette.background.paper, // <- white now via theme
        boxShadow: shadows.light,
        border: `1px solid ${colors.grayBorder}`,
        p: basePadding,
        mb: { xs: spacing.md, sm: spacing.lg },
        transition: transitions.base,
        ...(hoverable && { "&:hover": { boxShadow: shadows.hover } }),
        ...sx,
      }}
      {...paperProps}
    >
      {header && (
        <Box mb={spacing.sm} sx={{ fontSize: "1rem", fontWeight: 600, color: colors.textMain }}>
          {header}
        </Box>
      )}
      {children}
      {footer && (
        <Box mt={spacing.md} sx={{ color: colors.grayText }}>
          {footer}
        </Box>
      )}
    </Paper>
  );
};

export default CardContainer;
