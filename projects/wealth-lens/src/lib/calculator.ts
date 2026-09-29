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
import { costOfLiving, countryInSentence, type CountryCost } from "./cost-of-living";
import { addMonths } from "./dates";
import { monthlyWithdrawal, requiredCapital, requiredMonthlyContribution } from "./finance";
import { formatDuration, formatEur, formatMonthYear, formatRate } from "./format";
import { dividendNote, periodText, resolveInvestment, type ResolvedInvestment } from "./investment";
import { startingCapital, type StartingCapital } from "./plan";
import { MAX_YEARS, monthsTo, valueAt, withinReach, type Scenario } from "./report";
import { cachedSuccessRate } from "./simulation";
import type { Goal, Holding, Investment } from "./types";

/** What the calculator reads from the plan. */
export interface CalculatorPlan {
  invested: number;
  monthlyContribution: number;
  investment: Investment;
  /** How many years ahead the result looks (1-60). */
  years: number;
  withdrawalRate: number;
  goals: readonly Goal[];
}

/** "The monthly amount that would get there in 30 years", for goals out of reach. */
export const NEEDED_WITHIN_YEARS = 30;

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

export interface Result {
  years: number;
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
  return {
    years,
    total,
    putIn,
    growth: total - putIn,
    income: monthlyWithdrawal(Math.max(0, total), scenario.withdrawalRate),
    lasted: cachedSuccessRate(investment.key, investment.returns, scenario.withdrawalRate),
  };
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

export interface CountryRow {
  code: string;
  /** "Peru", "the Netherlands". */
  name: string;
  withoutHousing: CountryCell;
  withHousing: CountryCell;
  source: string;
  referenceDate: string;
}

/** The rows shown before "Show all": the five cheapest, plus these. */
export const FEATURED_COUNTRIES = ["PE", "NL"] as const;
const CHEAPEST_SHOWN = 5;

function cell(scenario: Scenario, horizonMonths: number, amount: number): CountryCell {
  const target = requiredCapital(amount * 12, scenario.withdrawalRate);
  const months = monthsTo(scenario, target);
  return { amount, target, months, covered: months <= horizonMonths };
}

/** Every country of the list, cheapest first (without housing), each with and without paying for housing. */
export function countryRows(
  scenario: Scenario,
  horizonMonths: number,
  countries: readonly CountryCost[] = costOfLiving.countries,
): CountryRow[] {
  return [...countries]
    .sort((a, b) => a.monthlyCostEur.withoutRent - b.monthlyCostEur.withoutRent || a.name.localeCompare(b.name))
    .map((country) => ({
      code: country.code,
      name: countryInSentence(country.name),
      withoutHousing: cell(scenario, horizonMonths, country.monthlyCostEur.withoutRent),
      withHousing: cell(scenario, horizonMonths, country.monthlyCostEur.withRent),
      source: country.source,
      referenceDate: country.referenceDate,
    }));
}

/** The five cheapest and the featured ones, in the table's order. */
export function featuredRows(rows: readonly CountryRow[]): CountryRow[] {
  return rows.filter((row, index) => index < CHEAPEST_SHOWN || (FEATURED_COUNTRIES as readonly string[]).includes(row.code));
}

export interface PricedItem {
  /** The item's id in src/data/connections.json. */
  id: string;
  name: string;
  amount: number;
  source: string;
  referenceDate: string;
}

const roundTo10 = (value: number) => Math.round(value / 10) * 10;

/**
 * The "Buy it" list with its prices. Months of living somewhere are priced
 * with housing (someone living there pays for a place to stay); items
 * priced from "your own country" need a country the app no longer asks
 * for, so they are left out.
 */
export function pricedItems(
  data: ConnectionsDataset = connectionsData,
  countries: readonly CountryCost[] = costOfLiving.countries,
): PricedItem[] {
  const byCode = new Map(countries.map((country) => [country.code, country]));
  return data.buy
    .filter((item: BuyItem) => !item.monthsAt || item.monthsAt.countries !== "home")
    .map((item) => {
      let amount = item.amount ?? 0;
      if (item.monthsAt && item.monthsAt.countries !== "home") {
        const place = item.monthsAt.countries;
        const monthly = place.reduce((sum, code) => sum + (byCode.get(code)?.monthlyCostEur.withRent ?? 0), 0) / place.length;
        amount = roundTo10(monthly * item.monthsAt.months) + (item.plus ?? 0);
      }
      return { id: item.id, name: item.name, amount, source: item.source, referenceDate: item.referenceDate };
    });
}

export interface ItemStatus {
  item: PricedItem;
  months: number;
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export interface GoalStatus {
  goal: Goal;
  /** "Live in Peru", "A used car", "Reach €100,000", "An income of €1,500 a month". */
  name: string;
  /** "with housing", "without housing", the income's own name, or nothing. */
  detail: string | null;
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
  /** How the status is worked out, one step per line. */
  explain: string[];
  /** False for an item a file names but the list no longer has. */
  known: boolean;
}

interface GoalShape {
  name: string;
  detail: string | null;
  kind: "monthly" | "once";
  amount: number;
  source: string;
}

function shapeOf(goal: Goal, items: ReadonlyMap<string, PricedItem>, countries: ReadonlyMap<string, CountryCost>): GoalShape | null {
  switch (goal.kind) {
    case "live": {
      const country = countries.get(goal.country);
      if (!country) return null;
      return {
        name: `Live in ${countryInSentence(country.name)}`,
        detail: goal.housing ? "with housing" : "without housing",
        kind: "monthly",
        amount: goal.housing ? country.monthlyCostEur.withRent : country.monthlyCostEur.withoutRent,
        source: `One person, ${goal.housing ? "with" : "without"} housing: ${country.source} (estimate, ${country.referenceDate}).`,
      };
    }
    case "buy": {
      const item = items.get(goal.item);
      if (!item) return null;
      return { name: item.name, detail: null, kind: "once", amount: item.amount, source: `${item.source} (estimate)` };
    }
    case "buy-own":
      return { name: goal.name, detail: null, kind: "once", amount: goal.amount, source: "Your own price." };
    case "amount":
      return { name: `Reach ${formatEur(goal.amount)}`, detail: null, kind: "once", amount: goal.amount, source: "Your own amount." };
    case "income":
      return {
        name: `An income of ${formatEur(goal.amount)} a month`,
        detail: goal.name,
        kind: "monthly",
        amount: goal.amount,
        source: "Your own amount.",
      };
  }
}

function growthLine({ realReturn }: Scenario, investment: ResolvedInvestment): string {
  const dividends = dividendNote(investment);
  return `growing ${formatRate(realReturn)} a year after inflation (${investment.name}, ${periodText(investment)} average${dividends ? `; ${dividends}` : ""})`;
}

/** Each goal against the same plan, in the order the user added them. */
export function goalStatuses(
  goals: readonly Goal[],
  scenario: Scenario,
  investment: ResolvedInvestment,
  today: Date,
  items: readonly PricedItem[] = pricedItems(),
  countries: readonly CountryCost[] = costOfLiving.countries,
): GoalStatus[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const countryByCode = new Map(countries.map((country) => [country.code, country]));
  const start = `${formatEur(scenario.capital)} now + ${formatEur(scenario.monthly)} a month, ${growthLine(scenario, investment)}`;
  return goals.map((goal) => {
    const shape = shapeOf(goal, itemById, countryByCode);
    if (!shape) {
      return {
        goal,
        name: "Not in the list any more",
        detail: null,
        kind: "once",
        amount: 0,
        target: 0,
        months: Infinity,
        reachable: false,
        date: null,
        needed: null,
        explain: ["A file named something the list no longer has. Remove it with ×."],
        known: false,
      };
    }
    const target = shape.kind === "monthly" ? requiredCapital(shape.amount * 12, scenario.withdrawalRate) : shape.amount;
    const months = monthsTo(scenario, target);
    const reachable = withinReach(months);
    const date = reachable && months > 0 ? addMonths(today, Math.ceil(months - 1e-9)) : null;
    const needed = reachable ? null : requiredMonthlyContribution(scenario.capital, scenario.realReturn, NEEDED_WITHIN_YEARS * 12, target);
    const cost =
      shape.kind === "monthly"
        ? `${formatEur(shape.amount)} a month × 12 ÷ ${formatRate(scenario.withdrawalRate)} taken out a year = ${formatEur(target)} needed.`
        : `${formatEur(target)} needed.`;
    const reach =
      months === 0
        ? `Already there: you have ${formatEur(scenario.capital)}.`
        : reachable && date
          ? `${start}: ${formatEur(target)} in ${formatDuration(months)} (${formatMonthYear(date)}).`
          : `${start}: more than ${MAX_YEARS} years. In ${NEEDED_WITHIN_YEARS} years it would take ${formatEur(needed ?? 0)} a month.`;
    return {
      goal,
      name: shape.name,
      detail: shape.detail,
      kind: shape.kind,
      amount: shape.amount,
      target,
      months,
      reachable,
      date,
      needed,
      explain: [cost, reach, shape.source],
      known: true,
    };
  });
}

// ---------------------------------------------------------------------------
// Everything at once
// ---------------------------------------------------------------------------

export interface Calculation {
  capital: StartingCapital;
  investment: ResolvedInvestment;
  scenario: Scenario;
  result: Result;
  goals: GoalStatus[];
  countries: CountryRow[];
}

/** `holdings` must already carry their prices (lib/auto-price.ts). */
export function calculate(plan: CalculatorPlan, holdings: readonly Holding[], today: Date): Calculation {
  const capital = startingCapital(holdings, plan.invested);
  const investment = resolveInvestment(plan.investment, holdings);
  const scenario: Scenario = {
    capital: capital.amount,
    monthly: plan.monthlyContribution,
    realReturn: investment.realReturn,
    withdrawalRate: plan.withdrawalRate,
    horizonMonths: plan.years * 12,
  };
  return {
    capital,
    investment,
    scenario,
    result: resultOf(scenario, investment, plan.years),
    goals: goalStatuses(plan.goals, scenario, investment, today),
    countries: countryRows(scenario, plan.years * 12),
  };
}

/** The "Buy it" list against the plan: now, in N years, or out of reach. */
export function itemStatuses(scenario: Scenario, items: readonly PricedItem[] = pricedItems()): ItemStatus[] {
  return items.map((item) => ({ item, months: monthsTo(scenario, item.amount) }));
}
