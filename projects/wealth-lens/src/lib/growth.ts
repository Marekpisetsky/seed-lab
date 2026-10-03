/**
 * How much the money grows, in words anyone reads at a glance, in the
 * page's language: next to the result ("Grows about 7.5% a year") and on
 * the chart, without percents that grow huge over the years ("+5,411%"):
 * "×2.3 what you put in" at the end of the curve, and "2036: €48,200" for
 * any year.
 */

import type { I18n } from "@/i18n";
import type { YearPoint } from "./calculator";

/** "Grows about 7.5% a year"; "Shrinks about 0.5% a year" when it loses to rising prices. */
export function growsText(rate: number, { m, f }: I18n): string {
  if (Math.abs(rate) < 0.0005) return m.result.staysSame;
  return (rate > 0 ? m.result.growsAbout : m.result.shrinksAbout)(f.rate(Math.abs(rate)));
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

/** "×2.3 what you put in": what the money became, without a percent; `null` with nothing put in. */
export function timesPutInText(point: Pick<YearPoint, "total" | "putIn">, i18n: I18n): string | null {
  const multiple = multipleOf(point);
  return multiple === null ? null : i18n.m.result.timesPutIn(formatMultiple(multiple, i18n));
}

/** A year of the chart under the finger or the mouse: "2036: €48,200". */
export function yearTooltip(point: YearPoint, startYear: number, { m, f }: I18n): string {
  return m.chart.tooltip(startYear + point.year, f.eur(point.total));
}
