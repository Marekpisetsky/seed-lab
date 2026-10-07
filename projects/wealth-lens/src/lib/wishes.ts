/**
 * "With this you could": up to three wishes under the big number, each
 * with when the plan gets there (research/wealth-lens/deseos.md).
 *
 * Wishes belong to the person (docs/direction.md): first the goals they
 * marked as priorities in My goals, in their order. The rest of the line
 * shows examples to discover, one from each area not yet covered, in this
 * order: an experience (a trip), a home, and time (living without
 * working). There is no fixed short, medium or long: within an area, the
 * example shown is the dearest the plan reaches by the end of its own
 * years; if none does, the cheapest, with its date. An example the plan
 * does not reach within 60 years is left out.
 *
 * Each wish is worked out on its own against the same plan, like every
 * goal: none takes money from another, and a wish has no wanted date. The
 * choice depends only on the plan, its goals and the prices; it never says
 * what to do.
 */

import { monthsTo, pricedItems, withinReach, type GoalStatus, type PricedItem, type Scenario } from "./calculator";
import { DEFAULT_PRICE_COUNTRY, type WishArea } from "./connections";
import { costOfLiving, type CountryCost } from "./cost-of-living";
import { requiredCapital } from "./finance";
import type { NewGoal } from "./types";

/** The areas the line shows examples of, in this order (docs/direction.md names them among the areas to research). */
export const LINE_AREAS: readonly WishArea[] = ["experiences", "housing", "time"];
/** At most this many wishes in the line. */
export const MAX_WISHES = 3;

export interface Wish {
  /** Stable for React: the goal's id, or the example's. */
  key: string;
  /** A priority of the person's own, from My goals. */
  own: GoalStatus | null;
  /** An example: its area, and what tapping it adds to My goals. */
  area: WishArea | null;
  goal: NewGoal | null;
  /** A thing of the list; `null` for living without working or a goal of the person's own. */
  item: PricedItem | null;
  /** The once amount, or the monthly cost of living without working. */
  amount: number;
  monthly: boolean;
  /** Capital that gets there. */
  target: number;
  /** Months until the plan gets there: 0 = now, Infinity = never. */
  months: number;
}

/**
 * Of the candidates the plan reaches within 60 years: the dearest reached
 * by `byMonths` (the end of the plan's years); if none is, the cheapest.
 * `null` when none is reached at all. Ties keep the list's order.
 */
export function pick<T extends { target: number; months: number }>(candidates: readonly T[], byMonths: number): T | null {
  const reached = candidates.filter((candidate) => withinReach(candidate.months));
  const inPlan = reached.filter((candidate) => candidate.months <= byMonths + 1e-9);
  if (inPlan.length > 0) return inPlan.reduce((dearest, candidate) => (candidate.target > dearest.target ? candidate : dearest));
  if (reached.length === 0) return null;
  return reached.reduce((cheapest, candidate) => (candidate.target < cheapest.target ? candidate : cheapest));
}

function thingExample(item: PricedItem, scenario: Scenario): Wish {
  return {
    key: `example:${item.id}`,
    own: null,
    area: item.area,
    goal: { kind: "buy", item: item.id, important: true },
    item,
    amount: item.amount,
    monthly: false,
    target: item.amount,
    months: monthsTo(scenario, item.amount),
  };
}

/** Living without working where the prices are from: what the money pays a month covers a life there, rent included. */
function freedomExample(country: CountryCost, scenario: Scenario): Wish {
  const amount = country.monthlyCostEur.withRent;
  const target = requiredCapital(amount * 12, scenario.withdrawalRate);
  const estimateDate = country.priceLevel ? String(country.priceLevel.year) : country.referenceDate;
  return {
    key: "example:freedom",
    own: null,
    area: "time",
    goal: { kind: "freedom", amount, country: country.code, estimateDate, important: true },
    item: null,
    amount,
    monthly: true,
    target,
    months: monthsTo(scenario, target),
  };
}

function ownWish(status: GoalStatus): Wish {
  return {
    key: status.goal.id,
    own: status,
    area: null,
    goal: null,
    item: status.item,
    amount: status.amount,
    monthly: status.kind === "monthly",
    target: status.target,
    months: status.months,
  };
}

/** The area a goal of the person's own covers, when it is one of the examples' kinds. */
function areaOf(status: GoalStatus): WishArea | null {
  if (status.goal.kind === "freedom") return "time";
  return status.item?.area ?? null;
}

/**
 * The line for this plan: the person's priorities, then examples at the
 * prices of `country`, up to three. `years` are the plan's own years.
 */
export function wishesFor(
  scenario: Scenario,
  years: number,
  goals: readonly GoalStatus[] = [],
  country: string = DEFAULT_PRICE_COUNTRY,
  items: readonly PricedItem[] = pricedItems(country),
  countries: readonly CountryCost[] = costOfLiving.countries,
): Wish[] {
  const own = goals.filter((status) => status.known && status.goal.important).slice(0, MAX_WISHES).map(ownWish);
  const covered = new Set(own.map((wish) => (wish.own ? areaOf(wish.own) : null)));
  const home = countries.find((entry) => entry.code === country);
  const examples = LINE_AREAS.filter((area) => !covered.has(area)).map((area) => {
    const candidates = items.filter((item) => item.area === area).map((item) => thingExample(item, scenario));
    if (area === "time" && home) candidates.push(freedomExample(home, scenario));
    return pick(candidates, years * 12);
  });
  return [...own, ...examples.filter((wish): wish is Wish => wish !== null)].slice(0, MAX_WISHES);
}
