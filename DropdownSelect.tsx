// src/pages/projectView/components/HeatLoadCalculator/DropdownSelect.tsx
import React from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  SelectProps,
  SxProps,
  Theme,
  FormHelperText,
} from "@mui/material";
import {
  colors,
  radii,
  shadows,
  spacing,
  fontSizes,
} from "./designTokens";

interface DropdownSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (event: SelectChangeEvent<string>) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  sx?: SxProps<Theme>;
  containerSx?: SxProps<Theme>;
  selectProps?: Partial<SelectProps<string>>;
}

const DropdownSelect: React.FC<DropdownSelectProps> = ({
  label,
  value,
  options,
  onChange,
  name,
  id,
  disabled = false,
  fullWidth = true,
  placeholder,
  error = false,
  helperText,
  sx,
  containerSx,
  selectProps,
}) => {
  const baseId = id || `ddl-${(name ?? label).toLowerCase().replace(/\s+/g, "-")}`;
  const labelId = `${baseId}-label`;

  return (
    <FormControl
      fullWidth={fullWidth}
      size="small"
      error={error}
      disabled={disabled}
      sx={{ minWidth: 120, ...containerSx }}
    >
      <InputLabel id={labelId}>{label}</InputLabel>

      <Select<string>
        labelId={labelId}
        id={baseId}
        value={value}
        label={label}
        onChange={onChange}
        name={name}
        displayEmpty={Boolean(placeholder)}
        MenuProps={{
          PaperProps: {
            sx: {
              borderRadius: radii.md,
              boxShadow: shadows.light,
              border: `1px solid ${colors.grayBorder}`,
              mt: 1,
            },
          },
        }}
        sx={{
          borderRadius: radii.md,
          backgroundColor: colors.panelBg,
          boxShadow: shadows.light,
          border: `1px solid ${colors.grayStroke}`,
          "& .MuiSelect-select": { py: spacing.sm, px: spacing.md, fontSize: fontSizes.base },
          "& fieldset": { border: "none" },
          "&.Mui-focused": { boxShadow: `0 0 0 2px ${colors.yellowSubtle}` },
          ...sx,
        }}
        renderValue={(selected) => {
          if (!selected && placeholder) {
            return <span style={{ color: colors.grayText }}>{placeholder}</span>;
          }
          const found = options.find((o) => o.value === selected);
          return found ? found.label : selected;
        }}
        {...selectProps}
      >
        {placeholder && (
          <MenuItem value="" disabled>
            <span style={{ color: colors.grayText }}>{placeholder}</span>
          </MenuItem>
        )}
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>

      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default DropdownSelect;
