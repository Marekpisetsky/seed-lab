/**
 * Inflation Lens's calculation: what an amount of euros from one year is
 * worth today, and back, from how much prices rose each year (Eurostat's
 * HICP, annual average). Pure (no page, no browser, no data of its own:
 * it gets the series), so the page built ahead, the browser and the tests
 * run the same code.
 *
 * Each year's prices are chained from the year before: the price level of
 * the year before the first rate is 100, and each rate moves it on. "Today"
 * is the last full year in the data.
 */

/** One place's yearly price rises: a country, the euro area or the EU. */
export interface Series {
  /** ISO 3166-1 alpha-2, or "EA" (euro area) and "EU". */
  code: string;
  /** In the page's language, as a list shows it. */
  name: string;
  /** As a sentence says it ("the euro area", "Spain"). */
  sentence: string;
  /** The place's currency today (ISO 4217): amounts are in it. */
  currency: string;
  /** The year of the first rate. */
  from: number;
  /** How much prices rose each year, in %, from `from` on. */
  rates: number[];
}

/** The first year an amount can come from: the one before the first rate. */
export function firstYear(series: Series): number {
  return series.from - 1;
}

/** "Today": the last full year in the data. */
export function lastYear(series: Series): number {
  return series.from + series.rates.length - 1;
}

/** The price level of a year (100 the year before the first rate); null outside the data. */
export function level(series: Series, year: number): number | null {
  if (!Number.isInteger(year) || year < firstYear(series) || year > lastYear(series)) return null;
  let value = 100;
  for (let index = 0; index <= year - series.from; index += 1) value *= 1 + series.rates[index] / 100;
  return value;
}

function usable(amount: number): boolean {
  return Number.isFinite(amount) && amount >= 0;
}

/** What `amount` euros of `year` are worth today; null without a usable amount or year. */
export function worthToday(amount: number, year: number, series: Series): number | null {
  const then = level(series, year);
  const now = level(series, lastYear(series));
  return usable(amount) && then !== null && now !== null ? (amount * now) / then : null;
}

/** What `amount` euros of today were worth in `year`; null without a usable amount or year. */
export function worthThen(amount: number, year: number, series: Series): number | null {
  const then = level(series, year);
  const now = level(series, lastYear(series));
  return usable(amount) && then !== null && now !== null ? (amount * then) / now : null;
}

/** How much prices rose from `year` to today: 0.35 is 35 %. Null outside the data. */
export function rise(year: number, series: Series): number | null {
  const then = level(series, year);
  const now = level(series, lastYear(series));
  return then !== null && now !== null ? now / then - 1 : null;
}

/** The years an amount can come from in a series, newest first: the choices of the year list. */
export function yearOptions(series: Series): number[] {
  const years: number[] = [];
  for (let year = lastYear(series); year >= firstYear(series); year -= 1) years.push(year);
  return years;
}
