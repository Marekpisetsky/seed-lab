/**
 * A mix: several assets with weights the user sets, from the ones a plan
 * can be projected with (lib/assets.ts). My portfolio is simulated the
 * same way, its stocks included (lib/portfolio.ts). The app never suggests
 * weights; the quick templates (100% stocks, 80/20, 60/40) are the
 * textbook starting points, not advice.
 *
 * Growth (the projection and "In N years you'll have")
 *   The weighted average of each part's growth: an asset's average over
 *   the common period, a savings part's rate less inflation. In My
 *   portfolio a stock grows at the average of the index it is assigned to;
 *   its own past is never projected.
 *
 * Ups and downs (the band, "Range (8 in 10)", the withdrawal success rate)
 *   1,000 simulated paths of 60 years, one draw per year:
 *   - one historical year (1988–2022) is drawn for every asset at once,
 *     so stocks, bonds and gold move together as they did, crashes and
 *     2022's fall of stocks and bonds together included;
 *   - an asset part earns that year's return; a savings part its rate;
 *   - a stock (only in My portfolio), in log terms: its index's average,
 *     plus β × how far its index was from average that year, plus a part
 *     of its own. β = ρ × σ_stock / σ_index, the own part has a spread of
 *     σ_stock × √(1 − ρ²), where σ_stock is the stock's volatility from its
 *     daily closes and ρ how its weekly returns correlate with its index's
 *     ETF. With too little data: twice the index's volatility, and the
 *     typical ρ of the stocks that have data;
 *   - the stocks' own parts are correlated so that, together with their
 *     indexes, two stocks move together as much as their weekly returns
 *     did.
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
 * data: an asset's own yearly returns, a stock's price change deflated by
 * US inflation, a savings part at today's rate.
 */

import { assetName, isSeriesAsset, type AssetId } from "./assets";
import { isIndexId, SERIES, SERIES_IDS, US_INFLATION, type IndexId, type SeriesId } from "./indexes";
import { INSTRUMENTS, MARKET, type Instrument, type PricesFile } from "./market-data";
import { mulberry32, survives } from "./monte-carlo";
import { percentile, type WealthPercentiles } from "./simulation";
import type { MixPart } from "./types";
import { indexVolatility, logStats, stockVolatility } from "./volatility";

export type { MixPart };

/** A mix's parts, the most it holds. */
export const MAX_PARTS = 10;
/** Simulated paths and their length. */
export const MIX_SIMULATIONS = 1000;
export const MIX_YEARS = 60;
const SEED = 20260929;
/** Correlation of a stock with its index when neither it nor any stock has the data. */
const DEFAULT_INDEX_CORRELATION = 0.6;

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

export interface MixTemplate {
  label: string;
  parts: readonly MixPart[];
}

/**
 * Quick starting points: world stocks alone, or with 20 % or 40 % in euro
 * government bonds. Textbook mixes, not advice; every weight stays editable.
 */
export const TEMPLATES: readonly MixTemplate[] = [
  { label: "100% stocks", parts: [{ asset: "world", weight: 100 }] },
  {
    label: "80/20",
    parts: [
      { asset: "world", weight: 80 },
      { asset: "bonds", weight: 20 },
    ],
  },
  {
    label: "60/40",
    parts: [
      { asset: "world", weight: 60 },
      { asset: "bonds", weight: 40 },
    ],
  },
];

