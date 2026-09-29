/**
 * Pure financial math. No UI, no I/O, no dates from the clock: every function
 * takes all of its inputs as arguments so it can be unit-tested by hand.
 *
 * Conventions
 * - Rates are decimal fractions (0.07 = 7 %).
 * - Returns are REAL (after inflation) unless a name says otherwise, so every
 *   projected amount is in today's money.
 * - Contributions are made at the END of each month (ordinary annuity).
 * - Monthly compounding uses the effective monthly rate (1 + r)^(1/12) - 1,
 *   so twelve months compound to exactly the annual rate. A lump sum therefore
 *   grows the same way whether it is compounded monthly or yearly.
 */

import type { CurrencyCode, Holding } from "./types";

function assertFiniteNumber(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number, got ${value}`);
  }
}

function assertAnnualRate(annualRate: number): void {
  assertFiniteNumber(annualRate, "annualRate");
  if (annualRate <= -1) {
    throw new RangeError(`annualRate must be greater than -100 %, got ${annualRate}`);
  }
}

function assertNonNegative(value: number, name: string): void {
  assertFiniteNumber(value, name);
  if (value < 0) {
    throw new RangeError(`${name} must not be negative, got ${value}`);
  }
}

/** Effective monthly rate whose 12-month compounding equals `annualRate`. */
export function monthlyRate(annualRate: number): number {
  assertAnnualRate(annualRate);
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/** Lump sum compounded yearly: PV × (1 + r)^years. */
export function futureValue(presentValue: number, annualRate: number, years: number): number {
  assertFiniteNumber(presentValue, "presentValue");
  assertAnnualRate(annualRate);
  assertNonNegative(years, "years");
  return presentValue * Math.pow(1 + annualRate, years);
}

/**
 * Starting balance plus a fixed end-of-month contribution:
 * FV = PV·(1+i)^m + PMT·((1+i)^m − 1) / i, with i the monthly rate and m months.
 */
export function futureValueWithContributions(
  presentValue: number,
  monthlyContribution: number,
  annualRate: number,
  years: number,
): number {
  assertNonNegative(presentValue, "presentValue");
  assertNonNegative(monthlyContribution, "monthlyContribution");
  assertNonNegative(years, "years");
  const months = years * 12;
  const i = monthlyRate(annualRate);
  if (i === 0) return presentValue + monthlyContribution * months;
  const growth = Math.pow(1 + i, months);
  return presentValue * growth + (monthlyContribution * (growth - 1)) / i;
}

/**
 * Months until the balance reaches `goal`, solving the future-value formula
 * above for m:
 *
 *   (1+i)^m = (goal·i + PMT) / (PV·i + PMT)   →   m = ln(ratio) / ln(1+i)
 *
 * Returns a fractional number of months (the goal is crossed during month
 * ⌈m⌉), `0` if the goal is already met and `Infinity` if the balance never
 * gets there (no contributions and no growth, or a negative return that
 * outweighs the contributions).
 */
export function monthsToGoal(
  presentValue: number,
  monthlyContribution: number,
  annualRate: number,
  goal: number,
): number {
  assertNonNegative(presentValue, "presentValue");
  assertNonNegative(monthlyContribution, "monthlyContribution");
  assertFiniteNumber(goal, "goal");
  const i = monthlyRate(annualRate);

  if (goal <= presentValue) return 0;

  if (i === 0) {
    return monthlyContribution > 0 ? (goal - presentValue) / monthlyContribution : Infinity;
  }

  const numerator = goal * i + monthlyContribution;
  const denominator = presentValue * i + monthlyContribution;
  // denominator <= 0: the balance never grows (e.g. nothing invested, nothing added).
  // numerator <= 0: with a negative return the balance converges to -PMT/i,
  // which is below the goal.
  if (denominator <= 0 || numerator <= 0) return Infinity;

  return Math.log(numerator / denominator) / Math.log1p(i);
}

/** `monthsToGoal` expressed in years. */
export function yearsToGoal(
  presentValue: number,
  monthlyContribution: number,
  annualRate: number,
  goal: number,
): number {
  return monthsToGoal(presentValue, monthlyContribution, annualRate, goal) / 12;
}

/**
 * Fixed end-of-month contribution needed to reach `goal` in `months` months:
 * PMT = (goal − PV·(1+i)^m) · i / ((1+i)^m − 1).
 *
 * Returns `0` when the starting balance alone gets there, and `Infinity` when
 * there is no time left (`months` = 0) but the goal is not met yet.
 */
export function requiredMonthlyContribution(
  presentValue: number,
  annualRate: number,
  months: number,
  goal: number,
): number {
  assertNonNegative(presentValue, "presentValue");
  assertNonNegative(months, "months");
  assertFiniteNumber(goal, "goal");
  const i = monthlyRate(annualRate);

  const growth = Math.pow(1 + i, months);
  const shortfall = goal - presentValue * growth;
  if (shortfall <= 0) return 0;
  if (months === 0) return Infinity;
  if (i === 0) return shortfall / months;
  return (shortfall * i) / (growth - 1);
}

/** Fisher relation: nominal = (1 + real)(1 + inflation) − 1. */
export function nominalReturn(realReturn: number, inflation: number): number {
  assertAnnualRate(realReturn);
  assertAnnualRate(inflation);
  return (1 + realReturn) * (1 + inflation) - 1;
}

/** Yearly income a portfolio supports under a fixed withdrawal rate. */
export function sustainableAnnualIncome(capital: number, withdrawalRate: number): number {
  assertNonNegative(capital, "capital");
  assertNonNegative(withdrawalRate, "withdrawalRate");
  return capital * withdrawalRate;
}

/**
 * What a capital pays per month under a yearly withdrawal rate:
 * capital × rate ÷ 12 (€300,000 at 4 % → €1,000 a month). In today's money,
 * since the withdrawal is adjusted for inflation every year.
 */
export function monthlyWithdrawal(capital: number, withdrawalRate: number): number {
  return sustainableAnnualIncome(capital, withdrawalRate) / 12;
}

/** Capital needed to fund `annualExpenses` (at 4 % this is expenses × 25). */
export function requiredCapital(annualExpenses: number, withdrawalRate: number): number {
  assertNonNegative(annualExpenses, "annualExpenses");
  assertFiniteNumber(withdrawalRate, "withdrawalRate");
  if (withdrawalRate <= 0) {
    throw new RangeError(`withdrawalRate must be positive, got ${withdrawalRate}`);
  }
  return annualExpenses / withdrawalRate;
}

export interface GainLoss {
  absolute: number;
  /** Relative to cost basis; `null` when the cost basis is zero. */
  percent: number | null;
}

export function gainLoss(costBasis: number, currentValue: number): GainLoss {
  assertFiniteNumber(costBasis, "costBasis");
  assertFiniteNumber(currentValue, "currentValue");
  const absolute = currentValue - costBasis;
  return { absolute, percent: costBasis === 0 ? null : absolute / costBasis };
}

/** Average price paid per share; `null` for an empty position. */
export function averageCost(holding: Pick<Holding, "costBasis" | "quantity">): number | null {
  return holding.quantity > 0 ? holding.costBasis / holding.quantity : null;
}

/** Market value at the user's current price; `null` if the price is unknown. */
export function holdingValue(holding: Pick<Holding, "quantity" | "currentPrice">): number | null {
  return holding.currentPrice === null ? null : holding.quantity * holding.currentPrice;
}

export function holdingGain(holding: Holding): GainLoss | null {
  const value = holdingValue(holding);
  return value === null ? null : gainLoss(holding.costBasis, value);
}

export interface CurrencySummary {
  currency: CurrencyCode;
  holdingCount: number;
  /** Holdings with a known current price, the only ones in the totals below. */
  pricedCount: number;
  /** Cost basis of the priced holdings, so it is comparable to `value`. */
  costBasis: number;
  value: number;
  gain: GainLoss;
}

/**
 * Totals per currency. Amounts in different currencies are never added
 * together, and holdings without a current price are counted but left out of
 * the money totals (so the gain is not distorted by a missing price).
 */
export function summarizeByCurrency(holdings: readonly Holding[]): CurrencySummary[] {
  const byCurrency = new Map<CurrencyCode, CurrencySummary>();
  for (const holding of holdings) {
    const summary = byCurrency.get(holding.currency) ?? {
      currency: holding.currency,
      holdingCount: 0,
      pricedCount: 0,
      costBasis: 0,
      value: 0,
      gain: { absolute: 0, percent: null },
    };
    summary.holdingCount += 1;
    const value = holdingValue(holding);
    if (value !== null) {
      summary.pricedCount += 1;
      summary.costBasis += holding.costBasis;
      summary.value += value;
    }
    byCurrency.set(holding.currency, summary);
  }
  return [...byCurrency.values()]
    .map((summary) => ({ ...summary, gain: gainLoss(summary.costBasis, summary.value) }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}
