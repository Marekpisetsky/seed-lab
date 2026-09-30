/**
 * One way in to the simulations, whatever the plan invests in: an index,
 * a single stock or a custom rate draw from a history of yearly returns
 * (lib/simulation.ts); a mix or the portfolio from its joint model
 * (lib/mix.ts).
 */

import type { ResolvedInvestment } from "./investment";
import { indexRef, mixModel, mixPercentiles, mixSuccessRates, sharedYears, worstYear, type WorstYear } from "./mix";
import { INDEXES } from "./indexes";
import { cachedSuccessRates, wealthPercentiles, type WealthPercentiles } from "./simulation";

export interface Amounts {
  start: number;
  monthly: number;
  years: number;
}

/** 10th, 50th and 90th percentile of the balance at each year. */
export function bandsFor(investment: ResolvedInvestment, { start, monthly, years }: Amounts): WealthPercentiles {
  return investment.model
    ? mixPercentiles(investment.model, { start, monthly, years })
    : wealthPercentiles({ start, monthly, returns: investment.returns, years, key: investment.key });
}

/** How often each withdrawal rate lasted 30 years. */
export function successRatesFor(investment: ResolvedInvestment, rates: readonly number[]): number[] {
  return investment.model ? mixSuccessRates(investment.model, rates) : cachedSuccessRates(investment.key, investment.returns, rates);
}

/** What a mix shows beside the result, with the S&P 500 alone as a reference. */
export interface MixFigures {
  /** 8 in 10 simulations ended between these, after the plan's years. */
  range: [number, number];
  worst: WorstYear | null;
  reference: { range: [number, number]; worst: WorstYear | null };
}

const SP500 = mixModel([{ ref: indexRef("sp500"), weight: 100 }], false);

export function mixFigures(investment: ResolvedInvestment, amounts: Amounts): MixFigures | null {
  const { model } = investment;
  if (!model || !SP500) return null;
  const bands = mixPercentiles(model, amounts);
  const reference = wealthPercentiles({
    ...amounts,
    returns: INDEXES.sp500.years.map((entry) => entry.realReturn),
    key: "index:sp500",
  });
  const years = amounts.years;
  return {
    range: [bands.p10[years], bands.p90[years]],
    worst: worstYear(model),
    reference: { range: [reference.p10[years], reference.p90[years]], worst: worstYear(SP500, undefined, sharedYears(model)) },
  };
}
