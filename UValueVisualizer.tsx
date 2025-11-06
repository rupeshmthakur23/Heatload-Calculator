import React from "react";
import UValueChart from "./UValueChart";

/**
 * This file lives at:
 *   src/pages/projectView/components/HeatLoadCalculator/UValueVisualizer.tsx
 *
 * The slider you already have lives at:
 *   src/pages/ApplicationPage/components/HeatLoadCalculator/room/sections/UValueSlider.tsx
 *
 * So we lazy-load it via a correct relative path (three folders up to /pages).
 */
const UValueSlider = React.lazy(
  () =>
    import(
      "./UValueSlider"
    )
);

interface VisualizerProps {
  label: string;
  value: number;
  editable: boolean;
  onChange?: (newValue: number) => void;
  min?: number;
  max?: number;
}

const UValueVisualizer: React.FC<VisualizerProps> = ({
  label,
  value,
  editable,
  onChange,
  min = 0.2,
  max = 2.0,
}) => {
  if (editable && onChange) {
    return (
      <React.Suspense fallback={<div style={{ height: 56 }} />}>
        <UValueSlider
          label={label}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
        />
      </React.Suspense>
    );
  }
  return <UValueChart label={label} value={value} min={min} max={max} />;
};

export default UValueVisualizer;
