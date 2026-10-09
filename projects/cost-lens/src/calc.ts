/**
 * Cost Lens's calculation: what a monthly amount in one country is worth
 * in another, from seed-kit's cost of living (official World Bank data). Pure (no
 * page, no browser, no data of its own: it gets the countries), so the
 * page built ahead, the browser and the tests run the same code.
 *
 * Every figure is an estimate: the countries' costs are national averages,
 * rounded.
 */

/** A country as Cost Lens uses it: what an average person there lives on a month, housing included, in euros. */
export interface Country {
  /** ISO 3166-1 alpha-2. */
  code: string;
  /** In the page's language, as a list shows it ("Netherlands"). */
  name: string;
  /** As a sentence says it ("the Netherlands"). */
  sentence: string;
  cost: number;
}

/** An amount that can be compared: a number above zero. */
function usable(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0;
}

/**
 * What you would need a month in `to` to live like `amount` a month in
 * `from`: the amount times how much more (or less) living costs there.
 * Null without a usable amount.
 */
export function equivalent(amount: number, from: Country, to: Country): number | null {
  if (!usable(amount)) return null;
  return (amount * to.cost) / from.cost;
}

/** How many times as far money from `from` goes in `to`: 2 is twice as far, 0.5 half as far. */
export function reach(from: Country, to: Country): number {
  return from.cost / to.cost;
}

export interface Ranked {
  country: Country;
  reach: number;
}

/**
 * The countries where money from `from` goes furthest and least far,
 * `count` of each, `from` itself left out. Equal reaches keep the list's order.
 */
export function extremes(from: Country, countries: readonly Country[], count = 5): { furthest: Ranked[]; least: Ranked[] } {
  const ranked = countries
    .filter((country) => country.code !== from.code)
    .map((country) => ({ country, reach: reach(from, country) }))
    .sort((a, b) => b.reach - a.reach);
  const size = Math.min(count, Math.floor(ranked.length / 2));
  return { furthest: ranked.slice(0, size), least: ranked.slice(ranked.length - size).reverse() };
}

/** A country by its code, or undefined. */
export function byCode(code: string, countries: readonly Country[]): Country | undefined {
  return countries.find((country) => country.code === code);
}
