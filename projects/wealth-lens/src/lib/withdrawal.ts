/**
 * The share of the money taken out each year once the plan's years are
 * over, as the result's slider offers it, and how each did, in words.
 */

/** The share of the money taken out each year, as the slider offers it: 2 % to 7 %, in steps of 0.5 %. */
export const WITHDRAWAL_MIN = 0.02;
export const WITHDRAWAL_MAX = 0.07;
export const WITHDRAWAL_STEP = 0.005;
export const WITHDRAWAL_STEPS: readonly number[] = Array.from(
  { length: Math.round((WITHDRAWAL_MAX - WITHDRAWAL_MIN) / WITHDRAWAL_STEP) + 1 },
  (_, index) => Math.round((WITHDRAWAL_MIN + index * WITHDRAWAL_STEP) * 1000) / 1000,
);

/**
 * The slider's steps: 2 % to 7 % every 0.5 %, and the rate the data back
 * wherever it falls (lib/safe-rate.ts); a step within a hundredth of a
 * percent of it gives way, so the thumb never has two stops in one place.
 */
export function sliderSteps(dataRate: number): number[] {
  return [...WITHDRAWAL_STEPS.filter((step) => Math.abs(step - dataRate) > 1e-4 + 1e-9), dataRate].sort((a, b) => a - b);
}

/** The rates worked out ahead: the slider's steps and the plan's own, lowest first. */
export function offeredRates(withdrawalRate: number, dataRate: number = withdrawalRate): number[] {
  return [...new Set([...sliderSteps(dataRate), withdrawalRate])].sort((a, b) => a - b);
}

/** A rate on the slider: within 2–7 %, on a step of 0.5 % (a file could hold any). */
export function snapWithdrawal(rate: number): number {
  const clamped = Math.min(WITHDRAWAL_MAX, Math.max(WITHDRAWAL_MIN, rate));
  return Math.round(Math.round((clamped - WITHDRAWAL_MIN) / WITHDRAWAL_STEP) * WITHDRAWAL_STEP * 1000 + WITHDRAWAL_MIN * 1000) / 1000;
}

/**
 * How a withdrawal rate did, as a zone said in words: prudent when the money
 * lasted 30 years in at least 9 possible futures in 10, risky from 3 in 4,
 * very risky below. With no ups and downs it either lasts or it does not.
 */
export type WithdrawalZone = "prudent" | "risky" | "very-risky";
export const PRUDENT_FROM = 0.9;
export const RISKY_FROM = 0.75;

export function withdrawalZone(lasted: number): WithdrawalZone {
  if (lasted >= PRUDENT_FROM) return "prudent";
  return lasted >= RISKY_FROM ? "risky" : "very-risky";
}
