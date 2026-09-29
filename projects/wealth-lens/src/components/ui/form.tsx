"use client";

import { useId, useState } from "react";
import { parseLooseNumber } from "@/lib/csv";

export const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none " +
  "focus:border-accent focus:ring-2 focus:ring-accent/30 aria-[invalid=true]:border-negative";

interface FieldProps {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => React.ReactNode;
  className?: string;
}

/** Label + control + hint/error, wired together for screen readers. */
export function Field({ label, hint, error, children, className = "" }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-negative">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

type NativeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "type" | "min" | "max"
>;

interface NumberInputProps extends NativeInputProps {
  value: number | null;
  onCommit: (value: number | null) => void;
  min?: number;
  max?: number;
  /** Allow clearing the field, committing `null`. */
  allowEmpty?: boolean;
  /** Displayed value ↔ stored value, e.g. percent ↔ fraction. */
  toDisplay?: (value: number) => number;
  fromDisplay?: (value: number) => number;
}

const identity = (value: number) => value;
const clean = (value: number) => String(Number(value.toFixed(8)));

/**
 * Text input for numbers that accepts "1,234.5" or "1.234,5". The typed text
 * is kept while editing and committed on blur or Enter; invalid text stays
 * visible and marked instead of being silently replaced.
 */
export function NumberInput({
  value,
  onCommit,
  min,
  max,
  allowEmpty = false,
  toDisplay = identity,
  fromDisplay = identity,
  className = "",
  ...rest
}: NumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const shown = draft ?? (value === null ? "" : clean(toDisplay(value)));

  const commit = () => {
    if (draft === null) return;
    const text = draft.trim();
    if (text === "" && allowEmpty) {
      onCommit(null);
    } else {
      const parsed = parseLooseNumber(text);
      const inRange = parsed !== null && (min === undefined || parsed >= min) && (max === undefined || parsed <= max);
      if (!inRange) {
        setInvalid(true);
        return;
      }
      onCommit(fromDisplay(parsed));
    }
    setDraft(null);
    setInvalid(false);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={shown}
      onChange={(event) => {
        setDraft(event.target.value);
        setInvalid(false);
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit();
        if (event.key === "Escape") {
          setDraft(null);
          setInvalid(false);
        }
      }}
      className={`${inputClass} ${className}`}
      {...rest}
      aria-invalid={invalid || rest["aria-invalid"] ? true : undefined}
    />
  );
}

const toPercent = (fraction: number) => fraction * 100;
const fromPercent = (percent: number) => percent / 100;

/** A NumberInput that shows 7 for a stored 0.07. `min`/`max` are in percent. */
export function PercentInput(props: Omit<NumberInputProps, "toDisplay" | "fromDisplay">) {
  return <NumberInput {...props} toDisplay={toPercent} fromDisplay={fromPercent} />;
}
