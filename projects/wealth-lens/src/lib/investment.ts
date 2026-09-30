/**
 * From "what I invest in" to the numbers every projection uses: the yearly
 * growth after inflation, and the series of historical yearly returns the
 * Monte Carlo simulation draws from. Both come from the same static index
 * datasets (lib/indexes.ts), over the years all three share, so the time to
 * a goal and the success rate of a withdrawal rate always tell the same
 * story, and the indexes are compared like for like.
 *
 * - An index: its history over the common period, averaged.
 * - A single stock: the growth of its reference index, and its own ups and
 *   downs: the index's years scaled to the stock's volatility
 *   (lib/volatility.ts). Its own past growth is shown apart as "past, not
 *   a forecast", never projected.
 * - My portfolio: each holding counts towards the index it tracks (or its
 *   closest one), weighted by its value in euros; the yearly returns are
 *   blended year by year, rebalanced yearly.
 * - A custom rate: the S&P 500's ups and downs, scaled so that they average
 *   exactly the rate typed by the user.
 */

import { formatPercent, formatRate } from "./format";
import { annualizedReturn, INDEXES, INDEX_IDS, type IndexId } from "./indexes";
import { INDEX_TRACKERS, instrumentById, instrumentForHolding, MARKET, type Instrument, type PricesFile } from "./market-data";
import { indexVolatility, scaleVolatility, stockVolatility } from "./volatility";
import { holdingValue } from "./finance";
import { BASE_CURRENCY, type Holding, type Investment } from "./types";

/** The index used for a custom rate's ups and downs, and when nothing else applies. */
export const DEFAULT_INDEX: IndexId = "sp500";

export interface IndexWeight {
  index: IndexId;
  /** Share of the portfolio's EUR value, between 0 and 1. */
  weight: number;
  /** EUR value of the holdings counted towards this index. */
  value: number;
}

export interface PortfolioMix {
  weights: IndexWeight[];
  /** EUR value of all holdings in the mix. */
  total: number;
  /** Tickers not recognized, counted as World. */
  assumedWorld: string[];
}

/**
 * The index a holding counts towards: the one a curated ETF tracks, the
 * closest one for a curated stock, a known tracker ticker (CSPX, IWDA, QQQ…),
 * or World for anything else (`assumed: true`).
 */
export function indexForHolding(
  holding: Pick<Holding, "ticker" | "currency">,
  instruments?: readonly Instrument[],
): { index: IndexId; assumed: boolean } {
  const instrument = instrumentForHolding(holding.ticker, holding.currency, instruments);
  if (instrument) return { index: instrument.index, assumed: false };
  const ticker = holding.ticker.trim().toUpperCase().split(".")[0];
  const tracked = INDEX_IDS.find((id) => INDEX_TRACKERS[id].includes(ticker));
  return tracked ? { index: tracked, assumed: false } : { index: "world", assumed: true };
}

/**
 * How the portfolio splits across the indexes, by value. Only priced holdings
 * in euros count, as for the goal: the app never converts currencies.
 */
export function portfolioMix(holdings: readonly Holding[]): PortfolioMix {
  const values = new Map<IndexId, number>();
  const assumedWorld: string[] = [];
  let total = 0;
  for (const holding of holdings) {
    const value = holdingValue(holding);
    if (holding.currency !== BASE_CURRENCY || value === null || value <= 0) continue;
    const { index, assumed } = indexForHolding(holding);
    values.set(index, (values.get(index) ?? 0) + value);
    if (assumed && !assumedWorld.includes(holding.ticker)) assumedWorld.push(holding.ticker);
    total += value;
  }
  const weights = INDEX_IDS.filter((index) => values.has(index)).map((index) => {
    const value = values.get(index) ?? 0;
    return { index, value, weight: value / total };
  });
  return { weights, total, assumedWorld };
}

/**
 * Yearly returns of a mix rebalanced every year, over the years every index
 * in the mix has data. With a single index this is its whole history.
 */
export function blendedReturns(weights: readonly Pick<IndexWeight, "index" | "weight">[]): {
  years: { year: number; realReturn: number }[];
} {
  if (weights.length === 0) throw new RangeError("weights must not be empty");
  const from = Math.max(...weights.map(({ index }) => INDEXES[index].firstYear));
  const to = Math.min(...weights.map(({ index }) => INDEXES[index].lastYear));
  const byYear = weights.map(({ index }) => new Map(INDEXES[index].years.map((entry) => [entry.year, entry.realReturn])));
  const years = [];
  for (let year = from; year <= to; year++) {
    const realReturn = weights.reduce((sum, { weight }, position) => sum + weight * (byYear[position].get(year) ?? 0), 0);
    years.push({ year, realReturn });
  }
  return { years };
}

