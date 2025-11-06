import React, { forwardRef } from "react";
import { Switch } from "antd";
// If you use TypeScript and want props typing:
// import type { SwitchProps } from "antd";

export interface YellowSwitchProps /* extends Omit<SwitchProps, "onChange"> */ {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  /** Optional label text, placed before or after the switch */
  label?: React.ReactNode;
  labelPlacement?: "start" | "end";
  /** aria-label for a11y if you don't render a visible label */
  ariaLabel?: string;
}

const YellowSwitch = forwardRef<HTMLButtonElement, YellowSwitchProps>(
  (
    {
      checked,
      defaultChecked,
      disabled,
      onChange,
      className = "",
      label,
      labelPlacement = "end",
      ariaLabel,
      ...rest
    },
    ref
  ) => {
    return (
      <label className="inline-flex items-center gap-3 select-none">
        {label && labelPlacement === "start" && (
          <span className="leading-none">{label}</span>
        )}

        <Switch
          ref={ref as any}
          className={`yellow-switch ${className}`}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={(val) => onChange?.(val)}
          {...rest}
        />

        {label && labelPlacement === "end" && (
          <span className="leading-none">{label}</span>
        )}
      </label>
    );
  }
);

export default YellowSwitch;
