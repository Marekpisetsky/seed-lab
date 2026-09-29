"use client";

import { useId } from "react";
import { formatPercent } from "@/lib/format";

export const RETURN_SLIDER = { min: 0.03, max: 0.1, step: 0.005 } as const;

interface ReturnSliderProps {
  value: number;
  onChange: (value: number) => void;
  /** Used to spell out the nominal equivalent next to the real figure. */
  inflation: number;
  nominalEquivalent: number;
}

/**
 * The expected return, labelled as REAL (after inflation) everywhere it is
 * shown: a nominal 7 % and a real 7 % give very different answers.
 */
export function ReturnSlider({ value, onChange, inflation, nominalEquivalent }: ReturnSliderProps) {
  const id = useId();
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          Expected <strong>real</strong> return per year
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
        Real means <em>after inflation</em>, not the nominal return you see quoted. With{" "}
        {formatPercent(inflation)} inflation, {formatPercent(value)} real is about{" "}
        {formatPercent(nominalEquivalent)} nominal. The 7% default is a common long-run estimate drawn from
        historical, mostly US, stock returns — not a promise.
      </p>
    </div>
  );
}