/** The template these parts are, if any. */
export function templateOf(parts: readonly MixPart[]): MixTemplate | null {
  const key = (list: readonly MixPart[]) =>
    [...list]
      .filter((part) => part.weight > 0)
      .map((part) => `${part.asset}=${part.weight}`)
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

interface StockPart {
  kind: "stock";
  /** The index it grows like. */
  asset: IndexId;
  weight: number;
  instrument: Instrument;
  /** Yearly volatility and correlation with its index's ETF. */
  volatility: number;
  correlation: number;
  /** True when either figure is a fallback. */
  fallback: boolean;
}

export type ModelPart = AssetPart | StockPart;

/** What a model is built from: an asset and its weight; a curated stock with the index it grows like. */
export interface ModelInput {
  asset: AssetId;
  weight: number;
  stock?: Instrument;
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

function correlationOf(market: PricesFile, a: string, b: string): number | null {
  const table = market.correlations;
  if (!table) return null;
  const i = table.ids.indexOf(a);
  const j = table.ids.indexOf(b);
  return i < 0 || j < 0 ? null : table.matrix[i][j];
}

/** The ETF on the list that tracks an index (VUAA, VWCE, EQQQ). */
function etfFor(index: IndexId): Instrument | undefined {
  return INSTRUMENTS.find((instrument) => instrument.kind === "etf" && instrument.index === index);
}

/** How a stock's weekly returns follow an index's ETF (its own by default); `null` without three years of shared data. */
export function indexCorrelation(instrument: Instrument, market: PricesFile = MARKET, index: IndexId = instrument.index): number | null {
  const etf = etfFor(index);
  return etf ? correlationOf(market, instrument.id, etf.id) : null;
}

/** The typical correlation of a stock with its index, among the stocks that have the data. */
export function typicalIndexCorrelation(market: PricesFile = MARKET): number {
  const values = INSTRUMENTS.filter((instrument) => instrument.kind === "stock")
    .map((instrument) => indexCorrelation(instrument, market))
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);
  return values.length > 0 ? percentile(values, 0.5) : DEFAULT_INDEX_CORRELATION;
}

/** An asset part's growth after inflation. */
function assetReturn(asset: AssetId, savingsReturn: number): number {
  return isSeriesAsset(asset) ? SERIES[asset].averageReturn : savingsReturn;
}

/**
 * The model of a mix; parts with no weight are dropped and the rest
 * re-weighted. `savingsReturn` is what a savings part earns after inflation.
 */
export function mixModel(
  inputs: readonly ModelInput[],
  rebalance: boolean,
  { savingsReturn = 0, market = MARKET }: { savingsReturn?: number; market?: PricesFile } = {},
): MixModel | null {
  const typical = typicalIndexCorrelation(market);
  const resolved: ModelPart[] = [];
  for (const input of inputs) {
    if (!(input.weight > 0)) continue;
    const { stock, asset } = input;
    if (stock && isIndexId(asset)) {
      const own = stockVolatility(stock, market, asset);
      const measured = indexCorrelation(stock, market, asset);
      resolved.push({
        kind: "stock",
        asset,
        weight: input.weight,
        instrument: stock,
        volatility: own.volatility,
        correlation: Math.min(0.99, Math.max(0, measured ?? typical)),
        fallback: own.fallback || measured === null,
      });
    } else {
      resolved.push({ kind: "asset", asset, weight: input.weight });
    }
  }
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

/** "bonds", or "stock:NVDA@nasdaq100". */
function partId(part: ModelPart): string {
  return part.kind === "stock" ? `stock:${part.instrument.id}@${part.asset}` : part.asset;
}

/** "Euro government bonds", "NVIDIA". */
export function partName(part: ModelPart): string {
  return part.kind === "stock" ? part.instrument.name : assetName(part.asset);
}

// ---------------------------------------------------------------------------
// Random draws, made once and reused
// ---------------------------------------------------------------------------

/** For each path and year: the historical year drawn, and one independent standard normal per slot. */
interface Draws {
  years: Uint8Array;
  normals: Float64Array[];
}

let draws: Draws | null = null;

/**
 * Makes the random draws ahead of time (about 35 ms once per visit), for
 * a few stocks; called when the user opens the investment picker, so a
 * first mix does not wait for them.
 */
export function prepareMixDraws(stocks = 3): void {
  drawsWith(stocks);
}

function drawsWith(slots: number): Draws {
  const size = MIX_SIMULATIONS * MIX_YEARS;
  if (!draws) {
    const random = mulberry32(SEED);
    const count = SERIES.sp500.years.length;
    const years = new Uint8Array(size);
    for (let i = 0; i < size; i++) years[i] = Math.floor(random() * count);
    draws = { years, normals: [] };
  }
  while (draws.normals.length < slots) {
    // Box–Muller, seeded per slot so each slot's numbers never change.
    const random = mulberry32(SEED + 1 + draws.normals.length);
    const normals = new Float64Array(size);
    for (let i = 0; i < size; i += 2) {
      const radius = Math.sqrt(-2 * Math.log(1 - random()));
      const angle = 2 * Math.PI * random();
      normals[i] = radius * Math.cos(angle);
      if (i + 1 < size) normals[i + 1] = radius * Math.sin(angle);
    }
    draws.normals.push(normals);
  }
  return draws;
}

const history = Object.fromEntries(SERIES_IDS.map((id) => [id, SERIES[id].years.map((entry) => entry.realReturn)])) as Record<SeriesId, number[]>;

let seriesCorrelations: Record<SeriesId, Record<SeriesId, number>> | null = null;

/** Correlation of the assets' yearly log returns over the years drawn from. */
function seriesCorrelationMatrix(): Record<SeriesId, Record<SeriesId, number>> {
  if (seriesCorrelations) return seriesCorrelations;
  const logs = Object.fromEntries(SERIES_IDS.map((id) => [id, history[id].map((value) => Math.log1p(value))])) as Record<SeriesId, number[]>;
  const stats = Object.fromEntries(SERIES_IDS.map((id) => [id, logStats(history[id])])) as Record<SeriesId, { mean: number; deviation: number }>;
  const result = {} as Record<SeriesId, Record<SeriesId, number>>;
  for (const a of SERIES_IDS) {
    result[a] = {} as Record<SeriesId, number>;
    for (const b of SERIES_IDS) {
      let sum = 0;
      for (let t = 0; t < logs[a].length; t++) sum += (logs[a][t] - stats[a].mean) * (logs[b][t] - stats[b].mean);
      result[a][b] = sum / (logs[a].length - 1) / (stats[a].deviation * stats[b].deviation);
    }
  }
  seriesCorrelations = result;
  return result;
}

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

/**
 * How the stocks' own parts go together: what their weekly correlation
 * leaves once their indexes are accounted for. Shrunk towards 0 until it
 * is a valid correlation matrix.
 */
function residualFactor(stocks: readonly StockPart[], market: PricesFile): number[][] {
  const correlations = seriesCorrelationMatrix();
  const n = stocks.length;
  const matrix = stocks.map((a, i) =>
    stocks.map((b, j) => {
      if (i === j) return 1;
      const measured = correlationOf(market, a.instrument.id, b.instrument.id);
      if (measured === null) return 0;
      const shared = a.correlation * b.correlation * correlations[a.asset][b.asset];
      const own = Math.sqrt((1 - a.correlation ** 2) * (1 - b.correlation ** 2));
      return Math.max(-0.9, Math.min(0.9, (measured - shared) / own));
    }),
  );
  for (let shrink = 1; shrink > 0.01; shrink *= 0.9) {
    const lower = cholesky(matrix.map((row, i) => row.map((value, j) => (i === j ? 1 : value * shrink))));
    if (lower) return lower;
  }
  return matrix.map((row, i) => row.map((_, j) => (i === j ? 1 : 0))).slice(0, n);
}

const returnsCache = new Map<string, Float64Array>();

/** Kept by what each part's returns depend on, so a changed part leaves the others' as they are. */
function cachedPart(id: string, market: PricesFile, make: () => Float64Array): Float64Array {
  if (market !== MARKET) return make();
  let kept = returnsCache.get(id);
  if (!kept) {
    kept = make();
    // About 0.5 MB each: the five assets, a savings rate and a few stocks.
    if (returnsCache.size >= 12) returnsCache.delete(returnsCache.keys().next().value as string);
    returnsCache.set(id, kept);
  }
  return kept;
}

/** Every part's return, per path and year (path × MIX_YEARS + year). */
export function partReturns(model: MixModel, market: PricesFile = MARKET): Float64Array[] {
  const stocks = model.parts.filter((part): part is StockPart => part.kind === "stock");
  const { years, normals } = drawsWith(stocks.length);
  // A stock's own part depends on the other stocks (they are correlated), an asset's on nothing else.
  const stockSet = stocks.map(partId).join(",");
  let lower: number[][] | null = null;
  const size = MIX_SIMULATIONS * MIX_YEARS;
  return model.parts.map((part) => {
    if (part.kind === "asset") {
      if (!isSeriesAsset(part.asset)) return cachedPart(`savings@${model.savingsReturn}`, market, () => new Float64Array(size).fill(model.savingsReturn));
      const series = history[part.asset];
      return cachedPart(part.asset, market, () => {
        const out = new Float64Array(size);
        for (let i = 0; i < size; i++) out[i] = series[years[i]];
        return out;
      });
    }
    return cachedPart(`${partId(part)}|${stockSet}`, market, () => stockReturns(part, stocks, (lower ??= residualFactor(stocks, market)), years, normals));
  });
}

/** A stock part's returns: its index's move times β, plus its own part, correlated with the other stocks'. */
function stockReturns(part: StockPart, stocks: readonly StockPart[], lower: number[][], years: Uint8Array, normals: Float64Array[]): Float64Array {
  const size = MIX_SIMULATIONS * MIX_YEARS;
  const out = new Float64Array(size);
  const series = history[part.asset];
  const position = stocks.indexOf(part);
  const { mean, deviation } = logStats(series);
  const beta = (part.correlation * part.volatility) / deviation;
  const own = part.volatility * Math.sqrt(1 - part.correlation ** 2);
  // The index's part of each historical year, in log terms, worked out once.
  const shared = series.map((value) => mean + beta * (Math.log1p(value) - mean));
  const row = lower[position];
  for (let i = 0; i < size; i++) {
    let shock = 0;
    for (let k = 0; k <= position; k++) shock += row[k] * normals[k][i];
    out[i] = Math.expm1(shared[years[i]] + own * shock);
  }
  return out;
}

// ---------------------------------------------------------------------------
// What a mix does
// ---------------------------------------------------------------------------

/**
 * 10th, 50th and 90th percentile of the balance at each year, like
 * lib/simulation.ts's for a single history: half of each year's
 * contributions added at the start of the year and half at the end.
 */
export function mixPercentiles(
  model: MixModel,
  { start, monthly, years }: { start: number; monthly: number; years: number },
  market: PricesFile = MARKET,
): WealthPercentiles {
  const returns = partReturns(model, market);
  const span = Math.min(years, MIX_YEARS);
  const totals = Array.from({ length: span + 1 }, () => new Float64Array(MIX_SIMULATIONS));
  const weights = Float64Array.from(model.parts, (part) => part.weight);
  // Each way of holding the weights has its own loop, so each stays fast whichever ran last.
  if (model.rebalance) balancesRebalanced(returns, weights, start, monthly, totals);
  else balancesDrifting(returns, weights, start, monthly, totals);
  const result: WealthPercentiles = { p10: [], p50: [], p90: [] };
  for (const column of totals) {
    column.sort();
    result.p10.push(percentile(column, 0.1));
    result.p50.push(percentile(column, 0.5));
    result.p90.push(percentile(column, 0.9));
  }
  return result;
}

function balancesRebalanced(returns: readonly Float64Array[], weights: Float64Array, start: number, monthly: number, totals: Float64Array[]): void {
  const span = totals.length - 1;
  for (let s = 0; s < MIX_SIMULATIONS; s++) {
    const offset = s * MIX_YEARS;
    let balance = start;
    totals[0][s] = balance;
    for (let y = 1; y <= span; y++) {
      let r = 0;
      for (let j = 0; j < weights.length; j++) r += weights[j] * returns[j][offset + y - 1];
      balance = (balance + 6 * monthly) * (1 + r) + 6 * monthly;
      totals[y][s] = balance;
    }
  }
}

function balancesDrifting(returns: readonly Float64Array[], weights: Float64Array, start: number, monthly: number, totals: Float64Array[]): void {
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
        balances[j] = (balances[j] + added) * (1 + returns[j][offset + y - 1]) + added;
        total += balances[j];
      }
      totals[y][s] = total;
    }
  }
}

