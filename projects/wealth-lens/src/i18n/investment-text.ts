/**
 * What an investment is called and how its simulations and growth are
 * described, in the page's language. The investment itself
 * (lib/investment.ts) holds only numbers and choices.
 */

import type { I18n } from ".";
import type { AssetId } from "@/lib/assets";
import { periodText, type ResolvedInvestment } from "@/lib/investment";
import { SAVINGS_RATE } from "@/lib/assets";
import { MARKET, type Instrument } from "@/lib/market-data";
import { mixStock, templateOf, type MixPart } from "@/lib/mix";
import { stockVolatility } from "@/lib/volatility";

export function assetLabel(asset: AssetId, { m }: I18n): string {
  return m.assets.name[asset];
}

/** Short enough for a narrow list: "Euro gov. bonds", "Savings". */
export function assetShortLabel(asset: AssetId, { m }: I18n): string {
  return m.assets.short[asset];
}

/** "grows like the Nasdaq-100 · moves ±50% a year": how a stock in a mix is worked out, in small type beside it. */
export function stockPartDetail(stock: Instrument, { m, f }: I18n): string {
  const own = stockVolatility(stock, MARKET, stock.index);
  return m.mix.part.stock(m.assets.inSentence[stock.index], f.percent(own.volatility, { decimals: 0 }), own.fallback);
}

/** A part of a mix by name: "World", "NVIDIA". */
export function mixPartName(part: MixPart, { m }: I18n): string {
  return mixStock(part.stock)?.name ?? m.assets.name[part.asset];
}

/** "S&P 500", "Gold", "Savings account", "Mix 60/40", "My portfolio", "Custom growth". */
export function investmentName({ investment }: Pick<ResolvedInvestment, "investment">, { m }: I18n): string {
  switch (investment.kind) {
    case "asset":
      return m.assets.name[investment.asset];
    case "portfolio":
      return m.invest.portfolio;
    case "custom":
      return m.invest.custom;
    case "mix": {
      const template = templateOf(investment.parts);
      return template ? m.invest.mixTemplate[template.id] : m.invest.mixOf(investment.parts.length);
    }
  }
}

/** Where the money goes, as the result's first sentence says it: "in the S&P 500", "in your mix", "growing 6% a year". */
export function investedInText({ investment, realReturn }: Pick<ResolvedInvestment, "investment" | "realReturn">, { m, f }: I18n): string {
  const t = m.result.investedIn;
  switch (investment.kind) {
    case "asset":
      return t.asset(m.assets.inSentence[investment.asset]);
    case "mix":
      return t.mix;
    case "portfolio":
      return t.portfolio;
    case "custom":
      return t.custom(f.rate(realReturn));
  }
}

/**
 * What "Invested in" shows: the investment's name, or, once any assumption
 * is the user's (growth, ups and downs or rising prices), "Custom (based on
 * S&P 500)". "Reset to standard" brings the name back. Custom growth has no
 * asset behind it and keeps its own name.
 */
export function selectorParts(
  investment: Pick<ResolvedInvestment, "investment" | "custom" | "customInflation">,
  i18n: I18n,
): { name: string; basedOn: string | null } {
  const name = investmentName(investment, i18n);
  if (investment.investment.kind === "custom" || !(investment.custom || investment.customInflation)) return { name, basedOn: null };
  return { name: i18n.m.invest.customLabel, basedOn: i18n.m.invest.basedOn(name) };
}

/** The same in one line: "Custom (based on S&P 500)". */
export function selectorName(investment: Pick<ResolvedInvestment, "investment" | "custom" | "customInflation">, i18n: I18n): string {
  const { name, basedOn } = selectorParts(investment, i18n);
  return basedOn ? `${name} ${basedOn}` : name;
}

/**
 * Whose real years a bad decade takes (lib/decade.ts): "the S&P 500",
 * "your mix's parts", "world stocks, moved to your growth"; with figures
 * the user typed, "the S&P 500, moved to your numbers".
 */
export function decadeSource(investment: Pick<ResolvedInvestment, "investment" | "custom">, { m }: I18n): string {
  const t = m.invest.decade;
  const chosen = investment.investment;
  if (chosen.kind === "custom") return t.custom;
  const what = chosen.kind === "asset" ? m.assets.inSentence[chosen.asset] : chosen.kind === "mix" ? t.mix : t.portfolio;
  return investment.custom ? t.typed(what) : what;
}

/** Where the growth figure comes from: "S&P 500, 1988–2022 average", "1.5% interest minus 2% rising prices". */
export function growthSource(investment: Pick<ResolvedInvestment, "investment" | "custom" | "allocation" | "inflation" | "period">, i18n: I18n): string {
  const { m, f } = i18n;
  if (investment.custom) return m.invest.source.custom;
  const period = periodText(investment);
  const chosen = investment.investment;
  if (chosen.kind === "asset") {
    if (chosen.asset === "savings") return m.invest.source.savings(f.rate(SAVINGS_RATE), f.rate(investment.inflation));
    return m.invest.source.asset(m.assets.name[chosen.asset], period);
  }
  return investment.allocation ? m.invest.source.portfolio(period) : m.invest.source.mix(period);
}

/** Said next to a growth figure that leaves dividends out; `null` when they are in. */
export function dividendNote({ withoutDividends }: Pick<ResolvedInvestment, "withoutDividends">, { m }: I18n): string | null {
  if (withoutDividends <= 0) return null;
  return withoutDividends >= 1 ? m.invest.dividends.all : m.invest.dividends.part;
}
