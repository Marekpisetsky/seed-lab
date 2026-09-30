/**
 * A mix: several indexes and stocks with weights the user sets. The app
 * never suggests weights; it shows what a mix does.
 *
 * Growth (the projection and "In N years you'll have")
 *   The weighted average of the growth of the index behind each part: an
 *   index's own average, a stock's reference index's. A stock's own past
 *   is never projected (lib/volatility.ts).
 *
 * Ups and downs (the band, "Range (8 in 10)", the withdrawal success rate)
 *   1,000 simulated paths of 60 years, one draw per year:
 *   - one historical year (1988–2022) is drawn for all three indexes at
 *     once, so they move together as they did, crashes included;
 *   - an index part earns that year's return;
 *   - a stock part, in log terms: its index's average, plus β × how far
 *     its index was from average that year, plus a part of its own.
 *     β = ρ × σ_stock / σ_index, the own part has a spread of
 *     σ_stock × √(1 − ρ²), where σ_stock is the stock's volatility from
 *     its daily closes and ρ how its weekly returns correlate with its
 *     index's ETF. The stock then swings as much as it does and follows its
 *     index as much as it has. With too little data: twice the index's
 *     volatility, and the typical ρ of the stocks that have data.
 *   - the stocks' own parts are correlated so that, together with their
 *     indexes, two stocks move together as much as their weekly returns
 *     did (they otherwise share only what their indexes share).
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
 * data: an index's own yearly returns, a stock's price change deflated by
 * US inflation.
 */

import { INDEXES, INDEX_IDS, US_INFLATION, type IndexId } from "./indexes";
import { instrumentById, INSTRUMENTS, MARKET, type Instrument, type PricesFile } from "./market-data";
import { mulberry32, survives } from "./monte-carlo";
import { percentile, type WealthPercentiles } from "./simulation";
import type { MixPart } from "./types";
import { indexVolatility, logStats, stockVolatility } from "./volatility";

/** "index:sp500" or "stock:NVDA". */
export type PartRef = string;

export type { MixPart };

/** A mix's parts, the most it holds. */
export const MAX_PARTS = 10;
/** Simulated paths and their length. */
export const MIX_SIMULATIONS = 1000;
export const MIX_YEARS = 60;
const SEED = 20260929;
/** Correlation of a stock with its index when neither it nor any stock has the data. */
const DEFAULT_INDEX_CORRELATION = 0.6;

export function indexRef(index: IndexId): PartRef {
  return `index:${index}`;
}

export function stockRef(id: string): PartRef {
  return `stock:${id}`;
}

/** What a reference points at, or `null` when it points at nothing on the list. */
export function resolveRef(ref: PartRef): { kind: "index"; index: IndexId } | { kind: "stock"; instrument: Instrument } | null {
  const [kind, id] = ref.split(":");
  if (kind === "index") {
    const index = INDEX_IDS.find((entry) => entry === id);
    return index ? { kind: "index", index } : null;
  }
  const instrument = kind === "stock" && id ? instrumentById(id) : undefined;
  return instrument && instrument.kind === "stock" ? { kind: "stock", instrument } : null;
}

export function refName(ref: PartRef): string {
  const resolved = resolveRef(ref);
  if (!resolved) return ref;
  return resolved.kind === "index" ? INDEXES[resolved.index].name : resolved.instrument.name;
}

/** Whether the weights add up to 100 % (to a hundredth). */
export function sumsTo100(parts: readonly MixPart[]): boolean {
  return parts.length > 0 && Math.abs(parts.reduce((sum, part) => sum + part.weight, 0) - 100) < 0.005;
}

/**
 * The same parts with equal weights, in whole percent that add up to 100:
 * the first ones get the leftover (3 parts: 34, 33, 33).
 */
export function splitEvenly(parts: readonly MixPart[]): MixPart[] {
  const base = Math.floor(100 / parts.length);
  const extra = 100 - base * parts.length;
  return parts.map((part, index) => ({ ...part, weight: base + (index < extra ? 1 : 0) }));
}

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------

interface IndexPart {
  kind: "index";
  ref: PartRef;
  index: IndexId;
  weight: number;
}

interface StockPart {
  kind: "stock";
  ref: PartRef;
  index: IndexId;
  weight: number;
  instrument: Instrument;
  /** Yearly volatility and correlation with its index's ETF. */
  volatility: number;
  correlation: number;
  /** True when either figure is a fallback. */
  fallback: boolean;
}

type Part = IndexPart | StockPart;

