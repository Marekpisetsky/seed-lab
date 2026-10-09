"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { parseLooseNumber } from "@/lib/number";
import { createSettler, type Settler } from "@/lib/settle";

export const inputClass =
  "min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-base tabular-nums outline-none " +
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

/** Numbers in the page's language: shown its way ("1.000,5" in Spanish) and read its way. */
function useNumbers() {
  const { f } = useI18n();
  return {
    show: (value: number, maxDecimals = 8) => f.number(Number(value.toFixed(maxDecimals)), maxDecimals),
    read: (text: string) => parseLooseNumber(text, f.decimalSeparator === ","),
  };
}

/**
 * Text input for numbers that accepts "1,234.5" or "1.234,5" (a lone
 * separator is read the page language's way). The typed text
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
  const numbers = useNumbers();
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const shown = draft ?? (value === null ? "" : numbers.show(toDisplay(value)));

  const commit = () => {
    if (draft === null) return;
    const text = draft.trim();
    if (text === "" && allowEmpty) {
      onCommit(null);
    } else {
      const parsed = numbers.read(text);
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

interface LiveNumberInputProps extends NativeInputProps {
  value: number | null;
  /** Called on every keystroke that reads as a number of 0 or more; `null` when cleared. For local drafts only: fields that change the report use SettledNumberInput. */
  onValue: (value: number | null) => void;
}

/**
 * A money field that updates everything as you type: no "Calculate" button.
 * Accepts "1,234.5" or "1.234,5"; the typed text is kept while editing, and
 * text that is not a number is marked instead of committed.
 */
export function LiveNumberInput({ value, onValue, className = "", ...rest }: LiveNumberInputProps) {
  const numbers = useNumbers();
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const shown = draft ?? (value === null ? "" : numbers.show(value, 2));
  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={shown}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        if (text.trim() === "") {
          setInvalid(false);
          onValue(null);
          return;
        }
        const parsed = numbers.read(text);
        const ok = parsed !== null && parsed >= 0;
        setInvalid(!ok);
        if (ok) onValue(parsed);
      }}
      onBlur={() => {
        setDraft(null);
        setInvalid(false);
      }}
      className={`${inputClass} ${className}`}
      {...rest}
      aria-invalid={invalid || rest["aria-invalid"] ? true : undefined}
    />
  );
}

interface SettledNumberInputProps extends Omit<NativeInputProps, "value" | "onChange"> {
  /** `null`: nothing typed yet, the field shows its placeholder (an example). */
  value: number | null;
  /** Called once the user has finished typing (a 500 ms pause, blur or Enter), never per keystroke. */
  onCommit: (value: number) => void;
  /** Emptied and left: called instead of committing the smallest value, so the field can go back to empty. */
  onEmpty?: () => void;
  ref?: React.Ref<HTMLInputElement>;
  /** Largest accepted value; more is marked invalid. */
  max?: number;
  /** Smallest accepted value (0 unless a figure can be negative); less is marked invalid. */
  min?: number;
}

/**
 * A money field that changes the report only when the user has finished
 * typing (lib/settle.ts): the values on the way ("1", "10", "100" while
 * typing "1000") are never applied, so the screen does not move under the
 * user's fingers. Accepts "1,234.5" or "1.234,5"; the typed text stays as
 * typed until the field is left. Emptied and left, it reads 0, or goes back
 * to empty with `onEmpty`.
 */
export function SettledNumberInput({ value, onCommit, onEmpty, max = Infinity, min = 0, className = "", onBlur, onKeyDown, ref, ...rest }: SettledNumberInputProps) {
  const numbers = useNumbers();
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const commit = useRef(onCommit);
  useEffect(() => {
    commit.current = onCommit;
  });
  // Made on first use, in an event handler: it reads the latest onCommit when it fires.
  const settlerRef = useRef<Settler<number> | null>(null);
  const settler = () => (settlerRef.current ??= createSettler<number>((next) => commit.current(next)));
  // Leaving the page mid-pause still applies what was typed.
  useEffect(() => () => settlerRef.current?.flush(), []);
  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      {...rest}
      ref={ref}
      value={draft ?? (value === null ? "" : numbers.show(value, 2))}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        if (text.trim() === "") {
          settler().cancel();
          setInvalid(false);
          return;
        }
        const parsed = numbers.read(text);
        const ok = parsed !== null && parsed >= min && parsed <= max;
        setInvalid(!ok);
        if (ok) settler().typed(parsed);
        else settler().cancel();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") settler().flush();
        onKeyDown?.(event);
      }}
      onBlur={(event) => {
        if (draft !== null && draft.trim() === "") {
          settler().cancel();
          if (onEmpty) onEmpty();
          else commit.current(Math.max(0, min));
        } else {
          settler().flush();
        }
        setDraft(null);
        setInvalid(false);
        onBlur?.(event);
      }}
      aria-invalid={invalid || undefined}
      className={`${inputClass} ${className}`}
    />
  );
}

