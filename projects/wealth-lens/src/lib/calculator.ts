/**
 * The calculator: what the plan gives after the chosen number of years,
 * and, for each goal the user added, when the same plan gets there.
 *
 * Everything is a pure function of the plan, the priced holdings and
 * today's date. Goals are independent: each is worked out on the whole
 * plan, none takes money from another, and they keep the order the user
 * added them in. Countries and purchases are only rows to read: nothing
 * about the user's life (a country, a home, what the money is for) is
 * assumed. All amounts are in today's euros: growth is after inflation and
 * the monthly amount is assumed to rise with prices.
 */

import { connectionsData, type BuyItem, type ConnectionsDataset } from "./connections";
import { costOfLiving, type CountryCost } from "./cost-of-living";
import { addMonths } from "./dates";
import { futureValueWithContributions, monthlyWithdrawal, monthsToGoal, requiredCapital, requiredMonthlyContribution } from "./finance";
import { resolveInvestment, shiftGrowth, type ResolvedInvestment } from "./investment";
import { startingCapital, type StartingCapital } from "./plan";
import { successRatesFor } from "./projections";
import type { AssumptionOverrides, Goal, Holding, Investment } from "./types";
import { WHAT_IF_IDS, whatIfAvailable, whatIfInputs, withBadStart, type WhatIfEffect, type WhatIfId } from "./what-if";

/** What the calculator reads from the plan. */
export interface CalculatorPlan {
  invested: number;
  monthlyContribution: number;
  investment: Investment;
  /** How many years ahead the result looks (1-60). */
  years: number;
  withdrawalRate: number;
  pricesOf: string;
  assumptions: AssumptionOverrides;
  goals: readonly Goal[];
}

/** "The monthly amount that would get there in 30 years", for goals out of reach. */
export const NEEDED_WITHIN_YEARS = 30;

/**
 * Beyond this a date is not a plan: a goal further away is "not at this
 * pace", and no finding quotes a figure that far out.
 */
export const MAX_YEARS = 60;
export const MAX_MONTHS = MAX_YEARS * 12;

/** The withdrawal rates the result offers, with how often each lasted. */
export const WITHDRAWAL_CHOICES = [0.03, 0.04, 0.05] as const;

/** Reached within MAX_YEARS (0 = now). `Infinity` (never) is not. */
export function withinReach(months: number): boolean {
  return months <= MAX_MONTHS;
}

/** The numbers every projection needs. */
export interface Scenario {
  capital: number;
  monthly: number;
  realReturn: number;
  withdrawalRate: number;
  /**
   * A set start ("What if: a bad first decade"): what the money is worth
   * after 0, 1, 2… years, the first being the capital; after the last one it
   * grows at `realReturn` again. Absent: it grows at `realReturn` from today.
   */
  head?: readonly number[];
}

/** Months until the plan reaches `target`: 0 = now, Infinity = never. */
export function monthsTo(scenario: Scenario, target: number): number {
  const { head } = scenario;
  if (!head || head.length < 2) return monthsToGoal(scenario.capital, scenario.monthly, scenario.realReturn, target);
  if (head[0] >= target) return 0;
  for (let year = 1; year < head.length; year++) {
    if (head[year] >= target) {
      // Within that year, as if it went up evenly.
      const share = (target - head[year - 1]) / (head[year] - head[year - 1]);
      return (year - 1) * 12 + Math.max(0, Math.min(1, share)) * 12;
    }
  }
  const last = head.length - 1;
  return last * 12 + monthsToGoal(head[last], scenario.monthly, scenario.realReturn, target);
}

/** What the plan is worth after `months`. */
export function valueAt(scenario: Scenario, months: number): number {
  const { head } = scenario;
  const at = Math.max(0, months);
  if (!head || head.length < 2) return futureValueWithContributions(scenario.capital, scenario.monthly, scenario.realReturn, at / 12);
  const last = head.length - 1;
  if (at >= last * 12) return futureValueWithContributions(head[last], scenario.monthly, scenario.realReturn, (at - last * 12) / 12);
  const year = Math.floor(at / 12);
  const share = at / 12 - year;
  return head[year] + (head[year + 1] - head[year]) * share;
}

