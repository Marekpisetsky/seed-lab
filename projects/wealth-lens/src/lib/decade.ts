/**
 * "What if your first 10 years were like 2000–2009?": a bad first decade
 * from history, not from the simulations. The plan's first ten years (or
 * all of them, when fewer) take the real yearly growth after rising prices
 * of a real decade, one year after the other; from then on the money grows
 * at the plan's average again.
 *
 * Which decade:
 * - 2000–2009, the decade most stock markets lost, when the data has it
 *   and it grew less than the investment's average over the data's years
 *   (COMMON_PERIOD): a bad decade for it;
 * - otherwise the investment's worst ten years in a row in those years,
 *   named with its years (gold: 1988–1997; euro bonds: 2013–2022).
 *
 * What the decade is made of:
 * - an asset with a history: its own years;
 * - a mix: its parts' years, at their weights (back at them each
 *   January, or drifting, as the mix says);
 * - Custom growth: US stocks' years (CUSTOM_BASE);
 * - growth or ups and downs the user typed: the same years, in log terms
 *   moved to the typed growth and stretched to the typed ups and downs, so
 *   the decade keeps its shape: log(1 + r') = log(1 + g') + (σ' / σ) ×
 *   (log(1 + r) − log(1 + g)), g and σ being the data's average and spread.
 *
 * With no ups and downs (a savings account, Custom growth at 0) there is
 * no bad decade.
 */

import { isSeriesAsset, type AssetId } from "./assets";
import { futureValueWithContributions } from "./finance";
import { SERIES, type SeriesId } from "./indexes";
import { CUSTOM_BASE, type ResolvedInvestment } from "./investment";

/** The decade tried first: the one most stock markets lost. */
export const FAMOUS_DECADE: readonly [number, number] = [2000, 2009];
/** Years a bad start lasts, at most. */
export const DECADE_YEARS = 10;

export interface HistoricalDecade {
  /** The real years used: 2000 and 2009, or fewer years when the plan is shorter than ten. */
  from: number;
  to: number;
  /** What the money is worth after 0, 1… of those years: the first is the starting amount. */
  head: number[];
}

/** One part of what is invested: a series of real years, or a fixed growth (a savings part). */
interface Strand {
  weight: number;
  /** Real growth a year by calendar year; `null`: the same every year. */
  years: ReadonlyMap<number, number> | null;
  fixed: number;
}

const byYear = new Map<SeriesId, ReadonlyMap<number, number>>();

/** An asset's years in the data the app uses (COMMON_PERIOD), by calendar year. */
function yearsOf(asset: SeriesId): ReadonlyMap<number, number> {
  let kept = byYear.get(asset);
  if (!kept) {
    kept = new Map(SERIES[asset].years.map((entry) => [entry.year, entry.realReturn]));
    byYear.set(asset, kept);
  }
  return kept;
}

function strandOf(asset: AssetId, weight: number, savingsReturn: number): Strand {
  return isSeriesAsset(asset) ? { weight, years: yearsOf(asset), fixed: 0 } : { weight, years: null, fixed: savingsReturn };
}

/** What the decade is made of. */
function strandsOf(investment: ResolvedInvestment): { strands: Strand[]; rebalance: boolean } | null {
  const { model } = investment;
  if (model && investment.investment.kind === "mix") {
    return { strands: model.parts.map((part) => strandOf(part.asset, part.weight, model.savingsReturn)), rebalance: model.rebalance };
  }
  const asset = investment.investment.kind === "asset" ? investment.investment.asset : CUSTOM_BASE;
  if (!isSeriesAsset(asset)) return null;
  return { strands: [strandOf(asset, 1, 0)], rebalance: true };
}

/** The decade's yearly growth, the parts back at their weights each year (to choose it and to stretch it). */
function combined(strands: readonly Strand[], year: number): number {
  return strands.reduce((sum, strand) => sum + strand.weight * (strand.years ? (strand.years.get(year) ?? NaN) : strand.fixed), 0);
}

const logGrowth = (values: readonly number[]) => values.reduce((sum, value) => sum + Math.log1p(value), 0);

/** The years every part has, in order. */
function sharedYears(strands: readonly Strand[]): number[] {
  const withData = strands.filter((strand) => strand.years !== null);
  if (withData.length === 0) return [];
  return [...(withData[0].years as ReadonlyMap<number, number>).keys()].filter((year) => withData.every((strand) => strand.years?.has(year))).sort((a, b) => a - b);
}

