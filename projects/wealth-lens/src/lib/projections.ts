/**
 * One way in to the simulations, whatever the plan invests in: an asset,
 * the user's own figures or a savings account draw from a pool of yearly
 * returns (lib/simulation.ts); a mix or the portfolio with standard
 * assumptions from its joint model (lib/mix.ts).
 */

import type { ResolvedInvestment } from "./investment";
import { mixModel, mixPercentiles, mixSuccessRates, sharedYears, worstYear, type WorstYear } from "./mix";
import { SERIES } from "./indexes";
import { cachedSuccessRates, wealthPercentiles, type WealthPercentiles } from "./simulation";

export interface Amounts {
  start: number;
  monthly: number;
  years: number;
}

const lastBands: { id: string; bands: WealthPercentiles }[] = [];

/** 10th, 50th and 90th percentile of the balance at each year (the last few are kept: the chart and a mix's figures ask for the same). */
export function bandsFor(investment: ResolvedInvestment, { start, monthly, years }: Amounts): WealthPercentiles {
  const id = `${investment.key}|${start}|${monthly}|${years}`;
  const kept = lastBands.find((entry) => entry.id === id);
  if (kept) return kept.bands;
  const bands =
    investment.simulation === "joint" && investment.model
      ? mixPercentiles(investment.model, { start, monthly, years }, undefined, investment.growthFactor)
      : wealthPercentiles({ start, monthly, returns: investment.returns, years, key: investment.key });
  lastBands.unshift({ id, bands });
  lastBands.length = Math.min(lastBands.length, 6);
  return bands;
}

const mixRates = new Map<string, number>();

/** How often each withdrawal rate lasted 30 years. */
export function successRatesFor(investment: ResolvedInvestment, rates: readonly number[]): number[] {
  const { model } = investment;
  if (investment.simulation !== "joint" || !model) return cachedSuccessRates(investment.key, investment.returns, rates);
  const id = (rate: number) => `${investment.key}|${rate.toFixed(4)}`;
  const missing = rates.filter((rate) => !mixRates.has(id(rate)));
  if (missing.length > 0) {
    if (mixRates.size > 256) mixRates.clear();
    mixSuccessRates(model, missing, undefined, undefined, investment.growthFactor).forEach((value, index) => mixRates.set(id(missing[index]), value));
  }
  return rates.map((rate) => mixRates.get(id(rate)) ?? NaN);
}

/** What a mix shows beside the result, with the S&P 500 alone as a reference. */
export interface MixFigures {
  /** 8 in 10 simulations ended between these, after the plan's years. */
  range: [number, number];
  worst: WorstYear | null;
  reference: { range: [number, number]; worst: WorstYear | null };
}

const SP500 = mixModel([{ asset: "sp500", weight: 100 }], false);
const SP500_RETURNS = SERIES.sp500.years.map((entry) => entry.realReturn);
const SP500_YEARS = new Set(SERIES.sp500.dataset.years.map((entry) => entry.year));

export function mixFigures(investment: ResolvedInvestment, amounts: Amounts): MixFigures | null {
  const { model } = investment;
  if (!model || !SP500) return null;
  const bands = bandsFor(investment, amounts);
  const reference = wealthPercentiles({ ...amounts, returns: SP500_RETURNS, key: "asset:sp500" });
  const years = amounts.years;
  // The worst year of both over the very same years: those the mix and the S&P 500 both have.
  const shared = sharedYears(model).filter((year) => SP500_YEARS.has(year));
  return {
    range: [bands.p10[years], bands.p90[years]],
    worst: worstYear(model, undefined, shared),
    reference: { range: [reference.p10[years], reference.p90[years]], worst: worstYear(SP500, undefined, shared) },
  };
}
