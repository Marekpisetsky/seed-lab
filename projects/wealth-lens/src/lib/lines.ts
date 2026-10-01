/**
 * My stocks' lines: one point a week for each period, 100 at its start,
 * worked out by the daily price job (scripts/lib/lines.mts) and published
 * as public/data/lines/<id>.json. Never a price: only how far each week is
 * from the period's first. A file is read from the site itself when its row
 * is opened (no price source is ever asked), and kept for the visit.
 */

import { LINE_PERIODS, parseLinesFile, type LinePeriod, type LinePeriodId, type LinesFile } from "./market-format";
import { publicPath } from "./site";

export type { LinePeriod, LinePeriodId, LinesFile } from "./market-format";
export { LINE_PERIODS } from "./market-format";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The day of each point: a week apart from `from`, the last one `to`. */
export function pointDates(period: LinePeriod): string[] {
  const start = Date.parse(`${period.from}T00:00:00Z`);
  return period.line.map((_, index) =>
    index === period.line.length - 1 ? period.to : new Date(start + index * 7 * DAY_MS).toISOString().slice(0, 10),
  );
}

/** Change over the period: 127.5 at the end is +27.5 %. */
export function lineChange(values: readonly number[]): number {
  return (values[values.length - 1] ?? 100) / 100 - 1;
}

/** The periods a file has, shortest first. */
export function availablePeriods(file: LinesFile | null): LinePeriodId[] {
  return file ? LINE_PERIODS.filter((id) => file.periods[id]) : [];
}

/** What a row opens on: a year, or all there is when that is less. */
export function defaultPeriod(file: LinesFile | null): LinePeriodId | null {
  const periods = availablePeriods(file);
  return periods.includes("1y") ? "1y" : (periods[0] ?? null);
}

const loaded = new Map<string, Promise<LinesFile | null>>();

/**
 * An instrument's lines, from the site itself; `null` when there are none
 * (before the price job first writes them) or the file is unreadable.
 */
export function loadLines(id: string, fetcher: typeof fetch = fetch): Promise<LinesFile | null> {
  let kept = loaded.get(id);
  if (!kept) {
    kept = fetcher(publicPath(`/data/lines/${encodeURIComponent(id)}.json`))
      .then((response) => (response.ok ? response.json() : null))
      .then((json) => {
        const file = json === null ? null : parseLinesFile(json);
        return file && file.id === id ? file : null;
      })
      .catch(() => null);
    // A failure is not kept: opening the row again tries again.
    kept.then((file) => file === null && loaded.delete(id));
    loaded.set(id, kept);
  }
  return kept;
}

/**
 * Round steps for a change axis from `low` to `high` (fractions: −0.2 to
 * 0.35), three to five of them, 0 among them whenever it is in range.
 */
export function changeTicks(low: number, high: number): number[] {
  const span = Math.max(high - low, 0.01);
  const rough = span / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rough) ?? rough;
  const result: number[] = [];
  for (let value = Math.ceil(low / step - 1e-9) * step; value <= high + 1e-9; value += step) result.push(Math.round(value / step) * step);
  return result.map((value) => (Math.abs(value) < 1e-12 ? 0 : Number(value.toPrecision(12))));
}