/**
 * Which ten years: 2000–2009 if the data has them and they grew less than
 * the average; otherwise the worst ten in a row. `null` with fewer than ten.
 */
function pickDecade(strands: readonly Strand[]): [number, number] | null {
  const years = sharedYears(strands);
  if (years.length < DECADE_YEARS) return null;
  const growth = years.map((year) => combined(strands, year));
  const average = logGrowth(growth) / growth.length;
  const at = (first: number) => years.indexOf(first);
  const decadeLog = (start: number) => logGrowth(growth.slice(start, start + DECADE_YEARS));
  const famous = at(FAMOUS_DECADE[0]);
  if (famous >= 0 && famous + DECADE_YEARS <= years.length && decadeLog(famous) < average * DECADE_YEARS) return [...FAMOUS_DECADE];
  let worst = 0;
  for (let start = 1; start + DECADE_YEARS <= years.length; start++) if (decadeLog(start) < decadeLog(worst)) worst = start;
  return [years[worst], years[worst + DECADE_YEARS - 1]];
}

/** The average and the spread of the yearly growth in log terms, over the data's years: for a single asset, its average growth and its ups and downs. */
function dataFigures(strands: readonly Strand[]): { growth: number; spread: number } {
  const logs = sharedYears(strands).map((year) => Math.log1p(combined(strands, year)));
  const growth = logs.reduce((sum, value) => sum + value, 0) / logs.length;
  const spread = Math.sqrt(logs.reduce((sum, value) => sum + (value - growth) ** 2, 0) / (logs.length - 1));
  return { growth, spread };
}

/** The real years a plan of `years` would take for its bad start (2000–2009, or 2000–2005 for a six-year plan): `null` with no ups and downs. */
export function decadeYears(investment: ResolvedInvestment, years: number): [number, number] | null {
  if (investment.volatility <= 0) return null;
  const made = strandsOf(investment);
  const decade = made && pickDecade(made.strands);
  if (!decade) return null;
  return [decade[0], decade[0] + Math.max(1, Math.min(DECADE_YEARS, years)) - 1];
}

/**
 * The plan's first years, as a real decade: `null` with no ups and downs.
 * `start` and `monthly` are the plan's; the monthly amount goes in at each
 * month's end, as everywhere else (lib/finance.ts).
 */
export function historicalDecade(investment: ResolvedInvestment, start: number, monthly: number, years: number): HistoricalDecade | null {
  if (investment.volatility <= 0) return null;
  const made = strandsOf(investment);
  if (!made) return null;
  const decade = pickDecade(made.strands);
  if (!decade) return null;
  const span = Math.max(1, Math.min(DECADE_YEARS, years));
  const calendar = Array.from({ length: span }, (_, index) => decade[0] + index);
  const head = [start];
  const data = dataFigures(made.strands);
  const typed = investment.custom || investment.investment.kind === "custom";
  // Typed figures (or Custom growth, on US stocks' years): the decade moved to the plan's growth and stretched to its ups and downs.
  if (typed || investment.growthFactor !== 1 || made.strands.length === 1 || made.rebalance) {
    const ratio = typed && data.spread > 0 ? investment.volatility / data.spread : 1;
    const target = typed ? Math.log1p(investment.realReturn) : data.growth;
    for (const year of calendar) {
      const raw = combined(made.strands, year);
      const growth = Math.expm1(target + ratio * (Math.log1p(raw) - data.growth));
      const last = head[head.length - 1];
      head.push(futureValueWithContributions(Math.max(0, last), monthly, (1 + growth) * investment.growthFactor - 1, 1));
    }
  } else {
    // A mix left to drift: each part grows on its own, the monthly amount split by the weights.
    let parts = made.strands.map((strand) => strand.weight * start);
    for (const year of calendar) {
      parts = made.strands.map((strand, index) => {
        const growth = strand.years ? (strand.years.get(year) ?? 0) : strand.fixed;
        return futureValueWithContributions(Math.max(0, parts[index]), monthly * strand.weight, growth, 1);
      });
      head.push(parts.reduce((sum, value) => sum + value, 0));
    }
  }
  return { from: calendar[0], to: calendar[calendar.length - 1], head };
}
