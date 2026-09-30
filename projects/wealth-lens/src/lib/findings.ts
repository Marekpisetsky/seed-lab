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
 * never say what to do.
 */

import { valueAt, withinReach, type Calculation, type GoalStatus, type Scenario } from "./calculator";
import { addMonths } from "./dates";
import { holdingValue, monthsToGoal } from "./finance";
import { formatEur, formatEurRounded, formatMoney, formatPercent, formatRate, formatYears } from "./format";
import { assetName } from "./assets";
import { dividendNote, type ResolvedInvestment } from "./investment";
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

function growthAssumption(scenario: Scenario, investment: ResolvedInvestment): string {
  const dividends = dividendNote(investment);
  const what = investment.period ? "Past, not a promise." : "Not a promise.";
  return `Growth ${formatRate(scenario.realReturn)} a year after inflation: ${investment.growthText}${dividends ? ` (${dividends})` : ""}. ${what}`;
}

function monthlyAssumption(scenario: Scenario): string {
  return `Your ${formatEur(scenario.monthly)} a month is added at the end of each month and rises with prices.`;
}

const TODAYS_EUROS = "All amounts in today's euros.";

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

/** +€100 a month vs +1 % growth vs having started a year earlier: for the first goal, or for the result. */
export function leverFinding(context: FindingContext): Finding | null {
  const { calc, today } = context;
  const { scenario, investment } = calc;
  const options = [
    { key: "monthly", label: `+€100 a month (${formatEur(scenario.monthly + 100)})`, scenario: { ...scenario, monthly: scenario.monthly + 100 } },
    { key: "return", label: `+1% growth (${formatRate(scenario.realReturn + 0.01)})`, scenario: { ...scenario, realReturn: scenario.realReturn + 0.01 } },
    { key: "earlier", label: "Starting a year earlier", scenario: { ...scenario, capital: valueAt(scenario, 12) } },
  ] as const;
  const assumptions = [growthAssumption(scenario, investment), monthlyAssumption(scenario)];

  // A first goal under two years away says little about levers: then it is about the result.
  const focus = focusOf(context);
  if (focus && focus.months >= 24) {
    const monthsFor = (s: Scenario) => monthsToGoal(s.capital, s.monthly, s.realReturn, focus.target);
    const results = options.map((option) => ({ ...option, gain: focus.months - monthsFor(option.scenario) }));
    const best = results.reduce((a, b) => (b.gain > a.gain ? b : a));
    if (best.gain < 6) return null;
    const when = formatYears(best.gain);
    const text =
      best.key === "monthly"
        ? `Adding €100 a month reaches your first goal ${when} sooner.`
        : best.key === "return"
          ? `1% more growth a year reaches your first goal ${when} sooner.`
          : `Having started a year ago would reach your first goal ${when} sooner.`;
    return {
      id: "lever",
      value: when,
      text,
      tone: "info",
      calculation: [
        `${focus.name}: ${formatEur(focus.target)} needed, in ${formatYears(focus.months)} (${yearOf(today, focus.months)}).`,
        ...results.map((result) => `${result.label}: ${formatYears(result.gain)} sooner.`),
      ],
      assumptions,
    };
  }

  const months = horizonOf(context);
  const base = valueAt(scenario, months);
  const results = options.map((option) => ({ ...option, gain: valueAt(option.scenario, months) - base }));
  const best = results.reduce((a, b) => (b.gain > a.gain ? b : a));
  if (base <= 0 || best.gain < Math.max(1000, base * 0.05)) return null;
  const amount = formatEurRounded(best.gain);
  const year = yearOf(today, months);
  const text =
    best.key === "monthly"
      ? `Adding €100 a month gives you ${amount} more by ${year}.`
      : best.key === "return"
        ? `1% more growth a year gives you ${amount} more by ${year}.`
        : `Having started a year ago would give you ${amount} more by ${year}.`;
  return {
    id: "lever",
    value: `+${amount}`,
    text,
    tone: "info",
    calculation: [`Now: ${formatEur(base)} by ${year}.`, ...results.map((result) => `${result.label}: ${formatEur(result.gain, { signed: true })}.`)],
    assumptions,
  };
}