/** How often each withdrawal rate lasted 30 years (withdrawals taken from the parts in proportion). */
export function mixSuccessRates(model: MixModel, rates: readonly number[], market: PricesFile = MARKET, years = 30): number[] {
  const returns = partReturns(model, market);
  const weights = Float64Array.from(model.parts, (part) => part.weight);
  const counts = model.rebalance ? lastedRebalanced(returns, weights, Float64Array.from(rates), years) : lastedDrifting(returns, weights, Float64Array.from(rates), years);
  return Array.from(counts, (count) => count / MIX_SIMULATIONS);
}

/** Back at the weights every year: one return a year, the rates played over it. */
function lastedRebalanced(returns: readonly Float64Array[], weights: Float64Array, rates: Float64Array, years: number): Float64Array {
  const successes = new Float64Array(rates.length);
  const sequence = new Array<number>(years);
  for (let s = 0; s < MIX_SIMULATIONS; s++) {
    const offset = s * MIX_YEARS;
    for (let y = 0; y < years; y++) {
      let r = 0;
      for (let j = 0; j < weights.length; j++) r += weights[j] * returns[j][offset + y];
      sequence[y] = r;
    }
    for (let index = 0; index < rates.length; index++) if (survives(sequence, rates[index])) successes[index] += 1;
  }
  return successes;
}

