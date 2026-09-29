/**
 * "My money", the daily brief: the answer first, worked out from the plan.
 *
 * Everything here is a pure function of the plan, the priced holdings and
 * today's date: the user's mission (never one the app picks), when it is
 * reached (or what the money pays after a chosen number of years), the
 * headline with where each number comes from, the status of every other
 * connection, and what a purchase costs later.
 * Levers (lib/levers.ts) and findings (lib/findings.ts) build on it.
 *
 * All amounts are in today's euros: growth is after inflation and the
 * monthly amount is assumed to rise with prices.
 */

import { allConnections, targetCapital, type Connection } from "./connections";
import { costOfLiving, countryInSentence } from "./cost-of-living";
import { addMonths } from "./dates";
import { futureValueWithContributions, monthlyWithdrawal, monthsToGoal, requiredMonthlyContribution } from "./finance";
import { formatDuration, formatEur, formatMonthYear, formatPercent, formatRate, formatYears } from "./format";
import { dividendNote, periodText, resolveInvestment, type ResolvedInvestment } from "./investment";
import { startingCapital, type StartingCapital } from "./plan";
import type { Holding, Mission, Plan } from "./types";

/** The plan the report reads (see Plan in lib/types.ts), once the user has chosen a mission. */
export type ReportPlan = Plan & { mission: Mission };

/**
 * Beyond this a date is not a plan: the report says "not reachable at this
 * pace" instead of a year in the next century, and findings stop there too.
 */
export const MAX_YEARS = 60;
export const MAX_MONTHS = MAX_YEARS * 12;
/** When a goal is out of reach: the monthly amount that would get there in these many years. */
export const INSTEAD_YEARS = [20, 30] as const;

/** Reached within MAX_YEARS (0 = now). `Infinity` (never) is not. */
export function withinReach(months: number): boolean {
  return months <= MAX_MONTHS;
}

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
  /** False when the goal is more than MAX_YEARS away (or never reached). */
  reachable: boolean;
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
  /** "enough to live in India", "already enough to…", "58% of what you need to…", "not reachable at this pace". */
  meaning: string;
  /** Out of reach: the monthly amount that would get there in 20 and in 30 years. */
  instead: { years: number; monthly: HeadlineNumber }[] | null;
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