/** What starting the same plan a year later leaves at the end of the chosen years. */
export function waitingFinding(context: FindingContext): Finding | null {
  const { calc, today } = context;
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
    value: formatEurRounded(cost),
    text: `Starting a year later leaves you ${formatEurRounded(cost)} less by ${year}.`,
    tone: "info",
    calculation: [`Start now: ${formatEur(now)} by ${year}.`, `Start the same plan a year later: ${formatEur(later)}.`, `Difference: ${formatEur(cost)}.`],
    assumptions: [growthAssumption(calc.scenario, calc.investment), monthlyAssumption(calc.scenario), TODAYS_EUROS],
  };
}

/** What the result, in today's euros, will read on a statement of that year. */
export function inflationFinding(context: FindingContext): Finding | null {
  const { calc, inflation, today } = context;
  const months = horizonOf(context);
  const years = months / 12;
  if (years < 5 || inflation <= 0) return null;
  const real = calc.result.total;
  // "~€6, worth €4 of today's money" says nothing.
  if (real < 1000) return null;
  const factor = Math.pow(1 + inflation, years);
  const nominal = real * factor;
  const year = yearOf(today, months);
  return {
    id: "inflation",
    value: `~${formatEurRounded(nominal)}`,
    text: `In ${year} your account will show ~${formatEurRounded(nominal)} — worth ${formatEurRounded(real)} of today's money.`,
    tone: "info",
    calculation: [
      `Prices rising ${formatRate(inflation)} a year for ${Math.round(years)} years: × ${factor.toFixed(2)}.`,
      `${formatEur(real)} × ${factor.toFixed(2)} = ${formatEur(nominal)} in euros of ${year}.`,
      `Every amount in Wealth Lens is in today's euros; your broker will show euros of ${year}.`,
    ],
    assumptions: [`Inflation ${formatRate(inflation)} a year.`, "Growth rates are after inflation, so they already allow for it."],
  };
}

/** A fund charging 1 % a year against one charging 0.2 %. */
export function feesFinding(context: FindingContext): Finding | null {
  const { calc, today } = context;
  const months = horizonOf(context);
  if (months < 60) return null;
  const cheap: Scenario = { ...calc.scenario, realReturn: calc.scenario.realReturn - 0.002 };
  const dear: Scenario = { ...calc.scenario, realReturn: calc.scenario.realReturn - 0.01 };
  const cost = valueAt(cheap, months) - valueAt(dear, months);
  if (cost < 1000) return null;
  const year = yearOf(today, months);
  return {
    id: "fees",
    value: formatEurRounded(cost),
    text: `A 1% fund instead of 0.2% costs you ${formatEurRounded(cost)} by ${year}.`,
    tone: "info",
    calculation: [`At 0.2% a year: ${formatEur(valueAt(cheap, months))} by ${year}.`, `At 1% a year: ${formatEur(valueAt(dear, months))}.`],
    assumptions: [
      "The index returns here are before fund costs. Index funds cost about 0.1-0.3% a year; many other funds 1% or more.",
      growthAssumption(calc.scenario, calc.investment),
    ],
  };
}

/** One holding (not an index fund) weighing more than 40 % of the portfolio. */
export function concentrationFinding({ holdings, market }: FindingContext): Finding | null {
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
  const pct = formatPercent(weight, { decimals: 0 });
  return {
    id: "concentration",
    value: pct,
    text: `${pct} of your portfolio rides on ${ticker} alone.`,
    tone: "warning",
    calculation: [
      `${ticker}: ${formatEur(biggest.value)} of ${formatEur(total)} in euros.`,
      ...(prices?.change1y != null ? [`Last 12 months: ${formatPercent(prices.change1y, { signed: true, decimals: 0 })}.`] : []),
      ...(prices?.drawdown ? [`Worst fall from a peak since ${prices.drawdown.from.slice(0, 4)}: ${formatPercent(-prices.drawdown.max, { decimals: 0 })}.`] : []),
      `In My portfolio it grows like ${referenceText(biggest.holding)}${instrument ? ", with its own ups and downs" : ""}; one company can fall much further than an index.`,
    ],
    assumptions: ["Only holdings priced in euros are counted."],
  };
}

