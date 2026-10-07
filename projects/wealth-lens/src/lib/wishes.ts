/**
 * "With this you could": two or three wishes under the big number, each
 * with when the plan gets there, chosen to cover three horizons (research/
 * wealth-lens/deseos.md):
 *
 * - short, a trip: the dearest of the trips the plan reaches within
 *   3 years; if none, the cheapest one, whenever it comes;
 * - medium, something bigger: the dearest of a home deposit, a new car
 *   or a used car that the plan reaches within 15 years; if none, the
 *   cheapest of them, whenever it comes;
 * - long: stop working, the money paying a month of living with housing
 *   in the country of the prices; if the plan never gets there, living in
 *   a cheaper country where many Europeans go, the dearest one it reaches.
 *
 * A wish the plan does not reach within 60 years is not shown: each one
 * says when. The choice depends only on the plan and the prices, the same
 * for everyone with the same numbers; it never says what to do.
 */

import { MAX_MONTHS, monthsTo, pricedItems, withinReach, type PricedItem, type Scenario } from "./calculator";
import { DEFAULT_PRICE_COUNTRY } from "./connections";
import { costOfLiving, type CountryCost } from "./cost-of-living";
import { requiredCapital } from "./finance";
import type { NewGoal } from "./types";

/** "Soon": a trip reached within this many years. */
export const SHORT_WITHIN_YEARS = 3;
/** "In a few years": a home deposit or a car reached within this many years. */
export const MEDIUM_WITHIN_YEARS = 15;
/** Where many Europeans go to live on less, in this order: the long wish when stopping work at home is out of reach (deseos.md). */
export const LIVE_ABROAD = ["PT", "ES", "TH", "PE"] as const;

export type WishHorizon = "short" | "medium" | "long";

export interface Wish {
  horizon: WishHorizon;
  /** What tapping it adds to My goals. */
  goal: NewGoal;
  /** A thing of the list; `null` for a life somewhere (stop working, live abroad). */
  item: PricedItem | null;
  /** The once amount, or what the money pays a month for a life somewhere. */
  amount: number;
  /** Capital that gets there. */
  target: number;
  /** Months until the plan gets there: 0 = now. */
  months: number;
}

interface Candidate {
  amount: number;
  months: number;
}

/**
 * The dearest candidate reached within `withinMonths`; if none, the
 * cheapest one reached at all (within 60 years); `null` if none is.
 * Ties keep the list's order.
 */
export function pick<T extends Candidate>(candidates: readonly T[], withinMonths: number): T | null {
  const reached = candidates.filter((candidate) => withinReach(candidate.months));
  const soon = reached.filter((candidate) => candidate.months <= withinMonths + 1e-9);
  if (soon.length > 0) return soon.reduce((dearest, candidate) => (candidate.amount > dearest.amount ? candidate : dearest));
  if (reached.length === 0) return null;
  return reached.reduce((cheapest, candidate) => (candidate.amount < cheapest.amount ? candidate : cheapest));
}

function thingWish(horizon: WishHorizon, item: PricedItem, scenario: Scenario): Wish {
  return { horizon, goal: { kind: "buy", item: item.id }, item, amount: item.amount, target: item.amount, months: monthsTo(scenario, item.amount) };
}

function lifeWish(country: CountryCost, scenario: Scenario, stopWorking: boolean): Wish {
  const amount = country.monthlyCostEur.withRent;
  const target = requiredCapital(amount * 12, scenario.withdrawalRate);
  const goal: NewGoal = stopWorking ? { kind: "live", country: country.code, housing: true, stopWorking: true } : { kind: "live", country: country.code, housing: true };
  return { horizon: "long", goal, item: null, amount, target, months: monthsTo(scenario, target) };
}

/** The long wish: stop working at home, or else the dearest of the cheaper countries the plan reaches. */
function longWish(scenario: Scenario, country: string, countries: ReadonlyMap<string, CountryCost>): Wish | null {
  const home = countries.get(country);
  const stop = home ? lifeWish(home, scenario, true) : null;
  if (stop && withinReach(stop.months)) return stop;
  const abroad = LIVE_ABROAD.filter((code) => code !== country)
    .map((code) => countries.get(code))
    .filter((entry): entry is CountryCost => entry !== undefined && (!home || entry.monthlyCostEur.withRent < home.monthlyCostEur.withRent))
    .map((entry) => lifeWish(entry, scenario, false));
  // Only within reach, the dearest: "pick" with the whole 60 years as "soon".
  return pick(abroad, MAX_MONTHS);
}

/** Two or three wishes for this plan, at the prices of `country`: short, medium, long, those the plan reaches. */
export function wishesFor(
  scenario: Scenario,
  country: string = DEFAULT_PRICE_COUNTRY,
  items: readonly PricedItem[] = pricedItems(country),
  countries: readonly CountryCost[] = costOfLiving.countries,
): Wish[] {
  const byHorizon = (horizon: "short" | "medium") => items.filter((item) => item.horizon === horizon).map((item) => thingWish(horizon, item, scenario));
  const short = pick(byHorizon("short"), SHORT_WITHIN_YEARS * 12);
  const medium = pick(byHorizon("medium"), MEDIUM_WITHIN_YEARS * 12);
  const long = longWish(scenario, country, new Map(countries.map((entry) => [entry.code, entry])));
  return [short, medium, long].filter((wish): wish is Wish => wish !== null);
}
