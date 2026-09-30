/**
 * The assumptions as the calculator shows them: one compact line
 * ("7.5% a year after inflation · swings ±17% · 1988–2022"), a short note,
 * and the figures the Edit panel shows, before or after inflation.
 */

import { GOLD_NOTE, SAVINGS_RATE } from "./assets";
import { formatPercent, formatRate } from "./format";
import { dividendNote, periodText, toNominal, type ResolvedInvestment } from "./investment";
import { PORTFOLIO_LABEL } from "./portfolio";

export type Basis = "real" | "nominal";

/** The growth a year in the basis shown: after inflation (real) or before it (nominal). */
export function growthIn(investment: Pick<ResolvedInvestment, "realReturn" | "inflation">, basis: Basis): number {
  return basis === "real" ? investment.realReturn : toNominal(investment.realReturn, investment.inflation);
}

/** "7.5% a year after inflation". */
export function growthText(investment: Pick<ResolvedInvestment, "realReturn" | "inflation">, basis: Basis): string {
  return `${formatRate(growthIn(investment, basis))} a year ${basis === "real" ? "after" : "before"} inflation`;
}

/** "swings ±17%", or "no swings". */
export function swingsText(volatility: number): string {
  return volatility > 0 ? `swings ±${formatPercent(volatility, { decimals: 0 })}` : "no swings";
}

/** Where the figures come from: "1988–2022", "1.5% interest, 2% inflation", "your figures". */
export function sourceText(investment: ResolvedInvestment): string {
  if (investment.custom) return investment.investment.kind === "custom" ? "your figures" : "your figures, not the data";
  if (investment.investment.kind === "asset" && investment.investment.asset === "savings") {
    return `${formatRate(SAVINGS_RATE)} interest, ${formatRate(investment.inflation)} inflation`;
  }
  return periodText(investment);
}

/** The compact line: growth · swings · where from. */
export function assumptionsLine(investment: ResolvedInvestment, basis: Basis): string {
  return [growthText(investment, basis), swingsText(investment.volatility), sourceText(investment)].filter(Boolean).join(" · ");
}

/** The short note under the line: what matters about this choice. */
export function assumptionsNote(investment: ResolvedInvestment): string {
  const notes: string[] = [];
  const { investment: chosen } = investment;
  if (chosen.kind === "portfolio") notes.push(PORTFOLIO_LABEL);
  if (chosen.kind === "asset" && chosen.asset === "gold") notes.push(`${GOLD_NOTE}: gold protects, it hardly grows.`);
  const dividends = dividendNote(investment);
  if (dividends) notes.push(`${dividends.charAt(0).toUpperCase()}${dividends.slice(1)}.`);
  notes.push(investment.custom ? "Your own figures, not a promise." : investment.period ? "Past, not a promise." : "Not a promise.");
  notes.push("Amounts in today's euros.");
  return notes.join(" ");
}
