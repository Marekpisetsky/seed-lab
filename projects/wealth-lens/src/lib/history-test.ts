/**
 * "Test my plan": the plan as it is (same investment, same amounts) run
 * through what really happened, year by year, in the data the app already
 * uses (lib/indexes.ts: yearly returns after inflation, in today's money).
 * No simulation: every figure is one real sequence of years.
 *
 * Each year, half of the year's monthly amounts go in at its start and half
 * at its end, as in the simulations (lib/simulation.ts). A mix follows each
 * part's own history, rebalanced to its weights every year when it is
 * rebalanced; a stock of My portfolio follows its index's history. A
 * savings part earns its fixed rate. Numbers only: the words are in
 * the dictionaries (`test`).
 */

import { isSeriesAsset, type AssetId } from "./assets";
import { valueAt, type Scenario } from "./calculator";
import { SERIES } from "./indexes";
import type { ResolvedInvestment } from "./investment";

/**
 * The crashes of the data: the year each hit, and how many calendar years
 * the markets kept falling (in yearly data: 1929–1931, 1973–1974,
 * 2000–2002, 2008, 2020, 2022). Its fall is looked for from the year
 * before it (the plan starts then) to the end of those years, so two
 * crashes never share a fall.
 */
export const CRISES = [
  { id: "depression", year: 1929, years: 3 },
  { id: "oil", year: 1973, years: 2 },
  { id: "dotcom", year: 2000, years: 3 },
  { id: "financial", year: 2008, years: 1 },
  { id: "covid", year: 2020, years: 1 },
  { id: "inflation", year: 2022, years: 1 },
] as const;

export type CrisisId = (typeof CRISES)[number]["id"];

/** The plan starts this many years before a crash. */
const CRISIS_START_BEFORE = 1;
/** Below this a fall is no fall: rounding. */
const NO_DROP = 0.0005;

/** What a plan's history is made of: its parts, their weights, and whether it is rebalanced every year. */
export interface HistorySource {
  parts: { asset: AssetId; weight: number }[];
  rebalance: boolean;
  /** What a savings part earns a year, after inflation. */
  savingsReturn: number;
}

export interface Amounts {
  start: number;
  monthly: number;
}

/**
 * The history of an investment: its asset, or a mix's or the portfolio's
 * parts (a stock follows its index). `null` for a savings account or custom
 * growth: they have no history of ups and downs.
 */
export function historySource(investment: Pick<ResolvedInvestment, "investment" | "model" | "custom">): HistorySource | null {
  const chosen = investment.investment;
  if (chosen.kind === "custom") return null;
  if (chosen.kind === "asset") return isSeriesAsset(chosen.asset) ? { parts: [{ asset: chosen.asset, weight: 1 }], rebalance: true, savingsReturn: 0 } : null;
  const model = investment.model;
  if (!model || !model.parts.some((part) => isSeriesAsset(part.asset))) return null;
  return { parts: model.parts.map((part) => ({ asset: part.asset, weight: part.weight })), rebalance: model.rebalance, savingsReturn: model.savingsReturn };
}

/** The S&P 500 alone, to compare a mix with. */
export const SP500_ALONE: HistorySource = { parts: [{ asset: "sp500", weight: 1 }], rebalance: true, savingsReturn: 0 };

/** Whether a source is the S&P 500 alone. */
export function isSp500Alone(source: HistorySource): boolean {
  return source.parts.length === 1 && source.parts[0].asset === "sp500";
}

function returnsOf(asset: AssetId): ReadonlyMap<number, number> | null {
  return isSeriesAsset(asset) ? new Map(SERIES[asset].dataset.years.map((entry) => [entry.year, entry.realReturn])) : null;
}

/** First and last year every part with history has data for; `null` if none. */
export function yearsCovered(source: HistorySource): [number, number] | null {
  const series = source.parts.map((part) => returnsOf(part.asset)).filter((entry): entry is ReadonlyMap<number, number> => entry !== null);
  if (series.length === 0) return null;
  const first = Math.max(...series.map((entry) => Math.min(...entry.keys())));
  const last = Math.min(...series.map((entry) => Math.max(...entry.keys())));
  return first <= last ? [first, last] : null;
}

/**
 * The money at the start (index 0) and at the end of each year from
 * `fromYear`, for `years` years or until the data ends.
 */
export function historyPath(source: HistorySource, { start, monthly }: Amounts, fromYear: number, years: number): number[] {
  const covered = yearsCovered(source);
  if (!covered || fromYear < covered[0] || fromYear > covered[1]) return [];
  const series = source.parts.map((part) => returnsOf(part.asset));
  const half = monthly * 6;
  let values = source.parts.map((part) => start * part.weight);
  const path = [start];
  for (let year = fromYear; year < fromYear + years && year <= covered[1]; year++) {
    values = values.map((value, index) => {
      const part = source.parts[index];
      const growth = series[index]?.get(year) ?? source.savingsReturn;
      return (value + half * part.weight) * (1 + growth) + half * part.weight;
    });
    const total = values.reduce((sum, value) => sum + value, 0);
    if (source.rebalance) values = source.parts.map((part) => total * part.weight);
    path.push(total);
  }
  return path;
}

