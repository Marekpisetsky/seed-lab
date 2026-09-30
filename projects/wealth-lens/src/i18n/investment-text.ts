/**
 * What an investment is called and how its simulations and growth are
 * described, in the page's language. The investment itself
 * (lib/investment.ts) holds only numbers and choices.
 */

import type { I18n } from ".";
import type { AssetId } from "@/lib/assets";
import type { SeriesId } from "@/lib/index-ids";
import { periodText, type ResolvedInvestment } from "@/lib/investment";
import { SAVINGS_RATE } from "@/lib/assets";
import { templateOf } from "@/lib/mix";

export function assetLabel(asset: AssetId, { m }: I18n): string {
  return m.assets.name[asset];
}

/** Short enough for a narrow list: "Euro gov. bonds", "Savings". */
export function assetShortLabel(asset: AssetId, { m }: I18n): string {
  return m.assets.short[asset];
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

type Described = Pick<ResolvedInvestment, "investment" | "custom" | "volatility" | "simulation" | "allocation" | "shift">;

/** What the simulations are, to end "lasted 30 years in 93% of …": "S&P 500 histories", "simulations of this mix". */
export function simulationsText(investment: Described, i18n: I18n): string {
  const { m, f } = i18n;
  const text = (() => {
    if (investment.custom) return investment.volatility <= 0 ? m.invest.simulations.customFixed : m.invest.simulations.custom;
    if (investment.simulation === "joint") return investment.allocation ? m.invest.simulations.portfolio : m.invest.simulations.mix;
    const chosen = investment.investment;
    if (chosen.kind === "asset" && chosen.asset !== "savings") return m.assets.histories[chosen.asset as SeriesId];
    return m.invest.simulations.savings;
  })();
  if (investment.shift === 0) return text;
  const change = `${investment.shift > 0 ? "+" : "−"}${f.rate(Math.abs(investment.shift))}`;
  return m.invest.shifted(text, change);
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
