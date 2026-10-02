/**
 * Cost Lens's calculation: what a monthly amount in one country is worth
 * in another, from seed-kit's cost of living of 172 countries. Pure (no
 * page, no browser, no data of its own: it gets the countries), so the
 * page built ahead, the browser and the tests run the same code.
 *
 * Every figure is an estimate: the countries' costs are rounded averages,
 * and some are estimated from their price level (`estimated`).
 */

/** A country as Cost Lens uses it: its monthly cost for one person, in euros, with and without housing. */
export interface Country {
  /** ISO 3166-1 alpha-2. */
  code: string;
  /** In the page's language, as a list shows it ("Netherlands"). */
  name: string;
  /** As a sentence says it ("the Netherlands"). */
  sentence: string;
  withoutRent: number;
  withRent: number;
  /** Estimated from its price level, not compiled from cost-of-living sources (shown "≈"). */
  estimated: boolean;
}

/** Both ways of living: renting a home, or already having one. */
export interface Both {
  withRent: number;
  withoutRent: number;
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
export function equivalent(amount: number, from: Country, to: Country): Both | null {
  if (!usable(amount)) return null;
  return {
    withRent: (amount * to.withRent) / from.withRent,
    withoutRent: (amount * to.withoutRent) / from.withoutRent,
  };
}

/** How many times as far money from `from` goes in `to`: 2 is twice as far, 0.5 half as far. */
export function reach(from: Country, to: Country): Both {
  return { withRent: from.withRent / to.withRent, withoutRent: from.withoutRent / to.withoutRent };
}

export interface Ranked {
  country: Country;
  reach: Both;
}

/**
 * The countries where money from `from` goes furthest and least far, by
 * the cost of living with housing (the one most people pay), `count` of
 * each, `from` itself left out. Equal reaches keep the list's order.
 */
export function extremes(from: Country, countries: readonly Country[], count = 5): { furthest: Ranked[]; least: Ranked[] } {
  const ranked = countries
    .filter((country) => country.code !== from.code)
    .map((country) => ({ country, reach: reach(from, country) }))
    .sort((a, b) => b.reach.withRent - a.reach.withRent);
  const size = Math.min(count, Math.floor(ranked.length / 2));
  return { furthest: ranked.slice(0, size), least: ranked.slice(ranked.length - size).reverse() };
}

/** A country by its code, or undefined. */
export function byCode(code: string, countries: readonly Country[]): Country | undefined {
  return countries.find((country) => country.code === code);
}
