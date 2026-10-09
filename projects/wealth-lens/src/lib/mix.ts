/**
 * A mix: several assets with weights the user sets, from the ones a plan
 * can be projected with (lib/assets.ts): US stocks, German government
 * bonds, gold and savings. Asset classes only, never a product. The app
 * never suggests weights; the quick templates (100% stocks, 80/20, 60/40)
 * are the textbook starting points, not advice.
 *
 * Growth (the projection and "In N years you'll have")
 *   The weighted average of each part's growth: an asset's average over
 *   the common period, a savings part's rate less inflation.
 *
 * Ups and downs (the band, "Range (8 in 10)", the withdrawal success rate)
 *   1,000 simulated paths of 60 years, one draw per year:
 *   - one historical year (1988–2022) is drawn for every asset at once,
 *     so stocks, bonds and gold move together as they did, crashes and
 *     2022's fall of stocks and bonds together included;
 *   - an asset part earns that year's return; a savings part its rate.
 *   The random draws are made once and reused, so changing a weight or an
 *   amount does not simulate again.
 *
 * Weights over time
 *   - Let weights drift (default): each part grows on its own; money added
 *     each month is split by the weights.
 *   - Rebalance every year: back to the weights every year.
 *
 * "Worst year in the data": the mix's worst calendar year, rebalanced to
 * its weights at the start of each year, over the years every part has
 * data: an asset's own yearly returns, a savings part at today's rate.
 *
 * Individual stocks were removed on 9 October 2026: they need daily prices
 * under licence and a server (research/wealth-lens/mezclas-y-acciones.md).
 */

import { isSeriesAsset, type AssetId } from "./assets";
import { SERIES, SERIES_IDS, type SeriesId } from "./indexes";
import { mulberry32, survives } from "./monte-carlo";
import { percentile, type WealthPercentiles } from "./simulation";
import type { MixPart } from "./types";

export type { MixPart };

/** A mix's parts, the most it holds. */
export const MAX_PARTS = 10;
/** Simulated paths and their length. */
export const MIX_SIMULATIONS = 1000;
export const MIX_YEARS = 60;
const SEED = 20260929;

/** Whether the weights add up to 100 % (to a hundredth). */
export function sumsTo100<T extends { weight: number }>(parts: readonly T[]): boolean {
  return parts.length > 0 && Math.abs(parts.reduce((sum, part) => sum + part.weight, 0) - 100) < 0.005;
}

/**
 * The same parts with equal weights, in whole percent that add up to 100:
 * the first ones get the leftover (3 parts: 34, 33, 33).
 */