/** Weights drifting: each part earns its own return, withdrawals taken from the parts in proportion. */
function lastedDrifting(returns: readonly Float64Array[], weights: Float64Array, rates: Float64Array, years: number): Float64Array {
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
        for (let j = 0; j < parts; j++) balances[j] *= keep * (1 + path[j * years + y]);
      }
      successes[index] += lasted;
    }
  }
  return successes;
}

const volatilityCache = new Map<string, number>();

/**
 * The mix's swings, as shown beside its growth: the standard deviation of
 * its yearly log returns, back at its weights each year. Over the common
 * period's years for assets; over the simulated years once a stock is in.
 */
export function mixVolatility(model: MixModel, market: PricesFile = MARKET): number {
  const id = `${model.key}|${model.parts.map((part) => part.weight.toFixed(6)).join(",")}`;
  const kept = market === MARKET ? volatilityCache.get(id) : undefined;
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
  if (model.parts.every((part) => part.kind === "asset")) {
    const series = model.parts.map((part) => (isSeriesAsset(part.asset) ? history[part.asset] : null));
    for (let t = 0; t < SERIES.sp500.years.length; t++) {
      let r = 0;
      for (let j = 0; j < weights.length; j++) r += weights[j] * (series[j]?.[t] ?? model.savingsReturn);
      add(r);
    }
  } else {
    // A fifth of the simulated years is plenty for one figure to show.
    const returns = partReturns(model, market);
    for (let i = 0; i < (MIX_SIMULATIONS / 5) * MIX_YEARS; i++) {
      let r = 0;
      for (let j = 0; j < weights.length; j++) r += weights[j] * returns[j][i];
      add(r);
    }
  }
  const mean = sum / count;
  const deviation = Math.sqrt(Math.max(0, (squares - count * mean * mean) / (count - 1)));
  // Rounding leaves a constant series (all savings) a hair above zero: no swings is zero.
  const value = deviation < 1e-7 ? 0 : deviation;
  if (market === MARKET) {
    if (volatilityCache.size >= 64) volatilityCache.clear();
    volatilityCache.set(id, value);
  }
  return value;
}

