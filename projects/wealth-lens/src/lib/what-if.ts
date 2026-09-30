/**
 * "What if…?": quick scenarios on top of the plan, one at a time. Each
 * shows what it changes in euros at the end of the plan's years, worked
 * out on the plan as it is; tapping one applies it to the whole screen
 * (the result, the chart, the goals and the country table), and tapping it
 * again takes it away.
 *
 * - Grows 1% more / less: the same investment, every year's growth factor
 *   times (1 + g ± 1%) / (1 + g), so the ups and downs stay and the typical
 *   year grows 1% more or less after rising prices.
 * - +€50 a month: the monthly amount plus €50.
 * - 5 more years: the same plan for five more years (60 at most).
 * - A bad first decade: for the first ten years (or the plan's years, if
 *   fewer), the money follows the line 1 in 10 simulated histories ended
 *   below (the lower dashed line of the chart); from then on it grows at the
 *   average again. The simulations are the investment's own: its history,
 *   or a normal distribution with the growth and ups and downs typed. With
 *   no ups and downs there is no bad decade.
 */

import type { Scenario } from "./calculator";
import type { ResolvedInvestment } from "./investment";
import { bandsFor } from "./projections";

export const WHAT_IF_IDS = ["grow-more", "grow-less", "monthly-50", "years-5", "bad-decade"] as const;
export type WhatIfId = (typeof WHAT_IF_IDS)[number];

export function isWhatIfId(value: unknown): value is WhatIfId {
  return typeof value === "string" && (WHAT_IF_IDS as readonly string[]).includes(value);
}

/** Growth added or taken away by "Grows 1% more / less". */
export const GROWTH_STEP = 0.01;
export const MONTHLY_STEP = 50;
export const MORE_YEARS = 5;
/** Years the bad start lasts, at most. */
export const BAD_YEARS = 10;
/** The most years a plan looks ahead. */
const MAX_YEARS = 60;

/** What a scenario changes in the plan's inputs. */
export interface WhatIfInputs {
  monthly: number;
  years: number;
  /** Added to the growth a year after rising prices. */
  growth: number;
  /** A bad start: the lower line of the simulations for its first years. */
  badStart: boolean;
}

/** The plan's inputs with a scenario applied (`null`: as they are). */
export function whatIfInputs(id: WhatIfId | null, monthly: number, years: number): WhatIfInputs {
  return {
    monthly: id === "monthly-50" ? monthly + MONTHLY_STEP : monthly,
    years: id === "years-5" ? Math.min(MAX_YEARS, years + MORE_YEARS) : years,
    growth: id === "grow-more" ? GROWTH_STEP : id === "grow-less" ? -GROWTH_STEP : 0,
    badStart: id === "bad-decade",
  };
}

/** Whether a scenario can apply to this plan: five more years only up to 60, a bad decade only with ups and downs. */
export function whatIfAvailable(id: WhatIfId, years: number, investment: Pick<ResolvedInvestment, "volatility">): boolean {
  if (id === "years-5") return years + MORE_YEARS <= MAX_YEARS;
  if (id === "bad-decade") return investment.volatility > 0;
  return true;
}

/**
 * The first years of a bad start: after 0, 1… up to BAD_YEARS years (or
 * the plan's years, if fewer), the 10th percentile of the simulated
 * balances. `null` when the investment has no ups and downs.
 */
export function badStartHead(investment: ResolvedInvestment, start: number, monthly: number, years: number): number[] | null {
  if (investment.volatility <= 0) return null;
  const span = Math.max(1, Math.min(BAD_YEARS, years));
  return bandsFor(investment, { start, monthly, years: span }).p10.slice(0, span + 1);
}

/** A scenario with a bad start, when there is one. */
export function withBadStart(scenario: Scenario, investment: ResolvedInvestment, years: number): Scenario {
  const head = badStartHead(investment, scenario.capital, scenario.monthly, years);
  return head ? { ...scenario, head } : scenario;
}

export interface WhatIfEffect {
  id: WhatIfId;
  /** What the money is worth with it, minus without it, at the end of the plan's (or its) years. */
  change: number;
  available: boolean;
}
