"use client";

import { useId } from "react";
import { formatPercent } from "@/lib/format";

export const RETURN_SLIDER = { min: 0.03, max: 0.1, step: 0.005 } as const;

interface ReturnSliderProps {
  value: number;
  onChange: (value: number) => void;
  /** Used to give the before-inflation equivalent. */
  inflation: number;
  nominalEquivalent: number;
}

/** Expected growth per year, always after inflation. */
export function ReturnSlider({ value, onChange, inflation, nominalEquivalent }: ReturnSliderProps) {
  const id = useId();
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          Growth per year, after inflation
        </label>
        <output htmlFor={id} className="text-lg font-semibold tabular-nums">
          {formatPercent(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={RETURN_SLIDER.min * 100}
        max={RETURN_SLIDER.max * 100}
        step={RETURN_SLIDER.step * 100}
        value={Math.round(value * 1000) / 10}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        aria-describedby={`${id}-help`}
        className="w-full accent-accent"
      />
      <div className="flex justify-between text-xs text-muted tabular-nums" aria-hidden="true">
        <span>{formatPercent(RETURN_SLIDER.min, { decimals: 0 })}</span>
        <span>{formatPercent(RETURN_SLIDER.max, { decimals: 0 })}</span>
      </div>
      <p id={`${id}-help`} className="text-xs text-muted">
        7% is a common long-run estimate for stocks, mostly from US history. Not a promise. With{" "}
        {formatPercent(inflation)} inflation, {formatPercent(value)} is about {formatPercent(nominalEquivalent)} before
        inflation.
      </p>
    </div>
  );
}