/** A series with the same ups and downs whose geometric average is exactly `target`. */
export function scaleToAverage(returns: readonly number[], target: number): number[] {
  const factor = (1 + target) / (1 + annualizedReturn(returns));
  return returns.map((value) => (1 + value) * factor - 1);
}

/** A single stock's own figures, next to the index it is projected with. */
export interface StockFigures {
  id: string;
  name: string;
  index: IndexId;
  /** Yearly volatility used for its ups and downs. */
  volatility: number;
  /** The index's, over the years its returns come from. */
  indexVolatility: number;
  /** True when it has under MIN_DATA_YEARS of closes and the fallback is used. */
  fallback: boolean;
  /** Years of daily closes behind `volatility`. */
  dataYears: number;
  from: string | null;
  to: string | null;
  /** Its price growth per year over its stored closes: shown, never projected. */
  past: { years: number; perYear: number } | null;
}

export interface ResolvedInvestment {
  /** What the plan says, or the default when that cannot be used (e.g. an empty portfolio). */
  investment: Investment;
  /** "S&P 500", "My portfolio", "NVIDIA", "Your own rate". */
  name: string;
  /** What the growth figure is the average of: "S&P 500"; for a stock, its index ("Nasdaq-100"). */
  growthSource: string;
  /** What the simulations draw, to end "lasted 30 years in 93% of …". */
  modelText: string;
  /** The same, shorter, for a chart legend. */
  modelShort: string;
  /** A single stock's own figures; `null` otherwise. */
  stock: StockFigures | null;
  /** Identifies the history in `returns` (same key, same numbers), for caching simulations. */
  key: string;
  /** Expected growth per year after inflation, used for every projection. */
  realReturn: number;
  /** Historical yearly real returns for the Monte Carlo simulation. */
  returns: readonly number[];
  /** Years the returns come from, e.g. [1928, 2022]. */
  period: [number, number];
  /** The index a single stock is projected with. */
  proxyIndex: IndexId | null;
  /** The mix, when the investment is the portfolio. */
  mix: PortfolioMix | null;
  /** Share of it whose figures leave dividends out (the Nasdaq-100's are price only): 0, 1 or in between. */
  withoutDividends: number;
}

/** "1988–2022". */
export function periodText({ period }: Pick<ResolvedInvestment, "period">): string {
  return `${period[0]}–${period[1]}`;
}

/** Said next to a growth figure that leaves dividends out; `null` when they are in. */
export function dividendNote({ withoutDividends }: Pick<ResolvedInvestment, "withoutDividends">): string | null {
  if (withoutDividends <= 0) return null;
  const what = withoutDividends >= 1 ? "price only" : "the Nasdaq-100 part is price only";
  return `${what}: dividends (roughly 1% a year) not included`;
}

function fromIndex(index: IndexId, investment: Investment, name = INDEXES[index].name): ResolvedInvestment {
  const info = INDEXES[index];
  return {
    investment,
    name,
    growthSource: info.name,
    modelText: `${info.name} histories`,
    modelShort: `${info.name} histories`,
    stock: null,
    key: `index:${index}`,
    realReturn: info.averageReturn,
    returns: info.years.map((entry) => entry.realReturn),
    period: [info.firstYear, info.lastYear],
    proxyIndex: null,
    mix: null,
    withoutDividends: info.priceOnly ? 1 : 0,
  };
}

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

/**
 * A single stock: the growth of its index, its own ups and downs. Its
 * returns are the index's years, scaled to the stock's volatility.
 */
export function fromStock(instrument: Instrument, investment: Investment, market: PricesFile = MARKET): ResolvedInvestment {
  const base = fromIndex(instrument.index, investment, instrument.name);
  const index = INDEXES[instrument.index];
  const own = stockVolatility(instrument, market);
  const ofIndex = indexVolatility(instrument.index);
  const factor = own.volatility / ofIndex;
  const growth = market.prices[instrument.id]?.growth ?? null;
  const last = market.prices[instrument.id]?.date;
  const pastYears = growth && last ? (Date.parse(last) - Date.parse(growth.from)) / YEAR_MS : 0;
  const volatility = `${Math.round(own.volatility * 100)}% a year`;
  return {
    ...base,
    key: `stock:${instrument.id}:${factor.toFixed(4)}`,
    returns: scaleVolatility(base.returns, factor),
    proxyIndex: instrument.index,
    modelText: own.fallback
      ? `simulations using ${index.name} years at twice its ups and downs (too little data for ${instrument.name})`
      : `simulations using ${index.name} years scaled to ${instrument.name}'s volatility (${volatility})`,
    modelShort: `simulations with ${instrument.name}'s volatility`,
    stock: {
      id: instrument.id,
      name: instrument.name,
      index: instrument.index,
      volatility: own.volatility,
      indexVolatility: ofIndex,
      fallback: own.fallback,
      dataYears: own.dataYears,
      from: own.from,
      to: own.to,
      past: growth && pastYears >= 1 ? { years: pastYears, perYear: growth.perYear } : null,
    },
  };
}