/** "the Nasdaq-100", "gold", "a savings account": what a holding grows like, in a sentence. */
function referenceText(holding: Holding): string {
  const { asset } = referenceFor(holding);
  if (asset === "savings") return "a savings account";
  if (asset === "gold") return "gold";
  if (asset === "bonds") return "euro government bonds";
  return asset === "world" ? "world stocks" : `the ${assetName(asset)}`;
}

const CURRENCY_NAMES: Readonly<Record<string, string>> = {
  USD: "US dollars",
  GBP: "pounds",
  GBX: "pence",
  CHF: "Swiss francs",
  JPY: "yen",
  PLN: "złoty",
  SEK: "Swedish kronor",
  NOK: "Norwegian kroner",
  DKK: "Danish kroner",
  CAD: "Canadian dollars",
};

/** Holdings in another currency, which are left out of every figure. */
export function currencyFinding({ holdings }: FindingContext): Finding | null {
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
  const money = formatMoney(amount, currency, { decimals: 0 });
  const single = sums.size === 1;
  return {
    id: "currency",
    value: single ? money : `${sums.size} currencies`,
    text: single
      ? `Your ${money} in ${CURRENCY_NAMES[currency] ?? currency} isn't counted: no currency conversion.`
      : `Your holdings in ${[...sums.keys()].join(" and ")} aren't counted: no currency conversion.`,
    tone: "warning",
    calculation: [
      ...[...sums].map(([code, value]) => `${formatMoney(value, code, { decimals: 0 })} in ${code}: not counted.`),
      `Counted: ${formatEur(counted)} in euros.`,
    ],
    assumptions: ["Wealth Lens does not convert currencies, so the result and the goals only use euro holdings."],
  };
}

/** A bad first decade (the 10th percentile of history-based simulations): for the first goal, or for the result. */
export function sequenceFinding(context: FindingContext): Finding | null {
  const { calc, today } = context;
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
  const period = decade === 10 ? "decade" : `${decade} years`;
  const calculation = [
    `After ${decade} years: ${formatEur(typical)} in a typical case, ${formatEur(bad)} in a bad one (1 in 10).`,
    "From then on, growth at the average rate.",
  ];
  const assumptions = [`1,000 simulated paths: ${investment.modelText}.`, monthlyAssumption(scenario)];

  if (focus) {
    const typicalMonths = decade * 12 + monthsToGoal(typical, scenario.monthly, scenario.realReturn, focus.target);
    const badMonths = decade * 12 + monthsToGoal(bad, scenario.monthly, scenario.realReturn, focus.target);
    const delay = badMonths - typicalMonths;
    // A bad start that pushes the goal past 60 years would quote a date that far out.
    if (!withinReach(badMonths) || !withinReach(typicalMonths) || delay < 12) return null;
    return {
      id: "sequence",
      value: `+${formatYears(delay)}`,
      text: `A bad first ${period} (1 in 10) delays your first goal ${formatYears(delay)}.`,
      tone: "warning",
      calculation: [...calculation, `${focus.name}: in ${formatYears(typicalMonths)} typically, ${formatYears(badMonths)} after a bad start.`],
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
    value: formatEurRounded(-shortfall),
    text: `A bad first ${period} (1 in 10) leaves ${formatEurRounded(shortfall)} less by ${year}.`,
    tone: "warning",
    calculation: [...calculation, `By ${year}: ${formatEur(after(typical))} typically, ${formatEur(after(bad))} after a bad start.`],
    assumptions,
  };
}

/** How long money takes to double at the plan's growth. */
export function doublingFinding({ calc }: FindingContext): Finding | null {
  const rate = calc.scenario.realReturn;
  if (rate < 0.02) return null;
  const years = Math.log(2) / Math.log1p(rate);
  return {
    id: "doubling",
    value: formatYears(years * 12),
    text: `At ${formatRate(rate)} after inflation, money doubles every ${formatYears(years * 12)}.`,
    tone: "info",
    calculation: [`(1 + ${formatRate(rate)}) ^ ${years.toFixed(1)} = 2.`],
    assumptions: [growthAssumption(calc.scenario, calc.investment)],
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
