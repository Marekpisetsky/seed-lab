/**
 * One way in to the simulations, whatever the plan invests in: an asset,
 * the user's own figures or a savings account draw from a pool of yearly
 * returns (lib/simulation.ts); a mix or the portfolio with standard
 * assumptions from its joint model (lib/mix.ts).
 */

import type { ResolvedInvestment } from "./investment";
import { concentration, mixModel, mixPercentiles, mixSamples, mixSuccessRates, sharedYears, worstYear, type Concentration, type WorstYear } from "./mix";
import { SERIES } from "./indexes";
import { cachedSuccessRates, wealthPercentiles, wealthSamples, type WealthPercentiles } from "./simulation";

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

/** How many possible futures each simulation works out: the percentiles, the bands and "1 in 10" are of these. */
export const FUTURES = 1000;

/**
 * `count` whole possible futures, from the very simulations the bands come
 * from, evenly spread over them: for the view "Where do these futures come
 * from?". Empty with no ups and downs.
 */
export function samplesFor(investment: ResolvedInvestment, { start, monthly, years }: Amounts, count: number): number[][] {
  if (investment.volatility <= 0) return [];
  return investment.simulation === "joint" && investment.model
    ? mixSamples(investment.model, { start, monthly, years }, count, undefined, investment.growthFactor)
    : wealthSamples({ start, monthly, returns: investment.returns, years, key: investment.key, count, simulations: FUTURES });
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
  /** A mix with one stock over a fifth of it: the result with that stock and with its index instead. */
  concentration: Concentration | null;
}

const SP500 = mixModel([{ asset: "sp500", weight: 100 }], false);
const SP500_RETURNS = SERIES.sp500.years.map((entry) => entry.realReturn);
const SP500_YEARS = new Set(SERIES.sp500.dataset.years.map((entry) => entry.year));

/** The S&P 500's band for the last amounts asked, and each mix's worst years: the same on every recalculation until they change. */
let lastReference: { id: string; range: [number, number] } | null = null;
const worstYears = new Map<string, { worst: WorstYear | null; reference: WorstYear | null }>();
const MAX_KEPT_WORST_YEARS = 16;

const concentrations = new Map<string, Concentration | null>();

/**
 * The concentration effect of a mix simulated from its own figures; with
 * the user's own growth or ups and downs the stock's own moves are not
 * simulated, so there is none to show.
 */
function concentrationFor(investment: ResolvedInvestment, amounts: Amounts): Concentration | null {
  const { model } = investment;
  if (!model || investment.investment.kind !== "mix" || investment.simulation !== "joint") return null;
  const id = `${investment.key}|${amounts.start}|${amounts.monthly}|${amounts.years}|${investment.growthFactor}`;
  let kept = concentrations.get(id);
  if (kept === undefined) {
    // The mix's own band is the chart's: worked out once for both.
    kept = concentration(model, amounts, undefined, investment.growthFactor, bandsFor(investment, amounts));
    if (concentrations.size >= 16) concentrations.delete(concentrations.keys().next().value ?? "");
    concentrations.set(id, kept);
  }
  return kept;
}

export function mixFigures(investment: ResolvedInvestment, amounts: Amounts): MixFigures | null {
  const { model } = investment;
  if (!model || !SP500) return null;
  const bands = bandsFor(investment, amounts);
  const years = amounts.years;
  const id = `${amounts.start}|${amounts.monthly}|${years}`;
  if (lastReference?.id !== id) {
    const reference = wealthPercentiles({ ...amounts, returns: SP500_RETURNS, key: "asset:sp500" });
    lastReference = { id, range: [reference.p10[years], reference.p90[years]] };
  }
  let worst = worstYears.get(model.key);
  if (!worst) {
    // The worst year of both over the very same years: those the mix and the S&P 500 both have.
    const shared = sharedYears(model).filter((year) => SP500_YEARS.has(year));
    worst = { worst: worstYear(model, undefined, shared), reference: worstYear(SP500, undefined, shared) };
    if (worstYears.size >= MAX_KEPT_WORST_YEARS) worstYears.delete(worstYears.keys().next().value ?? "");
    worstYears.set(model.key, worst);
  }
  return {
    range: [bands.p10[years], bands.p90[years]],
    worst: worst.worst,
    reference: { range: lastReference.range, worst: worst.reference },
    concentration: concentrationFor(investment, amounts),
  };
}
