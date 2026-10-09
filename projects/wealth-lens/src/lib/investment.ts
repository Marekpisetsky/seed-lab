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
 * - a mix: the weighted growth of its parts, its swings, and a joint
 *   simulation of the parts (lib/mix.ts);
 * - Custom growth: the growth typed with US stocks' swings (CUSTOM_BASE).
 *
 * Every one of them can be changed (Plan.assumptions): the growth after
 * inflation (Custom growth, "My %"), the swings and the inflation.
 * Everything is worked out after inflation. Once the growth or the
 * swings are the user's, the history no longer describes them, so the
 * simulations draw each year from a normal distribution with that growth
 * and those swings (lib/normal.ts); with no swings, every year grows the
 * same. Custom growth always works that way.
 */

import { isSeriesAsset, SAVINGS_RATE, savingsRealReturn, seriesVolatility, type AssetId } from "./assets";
// Only each country's inflation rate: the whole country dataset is not part of the first screen.
import { DEFAULT_PRICES_OF, isPriceCountry, referenceRate } from "@seed-kit/inflation-rates.ts";
import { COMMON_PERIOD, SERIES } from "./indexes";
import { mixInputs, mixModel, mixVolatility, type MixModel } from "./mix";
import { normalReturns } from "./normal";
import { STANDARD_ASSUMPTIONS, type AssumptionOverrides, type Investment } from "./types";

/** What the plan projects with when nothing else can be used (a mix with no weight). */
export const DEFAULT_ASSET: AssetId = "sp500";
/**
 * Whose ups and downs Custom growth has: US stocks', the one stock series
 * whose data may be published (world stocks' until 9 October 2026, when the
 * MSCI World series was removed: research/wealth-lens/crecimiento.md).
 */
export const CUSTOM_BASE: AssetId = "sp500";

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
  /** What the plan says, or the default when that cannot be used (a mix with no weight). Its name and texts: i18n/investment-text.ts. */
  investment: Investment;
  /** Growth a year after inflation, used for every projection. */
  realReturn: number;
  /** Swings a year: the standard deviation of yearly log returns (0: none). */
  volatility: number;
  /** Inflation a year: the "Rising prices in" country's, or the user's. */
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
  /** A mix's model: its figures (range, worst year) and, standard, its simulations. */
  model: MixModel | null;
  /** Every simulated year's growth factor is multiplied by this ("What if: grows 1% more"); 1 otherwise. */
  growthFactor: number;
  /** Growth added a year by a "What if…?" (+0.01, −0.01), 0 otherwise. */
  shift: number;
}

/** "1988–2022", or "" without history. */
export function periodText({ period }: Pick<ResolvedInvestment, "period">): string {
  return period ? `${period[0]}–${period[1]}` : "";
}

/** Inflation a year for these settings: the user's, or the "Rising prices in" country's reference. */
export function inflationFor(settings: ProjectionSettings): number {
  return settings.assumptions.inflation ?? referenceRate(settings.pricesOf);
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
  standard: StandardFigures;
  simulation: SimulationKind;
  key: string;
  returns: readonly number[];
  model: MixModel | null;
}

const PERIOD: [number, number] = [COMMON_PERIOD[0], COMMON_PERIOD[1]];

function fromAsset(asset: AssetId, inflation: number, investment: Investment = { kind: "asset", asset }): Base {
  if (!isSeriesAsset(asset)) {
    const realReturn = savingsRealReturn(inflation);
    return {
      investment,
      standard: { realReturn, volatility: 0, period: null, basis: "nominal", nominalRate: SAVINGS_RATE },
      simulation: "fixed",
      key: `fixed:${realReturn.toFixed(6)}`,
      returns: [realReturn],
      model: null,
    };
  }
  const info = SERIES[asset];
  return {
    investment,
    standard: { realReturn: info.averageReturn, volatility: seriesVolatility(asset), period: PERIOD, basis: "real", nominalRate: null },
    simulation: "history",
    key: `asset:${asset}`,
    returns: info.years.map((entry) => entry.realReturn),
    model: null,
  };
}

/** A mix, through its model. */
function fromModel(model: MixModel, investment: Investment): Base {
  const onlySavings = model.parts.every((part) => part.asset === "savings");
  const weights = model.parts.map((part) => part.weight.toFixed(4)).join(",");
  const volatility = mixVolatility(model);
  return {
    investment,
    standard: { realReturn: model.realReturn, volatility, period: onlySavings ? null : PERIOD, basis: "real", nominalRate: null },
    simulation: "joint",
    key: `model:${model.key}:${weights}:${model.rebalance ? "rebalance" : "drift"}`,
    returns: [],
    model,
  };
}

function baseFor(investment: Investment, inflation: number): Base {
  switch (investment.kind) {
    case "asset":
      return fromAsset(investment.asset, inflation, investment);
    case "mix": {
      const model = mixModel(mixInputs(investment.parts), investment.rebalance, { savingsReturn: savingsRealReturn(inflation) });
      if (model) return fromModel(model, investment);
      break;
    }
    case "custom": {
      // A growth of one's own moves like US stocks: their ups and downs, around the typed growth.
      const stocks = fromAsset(CUSTOM_BASE, inflation);
      return { ...stocks, investment, standard: { ...stocks.standard, period: null } };
    }
  }
  // A mix with no weight.
  return fromAsset(DEFAULT_ASSET, inflation);
}

/**
 * The growth, swings and simulations behind a plan's investment, with the
 * user's changes applied.
 */
export function resolveInvestment(investment: Investment, settings: ProjectionSettings = STANDARD_SETTINGS): ResolvedInvestment {
  const inflation = inflationFor(settings);
  const base = baseFor(investment, inflation);
  const { growth, volatility: typedVolatility } = settings.assumptions;
  const standardReal =
    base.standard.basis === "nominal" && base.standard.nominalRate !== null ? toReal(base.standard.nominalRate, inflation) : base.standard.realReturn;
  const realReturn = growth ?? standardReal;
  const volatility = typedVolatility ?? base.standard.volatility;
  const custom = base.investment.kind === "custom" || growth !== null || typedVolatility !== null;
  const shared = {
    growthFactor: 1,
    shift: 0,
    investment: base.investment,
    realReturn,
    volatility,
    inflation,
    pricesOf: isPriceCountry(settings.pricesOf) ? settings.pricesOf : DEFAULT_PRICES_OF,
    standard: { ...base.standard, realReturn: standardReal },
    custom,
    customInflation: settings.assumptions.inflation !== null,
    model: base.model,
  };
  if (!custom) {
    return {
      ...shared,
      simulation: base.simulation,
      key: base.key,
      returns: base.returns,
      period: base.standard.period,
    };
  }
  const fixed = volatility <= 0;
  return {
    ...shared,
    simulation: fixed ? "fixed" : "normal",
    key: fixed ? `fixed:${realReturn.toFixed(6)}` : `normal:${realReturn.toFixed(6)}:${volatility.toFixed(6)}`,
    returns: fixed ? [realReturn] : normalReturns(realReturn, volatility),
    period: null,
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
  return {
    ...investment,
    realReturn: investment.realReturn + delta,
    growthFactor: investment.growthFactor * factor,
    shift: investment.shift + delta,
    key: `${investment.key}|x${factor.toFixed(6)}`,
    returns: investment.returns.map((value) => (1 + value) * factor - 1),
  };
}
