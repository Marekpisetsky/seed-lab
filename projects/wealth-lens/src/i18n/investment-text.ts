/**
 * What an investment is called and how its simulations and growth are
 * described, in the page's language. The investment itself
 * (lib/investment.ts) holds only numbers and choices.
 */

import type { I18n } from ".";
import type { AssetId } from "@/lib/assets";
import { periodText, type ResolvedInvestment } from "@/lib/investment";
import { SAVINGS_RATE } from "@/lib/assets";
import { templateOf, type MixPart } from "@/lib/mix";
import { STARTING_GROWTH } from "@/lib/validation";

export function assetLabel(asset: AssetId, { m }: I18n): string {
  return m.assets.name[asset];
}

/** Short enough for a narrow list: "Euro gov. bonds", "Savings". */
export function assetShortLabel(asset: AssetId, { m }: I18n): string {
  return m.assets.short[asset];
}

/** A part of a mix by name: "US stocks", "Gold". */
export function mixPartName(part: MixPart, { m }: I18n): string {
  return m.assets.name[part.asset];
}

/** "US stocks", "Gold", "Savings account", "Mix 60/40", "Custom growth". */
export function investmentName({ investment }: Pick<ResolvedInvestment, "investment">, { m }: I18n): string {
  switch (investment.kind) {
    case "asset":
      return m.assets.name[investment.asset];
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
    case "custom":
      return realReturn < 0 ? t.customLoss(f.rate(-realReturn)) : t.custom(f.rate(realReturn));
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
 * Step 3's starting value as it is: Custom growth at 5 %, with US
 * stocks' ups and downs. Not the user's own number: the world's long-run
 * average, and said so.
 */
export function isStartingGrowth(investment: Pick<ResolvedInvestment, "investment" | "realReturn" | "volatility" | "standard" | "shift">): boolean {
  return (
    investment.investment.kind === "custom" &&
    investment.shift === 0 &&
    Math.abs(investment.realReturn - STARTING_GROWTH) < 1e-9 &&
    Math.abs(investment.volatility - investment.standard.volatility) < 1e-9
  );
}

/**
 * Whose real years a bad decade takes (lib/decade.ts): "the S&P 500",
 * "your mix's parts", "world stocks, moved to this plan's growth"; with figures
 * the user typed, "the S&P 500, moved to your numbers".
 */
export function decadeSource(investment: Pick<ResolvedInvestment, "investment" | "custom">, { m }: I18n): string {
  const t = m.invest.decade;
  const chosen = investment.investment;
  if (chosen.kind === "custom") return t.custom;
  const what = chosen.kind === "asset" ? m.assets.inSentence[chosen.asset] : t.mix;
  return investment.custom ? t.typed(what) : what;
}

/** Where the growth figure comes from: "S&P 500, 1988–2022 average", "1.5% interest minus 2% rising prices". */
export function growthSource(
  investment: Pick<ResolvedInvestment, "investment" | "custom" | "inflation" | "period" | "realReturn" | "volatility" | "standard" | "shift">,
  i18n: I18n,
): string {
  const { m, f } = i18n;
  if (isStartingGrowth(investment)) return m.invest.source.world;
  if (investment.custom) return m.invest.source.custom;
  const period = periodText(investment);
  const chosen = investment.investment;
  if (chosen.kind === "asset") {
    if (chosen.asset === "savings") return m.invest.source.savings(f.rate(SAVINGS_RATE), f.rate(investment.inflation));
    return m.invest.source.asset(m.assets.name[chosen.asset], period);
  }
  return m.invest.source.mix(period);
}