/** Yearly after-inflation returns of a part, by calendar year, from the data (not simulated); `null` for savings, the same every year. */
function yearlyReturns(part: ModelPart, market: PricesFile): Map<number, number> | null {
  if (part.kind === "asset") {
    return isSeriesAsset(part.asset) ? new Map(SERIES[part.asset].dataset.years.map((entry) => [entry.year, entry.realReturn])) : null;
  }
  const years = market.prices[part.instrument.id]?.stats?.years ?? {};
  const result = new Map<number, number>();
  for (const [year, change] of Object.entries(years)) {
    const inflation = US_INFLATION.get(Number(year));
    if (inflation !== undefined) result.set(Number(year), (1 + change) / (1 + inflation) - 1);
  }
  return result;
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
export function worstYear(model: MixModel, market: PricesFile = MARKET, years?: readonly number[]): WorstYear | null {
  const series = model.parts.map((part) => yearlyReturns(part, market));
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
export function sharedYears(model: MixModel, market: PricesFile = MARKET): number[] {
  return commonYears(model.parts.map((part) => yearlyReturns(part, market)));
}

/** Whether any figure behind a mix is a fallback (a stock with too little data). */
export function usesFallback(model: MixModel): boolean {
  return model.parts.some((part) => part.kind === "stock" && part.fallback);
}

/** Exposed for the model's explanation: each stock part's β and own spread. */
export function stockTerms(model: MixModel): { name: string; beta: number; own: number; correlation: number; volatility: number }[] {
  return model.parts
    .filter((part): part is StockPart => part.kind === "stock")
    .map((part) => ({
      name: part.instrument.name,
      correlation: part.correlation,
      volatility: part.volatility,
      beta: (part.correlation * part.volatility) / indexVolatility(part.asset),
      own: part.volatility * Math.sqrt(1 - part.correlation ** 2),
    }));
}