/**
 * The steady growth a year that turns the same money put in into the same
 * total after `years`: the plan's own growth, or, after a set start such as
 * "a bad first decade", the average over the whole run.
 */
export function effectiveGrowth(scenario: Scenario, years: number): number {
  const { capital, monthly, head } = scenario;
  if (!head || head.length < 2 || years <= 0 || (capital <= 0 && monthly <= 0)) return scenario.realReturn;
  const target = valueAt(scenario, years * 12);
  // The total rises with the growth, so halving the interval finds it.
  let low = -0.99;
  let high = 2;
  for (let step = 0; step < 80; step++) {
    const middle = (low + high) / 2;
    if (futureValueWithContributions(capital, monthly, middle, years) < target) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

export interface Result {
  years: number;
  /** The steady growth a year that gives `total` (see effectiveGrowth). */
  growthRate: number;
  /** What the money is worth after `years`. */
  total: number;
  /** What the user put in: today's capital plus every monthly amount. */
  putIn: number;
  /** total − putIn: what growth added (negative when the money shrank). */
  growth: number;
  /** What `total` pays a month at the withdrawal rate. */
  income: number;
  /** Share of historical 30-year runs in which that withdrawal rate lasted. */
  lasted: number;
}

export function resultOf(scenario: Scenario, investment: ResolvedInvestment, years: number): Result {
  const months = years * 12;
  const total = valueAt(scenario, months);
  const putIn = scenario.capital + scenario.monthly * months;
  // With the other rates the result offers, in one pass: they are asked for next.
  const rates = [...new Set([...WITHDRAWAL_CHOICES, scenario.withdrawalRate])];
  return {
    years,
    growthRate: effectiveGrowth(scenario, years),
    total,
    putIn,
    growth: total - putIn,
    income: monthlyWithdrawal(Math.max(0, total), scenario.withdrawalRate),
    lasted: successRatesFor(investment, rates)[rates.indexOf(scenario.withdrawalRate)],
  };
}

/** One year of the chart: what was put in so far and what it is worth. */
export interface YearPoint {
  year: number;
  putIn: number;
  total: number;
}

/**
 * Year 0 (today) to the chosen year, for the chart: the same projection as
 * the result, so its last point is the result.
 */
export function yearlyPath(scenario: Scenario, years: number): YearPoint[] {
  return Array.from({ length: years + 1 }, (_, year) => ({
    year,
    putIn: scenario.capital + scenario.monthly * 12 * year,
    total: valueAt(scenario, year * 12),
  }));
}

// ---------------------------------------------------------------------------
// Countries and purchases: rows to read
// ---------------------------------------------------------------------------

export interface CountryCell {
  /** One person's monthly cost there, in today's euros. */
  amount: number;
  /** Capital whose withdrawals pay it. */
  target: number;
  /** Months until the plan gets there: 0 = now, Infinity = never. */
  months: number;
  /** Paid by what the money pays after the chosen years. */
  covered: boolean;
}

/** A country of the table; its name comes from the page's language (i18n/countries.ts). */
export interface CountryRow {
  code: string;
  withoutHousing: CountryCell;
  withHousing: CountryCell;
  referenceDate: string;
}

/** The rows shown before "Show all": the five cheapest, plus these. */
export const FEATURED_COUNTRIES = ["PE", "NL"] as const;
const CHEAPEST_SHOWN = 5;

/**
 * ✓ when what the money pays after the chosen years pays it: the table
 * reads "What €X/month covers". Money that shrinks can pay a country today
 * and no longer at the end; then it is "not at this pace", never "now".
 */
function cell(scenario: Scenario, horizonMonths: number, amount: number): CountryCell {
  const target = requiredCapital(amount * 12, scenario.withdrawalRate);
  const atEnd = valueAt(scenario, horizonMonths);
  const covered = atEnd >= target;
  const first = monthsTo(scenario, target);
  // Not paid at the end: when it gets there after that, growing on from the end.
  const months = covered || first > horizonMonths ? first : horizonMonths + monthsToGoal(Math.max(0, atEnd), scenario.monthly, scenario.realReturn, target);
  return { amount, target, months, covered };
}

/** Every country of the list, cheapest first (without housing), each with and without paying for housing. */
export function countryRows(
  scenario: Scenario,
  horizonMonths: number,
  countries: readonly CountryCost[] = costOfLiving.countries,
): CountryRow[] {
  return [...countries]
    .sort((a, b) => a.monthlyCostEur.withoutRent - b.monthlyCostEur.withoutRent || a.code.localeCompare(b.code))
    .map((country) => ({
      code: country.code,
      withoutHousing: cell(scenario, horizonMonths, country.monthlyCostEur.withoutRent),
      withHousing: cell(scenario, horizonMonths, country.monthlyCostEur.withRent),
      referenceDate: country.referenceDate,
    }));
}

/** The five cheapest and the featured ones, in the table's order. */
export function featuredRows(rows: readonly CountryRow[]): CountryRow[] {
  return rows.filter((row, index) => index < CHEAPEST_SHOWN || (FEATURED_COUNTRIES as readonly string[]).includes(row.code));
}

/** A purchase of the list; its name and source come from the page's language (things.items). */
export interface PricedItem {
  /** The item's id in src/data/connections.json. */
  id: string;
  amount: number;
  referenceDate: string;
}

const roundTo10 = (value: number) => Math.round(value / 10) * 10;

/** The "Buy it" list with its prices. Months of living somewhere are priced with housing: a stay there includes a place to stay. */
export function pricedItems(
  data: ConnectionsDataset = connectionsData,
  countries: readonly CountryCost[] = costOfLiving.countries,
): PricedItem[] {
  const byCode = new Map(countries.map((country) => [country.code, country]));
  return data.buy.map((item: BuyItem) => {
    let amount = item.amount ?? 0;
    if (item.monthsAt) {
      const place = item.monthsAt.countries;
      const monthly = place.reduce((sum, code) => sum + (byCode.get(code)?.monthlyCostEur.withRent ?? 0), 0) / place.length;
      amount = roundTo10(monthly * item.monthsAt.months) + (item.plus ?? 0);
    }
    return { id: item.id, amount, referenceDate: item.referenceDate };
  });
}

export interface ItemStatus {
  item: PricedItem;
  months: number;
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

/** A goal against the plan: numbers only; its name and the calculation in words come from i18n/goal-text.ts. */
export interface GoalStatus {
  goal: Goal;
  /** monthly: a cost the withdrawals pay every month; once: an amount to have. */
  kind: "monthly" | "once";
  /** The monthly cost or the amount. */
  amount: number;
  /** Capital that gets there. */
  target: number;
  /** Months until the plan gets there: 0 = now, Infinity = never. */
  months: number;
  /** Within MAX_YEARS (60). */
  reachable: boolean;
  /** When it is reached; `null` now or out of reach. */
  date: Date | null;
  /** Out of reach: the monthly amount that would get there in 30 years. */
  needed: number | null;
  /** False for an item or country a file names but the lists no longer have. */
  known: boolean;
  /** When the country's or the item's figures are from ("2026-09"); `null` for the user's own amounts. */
  referenceDate: string | null;
}

interface GoalShape {
  kind: "monthly" | "once";
  amount: number;
  referenceDate: string | null;
}

function shapeOf(goal: Goal, items: ReadonlyMap<string, PricedItem>, countries: ReadonlyMap<string, CountryCost>): GoalShape | null {
  switch (goal.kind) {
    case "live": {
      const country = countries.get(goal.country);
      if (!country) return null;
      return { kind: "monthly", amount: goal.housing ? country.monthlyCostEur.withRent : country.monthlyCostEur.withoutRent, referenceDate: country.referenceDate };
    }
    case "buy": {
      const item = items.get(goal.item);
      return item ? { kind: "once", amount: item.amount, referenceDate: item.referenceDate } : null;
    }
    case "buy-own":
    case "amount":
      return { kind: "once", amount: goal.amount, referenceDate: null };
    case "monthly":
      return { kind: "monthly", amount: goal.amount, referenceDate: null };
  }
}

/** Each goal against the same plan, in the order the user added them. */
export function goalStatuses(
  goals: readonly Goal[],
  scenario: Scenario,
  today: Date,
  items: readonly PricedItem[] = pricedItems(),
  countries: readonly CountryCost[] = costOfLiving.countries,
): GoalStatus[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const countryByCode = new Map(countries.map((country) => [country.code, country]));
  return goals.map((goal) => {
    const shape = shapeOf(goal, itemById, countryByCode);
    if (!shape) {
      return { goal, kind: "once", amount: 0, target: 0, months: Infinity, reachable: false, date: null, needed: null, known: false, referenceDate: null };
    }
    const target = shape.kind === "monthly" ? requiredCapital(shape.amount * 12, scenario.withdrawalRate) : shape.amount;
    const months = monthsTo(scenario, target);
    const reachable = withinReach(months);
    const date = reachable && months > 1e-9 ? addMonths(today, Math.ceil(months - 1e-9)) : null;
    const needed = reachable ? null : requiredMonthlyContribution(scenario.capital, scenario.realReturn, NEEDED_WITHIN_YEARS * 12, target);
    return { goal, kind: shape.kind, amount: shape.amount, target, months, reachable, date, needed, known: true, referenceDate: shape.referenceDate };
  });
}

// ---------------------------------------------------------------------------
// Everything at once
// ---------------------------------------------------------------------------

export interface Calculation {
  capital: StartingCapital;
  investment: ResolvedInvestment;
  scenario: Scenario;
  /** The "What if…?" applied, if any (lib/what-if.ts). */
  whatIf: WhatIfId | null;
  result: Result;
  goals: GoalStatus[];
  countries: CountryRow[];
}

/**
 * `holdings` must already carry their prices (lib/auto-price.ts). With a
 * "What if…?" (lib/what-if.ts), everything is worked out with it: a
 * scenario that cannot apply to this plan (five more years past 60, a bad
 * decade with no ups and downs) is left out.
 */
export function calculate(plan: CalculatorPlan, holdings: readonly Holding[], today: Date, whatIf: WhatIfId | null = null): Calculation {
  const capital = startingCapital(holdings, plan.invested);
  const resolved = resolveInvestment(plan.investment, holdings, plan);
  const applied = whatIf !== null && whatIfAvailable(whatIf, plan.years, resolved) ? whatIf : null;
  const inputs = whatIfInputs(applied, plan.monthlyContribution, plan.years);
  const investment = inputs.growth !== 0 ? shiftGrowth(resolved, inputs.growth) : resolved;
  const plain: Scenario = {
    capital: capital.amount,
    monthly: inputs.monthly,
    realReturn: investment.realReturn,
    withdrawalRate: plan.withdrawalRate,
  };
  const scenario = inputs.badStart ? withBadStart(plain, investment, inputs.years) : plain;
  return {
    capital,
    investment,
    scenario,
    whatIf: applied,
    result: resultOf(scenario, investment, inputs.years),
    goals: goalStatuses(plan.goals, scenario, today),
    countries: countryRows(scenario, inputs.years * 12),
  };
}

/**
 * What each "What if…?" would change, in euros at the end of the plan's
 * years (five more years: at the end of those), worked out on a
 * calculation without one: the same projection `calculate` makes with it.
 */
export function whatIfEffects(base: Calculation): WhatIfEffect[] {
  const { scenario, investment, result } = base;
  return WHAT_IF_IDS.map((id) => {
    const available = whatIfAvailable(id, result.years, investment);
    if (!available) return { id, change: 0, available };
    const inputs = whatIfInputs(id, scenario.monthly, result.years);
    const plain: Scenario = { ...scenario, monthly: inputs.monthly, realReturn: scenario.realReturn + inputs.growth };
    const changed = inputs.badStart ? withBadStart(plain, investment, inputs.years) : plain;
    return { id, change: valueAt(changed, inputs.years * 12) - result.total, available };
  });
}

/** The "Buy it" list against the plan: now, in N years, or out of reach. */
export function itemStatuses(scenario: Scenario, items: readonly PricedItem[] = pricedItems()): ItemStatus[] {
  return items.map((item) => ({ item, months: monthsTo(scenario, item.amount) }));
}
