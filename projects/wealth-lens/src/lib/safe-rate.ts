/**
 * The withdrawal rate the data back for what the plan invests in (A4,
 * seed-kit's withdrawal-rate.ts): the largest yearly withdrawal, kept
 * constant after rising prices, that lasted RETIREMENT_YEARS years from
 * every start in the investment's own history, the worst included.
 *
 * - An asset with a history: its whole dataset (US stocks from 1928;
 *   bonds and gold from 1988), not only the years the assets share: more
 *   starts can only find a worse one.
 * - A mix: its parts' yearly returns, back to its weights each year, over
 *   the years every part has.
 * - A savings account, or growth with no ups and downs: the same every
 *   year, so one answer, no worst start.
 * - Growth or swings of the user's own ("My %"): no history describes
 *   them. The rate is the user's; the page shows what a fall like the
 *   worst year of the most similar asset would do at the start
 *   (research/wealth-lens/tasa-de-retiro.md).
 */

import { safeRate, steadyRate, withEarlyCrash, type CrashOutcome, type SafeRate, type YearReturn } from "@seed-kit/withdrawal-rate.ts";
import { isSeriesAsset, seriesVolatility } from "./assets";
import { SERIES, SERIES_IDS, type SeriesId } from "./indexes";
import { resolveInvestment, type ProjectionSettings, type ResolvedInvestment } from "./investment";
import { sharedYears, type MixModel } from "./mix";
import type { Investment } from "./types";

export { FEW_PERIODS } from "@seed-kit/withdrawal-rate.ts";

/** How long the money must last once the withdrawals start: 30 years, as in Bengen (1994) and the Trinity study. */
export const RETIREMENT_YEARS = 30;

/** The worst calendar year of an asset's data, after inflation. */
export interface WorstFall {
  asset: SeriesId;
  year: number;
  /** e.g. −0.37. */
  change: number;
}

export type SafeRateInfo =
  /** From history: the rate, the worst start and the periods behind it. */
  | ({ kind: "history" } & SafeRate)
  /** The same growth every year: the one rate it pays for the years. */
  | { kind: "steady"; rate: number; years: number }
  /** The user's own growth: no history. `rate` is the most similar asset's, a starting point only. */
  | { kind: "own"; similar: SeriesId; rate: number; fall: WorstFall };

/** A mix's yearly returns back to its weights each year, over the years every part has data. */
function mixHistory(model: MixModel): YearReturn[] {
  const byPart = model.parts.map((part) => (isSeriesAsset(part.asset) ? new Map(SERIES[part.asset].dataset.years.map((entry) => [entry.year, entry.realReturn])) : null));
  return sharedYears(model).map((year) => ({
    year,
    realReturn: model.parts.reduce((sum, part, index) => sum + part.weight * (byPart[index]?.get(year) ?? model.savingsReturn), 0),
  }));
}

const historyRates = new Map<string, SafeRate>();

/** An asset's safe rate from its whole dataset; made once. */
export function assetSafeRate(asset: SeriesId, years: number = RETIREMENT_YEARS): SafeRate {
  const key = `${asset}|${years}`;
  let known = historyRates.get(key);
  if (!known) {
    known = safeRate(SERIES[asset].dataset.years, years);
    historyRates.set(key, known);
  }
  return known;
}

/** The worst year of an asset's whole dataset. */
export function worstFall(asset: SeriesId): WorstFall {
  const worst = SERIES[asset].dataset.years.reduce((low, entry) => (entry.realReturn < low.realReturn ? entry : low));
  return { asset, year: worst.year, change: worst.realReturn };
}

/** The asset most like the user's own growth: the nearest swings, then the nearest growth. */
export function similarAsset(investment: Pick<ResolvedInvestment, "realReturn" | "volatility">): SeriesId {
  const distance = (id: SeriesId) => [Math.abs(seriesVolatility(id) - investment.volatility), Math.abs(SERIES[id].averageReturn - investment.realReturn)] as const;
  return [...SERIES_IDS].sort((a, b) => {
    const [swingsA, growthA] = distance(a);
    const [swingsB, growthB] = distance(b);
    return swingsA - swingsB || growthA - growthB;
  })[0];
}

/** The rate the data back for a resolved investment, over `years` years. */
export function safeRateFor(investment: ResolvedInvestment, years: number = RETIREMENT_YEARS): SafeRateInfo {
  if (investment.volatility <= 0) return { kind: "steady", rate: steadyRate(investment.realReturn, years), years };
  if (investment.custom || investment.investment.kind === "custom") {
    const similar = similarAsset(investment);
    return { kind: "own", similar, rate: assetSafeRate(similar, years).rate, fall: worstFall(similar) };
  }
  const plan = investment.investment;
  if (plan.kind === "asset" && isSeriesAsset(plan.asset)) return { kind: "history", ...assetSafeRate(plan.asset, years) };
  if (investment.model) {
    const history = mixHistory(investment.model);
    if (history.length > 0) return { kind: "history", ...safeRate(history, years) };
  }
  return { kind: "steady", rate: steadyRate(investment.realReturn, years), years };
}

/** "My %": what a fall like the similar asset's worst year, at the start, does to `rate` with the user's growth after it. */
export function earlyFall(info: Extract<SafeRateInfo, { kind: "own" }>, rate: number, growth: number, years: number = RETIREMENT_YEARS): CrashOutcome {
  return withEarlyCrash(rate, growth, info.fall.change, years);
}

/** The rate a plan takes out: the user's, or the one the data back for its investment. */
export function planWithdrawalRate(plan: ProjectionSettings & { investment: Investment; withdrawalRate: number | null }): number {
  return plan.withdrawalRate ?? safeRateFor(resolveInvestment(plan.investment, plan)).rate;
}
