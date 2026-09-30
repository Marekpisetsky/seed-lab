/**
 * How much the money grows, in words anyone reads at a glance, in the
 * page's language: next to the result ("Grows about 7.5% a year", "Your
 * money: ×2.3 · growth added +€63,288 (+129%)") and on the chart (the %
 * gained at the end of the curve, and "Year 2036: €48,200 · +37% so far"
 * for any year).
 */

import type { I18n } from "@/i18n";
import type { Result, YearPoint } from "./calculator";

/** "Grows about 7.5% a year"; "Shrinks about 0.5% a year" when it loses to rising prices. */
export function growsText(rate: number, { m, f }: I18n): string {
  if (Math.abs(rate) < 0.0005) return m.result.staysSame;
  return (rate > 0 ? m.result.growsAbout : m.result.shrinksAbout)(f.rate(Math.abs(rate)));
}

/** "(≈9.7% before inflation)": the same growth before rising prices are taken off. */
export function beforeInflationText(nominal: number, { m, f }: I18n): string {
  return m.result.beforeInflation(f.rate(nominal));
}

/** What the money ends up as for each euro put in: 2.3 means ×2.3. `null` with nothing put in. */
export function multipleOf({ total, putIn }: Pick<YearPoint, "total" | "putIn">): number | null {
  return putIn > 0 ? total / putIn : null;
}

/** What growth added, as a share of what was put in: 1.29 means +129%. `null` with nothing put in. */
export function gainedShareOf({ total, putIn }: Pick<YearPoint, "total" | "putIn">): number | null {
  return putIn > 0 ? (total - putIn) / putIn : null;
}

/** "×2.3", "×12.4", "×0.95" ("×2,3" in Spanish). */
export function formatMultiple(multiple: number, { f }: I18n): string {
  return `×${f.fixed(multiple, multiple < 1 ? 2 : 1)}`;
}

/** "+129%", "-5%", "+0.4%", "0%". */
export function formatShare(share: number, { f }: I18n): string {
  if (Math.abs(share) < 0.0005) return f.percent(0, { decimals: 0 });
  return f.percent(share, { signed: true, decimals: Math.abs(share) < 0.01 ? 1 : 0 });
}

/**
 * "Your money: ×2.3 · growth added +€63,288 (+129%)"; when it shrank,
 * "… the market took €2,368 (−5%)" (with no ups and downs: "rising prices
 * took"). `null` with nothing put in.
 */
export function moneyLine(result: Pick<Result, "total" | "putIn">, upsAndDowns: boolean, i18n: I18n): string | null {
  const { m, f } = i18n;
  const multiple = multipleOf(result);
  const share = gainedShareOf(result);
  if (multiple === null || share === null) return null;
  const gained = result.total - result.putIn;
  const shareText = formatShare(share, i18n);
  const change =
    gained >= 0
      ? m.result.growthAdded(f.eur(gained, { signed: true }), shareText)
      : (upsAndDowns ? m.result.marketTook : m.result.pricesTook)(f.eur(-gained), shareText);
  return m.result.moneyLine(formatMultiple(multiple, i18n), change);
}

/** The chart's label at the end of the curve: "+129%" gained in all; `null` with nothing put in. */
export function endLabel(point: Pick<YearPoint, "total" | "putIn">, i18n: I18n): string | null {
  const share = gainedShareOf(point);
  return share === null ? null : formatShare(share, i18n);
}

/** A year of the chart under the finger or the mouse: "Year 2036: €48,200 · +37% so far". */
export function yearTooltip(point: YearPoint, startYear: number, i18n: I18n): string {
  const { m, f } = i18n;
  const share = gainedShareOf(point);
  return m.chart.tooltip(startYear + point.year, f.eur(point.total)) + (share === null ? "" : m.chart.soFar(formatShare(share, i18n)));
}
