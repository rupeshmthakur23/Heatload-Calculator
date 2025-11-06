import React from "react";
import { Box, ButtonBase } from "@mui/material";
import { colors, spacing } from "./designTokens";

/**
 * SegmentedPills.tsx — MUI/TypeScript
 * A pill-style segmented control that matches the screenshots:
 * - Rounded rail with subtle border
 * - Selected pills use brand yellow background
 * - Supports single- or multi-select
 */

export type SegmentedOption = {
  value: string;
  label: string;
};

interface SegmentedPillsProps {
  options: SegmentedOption[];
  /** Selected values. For single-select, pass an array with one value. */
  value: string[];
  onChange: (next: string[]) => void;
  /** If false, behaves as single-select (default). */
  allowMultiple?: boolean;
  /** Optional compact mode */
  dense?: boolean;
}

const railSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.75,
  padding: "4px",
  borderRadius: 9999,
  backgroundColor: "#FFFFFF",
  border: `1px solid ${colors.grayBorder}`,
};

const pillBaseSx = {
  px: 2,
  py: 0.75,
  borderRadius: 9999,
  fontSize: 14,
  lineHeight: 1.25,
  userSelect: "none" as const,
  transition: "background-color 120ms ease, opacity 120ms ease",
  "&:focus-visible": {
    outline: `2px solid ${colors.primaryBlue}`,
    outlineOffset: 2,
    borderRadius: 9999,
  },
};

const SegmentedPills: React.FC<SegmentedPillsProps> = ({
  options,
  value,
  onChange,
  allowMultiple = false,
  dense = false,
}) => {
  const handleToggle = (v: string) => {
    const isSelected = value.includes(v);
    if (allowMultiple) {
      onChange(
        isSelected ? value.filter((x) => x !== v) : [...value, v]
      );
    } else {
      onChange(isSelected ? [] : [v]);
    }
  };

  return (
    <Box sx={{ ...railSx, p: dense ? "2px" : "4px" }}>
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <ButtonBase
            key={opt.value}
            onClick={() => handleToggle(opt.value)}
            disableRipple
            sx={{
              ...pillBaseSx,
              px: dense ? 1.5 : 2,
              py: dense ? 0.5 : 0.75,
              backgroundColor: selected ? colors.yellowMain : "transparent",
              color: selected ? colors.textMain : colors.primaryBlue,
              "&:hover": {
                backgroundColor: selected ? colors.yellowHover : colors.yellowSubtle,
              },
            }}
          >
            {opt.label}
          </ButtonBase>
        );
      })}
    </Box>
  );
};

export default SegmentedPills;
export {};

/**
 * Usage examples
 * 1) Single-select (matches first & third screenshots):
 *
 * const [mode, setMode] = React.useState<string[]>(["einspeisung"]);
 * <SegmentedPills
 *   options=[
 *     { value: "einspeisung", label: "Einspeisung" },
 *     { value: "volle", label: "Volleinspeisung" },
 *     { value: "direkt", label: "Direktvermarkt." },
 *   ]
 *   value={mode}
 *   onChange={setMode}
 * />
 *
 * 2) Multi-select (matches second screenshot):
 * const [modes, setModes] = React.useState<string[]>(["einspeisung","volle"]);
 * <SegmentedPills allowMultiple value={modes} onChange={setModes} options={...} />
 *
 * To use inside your codebase, place this file under
 * HeatLoadCalculator/SegmentedPills.tsx and import it where needed.
 */
