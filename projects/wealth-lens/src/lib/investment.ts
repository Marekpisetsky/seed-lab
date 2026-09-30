/**
 * From "what I invest in" and the assumptions to the numbers every
 * projection uses: the growth a year after inflation, the swings, and what
 * the Monte Carlo simulations draw from.
 *
 * Standard assumptions come filled in, from the data:
 * - an asset with a history (lib/indexes.ts): its average growth after
 *   inflation over 1988–2022 and its swings (the standard deviation of its
 *   yearly log returns); the simulations draw its historical years;
 * - a savings account: its interest rate (lib/assets.ts) less the "Prices
 *   of" country's inflation, with no swings;
 * - a mix or My portfolio: the weighted growth of its parts, its swings,
 *   and a joint simulation of the parts (lib/mix.ts);
 * - Custom growth: the S&P 500's figures, as a starting point.
 *
 * Every one of them can be changed (Plan.assumptions): the growth, before
 * or after inflation, the swings and the inflation. Once the growth or the
 * swings are the user's, the history no longer describes them, so the
 * simulations draw each year from a normal distribution with that growth
 * and those swings (lib/normal.ts); with no swings, every year grows the
 * same. Custom growth always works that way.
 */

import { assetName, historyName, isSeriesAsset, SAVINGS_RATE, savingsRealReturn, seriesVolatility, type AssetId } from "./assets";
import { DEFAULT_PRICES_OF, countryByCode, countryInSentence, referenceInflation } from "./cost-of-living";
import { formatPercent, formatRate } from "./format";
import { COMMON_PERIOD, SERIES } from "./indexes";
import { MARKET, type PricesFile } from "./market-data";
import { mixModel, mixVolatility, templateOf, type MixModel } from "./mix";
import { normalReturns } from "./normal";
import { portfolioAllocation, portfolioInputs, type Allocation } from "./portfolio";
import { STANDARD_ASSUMPTIONS, type AssumptionOverrides, type Holding, type Investment } from "./types";

/** What the plan projects with when nothing else can be used (an empty portfolio). */
export const DEFAULT_ASSET: AssetId = "sp500";

/** What the resolver reads from the plan besides the investment. */
export interface ProjectionSettings {
  pricesOf: string;
  assumptions: AssumptionOverrides;
}

export const STANDARD_SETTINGS: ProjectionSettings = { pricesOf: DEFAULT_PRICES_OF, assumptions: STANDARD_ASSUMPTIONS };

/** How the simulations draw each year. */
export type SimulationKind =
  /** One of the asset's historical years. */
  | "history"
  /** One historical year for all the parts of a mix at once (lib/mix.ts). */
  | "joint"
  /** From a normal distribution with the growth and swings given (lib/normal.ts). */
  | "normal"
  /** No swings: every year grows the same. */
  | "fixed";

/** The figures the investment comes with, before anything is changed. */
export interface StandardFigures {
  /** Growth a year after inflation. */
  realReturn: number;
  volatility: number;
  /** The years they come from; `null` for a savings account or Custom growth. */
  period: [number, number] | null;
  /** How the growth is set: from history, after inflation; or a savings rate, before it. */
  basis: "real" | "nominal";
  /** The savings rate before inflation, for a savings account. */
  nominalRate: number | null;
}

export interface ResolvedInvestment {
  /** What the plan says, or the default when that cannot be used (e.g. an empty portfolio). */
  investment: Investment;
  /** "S&P 500", "Gold", "Savings account", "Mix 60/40", "My portfolio", "Custom growth". */
  name: string;
  /** Growth a year after inflation, used for every projection. */
  realReturn: number;
  /** Swings a year: the standard deviation of yearly log returns (0: none). */
  volatility: number;
  /** Inflation a year: the "Prices of" country's, or the user's. */
  inflation: number;
  /** The country whose prices set the inflation. */
  pricesOf: string;
  standard: StandardFigures;
  /** The growth or the swings are the user's (always for Custom growth). */
  custom: boolean;
  /** The inflation is the user's, not the country's. */
  customInflation: boolean;
  simulation: SimulationKind;
  /** Identifies what the simulations draw (same key, same numbers), for caching. */
  key: string;
  /** Yearly returns the simulations draw from (history, normal quantiles or the one fixed return); unused for "joint". */
  returns: readonly number[];
  /** Years of history behind the growth; `null` when there are none. */
  period: [number, number] | null;
  /** A mix's or the portfolio's model: its figures (range, worst year) and, standard, its simulations. */
  model: MixModel | null;
  /** How the holdings are split, for My portfolio. */
  allocation: Allocation | null;
  /** What the simulations are, to end "lasted 30 years in 93% of …". */
  modelText: string;
  /** The same, shorter, for a chart legend. */
  modelShort: string;
  /** Where the growth comes from, for a finding's assumptions: "S&P 500, 1988–2022 average". */
  growthText: string;
  /** Share of it whose figures leave dividends out (the Nasdaq-100's are price only): 0, 1 or in between. */
  withoutDividends: number;
  /** Every simulated year's growth factor is multiplied by this ("What if: grows 1% more"); 1 otherwise. */
  growthFactor: number;
}

