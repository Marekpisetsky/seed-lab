/**
 * "My money", the daily brief: the answer first, worked out from the plan.
 *
 * Everything here is a pure function of the plan, the priced holdings and
 * today's date: which goal the report is about (the one the user pinned, or
 * the next milestone), when it is reached (or what the money pays after a
 * chosen number of years), the headline with where each number comes from,
 * the status of every connection, and what a pinned purchase costs later.
 * Levers (lib/levers.ts) and findings (lib/findings.ts) build on it.
 *
 * All amounts are in today's euros: growth is after inflation and the
 * monthly amount is assumed to rise with prices.
 */

import { allConnections, targetCapital, type Connection } from "./connections";
import { addMonths } from "./dates";
import { futureValueWithContributions, monthlyWithdrawal, monthsToGoal } from "./finance";
import { formatDuration, formatEur, formatMonthYear, formatPercent, formatRate, formatYears } from "./format";
import { resolveInvestment, type ResolvedInvestment } from "./investment";
import { startingCapital, type StartingCapital } from "./plan";
import type { Holding, Plan } from "./types";

/** The plan the report reads (see Plan in lib/types.ts). */
export type ReportPlan = Plan;

/** "Stop working" is the default goal when it is reachable within this many years. */
export const STOP_WORKING_WITHIN_YEARS = 40;
export const STOP_WORKING_ID = "life:stop-working";

/** The numbers every projection needs. */
export interface Scenario {
  capital: number;
  monthly: number;
  realReturn: number;
  withdrawalRate: number;
  /** `null`: look at when the goal is reached. */
  horizonMonths: number | null;
}

export interface ConnectionStatus {
  connection: Connection;
  /** Capital that pays for it. */
  target: number;
  /** Months until the capital gets there: 0 = now, Infinity = never. */
  months: number;
}

export interface Answer {
  mode: "goal" | "horizon";
  /** Goal mode: months until the goal (0 = now, Infinity = never). Horizon mode: the horizon. */
  months: number;
  date: Date | null;
  /** Capital at that point. */
  capital: number;
  /** What that capital pays per month at the withdrawal rate. */
  income: number;
  /** Capital at that point ÷ the goal's target. */
  progress: number;
}

export interface HeadlineNumber {
  text: string;
  /** Where the number comes from, one step per line. */
  explain: string[];
}

export interface Headline {
  /** "Today your money pays" or, for a purchase, "Today you have". */
  lead: string;
  today: HeadlineNumber;
  /** "In 20 years: €330/month", absent when already reached or never. */
  future: { when: HeadlineNumber; value: HeadlineNumber } | null;
  /** "enough to live in India", "already enough to…", "58% of what you need to…". */
  meaning: string;
}

export interface PurchaseImpact {
  /** Months until it can be bought: 0 = now, Infinity = never. */
  buyMonths: number;
  /** Capital just before and just after buying. */
  before: number;
  after: number;
  /** The living milestone it pushes back, if any. */
  milestone: ConnectionStatus | null;
  /** How much later that milestone comes because of the purchase. */
  delayMonths: number;
  /** What the price would have grown to by the milestone, left invested. */
  forgone: number;
}

export interface Report {
  plan: ReportPlan;
  today: Date;
  capital: StartingCapital;
  investment: ResolvedInvestment;
  scenario: Scenario;
  /** What today's capital pays per month. */
  incomeToday: number;
  statuses: ConnectionStatus[];
  goal: { status: ConnectionStatus; pinned: boolean };
  answer: Answer;
  headline: Headline;
  purchase: PurchaseImpact | null;
}

// ---------------------------------------------------------------------------
// Projections
// ---------------------------------------------------------------------------

export function monthsTo(scenario: Scenario, target: number): number {
  return monthsToGoal(scenario.capital, scenario.monthly, scenario.realReturn, target);
}

export function valueAt(scenario: Scenario, months: number): number {
  return futureValueWithContributions(scenario.capital, scenario.monthly, scenario.realReturn, Math.max(0, months) / 12);
}

/** Capital a connection needs under this scenario's withdrawal rate. */
export function targetFor(scenario: Scenario, connection: Pick<Connection, "kind" | "amount">): number {
  return targetCapital(connection, scenario.withdrawalRate);
}

/**
 * The single number levers compare: months to the goal (sooner is better),
 * or what the money pays or is worth at the horizon (more is better).
 */
export type AnswerMetric = { mode: "goal"; months: number } | { mode: "horizon"; value: number };

