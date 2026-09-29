/**
 * "What changes the answer": the few controls that move the result most,
 * each with its effect worked out live against the current answer.
 *
 * Effects are in the answer's own unit: years earlier or later when the
 * report looks at when the goal is reached, euros more or less when it
 * looks a fixed number of years ahead.
 */

import { addMonths } from "./dates";
import { monthlyWithdrawal } from "./finance";
import { formatEur, formatPercent, formatRate, formatYears } from "./format";
import { INDEXES, INDEX_IDS } from "./indexes";
import { periodText, portfolioMix, resolveInvestment } from "./investment";
import { answerMetric, valueAt, withinReach, type AnswerMetric, type Report, type Scenario } from "./report";
import { cachedSuccessRates } from "./simulation";
import type { Holding, Investment } from "./types";

export interface Effect {
  text: string;
  tone: "better" | "worse" | "same";
}

export interface ChoiceOption<T> {
  value: T;
  label: string;
  /** A second line: the rate, the value at that point, how often it lasted. */
  detail: string;
  /** A third, quieter line: where a rate comes from ("1988–2022 · no dividends"). */
  note?: string;
  /** Against the current answer; `null` for the current choice. */
  effect: Effect | null;
  selected: boolean;
}

export interface MonthlyLever {
  value: number;
  step: number;
  up: Effect;
  /** `null` when there is nothing to take away. */
  down: Effect | null;
}

export interface Levers {
  monthly: MonthlyLever;
  investment: ChoiceOption<Investment>[];
  horizon: ChoiceOption<number | null>[];
  /** Only for living goals: a purchase does not depend on it. */
  withdrawal: ChoiceOption<number>[] | null;
}

export const HORIZON_CHOICES = [5, 10, 20, 30] as const;
export const WITHDRAWAL_CHOICES = [0.03, 0.04, 0.05] as const;

/** How an alternative compares with the current answer, in words. */
export function describeEffect(base: AnswerMetric, alternative: AnswerMetric, kind: "live" | "buy"): Effect {
  if (base.mode === "goal" && alternative.mode === "goal") {
    const now = base.months;
    const then = alternative.months;
    if (now === 0 && then === 0) return { text: "already reached", tone: "same" };
    // Beyond MAX_YEARS a goal is "not reachable at this pace": no year counts past it.
    if (!withinReach(now) && !withinReach(then)) return { text: "still not reachable", tone: "same" };
    if (!withinReach(now)) return { text: `reachable in ${formatYears(then)}`, tone: "better" };
    if (!withinReach(then)) return { text: "not reachable", tone: "worse" };
    const gained = now - then;
    if (Math.abs(gained) < 0.5) return { text: "same time", tone: "same" };
    return gained > 0
      ? { text: `${formatYears(gained)} earlier`, tone: "better" }
      : { text: `${formatYears(-gained)} later`, tone: "worse" };
  }
  if (base.mode === "horizon" && alternative.mode === "horizon") {
    const difference = alternative.value - base.value;
    if (Math.abs(difference) < 1) return { text: "no change", tone: "same" };
    const amount = formatEur(difference, { signed: true });
    return { text: kind === "live" ? `${amount}/month` : amount, tone: difference > 0 ? "better" : "worse" };
  }
  throw new RangeError("cannot compare answers in different modes");
}

function stepFor(monthly: number): number {
  if (monthly < 300) return 50;
  return monthly < 2000 ? 100 : 250;
}

const sameInvestment = (a: Investment, b: Investment) => JSON.stringify(a) === JSON.stringify(b);

/** `holdings` must already carry their prices. */
export function buildLevers(report: Report, holdings: readonly Holding[]): Levers {
  const { scenario, goal, plan, investment } = report;
  const connection = goal.status.connection;
  const kind = connection.kind;
  const base = answerMetric(scenario, connection);
  const effect = (alternative: Scenario) => describeEffect(base, answerMetric(alternative, connection), kind);

  const step = stepFor(scenario.monthly);
  const monthly: MonthlyLever = {
    value: scenario.monthly,
    step,
    up: effect({ ...scenario, monthly: scenario.monthly + step }),
    down: scenario.monthly >= step ? effect({ ...scenario, monthly: scenario.monthly - step }) : null,
  };

  const choices: Investment[] = INDEX_IDS.map((index) => ({ kind: "index", index }));
  if (portfolioMix(holdings).weights.length > 0) choices.push({ kind: "portfolio" });
  const current = investment.investment;
  if (!choices.some((choice) => sameInvestment(choice, current))) choices.push(current);
  const investmentOptions = choices.map((choice): ChoiceOption<Investment> => {
    const resolved = resolveInvestment(choice, holdings);
    const selected = sameInvestment(choice, current);
    const label =
      choice.kind === "index" ? INDEXES[choice.index].name : choice.kind === "portfolio" ? "My portfolio" : resolved.name;
    const detail =
      choice.kind === "index" ? `${INDEXES[choice.index].etf} · ${formatRate(resolved.realReturn)}` : formatRate(resolved.realReturn);
    const dividends = resolved.withoutDividends >= 1 ? " · no dividends" : resolved.withoutDividends > 0 ? " · partly no dividends" : "";
    return {
      value: choice,
      label,
      detail,
      note: `${periodText(resolved)}${dividends}`,
      effect: selected ? null : effect({ ...scenario, realReturn: resolved.realReturn }),
      selected,
    };
  });

  const horizonValue = (months: number) => {
    const value = valueAt(scenario, months);
    return kind === "live" ? `${formatEur(monthlyWithdrawal(value, scenario.withdrawalRate))}/month` : formatEur(value);
  };
  const reach = goal.status.months;
  const horizon: ChoiceOption<number | null>[] = [
    {
      value: null,
      label: "When reached",
      detail:
        reach === 0
          ? "now"
          : withinReach(reach)
            ? String(addMonths(report.today, Math.ceil(reach - 1e-9)).getUTCFullYear())
            : "not at this pace",
      effect: null,
      selected: plan.horizonYears === null,
    },
    ...[...new Set([...HORIZON_CHOICES, ...(plan.horizonYears === null ? [] : [plan.horizonYears])])]
      .sort((a, b) => a - b)
      .map((years) => ({
        value: years,
        label: `${years} years`,
        detail: horizonValue(years * 12),
        effect: null,
        selected: plan.horizonYears === years,
      })),
  ];

  let withdrawal: ChoiceOption<number>[] | null = null;
  if (kind === "live") {
    const rates = [...new Set([...WITHDRAWAL_CHOICES, scenario.withdrawalRate])].sort((a, b) => a - b);
    const lastedByRate = cachedSuccessRates(investment.key, investment.returns, rates);
    withdrawal = rates.map((rate, index) => {
      const selected = Math.abs(rate - scenario.withdrawalRate) < 1e-9;
      const lasted = lastedByRate[index];
      return {
        value: rate,
        label: formatRate(rate),
        detail: `lasted 30 years in ${formatPercent(lasted, { decimals: 0 })}`,
        note: `${investment.name}, ${periodText(investment)}`,
        effect: selected ? null : effect({ ...scenario, withdrawalRate: rate }),
        selected,
      };
    });
  }

  return { monthly, investment: investmentOptions, horizon, withdrawal };
}