/** "1988–2022", or "" without history. */
export function periodText({ period }: Pick<ResolvedInvestment, "period">): string {
  return period ? `${period[0]}–${period[1]}` : "";
}

/** Said next to a growth figure that leaves dividends out; `null` when they are in. */
export function dividendNote({ withoutDividends }: Pick<ResolvedInvestment, "withoutDividends">): string | null {
  if (withoutDividends <= 0) return null;
  const what = withoutDividends >= 1 ? "price only" : "the Nasdaq-100 part is price only";
  return `${what}: dividends (roughly 1% a year) not included`;
}

/** Inflation a year for these settings: the user's, or the "Prices of" country's reference. */
export function inflationFor(settings: ProjectionSettings): number {
  return settings.assumptions.inflation ?? referenceInflation(settings.pricesOf).rate;
}

/** Growth before inflation from growth after it, and back. */
export function toNominal(real: number, inflation: number): number {
  return (1 + real) * (1 + inflation) - 1;
}

export function toReal(nominal: number, inflation: number): number {
  return (1 + nominal) / (1 + inflation) - 1;
}

/** An investment's own figures, before anything the user changed. */
interface Base {
  investment: Investment;
  name: string;
  standard: StandardFigures;
  simulation: SimulationKind;
  key: string;
  returns: readonly number[];
  model: MixModel | null;
  allocation: Allocation | null;
  modelText: string;
  modelShort: string;
  growthText: string;
  withoutDividends: number;
}

const PERIOD: [number, number] = [COMMON_PERIOD[0], COMMON_PERIOD[1]];

function fromAsset(asset: AssetId, inflation: number, investment: Investment = { kind: "asset", asset }): Base {
  if (!isSeriesAsset(asset)) {
    const realReturn = savingsRealReturn(inflation);
    return {
      investment,
      name: assetName(asset),
      standard: { realReturn, volatility: 0, period: null, basis: "nominal", nominalRate: SAVINGS_RATE },
      simulation: "fixed",
      key: `fixed:${realReturn.toFixed(6)}`,
      returns: [realReturn],
      model: null,
      allocation: null,
      modelText: "a savings account, which has no ups and downs",
      modelShort: "savings",
      growthText: `${formatRate(SAVINGS_RATE)} interest less ${formatRate(inflation)} inflation`,
      withoutDividends: 0,
    };
  }
  const info = SERIES[asset];
  return {
    investment,
    name: info.name,
    standard: { realReturn: info.averageReturn, volatility: seriesVolatility(asset), period: PERIOD, basis: "real", nominalRate: null },
    simulation: "history",
    key: `asset:${asset}`,
    returns: info.years.map((entry) => entry.realReturn),
    model: null,
    allocation: null,
    modelText: `${historyName(asset)} histories`,
    modelShort: `${historyName(asset)} histories`,
    growthText: `${info.name}, ${PERIOD[0]}–${PERIOD[1]} average`,
    withoutDividends: info.priceOnly ? 1 : 0,
  };
}

/** A mix or the portfolio, through its model. */
function fromModel(model: MixModel, investment: Investment, name: string, allocation: Allocation | null): Base {
  const onlySavings = model.parts.every((part) => part.asset === "savings");
  const weights = model.parts.map((part) => part.weight.toFixed(4)).join(",");
  const what = allocation ? "your portfolio" : "this mix";
  const volatility = mixVolatility(model);
  return {
    investment,
    name,
    standard: { realReturn: model.realReturn, volatility, period: onlySavings ? null : PERIOD, basis: "real", nominalRate: null },
    simulation: "joint",
    key: `model:${model.key}:${weights}:${model.rebalance ? "rebalance" : "drift"}`,
    returns: [],
    model,
    allocation,
    modelText: `simulations of ${what} (${model.rebalance ? "rebalanced every year" : "weights drifting"})`,
    modelShort: `simulations of ${what}`,
    growthText: `the weighted average of ${allocation ? "what your holdings grow like" : "its parts"}, ${PERIOD[0]}–${PERIOD[1]}`,
    withoutDividends: model.parts.reduce((sum, part) => sum + (part.asset === "nasdaq100" ? part.weight : 0), 0),
  };
}

/** "Mix 60/40" for a template, "Mix of 3" otherwise. */
export function mixName(investment: Extract<Investment, { kind: "mix" }>): string {
  const template = templateOf(investment.parts);
  if (template) return template.label === "100% stocks" ? "Mix: 100% stocks" : `Mix ${template.label}`;
  return `Mix of ${investment.parts.length}`;
}