/** The growth and history behind a plan's investment. `holdings` must already be priced. */
export function resolveInvestment(investment: Investment, holdings: readonly Holding[]): ResolvedInvestment {
  switch (investment.kind) {
    case "index":
      return fromIndex(investment.index, investment);
    case "stock": {
      const instrument = instrumentById(investment.id);
      if (!instrument || instrument.kind !== "stock") break;
      return fromStock(instrument, investment);
    }
    case "portfolio": {
      const mix = portfolioMix(holdings);
      if (mix.weights.length === 0) break;
      const { years } = blendedReturns(mix.weights);
      const returns = years.map((entry) => entry.realReturn);
      return {
        investment,
        name: "My portfolio",
        growthSource: "your portfolio's indexes",
        modelText: "histories of your portfolio's indexes",
        modelShort: "histories of your portfolio's indexes",
        stock: null,
        key: `mix:${mix.weights.map(({ index, weight }) => `${index}=${weight.toFixed(3)}`).join(",")}`,
        realReturn: annualizedReturn(returns),
        returns,
        period: [years[0].year, years[years.length - 1].year],
        proxyIndex: null,
        mix,
        withoutDividends: mix.weights.reduce((sum, { index, weight }) => sum + (INDEXES[index].priceOnly ? weight : 0), 0),
      };
    }
    case "custom": {
      const base = fromIndex(DEFAULT_INDEX, investment, "Your own rate");
      return {
        ...base,
        growthSource: "your own rate",
        modelText: "S&P 500 histories scaled to your rate",
        modelShort: "S&P 500 histories scaled to your rate",
        key: `custom:${investment.realReturn.toFixed(4)}`,
        realReturn: investment.realReturn,
        returns: scaleToAverage(base.returns, investment.realReturn),
      };
    }
  }
  // A stock no longer on the list, or a portfolio with nothing priced in euros.
  return fromIndex(DEFAULT_INDEX, { kind: "index", index: DEFAULT_INDEX });
}

function monthsOrYears(years: number): string {
  if (years >= 1.5) return `${Math.round(years)} years`;
  const months = Math.max(1, Math.round(years * 12));
  return `${months} month${months === 1 ? "" : "s"}`;
}

/**
 * The assumptions under the calculator, one sentence each: where the
 * growth comes from and, for a single stock, where its ups and downs come
 * from and its own past, apart.
 */
export function assumptionLines(investment: ResolvedInvestment): string[] {
  const dividends = dividendNote(investment);
  const growth = `${formatRate(investment.realReturn)} a year after inflation, ${periodText(investment)} average${dividends ? ` (${dividends})` : ""}`;
  const { stock } = investment;
  if (!stock) return [`${investment.name}: ${growth}. Past, not a promise. All amounts in today's euros.`];
  const lines = [`Growth: ${investment.growthSource} average, ${growth}. One stock's future can't be predicted.`];
  lines.push(
    stock.fallback
      ? `Ups and downs: only ${monthsOrYears(stock.dataYears)} of closes for ${stock.name}, so they are taken as twice the ${investment.growthSource}'s (${formatPercent(stock.volatility, { decimals: 0 })} a year).`
      : `Ups and downs: ${stock.name}'s own, ${formatPercent(stock.volatility, { decimals: 0 })} a year (daily closes ${stock.from?.slice(0, 4)}–${stock.to?.slice(0, 4)}), against ${formatPercent(stock.indexVolatility, { decimals: 0 })} for the ${investment.growthSource}.`,
  );
  if (stock.past) {
    lines.push(`Past ${monthsOrYears(stock.past.years)}: ${formatPercent(stock.past.perYear, { signed: true, decimals: 0 })} a year (price, before inflation). Past, not a forecast.`);
  }
  return lines;
}