export function splitEvenly<T extends { weight: number }>(parts: readonly T[]): T[] {
  const base = Math.floor(100 / parts.length);
  const extra = 100 - base * parts.length;
  return parts.map((part, index) => ({ ...part, weight: base + (index < extra ? 1 : 0) }));
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export type TemplateId = "stocks-100" | "80-20" | "60-40";

export interface MixTemplate {
  /** Its name on the button comes from the dictionary: "100% stocks", "80/20", "60/40". */
  id: TemplateId;
  parts: readonly MixPart[];
}

/**
 * Quick starting points: US stocks alone, or with 20 % or 40 % in German
 * government bonds. Textbook mixes, not advice; every weight stays editable.
 */
export const TEMPLATES: readonly MixTemplate[] = [
  { id: "stocks-100", parts: [{ asset: "sp500", weight: 100 }] },
  {
    id: "80-20",
    parts: [
      { asset: "sp500", weight: 80 },
      { asset: "bonds", weight: 20 },
    ],
  },
  {
    id: "60-40",
    parts: [
      { asset: "sp500", weight: 60 },
      { asset: "bonds", weight: 40 },
    ],
  },
];

/** What tells a mix's parts apart: "asset:bonds". */
export function mixPartKey(part: Pick<MixPart, "asset">): string {
  return `asset:${part.asset}`;
}

/** A mix's parts as the model's inputs. */
export function mixInputs(parts: readonly MixPart[]): ModelInput[] {
  return parts.map((part) => ({ asset: part.asset, weight: part.weight }));
}

/** The template these parts are, if any. */
export function templateOf(parts: readonly MixPart[]): MixTemplate | null {
  const key = (list: readonly MixPart[]) =>
    [...list]
      .filter((part) => part.weight > 0)
      .map((part) => `${mixPartKey(part)}=${part.weight}`)
      .sort()
      .join(",");
  return TEMPLATES.find((template) => key(template.parts) === key(parts)) ?? null;
}

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------

interface AssetPart {
  kind: "asset";
  asset: AssetId;
  weight: number;
}

export type ModelPart = AssetPart;

/** What a model is built from: an asset and its weight. */
export interface ModelInput {
  asset: AssetId;
  weight: number;
}

export interface MixModel {
  parts: readonly ModelPart[];
  rebalance: boolean;
  /** Identifies the parts and what they earn (not the weights), for caching. */
  key: string;
  /** A savings part's growth after inflation. */
  savingsReturn: number;
  /** Weighted average of the parts' growth. */
  realReturn: number;
}

/** An asset part's growth after inflation. */
function assetReturn(asset: AssetId, savingsReturn: number): number {
  return isSeriesAsset(asset) ? SERIES[asset].averageReturn : savingsReturn;
}

/**
 * The model of a mix; parts with no weight are dropped and the rest
 * re-weighted. `savingsReturn` is what a savings part earns after inflation.
 */
export function mixModel(inputs: readonly ModelInput[], rebalance: boolean, { savingsReturn = 0 }: { savingsReturn?: number } = {}): MixModel | null {
  const resolved: ModelPart[] = inputs.filter((input) => input.weight > 0).map((input) => ({ kind: "asset", asset: input.asset, weight: input.weight }));
  const total = resolved.reduce((sum, part) => sum + part.weight, 0);
  if (resolved.length === 0 || total <= 0) return null;
  const normalized = resolved.map((part) => ({ ...part, weight: part.weight / total }));
  const hasSavings = normalized.some((part) => part.asset === "savings");
  return {
    parts: normalized,
    rebalance,
    key: [...normalized.map(partId), ...(hasSavings ? [`savings@${savingsReturn.toFixed(6)}`] : [])].join(","),
    savingsReturn,
    realReturn: normalized.reduce((sum, part) => sum + part.weight * assetReturn(part.asset, savingsReturn), 0),
  };
}

/** "bonds". */
function partId(part: ModelPart): string {
  return part.asset;
}

// ---------------------------------------------------------------------------
// Random draws, made once and reused
// ---------------------------------------------------------------------------

/** For each path and year: the historical year drawn. */
let drawnYears: Uint8Array | null = null;

/** Makes the random draws ahead of time, once per visit; called when the user opens the investment picker, so a first mix does not wait. */
export function prepareMixDraws(): void {
  drawYears();
}

function drawYears(): Uint8Array {
  if (!drawnYears) {
    const size = MIX_SIMULATIONS * MIX_YEARS;
    const random = mulberry32(SEED);
    const count = SERIES.sp500.years.length;
    drawnYears = new Uint8Array(size);
    for (let i = 0; i < size; i++) drawnYears[i] = Math.floor(random() * count);
  }
  return drawnYears;
}

const history = Object.fromEntries(SERIES_IDS.map((id) => [id, SERIES[id].years.map((entry) => entry.realReturn)])) as Record<SeriesId, number[]>;

/** Lower-triangular L with L Lᵀ = matrix; `null` if it is not positive definite. */
export function cholesky(matrix: readonly (readonly number[])[]): number[][] | null {
  const n = matrix.length;
  const lower = matrix.map(() => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = matrix[i][j];
      for (let k = 0; k < j; k++) sum -= lower[i][k] * lower[j][k];
      if (i === j) {
        if (sum <= 1e-10) return null;
        lower[i][i] = Math.sqrt(sum);
      } else {
        lower[i][j] = sum / lower[j][j];
      }
    }
  }
  return lower;
}

const returnsCache = new Map<string, Float64Array>();

/** Kept by what each part's returns depend on, so a changed part leaves the others' as they are. */
function cachedPart(id: string, make: () => Float64Array): Float64Array {
  let kept = returnsCache.get(id);
  if (!kept) {
    kept = make();
    // About 0.5 MB each: the three assets and a few savings rates.
    if (returnsCache.size >= 12) returnsCache.delete(returnsCache.keys().next().value as string);
    returnsCache.set(id, kept);
  }
  return kept;
}

/** Every part's return, per path and year (path × MIX_YEARS + year). */
export function partReturns(model: MixModel): Float64Array[] {
  const years = drawYears();
  const size = MIX_SIMULATIONS * MIX_YEARS;
  return model.parts.map((part) => {
    if (!isSeriesAsset(part.asset)) return cachedPart(`savings@${model.savingsReturn}`, () => new Float64Array(size).fill(model.savingsReturn));
    const series = history[part.asset];
    return cachedPart(part.asset, () => {
      const out = new Float64Array(size);
      for (let i = 0; i < size; i++) out[i] = series[years[i]];
      return out;
    });
  });
}

// ---------------------------------------------------------------------------
// What a mix does
// ---------------------------------------------------------------------------

let columns: Float64Array[] | null = null;

/**
 * The balance columns the simulations fill, one a year: made once and
 * reused, so a recalculation does not leave ~0.2 MB behind for the garbage
 * collector each time (its pauses showed as slow recalculations). Nothing
 * keeps them after a call returns.
 */