function baseFor(investment: Investment, holdings: readonly Holding[], inflation: number, market: PricesFile): Base {
  switch (investment.kind) {
    case "asset":
      return fromAsset(investment.asset, inflation, investment);
    case "portfolio": {
      const allocation = portfolioAllocation(holdings);
      const model = mixModel(portfolioInputs(allocation), false, { savingsReturn: savingsRealReturn(inflation), market });
      if (model) return fromModel(model, investment, "My portfolio", allocation);
      break;
    }
    case "mix": {
      const model = mixModel(investment.parts, investment.rebalance, { savingsReturn: savingsRealReturn(inflation), market });
      if (model) return fromModel(model, investment, mixName(investment), null);
      break;
    }
    case "custom": {
      const sp500 = fromAsset("sp500", inflation);
      return {
        ...sp500,
        investment,
        name: "Custom growth",
        standard: { ...sp500.standard, period: null },
        growthText: "your own figure",
        withoutDividends: 0,
      };
    }
  }
  // A portfolio with nothing priced in euros, or a mix with no weight.
  return fromAsset(DEFAULT_ASSET, inflation);
}

/**
 * The growth, swings and simulations behind a plan's investment, with the
 * user's changes applied. `holdings` must already be priced.
 */
export function resolveInvestment(
  investment: Investment,
  holdings: readonly Holding[],
  settings: ProjectionSettings = STANDARD_SETTINGS,
  market: PricesFile = MARKET,
): ResolvedInvestment {
  const inflation = inflationFor(settings);
  const base = baseFor(investment, holdings, inflation, market);
  const { growth, volatility: typedVolatility } = settings.assumptions;
  const standardReal =
    base.standard.basis === "nominal" && base.standard.nominalRate !== null ? toReal(base.standard.nominalRate, inflation) : base.standard.realReturn;
  const realReturn = growth ? (growth.basis === "real" ? growth.rate : toReal(growth.rate, inflation)) : standardReal;
  const volatility = typedVolatility ?? base.standard.volatility;
  const custom = base.investment.kind === "custom" || growth !== null || typedVolatility !== null;
  const shared = {
    growthFactor: 1,
    investment: base.investment,
    name: base.name,
    realReturn,
    volatility,
    inflation,
    pricesOf: countryByCode(settings.pricesOf) ? settings.pricesOf : DEFAULT_PRICES_OF,
    standard: { ...base.standard, realReturn: standardReal },
    custom,
    customInflation: settings.assumptions.inflation !== null,
    model: base.model,
    allocation: base.allocation,
    withoutDividends: custom ? 0 : base.withoutDividends,
  };
  if (!custom) {
    return {
      ...shared,
      simulation: base.simulation,
      key: base.key,
      returns: base.returns,
      period: base.standard.period,
      modelText: base.modelText,
      modelShort: base.modelShort,
      growthText: base.growthText,
    };
  }
  const upsAndDowns = `ups and downs of ±${formatPercent(volatility, { decimals: 0 })}`;
  const fixed = volatility <= 0;
  return {
    ...shared,
    simulation: fixed ? "fixed" : "normal",
    key: fixed ? `fixed:${realReturn.toFixed(6)}` : `normal:${realReturn.toFixed(6)}:${volatility.toFixed(6)}`,
    returns: fixed ? [realReturn] : normalReturns(realReturn, volatility),
    period: null,
    modelText: fixed ? "your figures, with no ups and downs" : `simulations with ${formatRate(realReturn)} a year after rising prices and ${upsAndDowns}`,
    modelShort: fixed ? "your figures" : "simulations with your figures",
    growthText: "your own figure",
  };
}

/**
 * The same investment growing `delta` a year more (or less) after rising
 * prices, with the same ups and downs: every simulated year's growth factor
 * is multiplied by (1 + g + delta) / (1 + g), so the typical year grows
 * exactly g + delta. Used by "What if: grows 1% more / less".
 */
export function shiftGrowth(investment: ResolvedInvestment, delta: number): ResolvedInvestment {
  const factor = (1 + investment.realReturn + delta) / (1 + investment.realReturn);
  const change = `${delta >= 0 ? "+" : "−"}${formatRate(Math.abs(delta))} a year`;
  return {
    ...investment,
    realReturn: investment.realReturn + delta,
    growthFactor: investment.growthFactor * factor,
    key: `${investment.key}|x${factor.toFixed(6)}`,
    returns: investment.returns.map((value) => (1 + value) * factor - 1),
    modelText: `${investment.modelText}, ${change}`,
    modelShort: `${investment.modelShort}, ${change}`,
  };
}

/** "the Netherlands", as "Prices of" reads in a sentence. */
export function pricesOfName(code: string): string {
  const country = countryByCode(code) ?? countryByCode(DEFAULT_PRICES_OF);
  return country ? countryInSentence(country.name) : code;
}
