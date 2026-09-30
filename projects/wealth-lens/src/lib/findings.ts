/**
 * "What you should know": short findings about the plan, each with one
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
 * never say what to do. The words come from the dictionaries (`findings`),
 * in the page's language.
 */

import type { I18n } from "@/i18n";
import { goalName } from "@/i18n/goal-text";
import { dividendNote, growthSource, simulationsText } from "@/i18n/investment-text";
import { valueAt, withinReach, type Calculation, type GoalStatus, type Scenario } from "./calculator";
import { addMonths } from "./dates";
import { holdingValue, monthsToGoal } from "./finance";
import type { ResolvedInvestment } from "./investment";
import { INDEX_TRACKERS, instrumentForHolding, MARKET, type PricesFile } from "./market-data";
import { referenceFor } from "./portfolio";
import { bandsFor } from "./projections";
import { BASE_CURRENCY, type Holding } from "./types";

export type FindingId = "lever" | "waiting" | "inflation" | "fees" | "concentration" | "currency" | "sequence" | "doubling";

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
  /** Priced holdings. */
  holdings: readonly Holding[];
  market: PricesFile;
  i18n: I18n;
}

export const MAX_FINDINGS = 3;

/** The order findings are shown in: risks first, then what moves the plan, general facts last. */
export const ORDER: readonly FindingId[] = [
  "concentration",
  "currency",
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

function growthAssumption(scenario: Scenario, investment: ResolvedInvestment, i18n: I18n): string {
  const dividends = dividendNote(investment, i18n);
  const source = growthSource(investment, i18n) + (dividends ? ` (${dividends})` : "");
  return i18n.m.findings.growthAssumption(i18n.f.rate(scenario.realReturn), source, Boolean(investment.period));
}

function monthlyAssumption(scenario: Scenario, { m, f }: I18n): string {
  return m.findings.monthlyAssumption(f.eur(scenario.monthly));
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

/** +€100 a month vs +1 % growth vs having started a year earlier: for the first goal, or for the result. */
export function leverFinding(context: FindingContext): Finding | null {
  const { calc, today, i18n } = context;
  const { m, f } = i18n;
  const t = m.findings.lever;
  const { scenario, investment } = calc;
  const options = [
    { key: "monthly", label: t.monthlyLabel(f.eur(scenario.monthly + 100)), scenario: { ...scenario, monthly: scenario.monthly + 100 } },
    { key: "return", label: t.returnLabel(f.rate(scenario.realReturn + 0.01)), scenario: { ...scenario, realReturn: scenario.realReturn + 0.01 } },
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
    const say = best.key === "monthly" ? t.goalMonthly : best.key === "return" ? t.goalReturn : t.goalEarlier;
    return {
      id: "lever",
      value: when,
      text: say(when),
      tone: "info",
      calculation: [
        t.goalNeeded(goalName(focus, i18n), f.eur(focus.target), f.span(focus.months), yearOf(today, focus.months)),
        ...results.map((result) => t.sooner(result.label, f.span(result.gain))),
      ],
      assumptions,
    };
  }

  const months = horizonOf(context);
  const base = valueAt(scenario, months);
  const results = options.map((option) => ({ ...option, gain: valueAt(option.scenario, months) - base }));
  const best = results.reduce((a, b) => (b.gain > a.gain ? b : a));
  if (base <= 0 || best.gain < Math.max(1000, base * 0.05)) return null;
  const amount = f.eurRounded(best.gain);
  const year = yearOf(today, months);
  const say = best.key === "monthly" ? t.resultMonthly : best.key === "return" ? t.resultReturn : t.resultEarlier;
  return {
    id: "lever",
    value: f.eurRounded(best.gain, { signed: true }),
    text: say(amount, year),
    tone: "info",
    calculation: [t.now(f.eur(base), year), ...results.map((result) => t.gain(result.label, f.eur(result.gain, { signed: true })))],
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
  if (cost < Math.max(500, now * 0.02)) return null;
  const year = yearOf(today, months);
  return {
    id: "waiting",
    value: f.eurRounded(cost),
    text: t.text(f.eurRounded(cost), year),
    tone: "info",
    calculation: [t.now(f.eur(now), year), t.later(f.eur(later)), t.difference(f.eur(cost))],
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
  if (real < 1000) return null;
  const factor = Math.pow(1 + inflation, years);
  const nominal = real * factor;
  const year = yearOf(today, months);
  const times = f.fixed(factor, 2);
  return {
    id: "inflation",
    value: `~${f.eurRounded(nominal)}`,
    text: t.text(year, f.eurRounded(nominal), f.eurRounded(real)),
    tone: "info",
    calculation: [t.factor(f.rate(inflation), Math.round(years), times), t.times(f.eur(real), times, f.eur(nominal), year), t.todays(year)],
    assumptions: [t.assumption(f.rate(inflation)), t.afterPrices],
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
  if (cost < 1000) return null;
  const year = yearOf(today, months);
  return {
    id: "fees",
    value: f.eurRounded(cost),
    text: t.text(f.eurRounded(cost), year),
    tone: "info",
    calculation: [t.cheap(f.eur(valueAt(cheap, months)), year), t.dear(f.eur(valueAt(dear, months)))],
    assumptions: [t.assumption, growthAssumption(calc.scenario, calc.investment, i18n)],
  };
}

/** One holding (not an index fund) weighing more than 40 % of the portfolio. */
export function concentrationFinding({ holdings, market, i18n }: FindingContext): Finding | null {
  const { m, f } = i18n;
  const t = m.findings.concentration;
  const priced = holdings
    .filter((holding) => holding.currency === BASE_CURRENCY)
    .map((holding) => ({ holding, value: holdingValue(holding) ?? 0 }))
    .filter((entry) => entry.value > 0);
  const total = priced.reduce((sum, entry) => sum + entry.value, 0);
  if (priced.length === 0 || total <= 0) return null;
  const isIndexFund = (holding: Holding) => {
    const instrument = instrumentForHolding(holding.ticker, holding.currency);
    if (instrument) return instrument.kind === "etf";
    const ticker = holding.ticker.trim().toUpperCase().split(".")[0];
    return Object.values(INDEX_TRACKERS).some((list) => list.includes(ticker));
  };
  const biggest = priced.filter((entry) => !isIndexFund(entry.holding)).sort((a, b) => b.value - a.value)[0];
  if (!biggest) return null;
  const weight = biggest.value / total;
  if (weight <= 0.4) return null;
  const { ticker } = biggest.holding;
  const instrument = instrumentForHolding(ticker, biggest.holding.currency);
  const prices = instrument ? market.prices[instrument.id] : undefined;
  const pct = f.percent(weight, { decimals: 0 });
  return {
    id: "concentration",
    value: pct,
    text: t.text(pct, ticker),
    tone: "warning",
    calculation: [
      t.share(ticker, f.eur(biggest.value), f.eur(total)),
      ...(prices?.change1y != null ? [t.lastYear(f.percent(prices.change1y, { signed: true, decimals: 0 }))] : []),
      ...(prices?.drawdown ? [t.worstFall(prices.drawdown.from.slice(0, 4), f.percent(-prices.drawdown.max, { decimals: 0 }))] : []),
      t.growsLike(m.assets.inSentence[referenceFor(biggest.holding).asset], Boolean(instrument)),
    ],
    assumptions: [t.assumption],
  };
}

/** Holdings in another currency, which are left out of every figure. */
export function currencyFinding({ holdings, i18n }: FindingContext): Finding | null {
  const { m, f } = i18n;
  const t = m.findings.currency;
  const sums = new Map<string, number>();
  for (const holding of holdings) {
    if (holding.currency === BASE_CURRENCY) continue;
    sums.set(holding.currency, (sums.get(holding.currency) ?? 0) + (holdingValue(holding) ?? holding.costBasis));
  }
  if (sums.size === 0) return null;
  const counted = holdings
    .filter((holding) => holding.currency === BASE_CURRENCY)
    .reduce((sum, holding) => sum + (holdingValue(holding) ?? 0), 0);
  const [[currency, amount]] = [...sums].sort((a, b) => b[1] - a[1]);
  const money = f.money(amount, currency, { decimals: 0 });
  const single = sums.size === 1;
  return {
    id: "currency",
    value: single ? money : t.value(sums.size),
    text: single ? t.one(money, t.names[currency] ?? currency) : t.many([...sums.keys()].join(t.and)),
    tone: "warning",
    calculation: [...[...sums].map(([code, value]) => t.line(f.money(value, code, { decimals: 0 }), code)), t.counted(f.eur(counted))],
    assumptions: [t.assumption],
  };
}

/** A bad first decade (the 10th percentile of history-based simulations): for the first goal, or for the result. */
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
  const decade = Math.min(10, Math.floor(months / 12));
  const { p10, p50 } = bandsFor(investment, { start: scenario.capital, monthly: scenario.monthly, years: decade });
  const bad = p10[decade];
  const typical = p50[decade];
  const period = decade === 10 ? t.decade : t.years(decade);
  const calculation = [t.afterYears(decade, f.eur(typical), f.eur(bad)), t.thenAverage];
  const assumptions = [t.simulated(simulationsText(investment, i18n)), monthlyAssumption(scenario, i18n)];

  if (focus) {
    const typicalMonths = decade * 12 + monthsToGoal(typical, scenario.monthly, scenario.realReturn, focus.target);
    const badMonths = decade * 12 + monthsToGoal(bad, scenario.monthly, scenario.realReturn, focus.target);
    const delay = badMonths - typicalMonths;
    // A bad start that pushes the goal past 60 years would quote a date that far out.
    if (!withinReach(badMonths) || !withinReach(typicalMonths) || delay < 12) return null;
    return {
      id: "sequence",
      value: `+${f.span(delay)}`,
      text: t.goalText(period, f.span(delay)),
      tone: "warning",
      calculation: [...calculation, t.goalLine(goalName(focus, i18n), f.span(typicalMonths), f.span(badMonths))],
      assumptions,
    };
  }
  const rest = months - decade * 12;
  const after = (start: number) => valueAt({ ...scenario, capital: start }, rest);
  const shortfall = after(typical) - after(bad);
  if (shortfall < Math.max(1000, after(typical) * 0.05)) return null;
  const year = yearOf(today, months);
  return {
    id: "sequence",
    value: f.eurRounded(-shortfall),
    text: t.resultText(period, f.eurRounded(shortfall), year),
    tone: "warning",
    calculation: [...calculation, t.resultLine(year, f.eur(after(typical)), f.eur(after(bad)))],
    assumptions,
  };
}

/** How long money takes to double at the plan's growth. */
export function doublingFinding({ calc, i18n }: FindingContext): Finding | null {
  const { m, f } = i18n;
  const rate = calc.scenario.realReturn;
  if (rate < 0.02) return null;
  const years = Math.log(2) / Math.log1p(rate);
  return {
    id: "doubling",
    value: f.span(years * 12),
    text: m.findings.doubling.text(f.rate(rate), f.span(years * 12)),
    tone: "info",
    calculation: [m.findings.doubling.line(f.rate(rate), f.fixed(years, 1))],
    assumptions: [growthAssumption(calc.scenario, calc.investment, i18n)],
  };
}

const RULES: Record<FindingId, (context: FindingContext) => Finding | null> = {
  concentration: concentrationFinding,
  currency: currencyFinding,
  lever: leverFinding,
  sequence: sequenceFinding,
  inflation: inflationFinding,
  waiting: waitingFinding,
  fees: feesFinding,
  doubling: doublingFinding,
};

/** Every finding that matters for this plan, in the fixed order. */
export function allFindings(context: Omit<FindingContext, "market"> & { market?: PricesFile }): Finding[] {
  const full: FindingContext = { ...context, market: context.market ?? MARKET };
  return ORDER.map((id) => RULES[id](full)).filter((finding): finding is Finding => finding !== null);
}

/** The ones the page shows: at most three. */
export function topFindings(context: Omit<FindingContext, "market"> & { market?: PricesFile }): Finding[] {
  return allFindings(context).slice(0, MAX_FINDINGS);
}