function balanceColumns(span: number): Float64Array[] {
  columns ??= Array.from({ length: MIX_YEARS + 1 }, () => new Float64Array(MIX_SIMULATIONS));
  return columns.slice(0, span + 1);
}

/**
 * 10th, 50th and 90th percentile of the balance at each year, like
 * lib/simulation.ts's for a single history: half of each year's
 * contributions added at the start of the year and half at the end.
 */
export function mixPercentiles(
  model: MixModel,
  { start, monthly, years }: { start: number; monthly: number; years: number },
  /** Every year's growth factor times this ("What if: grows 1% more"). */
  growth = 1,
): WealthPercentiles {
  const returns = partReturns(model);
  const span = Math.min(years, MIX_YEARS);
  const totals = balanceColumns(span);
  const weights = Float64Array.from(model.parts, (part) => part.weight);
  // Each way of holding the weights has its own loop, so each stays fast whichever ran last.
  if (model.rebalance) balancesRebalanced(returns, weights, start, monthly, totals, growth);
  else balancesDrifting(returns, weights, start, monthly, totals, growth);
  const result: WealthPercentiles = { p10: [], p50: [], p90: [] };
  for (const column of totals) {
    column.sort();
    result.p10.push(percentile(column, 0.1));
    result.p50.push(percentile(column, 0.5));
    result.p90.push(percentile(column, 0.9));
  }
  return result;
}

/** A few whole simulated paths of a mix, evenly spread over its simulations, for the view of the possible futures. */
export function mixSamples(
  model: MixModel,
  { start, monthly, years }: { start: number; monthly: number; years: number },
  count: number,
  growth = 1,
): number[][] {
  const returns = partReturns(model);
  const span = Math.min(years, MIX_YEARS);
  const totals = balanceColumns(span);
  const weights = Float64Array.from(model.parts, (part) => part.weight);
  if (model.rebalance) balancesRebalanced(returns, weights, start, monthly, totals, growth);
  else balancesDrifting(returns, weights, start, monthly, totals, growth);
  const step = MIX_SIMULATIONS / count;
  return Array.from({ length: count }, (_, index) => totals.map((column) => column[Math.floor(index * step)]));
}

function balancesRebalanced(returns: readonly Float64Array[], weights: Float64Array, start: number, monthly: number, totals: Float64Array[], growth: number): void {
  const span = totals.length - 1;
  for (let s = 0; s < MIX_SIMULATIONS; s++) {
    const offset = s * MIX_YEARS;
    let balance = start;
    totals[0][s] = balance;
    for (let y = 1; y <= span; y++) {
      let r = 0;
      for (let j = 0; j < weights.length; j++) r += weights[j] * returns[j][offset + y - 1];
      balance = (balance + 6 * monthly) * (1 + r) * growth + 6 * monthly;
      totals[y][s] = balance;
    }
  }
}

function balancesDrifting(returns: readonly Float64Array[], weights: Float64Array, start: number, monthly: number, totals: Float64Array[], growth: number): void {
  const span = totals.length - 1;
  const balances = new Float64Array(weights.length);
  for (let s = 0; s < MIX_SIMULATIONS; s++) {
    const offset = s * MIX_YEARS;
    for (let j = 0; j < weights.length; j++) balances[j] = weights[j] * start;
    totals[0][s] = start;
    for (let y = 1; y <= span; y++) {
      let total = 0;
      for (let j = 0; j < weights.length; j++) {
        const added = 6 * monthly * weights[j];
        balances[j] = (balances[j] + added) * (1 + returns[j][offset + y - 1]) * growth + added;
        total += balances[j];
      }
      totals[y][s] = total;
    }
  }
}

/** How often each withdrawal rate lasted 30 years (withdrawals taken from the parts in proportion). */
export function mixSuccessRates(model: MixModel, rates: readonly number[], years = 30, growth = 1): number[] {
  const returns = partReturns(model);
  const weights = Float64Array.from(model.parts, (part) => part.weight);
  const counts = model.rebalance
    ? lastedRebalanced(returns, weights, Float64Array.from(rates), years, growth)
    : lastedDrifting(returns, weights, Float64Array.from(rates), years, growth);
  return Array.from(counts, (count) => count / MIX_SIMULATIONS);
}

/** Back at the weights every year: one return a year, the rates played over it. */
function lastedRebalanced(returns: readonly Float64Array[], weights: Float64Array, rates: Float64Array, years: number, growth: number): Float64Array {
  const successes = new Float64Array(rates.length);
  const sequence = new Array<number>(years);
  for (let s = 0; s < MIX_SIMULATIONS; s++) {
    const offset = s * MIX_YEARS;
    for (let y = 0; y < years; y++) {
      let r = 0;
      for (let j = 0; j < weights.length; j++) r += weights[j] * returns[j][offset + y];
      sequence[y] = (1 + r) * growth - 1;
    }
    for (let index = 0; index < rates.length; index++) if (survives(sequence, rates[index])) successes[index] += 1;
  }
  return successes;
}