export function answerMetric(scenario: Scenario, goal: Pick<Connection, "kind" | "amount">): AnswerMetric {
  if (scenario.horizonMonths === null) return { mode: "goal", months: monthsTo(scenario, targetFor(scenario, goal)) };
  const value = valueAt(scenario, scenario.horizonMonths);
  return { mode: "horizon", value: goal.kind === "live" ? monthlyWithdrawal(value, scenario.withdrawalRate) : value };
}

// ---------------------------------------------------------------------------
// Goal
// ---------------------------------------------------------------------------

/**
 * The pinned connection, or else the next milestone: stopping work when it
 * is within reach (40 years), otherwise the cheapest way to live off the
 * money that is not covered yet.
 */
export function chooseGoal(
  statuses: readonly ConnectionStatus[],
  pinned: string | null,
): { status: ConnectionStatus; pinned: boolean } {
  const chosen = pinned ? statuses.find((status) => status.connection.id === pinned) : undefined;
  if (chosen) return { status: chosen, pinned: true };
  const stop = statuses.find((status) => status.connection.id === STOP_WORKING_ID);
  if (stop && stop.months <= STOP_WORKING_WITHIN_YEARS * 12) return { status: stop, pinned: false };
  const next = statuses
    .filter((status) => status.connection.kind === "live" && status.months > 0)
    .sort((a, b) => a.target - b.target || a.months - b.months)[0];
  return { status: next ?? stop ?? statuses[0], pinned: false };
}

/** "A used car" → "a used car", but "NL" stays "NL". */
export const lowerFirst = (text: string) => (/^[A-Z](?![A-Z])/.test(text) ? text[0].toLowerCase() + text.slice(1) : text);

/** "enough to live in India", "enough for a used car", "enough for Boat". */
export function enoughFor(connection: Connection): string {
  if (connection.group === "custom") return `enough for ${connection.name}`;
  return connection.kind === "live" ? `enough to ${lowerFirst(connection.name)}` : `enough for ${lowerFirst(connection.name)}`;
}

/** "58% of what you need to live in India", "58% of the price of a used car". */
export function shareOf(connection: Connection, share: number): string {
  const pct = formatPercent(Math.max(0, share), { decimals: 0 });
  if (connection.group === "custom") return `${pct} of ${connection.name}`;
  return connection.kind === "live"
    ? `${pct} of what you need to ${lowerFirst(connection.name)}`
    : `${pct} of the price of ${lowerFirst(connection.name)}`;
}

// ---------------------------------------------------------------------------
// Headline
// ---------------------------------------------------------------------------

function capitalLabel(capital: StartingCapital): string {
  return capital.source === "holdings" ? "in your holdings (euros only)" : "invested";
}

function buildHeadline(report: Omit<Report, "headline" | "purchase">): Headline {
  const { capital, scenario, investment, incomeToday, goal, answer, today } = report;
  const connection = goal.status.connection;
  const live = connection.kind === "live";
  const rate = formatRate(scenario.withdrawalRate);
  const growth = `growing ${formatRate(scenario.realReturn)} a year after inflation (${investment.name}, ${investment.period[0]}–${investment.period[1]} average)`;
  const perMonth = (amount: number) => `${formatEur(amount)}/month`;

  const todayNumber: HeadlineNumber = live
    ? {
        text: perMonth(incomeToday),
        explain: [
          `${formatEur(capital.amount)} ${capitalLabel(capital)}`,
          `× ${rate} taken out a year ÷ 12 = ${formatEur(incomeToday)} a month`,
          "In today's euros: the amount rises with inflation each year.",
        ],
      }
    : { text: formatEur(capital.amount), explain: [`${formatEur(capital.amount)} ${capitalLabel(capital)}`] };

  const valueNumber = (amount: number): HeadlineNumber =>
    live
      ? {
          text: perMonth(monthlyWithdrawal(amount, scenario.withdrawalRate)),
          explain: [
            `${formatEur(amount)} × ${rate} ÷ 12 = ${formatEur(monthlyWithdrawal(amount, scenario.withdrawalRate))} a month`,
            `${connection.name}: about ${perMonth(connection.amount)} (estimate).`,
            connection.source,
          ],
        }
      : { text: formatEur(amount), explain: [`${connection.name}: ${formatEur(connection.amount)} (estimate).`, connection.source] };

  const lead = live ? "Today your money pays" : "Today you have";
  const start = `${formatEur(capital.amount)} now + ${formatEur(scenario.monthly)} a month`;

  if (answer.mode === "horizon") {
    return {
      lead,
      today: todayNumber,
      future: {
        when: {
          text: formatYears(answer.months),
          explain: [`You look ${formatYears(answer.months)} ahead (${answer.date?.getUTCFullYear()}).`, start, growth, `= ${formatEur(answer.capital)}`],
        },
        value: valueNumber(answer.capital),
      },
      meaning: answer.progress >= 1 ? enoughFor(connection) : shareOf(connection, answer.progress),
    };
  }
  if (answer.months === 0) return { lead, today: todayNumber, future: null, meaning: `already ${enoughFor(connection)}` };
  if (!Number.isFinite(answer.months)) {
    return {
      lead,
      today: todayNumber,
      future: null,
      meaning: `not enough to ${live ? lowerFirst(connection.name) : `buy ${lowerFirst(connection.name)}`} without adding money each month`,
    };
  }
  const reach = addMonths(today, Math.ceil(answer.months - 1e-9));
  return {
    lead,
    today: todayNumber,
    future: {
      when: {
        text: formatYears(answer.months),
        explain: [start, growth, `reaches ${formatEur(goal.status.target)} in ${formatDuration(answer.months)} (${formatMonthYear(reach)}).`],
      },
      value: valueNumber(goal.status.target),
    },
    meaning: enoughFor(connection),
  };
}