/** The mission, with what it costs and how far away it is. */
export interface MissionGoal {
  mission: Mission;
  status: ConnectionStatus;
  /** "Stop working in the Netherlands", "Live in Portugal", "A used car", "Reach €100,000". */
  title: string;
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
  goal: MissionGoal;
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

/** The user's country, as a sentence says it: "the Netherlands". */
function homeName(plan: Pick<Plan, "homeCountry">): string {
  const home = costOfLiving.countries.find((country) => country.code === plan.homeCountry) ?? costOfLiving.countries[0];
  return countryInSentence(home.name);
}

/**
 * The connection a mission is about, and its title; `null` when the mission
 * names something the data no longer has (a country or an item removed).
 */
export function missionConnection(
  mission: Mission,
  plan: Pick<Plan, "homeCountry">,
  connections: readonly Connection[],
): { connection: Connection; title: string } | null {
  const find = (id: string) => connections.find((connection) => connection.id === id);
  switch (mission.kind) {
    case "stop-working": {
      const connection = find(STOP_WORKING_ID);
      return connection ? { connection, title: `Stop working in ${homeName(plan)}` } : null;
    }
    case "live-abroad": {
      if (mission.country === plan.homeCountry) {
        // "Abroad" in the user's own country is stopping work there.
        const stop = find(STOP_WORKING_ID);
        if (!stop) return null;
        const title = `Live in ${homeName(plan)}`;
        return { connection: { ...stop, id: `country:${mission.country}`, group: "country", name: title }, title };
      }
      const connection = find(`country:${mission.country}`);
      return connection ? { connection, title: connection.name } : null;
    }
    case "buy": {
      const connection = find(`buy:${mission.item}`);
      return connection ? { connection, title: connection.name } : null;
    }
    case "buy-own":
      return {
        connection: { id: "mission:own", kind: "buy", group: "mission", name: mission.name, amount: mission.amount, source: "Your own price.", referenceDate: "" },
        title: mission.name,
      };
    case "amount": {
      const title = `Reach ${formatEur(mission.amount)}`;
      return {
        connection: { id: "mission:amount", kind: "buy", group: "mission", name: title, amount: mission.amount, source: "Your own amount.", referenceDate: "" },
        title,
      };
    }
  }
}

/** Every connection "My money" lists, priced for this plan. */
function connectionsFor(plan: Plan): Connection[] {
  return allConnections({ homeCountry: plan.homeCountry, housing: plan.housing, custom: plan.customConnections });
}

/** True when there is a mission the report can be built around. */
export function hasReport(plan: Plan): plan is ReportPlan {
  return plan.mission !== null && missionConnection(plan.mission, plan, connectionsFor(plan)) !== null;
}

/** "A used car" → "a used car", but "NL" stays "NL". */
export const lowerFirst = (text: string) => (/^[A-Z](?![A-Z])/.test(text) ? text[0].toLowerCase() + text.slice(1) : text);

/** "enough to live in India", "enough for a used car", "enough for Boat", "your target". */
export function enoughFor(connection: Connection): string {
  if (connection.id === "mission:amount") return "your target";
  if (connection.group === "custom" || connection.group === "mission") return `enough for ${connection.name}`;
  return connection.kind === "live" ? `enough to ${lowerFirst(connection.name)}` : `enough for ${lowerFirst(connection.name)}`;
}

/** "58% of what you need to live in India", "58% of the price of a used car". */
export function shareOf(connection: Connection, share: number): string {
  const pct = formatPercent(Math.max(0, share), { decimals: 0 });
  if (connection.id === "mission:amount") return `${pct} of your ${formatEur(connection.amount)} target`;
  if (connection.group === "custom" || connection.group === "mission") return `${pct} of ${connection.name}`;
  return connection.kind === "live"
    ? `${pct} of what you need to ${lowerFirst(connection.name)}`
    : `${pct} of the price of ${lowerFirst(connection.name)}`;
}

// ---------------------------------------------------------------------------
// Headline
// ---------------------------------------------------------------------------

/** Whole euros, but "under €1" for a few cents: €1 invested pays €0.003 a month, not €0. */
export function formatSmallEur(amount: number): string {
  return amount > 0 && amount < 0.5 ? "under €1" : formatEur(amount);
}

function capitalLabel(capital: StartingCapital): string {
  return capital.source === "holdings" ? "in your holdings (euros only)" : "invested";
}

function buildHeadline(report: Omit<Report, "headline" | "purchase">): Headline {
  const { capital, scenario, investment, incomeToday, goal, answer, today } = report;
  const connection = goal.status.connection;
  const live = connection.kind === "live";
  const rate = formatRate(scenario.withdrawalRate);
  const dividends = dividendNote(investment);
  const growth = `growing ${formatRate(scenario.realReturn)} a year after inflation (${investment.name}, ${periodText(investment)} average${dividends ? `; ${dividends}` : ""})`;
  const perMonth = (amount: number) => `${formatSmallEur(amount)}/month`;

  const todayNumber: HeadlineNumber = live
    ? {
        text: perMonth(incomeToday),
        explain: [
          `${formatEur(capital.amount)} ${capitalLabel(capital)}`,
          `× ${rate} taken out a year ÷ 12 = ${formatSmallEur(incomeToday)} a month`,
          "In today's euros: the amount rises with inflation each year.",
        ],
      }
    : { text: formatEur(capital.amount), explain: [`${formatEur(capital.amount)} ${capitalLabel(capital)}`] };

  const valueNumber = (amount: number): HeadlineNumber =>
    live
      ? {
          text: perMonth(monthlyWithdrawal(amount, scenario.withdrawalRate)),
          explain: [
            `${formatEur(amount)} × ${rate} ÷ 12 = ${formatSmallEur(monthlyWithdrawal(amount, scenario.withdrawalRate))} a month`,
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
      instead: null,
    };
  }
  if (answer.months === 0) return { lead, today: todayNumber, future: null, meaning: `already ${enoughFor(connection)}`, instead: null };
  if (!answer.reachable) {
    const target = goal.status.target;
    return {
      lead,
      today: todayNumber,
      future: null,
      meaning: "not reachable at this pace",
      instead: INSTEAD_YEARS.map((years) => {
        const monthly = requiredMonthlyContribution(capital.amount, scenario.realReturn, years * 12, target);
        return {
          years,
          monthly: {
            text: perMonth(monthly),
            explain: [
              `${formatEur(capital.amount)} now + ${formatEur(monthly)} a month for ${years} years,`,
              growth,
              `= ${formatEur(target)}: ${connection.name} (${live ? `${perMonth(connection.amount)} at ${rate} a year` : "estimate"}).`,
              `At ${formatEur(scenario.monthly)} a month it takes more than ${MAX_YEARS} years.`,
            ],
          },
        };
      }),
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
    instead: null,
  };
}

// ---------------------------------------------------------------------------
// Purchase
// ---------------------------------------------------------------------------

/** What buying the mission's item does: money left, and how much later stopping work comes. */
export function purchaseImpact(
  scenario: Scenario,
  item: ConnectionStatus,
  statuses: readonly ConnectionStatus[],
): PurchaseImpact {
  const price = item.connection.amount;
  const buyMonths = item.months;
  const before = buyMonths === 0 ? scenario.capital : price;
  const after = buyMonths === 0 ? scenario.capital - price : 0;
  const milestone = statuses.find((status) => status.connection.id === STOP_WORKING_ID) ?? null;
  if (!milestone || !withinReach(buyMonths) || !withinReach(milestone.months) || milestone.months <= buyMonths) {
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
  const connections = connectionsFor(plan);
  const statusOf = (connection: Connection): ConnectionStatus => {
    const target = targetFor(scenario, connection);
    return { connection, target, months: monthsTo(scenario, target) };
  };
  const statuses = connections.map(statusOf);
  const resolved = missionConnection(plan.mission, plan, connections);
  if (!resolved) throw new RangeError("The mission names something the data no longer has; check hasReport first");
  const goal: MissionGoal = { mission: plan.mission, status: statusOf(resolved.connection), title: resolved.title };
  const { target } = goal.status;

  let answer: Answer;
  if (scenario.horizonMonths === null) {
    const months = goal.status.months;
    const reached = months === 0 ? scenario.capital : target;
    answer = {
      mode: "goal",
      months,
      reachable: withinReach(months),
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
      reachable: true,
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
    purchase:
      (goal.mission.kind === "buy" || goal.mission.kind === "buy-own") && withinReach(goal.status.months)
        ? purchaseImpact(scenario, goal.status, statuses)
        : null,
  };
}