export interface CrisisResult {
  id: CrisisId;
  /** The year it hit. */
  year: number;
  /** The plan starts at the beginning of this year. */
  startYear: number;
  /** The money at the start and at the end of each year, until the data ends. */
  path: number[];
  /**
   * The fall: from the highest point (index into `path`) to the lowest, what
   * the crash did to the money there was at the top (`from` → `to`), the
   * money added since left out. `null` when prices were no lower at any
   * year end.
   */
  fall: { peak: number; trough: number; from: number; to: number; drop: number } | null;
  /** Years from the top until that money was back to it; `null` when it was not back before the data ends. */
  yearsToRecover: number | null;
  /** Years the plan runs here: the plan's, or fewer when the data ends first. */
  years: number;
  /** The money after those years. */
  final: number;
  /** The last year of data. */
  lastYear: number;
}

/** The plan through one crash; `null` when the data does not cover it. */
export function crisisResult(source: HistorySource, amounts: Amounts, years: number, id: CrisisId): CrisisResult | null {
  const crisis = CRISES.find((entry) => entry.id === id);
  const covered = yearsCovered(source);
  if (!crisis || !covered) return null;
  const startYear = crisis.year - CRISIS_START_BEFORE;
  if (startYear < covered[0] || crisis.year > covered[1]) return null;
  const path = historyPath(source, amounts, startYear, covered[1] - startYear + 1);
  // What €1 did, with nothing added: the crash itself, which the money added each year would hide.
  const unit = historyPath(source, { start: 1, monthly: 0 }, startYear, covered[1] - startYear + 1);
  // The fall: the biggest drop from a running top, by the end of the crash's years.
  const windowEnd = Math.min(unit.length - 1, crisis.year + crisis.years - startYear);
  let fall: CrisisResult["fall"] = null;
  let peak = 0;
  for (let index = 0; index <= windowEnd; index++) {
    if (unit[index] > unit[peak]) peak = index;
    const drop = 1 - unit[index] / unit[peak];
    if (drop > NO_DROP && (!fall || drop > fall.drop)) fall = { peak, trough: index, from: path[peak], to: path[peak] * (1 - drop), drop };
  }
  let yearsToRecover: number | null = null;
  if (fall) {
    const top = unit[fall.peak];
    const back = unit.findIndex((value, index) => index > fall.trough && value >= top);
    yearsToRecover = back === -1 ? null : back - fall.peak;
  }
  const shown = Math.min(years, path.length - 1);
  return { id, year: crisis.year, startYear, path, fall, yearsToRecover, years: shown, final: path[shown], lastYear: covered[1] };
}

/** Every crash of the list, `null` where the data does not cover it. */
export function crisisResults(source: HistorySource | null, amounts: Amounts, years: number): Record<CrisisId, CrisisResult | null> {
  return Object.fromEntries(CRISES.map(({ id }) => [id, source ? crisisResult(source, amounts, years, id) : null])) as Record<CrisisId, CrisisResult | null>;
}

export interface StartYear {
  year: number;
  final: number;
}

export interface StartYears {
  /** Years each run lasts: the plan's, or fewer when the data is too short for two runs. */
  window: number;
  starts: StartYear[];
  worst: StartYear;
  median: StartYear;
  best: StartYear;
}

/**
 * The plan started in every possible year of the data: what it gave after
 * the plan's years (or the longest runs that leave at least five start
 * years, when the data is short). `onlyYears` keeps the same start years
 * as another source, to compare them alike.
 */
export function everyStartYear(source: HistorySource | null, amounts: Amounts, years: number, onlyYears?: readonly number[]): StartYears | null {
  const covered = source && yearsCovered(source);
  if (!source || !covered) return null;
  const span = covered[1] - covered[0] + 1;
  const window = span - years + 1 >= 2 ? years : Math.max(1, span - 4);
  const starts: StartYear[] = [];
  for (let year = covered[0]; year + window - 1 <= covered[1]; year++) {
    if (onlyYears && !onlyYears.includes(year)) continue;
    const path = historyPath(source, amounts, year, window);
    starts.push({ year, final: path[window] });
  }
  if (starts.length === 0) return null;
  const sorted = [...starts].sort((a, b) => a.final - b.final);
  return { window, starts, worst: sorted[0], median: sorted[Math.floor((sorted.length - 1) / 2)], best: sorted[sorted.length - 1] };
}

/** The plan's own projection over the same years, with its average growth: what the history is compared with. */
export function averageResult(scenario: Scenario, years: number): number {
  return valueAt(scenario, years * 12);
}
