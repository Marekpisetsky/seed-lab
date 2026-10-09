/**
 * "Good to know": short findings about the plan, each with one
 * number and one sentence, and the calculation behind it.
 *
 * They are worked out over the years the user chose. When the user has
 * added goals, the ones about reaching something (the strongest lever, a
 * bad first decade) are about the first goal; the rest are about the
 * result. Every rule is a pure function that returns `null` when it does
 * not matter for this user (its relevance rule). The order is fixed
 * (ORDER): risks the user carries first, then what moves the plan, general
 * facts last, so a card never jumps places when a number changes; the page
 * shows the first three that apply. Findings inform with numbers; they
 * never say what to do. One stock that weighs too much is not a finding:
 * "Check your plan" says it (lib/plan-check.ts), once. The words come from the dictionaries (`findings`),
 * in the page's language.
 */

import type { I18n } from "@/i18n";
import { goalName } from "@/i18n/goal-text";
import { decadeSource, growthSource } from "@/i18n/investment-text";
import { monthsTo, valueAt, withinReach, type Calculation, type GoalStatus, type Scenario } from "./calculator";
import { addMonths } from "./dates";
import { DECADE_YEARS, historicalDecade } from "./decade";
import { monthsToGoal } from "./finance";
import type { ResolvedInvestment } from "./investment";

export type FindingId = "lever" | "waiting" | "inflation" | "fees" | "sequence" | "doubling";

export interface Finding {
  id: FindingId;
  /** The one number the card is about: "3 years", "€5,400", "70%". */
  value: string;
  /** One short sentence (about 12 words at most). */
  text: string;
  /** A risk the user carries, rather than a general fact. */
  tone: "info" | "warning";
  /** How the number is worked out, one step per line. */
  calculation: string[];
  assumptions: string[];
}

export interface FindingContext {
  calc: Calculation;
  /** Expected yearly inflation. */
  inflation: number;
  today: Date;
  i18n: I18n;
}

export const MAX_FINDINGS = 3;

/** The order findings are shown in: risks first, then what moves the plan, general facts last. */
export const ORDER: readonly FindingId[] = [
  "lever",
  "sequence",
  "inflation",
  "waiting",
  "fees",
  "doubling",
];

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function horizonOf({ calc }: FindingContext): number {
  return calc.result.years * 12;
}

/** The first goal, when it is one the plan reaches later (not now, not past 60 years). */
export function focusOf({ calc }: Pick<FindingContext, "calc">): GoalStatus | null {
  const first = calc.goals[0];
  return first && first.known && first.reachable && first.months > 0 ? first : null;
}

function yearOf(today: Date, months: number): number {
  return addMonths(today, Math.ceil(months - 1e-9)).getUTCFullYear();
}

/** What growth adds in the plan's first year, in euros: the percent's equivalent on the user's money. */
export function firstYearGrowth(scenario: Scenario, extra = 0): number {
  const grown = { ...scenario, realReturn: scenario.realReturn + extra, head: undefined };
  return valueAt(grown, 12) - valueAt({ ...grown, realReturn: 0 }, 12);
}

function growthAssumption(scenario: Scenario, investment: ResolvedInvestment, i18n: I18n): string {
  const source = growthSource(investment, i18n);
  const { f } = i18n;
  return i18n.m.findings.growthAssumption(f.rate(scenario.realReturn), f.cur(firstYearGrowth(scenario), { signed: true }), source, Boolean(investment.period));
}

/** An amount with cents only when there are any: "€102", "€102.50", "€1.49". */
function euros(amount: number, { f }: I18n): string {
  return f.money(amount, f.currency, { decimals: Math.abs(amount - Math.round(amount)) < 0.005 ? 0 : 2 });
}

/**
 * A size of money in euros, in the plan's currency: the findings' limits
 * ("worth saying from €1,000") are the same size of money in any currency
 * (f.step is €50's worth, lib/money.ts).
 */
function sized(euroAmount: number, { f }: I18n): number {
  return (euroAmount / 50) * f.step;
}