export interface MixModel {
  parts: readonly Part[];
  rebalance: boolean;
  /** Identifies the parts (not the weights), for caching. */
  key: string;
  /** Weighted average of the growth of the indexes behind the parts. */
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

/** How a stock's weekly returns follow its index's ETF; `null` without three years of shared data. */
export function indexCorrelation(instrument: Instrument, market: PricesFile = MARKET): number | null {
  const etf = etfFor(instrument.index);
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

/** The model of a mix; parts pointing at nothing are dropped and the rest re-weighted. */
export function mixModel(parts: readonly MixPart[], rebalance: boolean, market: PricesFile = MARKET): MixModel | null {
  const typical = typicalIndexCorrelation(market);
  const resolved: Part[] = [];
  for (const part of parts) {
    const target = resolveRef(part.ref);
    if (!target || !(part.weight > 0)) continue;
    if (target.kind === "index") {
      resolved.push({ kind: "index", ref: part.ref, index: target.index, weight: part.weight });
    } else {
      const own = stockVolatility(target.instrument, market);
      const measured = indexCorrelation(target.instrument, market);
      resolved.push({
        kind: "stock",
        ref: part.ref,
        index: target.instrument.index,
        weight: part.weight,
        instrument: target.instrument,
        volatility: own.volatility,
        correlation: Math.min(0.99, Math.max(0, measured ?? typical)),
        fallback: own.fallback || measured === null,
      });
    }
  }
  const total = resolved.reduce((sum, part) => sum + part.weight, 0);
  if (resolved.length === 0 || total <= 0) return null;
  const normalized = resolved.map((part) => ({ ...part, weight: part.weight / total }));
  return {
    parts: normalized,
    rebalance,
    key: normalized.map((part) => part.ref).join(","),
    realReturn: normalized.reduce((sum, part) => sum + part.weight * INDEXES[part.index].averageReturn, 0),
  };
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
    const count = INDEXES.sp500.years.length;
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

/** Correlation of the indexes' yearly log returns over the years drawn from. */
function indexCorrelationMatrix(): Record<IndexId, Record<IndexId, number>> {
  const logs = Object.fromEntries(INDEX_IDS.map((id) => [id, INDEXES[id].years.map((entry) => Math.log1p(entry.realReturn))])) as Record<
    IndexId,
    number[]
  >;
  const stats = Object.fromEntries(INDEX_IDS.map((id) => [id, logStats(INDEXES[id].years.map((entry) => entry.realReturn))])) as Record<
    IndexId,
    { mean: number; deviation: number }
  >;
  const result = {} as Record<IndexId, Record<IndexId, number>>;
  for (const a of INDEX_IDS) {
    result[a] = {} as Record<IndexId, number>;
    for (const b of INDEX_IDS) {
      let sum = 0;
      for (let t = 0; t < logs[a].length; t++) sum += (logs[a][t] - stats[a].mean) * (logs[b][t] - stats[b].mean);
      result[a][b] = sum / (logs[a].length - 1) / (stats[a].deviation * stats[b].deviation);
    }
  }
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
function residualFactor(stocks: readonly StockPart[], indexCorrelations: Record<IndexId, Record<IndexId, number>>, market: PricesFile): number[][] {
  const n = stocks.length;
  const matrix = stocks.map((a, i) =>
    stocks.map((b, j) => {
      if (i === j) return 1;
      const measured = correlationOf(market, a.instrument.id, b.instrument.id);
      if (measured === null) return 0;
      const shared = a.correlation * b.correlation * indexCorrelations[a.index][b.index];
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

const returnsCache = new Map<string, Float64Array[]>();

/** Every part's return, per path and year (path × MIX_YEARS + year). */
export function partReturns(model: MixModel, market: PricesFile = MARKET): Float64Array[] {
  const cached = returnsCache.get(model.key);
  if (cached && market === MARKET) return cached;
  const stocks = model.parts.filter((part): part is StockPart => part.kind === "stock");
  const { years, normals } = drawsWith(stocks.length);
  const correlations = indexCorrelationMatrix();
  const lower = residualFactor(stocks, correlations, market);
  const history = Object.fromEntries(INDEX_IDS.map((id) => [id, INDEXES[id].years.map((entry) => entry.realReturn)])) as Record<IndexId, number[]>;
  const size = MIX_SIMULATIONS * MIX_YEARS;
  const result = model.parts.map((part) => {
    const out = new Float64Array(size);
    const series = history[part.index];
    if (part.kind === "index") {
      for (let i = 0; i < size; i++) out[i] = series[years[i]];
      return out;
    }
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
  });
  if (market === MARKET) {
    if (returnsCache.size >= 16) returnsCache.delete(returnsCache.keys().next().value as string);
    returnsCache.set(model.key, result);
  }
  return result;
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
  const weights = model.parts.map((part) => part.weight);
  for (let s = 0; s < MIX_SIMULATIONS; s++) {
    if (model.rebalance) {
      let balance = start;
      totals[0][s] = balance;
      for (let y = 1; y <= span; y++) {
        let r = 0;
        for (let j = 0; j < weights.length; j++) r += weights[j] * returns[j][s * MIX_YEARS + y - 1];
        balance = (balance + 6 * monthly) * (1 + r) + 6 * monthly;
        totals[y][s] = balance;
      }
    } else {
      const balances = weights.map((weight) => weight * start);
      totals[0][s] = start;
      for (let y = 1; y <= span; y++) {
        let total = 0;
        for (let j = 0; j < weights.length; j++) {
          const r = returns[j][s * MIX_YEARS + y - 1];
          balances[j] = (balances[j] + 6 * monthly * weights[j]) * (1 + r) + 6 * monthly * weights[j];
          total += balances[j];
        }
        totals[y][s] = total;
      }
    }
  }
  const result: WealthPercentiles = { p10: [], p50: [], p90: [] };
  for (const column of totals) {
    column.sort();
    result.p10.push(percentile(column, 0.1));
    result.p50.push(percentile(column, 0.5));
    result.p90.push(percentile(column, 0.9));
  }
  return result;
}

/** How often each withdrawal rate lasted 30 years (withdrawals taken from the parts in proportion). */
export function mixSuccessRates(model: MixModel, rates: readonly number[], market: PricesFile = MARKET, years = 30): number[] {
  const returns = partReturns(model, market);
  const weights = model.parts.map((part) => part.weight);
  const successes = rates.map(() => 0);
  const sequence = new Array<number>(years);
  const balances = new Float64Array(weights.length);
  for (let s = 0; s < MIX_SIMULATIONS; s++) {
    if (model.rebalance) {
      for (let y = 0; y < years; y++) {
        let r = 0;
        for (let j = 0; j < weights.length; j++) r += weights[j] * returns[j][s * MIX_YEARS + y];
        sequence[y] = r;
      }
      rates.forEach((rate, index) => {
        if (survives(sequence, rate)) successes[index] += 1;
      });
      continue;
    }
    for (let index = 0; index < rates.length; index++) {
      const rate = rates[index];
      balances.set(weights);
      let lasted = true;
      for (let y = 0; y < years && lasted; y++) {
        let total = 0;
        for (let j = 0; j < balances.length; j++) total += balances[j];
        if (total <= rate) {
          lasted = false;
          break;
        }
        // Withdrawn from every part in proportion, then each part earns its own return.
        const keep = 1 - rate / total;
        for (let j = 0; j < balances.length; j++) balances[j] *= keep * (1 + returns[j][s * MIX_YEARS + y]);
      }
      if (lasted) successes[index] += 1;
    }
  }
  return successes.map((count) => count / MIX_SIMULATIONS);
}

/** Yearly after-inflation returns of a part, by calendar year, from the data (not simulated). */
function yearlyReturns(part: Part, market: PricesFile): Map<number, number> {
  if (part.kind === "index") return new Map(INDEXES[part.index].dataset.years.map((entry) => [entry.year, entry.realReturn]));
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

/**
 * The worst calendar year of a mix (rebalanced to its weights at the start
 * of each year) over the years every part has data; `null` if they share
 * none. `years` restricts it to those years, to compare two mixes alike.
 */
export function worstYear(model: MixModel, market: PricesFile = MARKET, years?: readonly number[]): WorstYear | null {
  const series = model.parts.map((part) => yearlyReturns(part, market));
  const shared = (years ?? [...series[0].keys()]).filter((year) => series.every((entry) => entry.has(year))).sort((a, b) => a - b);
  if (shared.length === 0) return null;
  let worst: { year: number; change: number } | null = null;
  for (const year of shared) {
    const change = model.parts.reduce((sum, part, index) => sum + part.weight * (series[index].get(year) ?? 0), 0);
    if (!worst || change < worst.change) worst = { year, change };
  }
  return worst ? { ...worst, from: shared[0], to: shared[shared.length - 1] } : null;
}

/** Years a mix's worst year is looked for in. */
export function sharedYears(model: MixModel, market: PricesFile = MARKET): number[] {
  const series = model.parts.map((part) => yearlyReturns(part, market));
  return [...series[0].keys()].filter((year) => series.every((entry) => entry.has(year))).sort((a, b) => a - b);
}

/** Whether any figure behind a mix is a fallback (a stock with too little data). */
export function usesFallback(model: MixModel): boolean {
  return model.parts.some((part) => part.kind === "stock" && part.fallback);
}

/** Exposed for the model's explanation: each stock part's β and own spread. */
export function stockTerms(model: MixModel): { ref: PartRef; beta: number; own: number; correlation: number; volatility: number }[] {
  return model.parts
    .filter((part): part is StockPart => part.kind === "stock")
    .map((part) => ({
      ref: part.ref,
      correlation: part.correlation,
      volatility: part.volatility,
      beta: (part.correlation * part.volatility) / indexVolatility(part.index),
      own: part.volatility * Math.sqrt(1 - part.correlation ** 2),
    }));
}
