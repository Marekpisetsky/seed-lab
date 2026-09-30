"use client";

import { useRef } from "react";

export interface RadioOption<T> {
  value: T;
  label: React.ReactNode;
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
  const move = (from: number, step: number) => {
    const next = (from + step + options.length) % options.length;
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
          tabIndex={index === (picked >= 0 ? picked : 0) ? 0 : -1}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => {
            const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
            if (step === 0) return;
            event.preventDefault();
            move(index, step);
          }}
          className={optionClassName(index === picked)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
