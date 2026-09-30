/**
 * The assumptions as the calculator shows them, in plain words and in the
 * page's language: one compact line ("Grows 7.5% a year after rising
 * prices · can move ±17% in a year · data 1988–2022"), a short note, and
 * the figures the Edit panel shows, after or before rising prices.
 */

import type { I18n } from "@/i18n";
import { dividendNote } from "@/i18n/investment-text";
import { SAVINGS_RATE } from "./assets";
import { periodText, toNominal, type ResolvedInvestment } from "./investment";

export type Basis = "real" | "nominal";

/** The growth a year as shown: after rising prices ("real") or before them ("nominal"). */
export function growthIn(investment: Pick<ResolvedInvestment, "realReturn" | "inflation">, basis: Basis): number {
  return basis === "real" ? investment.realReturn : toNominal(investment.realReturn, investment.inflation);
}

/** "Grows 7.5% a year after rising prices"; "Shrinks 0.5% a year …" below zero. */
export function growthText(investment: Pick<ResolvedInvestment, "realReturn" | "inflation">, basis: Basis, { m, f }: I18n): string {
  const rate = growthIn(investment, basis);
  const say = rate < 0 ? m.assumptions.shrinks : m.assumptions.grows;
  return say(f.rate(Math.abs(rate)), basis === "real");
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
  if (investment.custom) return investment.investment.kind === "custom" ? m.assumptions.yourNumbers : m.assumptions.yourNumbersNotData;
  if (investment.investment.kind === "asset" && investment.investment.asset === "savings") {
    return m.assumptions.savingsSource(f.rate(SAVINGS_RATE), f.rate(investment.inflation));
  }
  const period = periodText(investment);
  return period && m.assumptions.data(period);
}

/** The compact line: growth · ups and downs · where from. */
export function assumptionsLine(investment: ResolvedInvestment, basis: Basis, i18n: I18n): string {
  return [growthText(investment, basis, i18n), upsAndDownsText(investment.volatility, i18n), sourceText(investment, i18n)].filter(Boolean).join(" · ");
}

/** The short note under the line: what matters about this choice (My portfolio's label sits over its holdings). */
export function assumptionsNote(investment: ResolvedInvestment, i18n: I18n): string {
  const { notes } = i18n.m.assumptions;
  const said: string[] = [];
  const { investment: chosen } = investment;
  if (chosen.kind === "asset" && chosen.asset === "gold") said.push(notes.gold);
  const dividends = dividendNote(investment, i18n);
  if (dividends) said.push(`${dividends.charAt(0).toUpperCase()}${dividends.slice(1)}.`);
  said.push(investment.custom ? notes.yours : investment.period ? notes.past : notes.notPromise);
  said.push(notes.todaysEuros);
  return said.join(" ");
}
