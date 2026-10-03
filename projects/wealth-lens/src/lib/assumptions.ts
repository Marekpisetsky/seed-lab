/**
 * The assumptions in plain words and in the page's language: the growth
 * line under the chips, one compact line for "What you should know"
 * ("Grows 7.5% a year after rising prices · can move ±17% in a year · data
 * 1988–2022"), a short note under the chart, and the hints in More options.
 */

import type { I18n } from "@/i18n";
import { dividendNote, isStartingGrowth } from "@/i18n/investment-text";
import { SAVINGS_RATE } from "./assets";
import { periodText, toNominal, type ResolvedInvestment } from "./investment";
import { BEST_20_YEARS, beyondHistory, closestHistory, type BestRun } from "./realism";
import type { Plan } from "./types";

/** The growth a year as banks and news quote it, before rising prices: the small line under the chips. */
export function quotedGrowth(investment: Pick<ResolvedInvestment, "realReturn" | "inflation">): number {
  return toNominal(investment.realReturn, investment.inflation);
}

/** "Grows 7.5% a year after rising prices"; "Shrinks 0.5% a year …" below zero. */
export function growthText(investment: Pick<ResolvedInvestment, "realReturn">, { m, f }: I18n): string {
  const rate = investment.realReturn;
  const say = rate < 0 ? m.assumptions.shrinks : m.assumptions.grows;
  return say(f.rate(Math.abs(rate)));
}

/**
 * Whether something in More options differs from its standard: the ups and
 * downs, the rising prices, or a growth typed over an investment. "My %" is
 * a chip, not an option: choosing it changes nothing in there.
 */
export function optionsChanged({ assumptions, investment }: Pick<Plan, "assumptions" | "investment">): boolean {
  return assumptions.volatility !== null || assumptions.inflation !== null || (assumptions.growth !== null && investment.kind !== "custom");
}

/**
 * "Very rare: the best 20 years in the data gave 13%." (the S&P 500,
 * 1980–1999), under a growth beyond the best 20 years in the data, in the
 * place of step 3's line; `null` otherwise.
 */
export function realismWarning(investment: Pick<ResolvedInvestment, "realReturn">, { m, f }: I18n, best: BestRun = BEST_20_YEARS): string | null {
  if (!beyondHistory(investment.realReturn, best)) return null;
  return m.growth.veryRare(best.to - best.from + 1, f.rate(best.growth));
}

/**
 * "Historically, assets growing about 7.5% moved about ±16% a year.": the
 * asset whose growth is closest, beside the ups and downs, which stay the
 * user's to set. `null` for a savings account, which has none.
 */
export function historicalRiskText(investment: Pick<ResolvedInvestment, "realReturn" | "investment">, { m, f }: I18n): string | null {
  const chosen = investment.investment;
  if (chosen.kind === "asset" && chosen.asset === "savings") return null;
  const near = closestHistory(investment.realReturn);
  return m.assumptions.historically(f.rate(near.growth), f.percent(near.volatility, { decimals: 0 }));
}

/** "can move ±17% in a year", or "the same every year" with no ups and downs. */
export function upsAndDownsText(volatility: number, { m, f }: I18n): string {
  return volatility > 0 ? m.assumptions.canMove(f.percent(volatility, { decimals: 0 })) : m.assumptions.sameEveryYear;
}

/** "So €10,000 could end the year at €9,200 to €10,800.": a normal year's ups and downs, in euros. */
export function upsAndDownsExample(volatility: number, { m, f }: I18n): string {
  if (volatility <= 0) return m.assumptions.exampleNone;
  return m.assumptions.example(f.eur(10_000), f.eur(Math.max(0, 10_000 * (1 - volatility))), f.eur(10_000 * (1 + volatility)));
}

/** Where the figures come from: "data 1988–2022", "1.5% interest, prices rise 2%", "your numbers". */
export function sourceText(investment: ResolvedInvestment, { m, f }: I18n): string {
  if (isStartingGrowth(investment)) return m.assumptions.worldAverage;
  if (investment.custom) return investment.investment.kind === "custom" ? m.assumptions.yourNumbers : m.assumptions.yourNumbersNotData;
  if (investment.investment.kind === "asset" && investment.investment.asset === "savings") {
    return m.assumptions.savingsSource(f.rate(SAVINGS_RATE), f.rate(investment.inflation));
  }
  const period = periodText(investment);
  return period && m.assumptions.data(period);
}

/** The user's money, for the euros beside each percent: what growth adds in the first year, and what a year's move is measured on. */
export interface OnYourMoney {
  firstYear: number;
  base: number;
}

/**
 * The compact line: growth after rising prices · ups and downs · where
 * from; with the user's money, each percent with its euros ("Grows 5% a
 * year after rising prices: +€55 the first year · can move ±18% in a year:
 * ±€198 on €1,100 · your numbers").
 */
export function assumptionsLine(investment: ResolvedInvestment, i18n: I18n, money?: OnYourMoney): string {
  const { m, f } = i18n;
  const growth = money ? m.assumptions.growsEuros(growthText(investment, i18n), f.eur(money.firstYear, { signed: true })) : growthText(investment, i18n);
  const moves =
    money && investment.volatility > 0 && money.base > 0
      ? m.assumptions.canMoveEuros(f.percent(investment.volatility, { decimals: 0 }), f.eur(money.base * investment.volatility), f.eur(money.base))
      : upsAndDownsText(investment.volatility, i18n);
  return [growth, moves, sourceText(investment, i18n)].filter(Boolean).join(" · ");
}

/** The short note under the line: what matters about this choice (My portfolio's label sits over its holdings). */
export function assumptionsNote(investment: ResolvedInvestment, i18n: I18n): string {
  const { notes } = i18n.m.assumptions;
  const said: string[] = [];
  const { investment: chosen } = investment;
  if (chosen.kind === "asset" && chosen.asset === "gold") said.push(notes.gold);
  const dividends = dividendNote(investment, i18n);
  if (dividends) said.push(`${dividends.charAt(0).toUpperCase()}${dividends.slice(1)}.`);
  said.push(isStartingGrowth(investment) ? notes.world : investment.custom ? notes.yours : investment.period ? notes.past : notes.notPromise);
  said.push(notes.todaysEuros);
  return said.join(" ");
}
