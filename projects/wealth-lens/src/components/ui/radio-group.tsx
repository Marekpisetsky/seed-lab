"use client";

import { useRef } from "react";

export interface RadioOption<T> {
  value: T;
  label: React.ReactNode;
  /** Shown but not choosable (a period the data does not reach); the arrow keys skip it. */
  disabled?: boolean;
}

/**
 * A row of choices with one picked, as screen readers expect a radio group
 * to work: Tab reaches it once (on the picked choice, or the first), the
 * arrow keys move and pick, and a tap or a click picks directly.
 */
export function RadioGroup<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
  className = "",
  optionClassName,
}: {
  label: string;
  options: readonly RadioOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  className?: string;
  optionClassName: (checked: boolean) => string;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const picked = options.findIndex((option) => option.value === value);
  const firstEnabled = Math.max(0, options.findIndex((option) => !option.disabled));
  const move = (from: number, step: number) => {
    let next = from;
    for (let tries = 0; tries < options.length; tries++) {
      next = (next + step + options.length) % options.length;
      if (!options[next].disabled) break;
    }
    if (options[next].disabled || next === from) return;
    onChange(options[next].value);
    buttons.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {options.map((option, index) => (
        <button
          key={String(option.value)}
          ref={(element) => {
            buttons.current[index] = element;
          }}
          type="button"
          role="radio"
          aria-checked={index === picked}
          tabIndex={index === (picked >= 0 ? picked : firstEnabled) ? 0 : -1}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => {
            const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
            if (step === 0) return;
            event.preventDefault();
            move(index, step);
          }}
          className={`${optionClassName(index === picked)} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