function monthlyAssumption(scenario: Scenario, { m, f }: I18n): string {
  return m.findings.monthlyAssumption(f.cur(scenario.monthly));
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

/** +€100 a month (twice the currency's step) vs +1 % growth vs having started a year earlier: for the first goal, or for the result. */
export function leverFinding(context: FindingContext): Finding | null {
  const { calc, today, i18n } = context;
  const { m, f } = i18n;
  const t = m.findings.lever;
  const { scenario, investment } = calc;
  const more = 2 * f.step;
  const options = [
    { key: "monthly", label: t.monthlyLabel(f.cur(more), f.cur(scenario.monthly + more)), scenario: { ...scenario, monthly: scenario.monthly + more } },
    {
      key: "return",
      label: t.returnLabel(f.rate(scenario.realReturn + 0.01), f.cur(firstYearGrowth(scenario, 0.01) - firstYearGrowth(scenario), { signed: true })),
      scenario: { ...scenario, realReturn: scenario.realReturn + 0.01 },
    },
    { key: "earlier", label: t.earlierLabel, scenario: { ...scenario, capital: valueAt(scenario, 12) } },
  ] as const;
  const assumptions = [growthAssumption(scenario, investment, i18n), monthlyAssumption(scenario, i18n)];

  // A first goal under two years away says little about levers: then it is about the result.
  const focus = focusOf(context);
  if (focus && focus.months >= 24) {
    const monthsFor = (s: Scenario) => monthsToGoal(s.capital, s.monthly, s.realReturn, focus.target);
    const results = options.map((option) => ({ ...option, gain: focus.months - monthsFor(option.scenario) }));
    const best = results.reduce((a, b) => (b.gain > a.gain ? b : a));
    if (best.gain < 6) return null;
    const when = f.span(best.gain);
    const extra = f.cur(firstYearGrowth(scenario, 0.01) - firstYearGrowth(scenario), { signed: true });
    const text = best.key === "monthly" ? t.goalMonthly(f.cur(more), when) : best.key === "return" ? t.goalReturn(when, extra) : t.goalEarlier(when);
    return {
      id: "lever",
      value: when,
      text,
      tone: "info",
      calculation: [
        t.goalNeeded(goalName(focus, i18n), f.cur(focus.target), f.span(focus.months), yearOf(today, focus.months)),
        ...results.map((result) => t.sooner(result.label, f.span(result.gain))),
      ],
      assumptions,
    };
  }

  const months = horizonOf(context);
  const base = valueAt(scenario, months);
  const results = options.map((option) => ({ ...option, gain: valueAt(option.scenario, months) - base }));
  const best = results.reduce((a, b) => (b.gain > a.gain ? b : a));
  if (base <= 0 || best.gain < Math.max(sized(1000, i18n), base * 0.05)) return null;
  const amount = f.curRounded(best.gain);
  const year = yearOf(today, months);
  const say = (gain: string, at: number) => (best.key === "monthly" ? t.resultMonthly(f.cur(more), gain, at) : best.key === "return" ? t.resultReturn(gain, at) : t.resultEarlier(gain, at));
  return {
    id: "lever",
    value: f.curRounded(best.gain, { signed: true }),
    text: say(amount, year),
    tone: "info",
    calculation: [t.now(f.cur(base), year), ...results.map((result) => t.gain(result.label, f.cur(result.gain, { signed: true })))],
    assumptions,
  };
}

/** What starting the same plan a year later leaves at the end of the chosen years. */
export function waitingFinding(context: FindingContext): Finding | null {
  const { calc, today, i18n } = context;
  const { m, f } = i18n;
  const t = m.findings.waiting;
  const months = horizonOf(context);
  if (months < 24) return null;
  const now = valueAt(calc.scenario, months);
  // The same capital and monthly amount, invested a year later: one year less by that date.
  const later = valueAt(calc.scenario, months - 12);
  const cost = now - later;
  if (cost < Math.max(sized(500, i18n), now * 0.02)) return null;
  const year = yearOf(today, months);
  return {
    id: "waiting",
    value: f.curRounded(cost),
    text: t.text(f.curRounded(cost), year),
    tone: "info",
    calculation: [t.now(f.cur(now), year), t.later(f.cur(later)), t.difference(f.cur(cost))],
    assumptions: [growthAssumption(calc.scenario, calc.investment, i18n), monthlyAssumption(calc.scenario, i18n), m.findings.todaysEuros],
  };
}

/** What the result, in today's euros, will read on a statement of that year. */
export function inflationFinding(context: FindingContext): Finding | null {
  const { calc, inflation, today, i18n } = context;
  const { m, f } = i18n;
  const t = m.findings.inflation;
  const months = horizonOf(context);
  const years = months / 12;
  if (years < 5 || inflation <= 0) return null;
  const real = calc.result.total;
  // "~€6, worth €4 of today's money" says nothing.
  if (real < sized(1000, i18n)) return null;
  const factor = Math.pow(1 + inflation, years);
  const nominal = real * factor;
  const year = yearOf(today, months);
  const times = f.fixed(factor, 2);
  return {
    id: "inflation",
    value: `~${f.curRounded(nominal)}`,
    text: t.text(year, f.curRounded(nominal), f.curRounded(real)),
    tone: "info",
    calculation: [
      t.factor(f.rate(inflation), Math.round(years), times, euros(1, i18n), euros(factor, i18n)),
      t.times(f.cur(real), times, f.cur(nominal), year),
      t.todays(year),
    ],
    assumptions: [t.assumption(f.rate(inflation), euros(100, i18n), euros(100 * (1 + inflation), i18n)), t.afterPrices],
  };
}

/** A fund charging 1 % a year against one charging 0.2 %. */
export function feesFinding(context: FindingContext): Finding | null {
  const { calc, today, i18n } = context;
  const { m, f } = i18n;
  const t = m.findings.fees;
  const months = horizonOf(context);
  if (months < 60) return null;
  const cheap: Scenario = { ...calc.scenario, realReturn: calc.scenario.realReturn - 0.002 };
  const dear: Scenario = { ...calc.scenario, realReturn: calc.scenario.realReturn - 0.01 };
  const cost = valueAt(cheap, months) - valueAt(dear, months);
  if (cost < sized(1000, i18n)) return null;
  const year = yearOf(today, months);
  return {
    id: "fees",
    value: f.curRounded(cost),
    text: t.text(f.curRounded(cost), year),
    tone: "info",
    calculation: [t.cheap(f.cur(valueAt(cheap, months)), year), t.dear(f.cur(valueAt(dear, months)))],
    assumptions: [t.assumption(f.cur(1), f.cur(3), f.cur(1000)), growthAssumption(calc.scenario, calc.investment, i18n)],
  };
}

/**
 * A bad first decade from history (lib/decade.ts: 2000–2009, or the
 * investment's worst): for the first goal, or for the result. The same
 * decade "What if…?" applies.
 */
export function sequenceFinding(context: FindingContext): Finding | null {
  const { calc, today, i18n } = context;
  const { m, f } = i18n;
  const t = m.findings.sequence;
  const { scenario, investment } = calc;
  // A first goal under five years away is not hit by a bad decade: then it is about the result.
  const first = focusOf(context);
  const focus = first && first.months >= 60 ? first : null;
  const months = focus ? focus.months : horizonOf(context);
  if (months < 60) return null;
  const span = Math.min(DECADE_YEARS, Math.floor(months / 12));
  const decade = historicalDecade(investment, scenario.capital, scenario.monthly, span);
  if (!decade) return null;
  const bad: Scenario = { ...scenario, head: decade.head };
  const years = `${decade.from}–${decade.to}`;
  const typical = valueAt(scenario, span * 12);
  const calculation = [t.afterYears(span, f.cur(typical), f.cur(decade.head[span]), years), t.thenAverage];
  const assumptions = [t.realYears(decadeSource(investment, i18n), years), monthlyAssumption(scenario, i18n)];

  if (focus) {
    const badMonths = monthsTo(bad, focus.target);
    const delay = badMonths - focus.months;
    // A bad start that pushes the goal past 60 years would quote a date that far out.
    if (!withinReach(badMonths) || delay < 12) return null;
    return {
      id: "sequence",
      value: `+${f.span(delay)}`,
      text: t.goalText(span, years, f.span(delay)),
      tone: "warning",
      calculation: [...calculation, t.goalLine(goalName(focus, i18n), f.span(focus.months), f.span(badMonths), years)],
      assumptions,
    };
  }
  const shortfall = valueAt(scenario, months) - valueAt(bad, months);
  if (shortfall < Math.max(sized(1000, i18n), valueAt(scenario, months) * 0.05)) return null;
  const year = yearOf(today, months);
  return {
    id: "sequence",
    value: f.curRounded(-shortfall),
    text: t.resultText(span, years, f.curRounded(shortfall), year),
    tone: "warning",
    calculation: [...calculation, t.resultLine(year, f.cur(valueAt(scenario, months)), f.cur(valueAt(bad, months)), years)],
    assumptions,
  };
}

/** How long money takes to double at the plan's growth: on what the user has now, or a year of what they add. */
export function doublingFinding({ calc, i18n }: FindingContext): Finding | null {
  const { m, f } = i18n;
  const rate = calc.scenario.realReturn;
  if (rate < 0.02) return null;
  const years = Math.log(2) / Math.log1p(rate);
  const base = calc.scenario.capital > 0 ? calc.scenario.capital : calc.scenario.monthly * 12;
  if (base <= 0) return null;
  return {
    id: "doubling",
    value: f.span(years * 12),
    text: m.findings.doubling.text(f.rate(rate), f.cur(base), f.cur(base * 2), f.span(years * 12)),
    tone: "info",
    calculation: [m.findings.doubling.line(f.rate(rate), f.fixed(years, 1), f.cur(base), f.cur(base * 2))],
    assumptions: [growthAssumption(calc.scenario, calc.investment, i18n)],
  };
}

const RULES: Record<FindingId, (context: FindingContext) => Finding | null> = {
  lever: leverFinding,
  sequence: sequenceFinding,
  inflation: inflationFinding,
  waiting: waitingFinding,
  fees: feesFinding,
  doubling: doublingFinding,
};

/** Every finding that matters for this plan, in the fixed order. */
export function allFindings(context: FindingContext): Finding[] {
  return ORDER.map((id) => RULES[id](context)).filter((finding): finding is Finding => finding !== null);
}

/** The ones the page shows: at most three. */
export function topFindings(context: FindingContext): Finding[] {
  return allFindings(context).slice(0, MAX_FINDINGS);
}
