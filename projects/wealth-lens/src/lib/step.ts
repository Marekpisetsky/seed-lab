/**
 * The − / + buttons beside a number: one step up or down, snapped to the
 * steps (230 goes up to 250 and down to 200 in steps of 50) and kept
 * within bounds. Applied at once, without the typing pause.
 */
export function stepValue(value: number, direction: 1 | -1, { step, min, max }: { step: number; min: number; max: number }): number {
  const units = value / step;
  const next = direction > 0 ? (Math.floor(units + 1e-9) + 1) * step : (Math.ceil(units - 1e-9) - 1) * step;
  return Math.min(max, Math.max(min, next));
}

/** "You add each month": steps of EUR 50, never below 0. */
export const MONTHLY_STEP = { step: 50, min: 0 } as const;
/** "For N years": steps of a year, 1 to 60. */
export const YEARS_STEP = { step: 1, min: 1, max: 60 } as const;
