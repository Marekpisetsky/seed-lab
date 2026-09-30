/**
 * The assumptions as the calculator shows them, in plain words: one compact
 * line ("Grows 7.5% a year after rising prices · can move ±17% in a year ·
 * data 1988–2022"), a short note, and the figures the Edit panel shows,
 * after or before rising prices.
 */

import { GOLD_NOTE, SAVINGS_RATE } from "./assets";
import { formatEur, formatPercent, formatRate } from "./format";
import { dividendNote, periodText, toNominal, type ResolvedInvestment } from "./investment";

export type Basis = "real" | "nominal";

/** The growth a year as shown: after rising prices ("real") or before them ("nominal"). */
export function growthIn(investment: Pick<ResolvedInvestment, "realReturn" | "inflation">, basis: Basis): number {
  return basis === "real" ? investment.realReturn : toNominal(investment.realReturn, investment.inflation);
}

/** "Grows 7.5% a year after rising prices"; "Shrinks 0.5% a year …" below zero. */
export function growthText(investment: Pick<ResolvedInvestment, "realReturn" | "inflation">, basis: Basis): string {
  const rate = growthIn(investment, basis);
  return `${rate < 0 ? "Shrinks" : "Grows"} ${formatRate(Math.abs(rate))} a year ${basis === "real" ? "after" : "before"} rising prices`;
}

/** "can move ±17% in a year", or "the same every year" with no ups and downs. */
export function upsAndDownsText(volatility: number): string {
  return volatility > 0 ? `can move ±${formatPercent(volatility, { decimals: 0 })} in a year` : "the same every year";
}

/** "e.g. a €10,000 year could end between €9,200 and €10,800": a normal year's ups and downs, in euros. */
export function upsAndDownsExample(volatility: number): string {
  if (volatility <= 0) return "0: it grows the same every year.";
  const low = formatEur(Math.max(0, 10_000 * (1 - volatility)));
  return `e.g. a €10,000 year could end between ${low} and ${formatEur(10_000 * (1 + volatility))}.`;
}

/** Where the figures come from: "data 1988–2022", "1.5% interest, prices rise 2%", "your figures". */
export function sourceText(investment: ResolvedInvestment): string {
  if (investment.custom) return investment.investment.kind === "custom" ? "your figures" : "your figures, not the data";
  if (investment.investment.kind === "asset" && investment.investment.asset === "savings") {
    return `${formatRate(SAVINGS_RATE)} interest, prices rise ${formatRate(investment.inflation)}`;
  }
  const period = periodText(investment);
  return period && `data ${period}`;
}

/** The compact line: growth · ups and downs · where from. */
export function assumptionsLine(investment: ResolvedInvestment, basis: Basis): string {
  return [growthText(investment, basis), upsAndDownsText(investment.volatility), sourceText(investment)].filter(Boolean).join(" · ");
}

/** The short note under the line: what matters about this choice (My portfolio's label sits over its holdings). */
export function assumptionsNote(investment: ResolvedInvestment): string {
  const notes: string[] = [];
  const { investment: chosen } = investment;
  if (chosen.kind === "asset" && chosen.asset === "gold") notes.push(`${GOLD_NOTE}: gold protects, it hardly grows.`);
  const dividends = dividendNote(investment);
  if (dividends) notes.push(`${dividends.charAt(0).toUpperCase()}${dividends.slice(1)}.`);
  notes.push(investment.custom ? "Your own figures, not a promise." : investment.period ? "Past, not a promise." : "Not a promise.");
  notes.push("Amounts in today's euros.");
  return notes.join(" ");
}