/** Weights drifting: each part earns its own return, withdrawals taken from the parts in proportion. */
function lastedDrifting(returns: readonly Float64Array[], weights: Float64Array, rates: Float64Array, years: number, growth: number): Float64Array {
  const parts = weights.length;
  const successes = new Float64Array(rates.length);
  const balances = new Float64Array(parts);
  // One path's returns, read once from the big arrays and replayed for every rate.
  const path = new Float64Array(parts * years);
  for (let s = 0; s < MIX_SIMULATIONS; s++) {
    const offset = s * MIX_YEARS;
    for (let j = 0; j < parts; j++) {
      const source = returns[j];
      for (let y = 0; y < years; y++) path[j * years + y] = source[offset + y];
    }
    for (let index = 0; index < rates.length; index++) {
      const rate = rates[index];
      for (let j = 0; j < parts; j++) balances[j] = weights[j];
      let lasted = 1;
      for (let y = 0; y < years; y++) {
        let total = 0;
        for (let j = 0; j < parts; j++) total += balances[j];
        if (total <= rate) {
          lasted = 0;
          break;
        }
        const keep = 1 - rate / total;
        for (let j = 0; j < parts; j++) balances[j] *= keep * (1 + path[j * years + y]) * growth;
      }
      successes[index] += lasted;
    }
  }
  return successes;
}

const volatilityCache = new Map<string, number>();

/**
 * The mix's swings, as shown beside its growth: the standard deviation of
 * its yearly log returns, back at its weights each year, over the common
 * period's years.
 */
export function mixVolatility(model: MixModel): number {
  const id = `${model.key}|${model.parts.map((part) => part.weight.toFixed(6)).join(",")}`;
  const kept = volatilityCache.get(id);
  if (kept !== undefined) return kept;
  // Running sums of the log returns: no arrays of rows.
  let count = 0;
  let sum = 0;
  let squares = 0;
  const add = (r: number) => {
    const value = Math.log1p(r);
    count += 1;
    sum += value;
    squares += value * value;
  };
  const weights = model.parts.map((part) => part.weight);
  const series = model.parts.map((part) => (isSeriesAsset(part.asset) ? history[part.asset] : null));
  for (let t = 0; t < SERIES.sp500.years.length; t++) {
    let r = 0;
    for (let j = 0; j < weights.length; j++) r += weights[j] * (series[j]?.[t] ?? model.savingsReturn);
    add(r);
  }
  const mean = sum / count;
  const deviation = Math.sqrt(Math.max(0, (squares - count * mean * mean) / (count - 1)));
  // Rounding leaves a constant series (all savings) a hair above zero: no swings is zero.
  const value = deviation < 1e-7 ? 0 : deviation;
  if (volatilityCache.size >= 64) volatilityCache.clear();
  volatilityCache.set(id, value);
  return value;
}

/** Yearly after-inflation returns of a part, by calendar year, from the data (not simulated); `null` for savings, the same every year. */
function yearlyReturns(part: ModelPart): Map<number, number> | null {
  return isSeriesAsset(part.asset) ? new Map(SERIES[part.asset].dataset.years.map((entry) => [entry.year, entry.realReturn])) : null;
}

export interface WorstYear {
  year: number;
  /** After inflation, e.g. −0.31. */
  change: number;
  /** The years looked at. */
  from: number;
  to: number;
}

/** Years every part with data has data for; `[]` when only savings. */
function commonYears(series: readonly (Map<number, number> | null)[]): number[] {
  const withData = series.filter((entry): entry is Map<number, number> => entry !== null);
  if (withData.length === 0) return [];
  return [...withData[0].keys()].filter((year) => withData.every((entry) => entry.has(year))).sort((a, b) => a - b);
}

/**
 * The worst calendar year of a mix (rebalanced to its weights at the start
 * of each year) over the years every part has data; `null` if they share
 * none. `years` restricts it to those years, to compare two mixes alike.
 */
export function worstYear(model: MixModel, years?: readonly number[]): WorstYear | null {
  const series = model.parts.map((part) => yearlyReturns(part));
  const shared = commonYears(series).filter((year) => !years || years.includes(year));
  if (shared.length === 0) return null;
  let worst: { year: number; change: number } | null = null;
  for (const year of shared) {
    const change = model.parts.reduce((sum, part, index) => sum + part.weight * (series[index]?.get(year) ?? model.savingsReturn), 0);
    if (!worst || change < worst.change) worst = { year, change };
  }
  return worst ? { ...worst, from: shared[0], to: shared[shared.length - 1] } : null;
}

/** Years a mix's worst year is looked for in. */
export function sharedYears(model: MixModel): number[] {
  return commonYears(model.parts.map((part) => yearlyReturns(part)));
}