// ---------------------------------------------------------------------------
// Purchase
// ---------------------------------------------------------------------------

/** What buying a pinned item does: money left, and the living milestone it pushes back. */
export function purchaseImpact(
  scenario: Scenario,
  item: ConnectionStatus,
  statuses: readonly ConnectionStatus[],
): PurchaseImpact {
  const price = item.connection.amount;
  const buyMonths = item.months;
  const before = buyMonths === 0 ? scenario.capital : price;
  const after = buyMonths === 0 ? scenario.capital - price : 0;
  const living = statuses.filter((status) => status.connection.kind === "live");
  const milestone = chooseGoal(living, null).status ?? null;
  if (!milestone || !Number.isFinite(buyMonths) || !Number.isFinite(milestone.months) || milestone.months <= buyMonths) {
    return { buyMonths, before, after, milestone: null, delayMonths: 0, forgone: 0 };
  }
  const afterPurchase: Scenario = { ...scenario, capital: after };
  const withPurchase = buyMonths + monthsTo(afterPurchase, milestone.target);
  const growth = Math.pow(1 + scenario.realReturn, (milestone.months - buyMonths) / 12);
  return {
    buyMonths,
    before,
    after,
    milestone,
    delayMonths: Math.max(0, withPurchase - milestone.months),
    forgone: price * growth,
  };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

/** `holdings` must already carry their prices (lib/auto-price.ts). */
export function buildReport(plan: ReportPlan, holdings: readonly Holding[], today: Date): Report {
  const capital = startingCapital(holdings, plan.invested);
  const investment = resolveInvestment(plan.investment, holdings);
  const scenario: Scenario = {
    capital: capital.amount,
    monthly: plan.monthlyContribution,
    realReturn: investment.realReturn,
    withdrawalRate: plan.withdrawalRate,
    horizonMonths: plan.horizonYears === null ? null : plan.horizonYears * 12,
  };
  const statuses = allConnections({ homeCountry: plan.homeCountry, housing: plan.housing, custom: plan.customConnections }).map(
    (connection) => {
      const target = targetFor(scenario, connection);
      return { connection, target, months: monthsTo(scenario, target) };
    },
  );
  const goal = chooseGoal(statuses, plan.pinned);
  const { target } = goal.status;

  let answer: Answer;
  if (scenario.horizonMonths === null) {
    const months = goal.status.months;
    const reached = months === 0 ? scenario.capital : target;
    answer = {
      mode: "goal",
      months,
      date: Number.isFinite(months) ? addMonths(today, Math.ceil(months - 1e-9)) : null,
      capital: reached,
      income: monthlyWithdrawal(Math.max(0, reached), scenario.withdrawalRate),
      progress: target > 0 ? scenario.capital / target : 1,
    };
  } else {
    const value = valueAt(scenario, scenario.horizonMonths);
    answer = {
      mode: "horizon",
      months: scenario.horizonMonths,
      date: addMonths(today, scenario.horizonMonths),
      capital: value,
      income: monthlyWithdrawal(value, scenario.withdrawalRate),
      progress: target > 0 ? value / target : 1,
    };
  }

  const base = {
    plan,
    today,
    capital,
    investment,
    scenario,
    incomeToday: monthlyWithdrawal(Math.max(0, capital.amount), plan.withdrawalRate),
    statuses,
    goal,
    answer,
  };
  return {
    ...base,
    headline: buildHeadline(base),
    purchase: goal.pinned && goal.status.connection.kind === "buy" ? purchaseImpact(scenario, goal.status, statuses) : null,
  };
}
