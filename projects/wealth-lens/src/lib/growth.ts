/**
 * How much the money grows, in words anyone reads at a glance: next to the
 * result ("Grows about 7.5% a year", "Your money: ×2.3 · growth added
 * +€63,288 (+129%)") and on the chart (the % gained at the end of the curve,
 * and "Year 2036: €48,200 · +37% so far" for any year).
 */

import type { Result, YearPoint } from "./calculator";
import { formatEur, formatPercent, formatRate } from "./format";

/** "Grows about 7.5% a year"; "Shrinks about 0.5% a year" when it loses to rising prices. */
export function growsText(rate: number): string {
  if (Math.abs(rate) < 0.0005) return "Stays about the same every year";
  return `${rate > 0 ? "Grows" : "Shrinks"} about ${formatRate(Math.abs(rate))} a year`;
}

/** "(≈9.7% before inflation)": the same growth before rising prices are taken off. */
export function beforeInflationText(nominal: number): string {
  return `(≈${formatRate(nominal)} before inflation)`;
}

/** What the money ends up as for each euro put in: 2.3 means ×2.3. `null` with nothing put in. */
export function multipleOf({ total, putIn }: Pick<YearPoint, "total" | "putIn">): number | null {
  return putIn > 0 ? total / putIn : null;
}

/** What growth added, as a share of what was put in: 1.29 means +129%. `null` with nothing put in. */
export function gainedShareOf({ total, putIn }: Pick<YearPoint, "total" | "putIn">): number | null {
  return putIn > 0 ? (total - putIn) / putIn : null;
}

/** "×2.3", "×12.4", "×0.95". */
export function formatMultiple(multiple: number): string {
  return `×${multiple.toFixed(multiple < 1 ? 2 : 1)}`;
}

/** "+129%", "-5%", "+0.4%", "0%". */
export function formatShare(share: number): string {
  if (Math.abs(share) < 0.0005) return "0%";
  return formatPercent(share, { signed: true, decimals: Math.abs(share) < 0.01 ? 1 : 0 });
}

/**
 * "Your money: ×2.3 · growth added +€63,288 (+129%)"; when it shrank,
 * "… the market took €2,368 (−5%)" (with no ups and downs: "rising prices
 * took"). `null` with nothing put in.
 */
export function moneyLine(result: Pick<Result, "total" | "putIn">, upsAndDowns: boolean): string | null {
  const multiple = multipleOf(result);
  const share = gainedShareOf(result);
  if (multiple === null || share === null) return null;
  const gained = result.total - result.putIn;
  const change =
    gained >= 0
      ? `growth added ${formatEur(gained, { signed: true })}`
      : `${upsAndDowns ? "the market" : "rising prices"} took ${formatEur(-gained)}`;
  return `Your money: ${formatMultiple(multiple)} · ${change} (${formatShare(share)})`;
}

/** The chart's label at the end of the curve: "+129%" gained in all; `null` with nothing put in. */
export function endLabel(point: Pick<YearPoint, "total" | "putIn">): string | null {
  const share = gainedShareOf(point);
  return share === null ? null : formatShare(share);
}

/** A year of the chart under the finger or the mouse: "Year 2036: €48,200 · +37% so far". */
export function yearTooltip(point: YearPoint, startYear: number): string {
  const share = gainedShareOf(point);
  return `Year ${startYear + point.year}: ${formatEur(point.total)}${share === null ? "" : ` · ${formatShare(share)} so far`}`;
}
