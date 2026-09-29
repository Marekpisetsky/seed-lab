/**
 * "What you should know": short findings about the user's mission, each
 * with one number and one sentence, and the calculation behind it.
 *
 * Every rule is a pure function that returns `null` when it does not matter
 * for this user (its relevance rule). Which rules apply, and in what order,
 * depends on the kind of mission (MISSION_ORDER): risks the user carries
 * first, then what moves the mission, general facts last. The order is
 * fixed, so a card never jumps places when a number changes; the report
 * shows the first five that apply. Findings inform with numbers; they never
 * say what to do.
 */

import { addMonths } from "./dates";
import { holdingValue, monthsToGoal } from "./finance";
import { formatEur, formatEurRounded, formatMoney, formatPercent, formatRate, formatYears } from "./format";
import { INDEXES } from "./indexes";
import { dividendNote, periodText } from "./investment";
import { INDEX_TRACKERS, instrumentForHolding, MARKET, type PricesFile } from "./market-data";
import { answerMetric, MAX_YEARS, monthsTo, valueAt, withinReach, type Report, type Scenario } from "./report";
import { cachedSuccessRate, wealthPercentiles } from "./simulation";
import { BASE_CURRENCY, type Holding } from "./types";

export type FindingId =
  | "lever"
  | "waiting"
  | "inflation"
  | "fees"
  | "geography"
  | "concentration"
  | "currency"
  | "sequence"
  | "withdrawal"
  | "growth-share"
  | "doubling"
  | "stock-past";

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
  report: Report;
  /** Priced holdings. */
  holdings: readonly Holding[];
  market: PricesFile;
}

export const MAX_FINDINGS = 5;
// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

/**
 * Months ahead that euro-at-a-date findings look at: the answer's point in
 * time. A goal a few months away stays short, so long-run findings do not
 * apply to it. `null` when there is no such date: the goal is reached
 * already (a date 20 years out would be about nothing), or it is more than
 * MAX_YEARS away (no finding quotes a figure that far out).
 */
export function horizonOf(report: Report): number | null {
  const { answer } = report;
  if (answer.mode === "horizon") return answer.months;
  if (!answer.reachable || answer.months === 0) return null;
  return answer.months;
}

function yearOf(report: Report, months: number): number {
  return addMonths(report.today, Math.ceil(months - 1e-9)).getUTCFullYear();
}

function growthAssumption({ investment, scenario }: Report): string {
  const dividends = dividendNote(investment);
  return `Growth ${formatRate(scenario.realReturn)} a year after inflation: ${investment.name}, ${periodText(investment)} average${dividends ? ` (${dividends})` : ""}. Past, not a promise.`;
}

function monthlyAssumption({ scenario }: Report): string {
  return `Your ${formatEur(scenario.monthly)} a month is added at the end of each month and rises with prices.`;
}

const TODAYS_EUROS = "All amounts in today's euros.";

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

/** +€100 a month vs +1 % growth vs having started a year earlier. */
export function leverFinding({ report }: FindingContext): Finding | null {
  const { scenario, goal } = report;
  const connection = goal.status.connection;
  const base = answerMetric(scenario, connection);
  const options = [
    { key: "monthly", label: `+€100 a month (${formatEur(scenario.monthly + 100)})`, scenario: { ...scenario, monthly: scenario.monthly + 100 } },
    { key: "return", label: `+1% growth (${formatRate(scenario.realReturn + 0.01)})`, scenario: { ...scenario, realReturn: scenario.realReturn + 0.01 } },
    { key: "earlier", label: "Starting a year earlier", scenario: { ...scenario, capital: valueAt(scenario, 12) } },
  ] as const;

  if (base.mode === "goal") {
    if (!withinReach(base.months) || base.months < 24) return null;
    const results = options.map((option) => {
      const metric = answerMetric(option.scenario, connection);
      return { ...option, gain: metric.mode === "goal" ? base.months - metric.months : 0 };
    });
    const best = results.reduce((a, b) => (b.gain > a.gain ? b : a));
    if (best.gain < 6) return null;
    const when = formatYears(best.gain);
    const text =
      best.key === "monthly"
        ? `Adding €100 a month gets you there ${when} earlier.`
        : best.key === "return"
          ? `1% more growth a year gets you there ${when} earlier.`
          : `Having started a year ago would put you ${when} ahead.`;
    return {
      id: "lever",
      value: when,
      text,
      tone: "info",
      calculation: [
        `Now: ${formatYears(base.months)} (${yearOf(report, base.months)}).`,
        ...results.map((result) => `${result.label}: ${formatYears(result.gain)} earlier.`),
      ],
      assumptions: [growthAssumption(report), monthlyAssumption(report), `${connection.name}: ${formatEur(goal.status.target)} needed.`],
    };
  }

  const results = options.map((option) => {
    const metric = answerMetric(option.scenario, connection);
    return { ...option, gain: metric.mode === "horizon" ? metric.value - base.value : 0 };
  });
  const best = results.reduce((a, b) => (b.gain > a.gain ? b : a));
  if (base.value <= 0 || best.gain < base.value * 0.05) return null;
  const unit = connection.kind === "live" ? "/month" : "";
  const amount = `${formatEurRounded(best.gain, { signed: true })}${unit}`;
  const year = yearOf(report, report.answer.months);
  const text =
    best.key === "monthly"
      ? `Adding €100 a month gives you ${amount} more in ${year}.`
      : best.key === "return"
        ? `1% more growth a year gives you ${amount} more in ${year}.`
        : `Having started a year ago would give you ${amount} more in ${year}.`;
  return {
    id: "lever",
    value: amount,
    text,
    tone: "info",
    calculation: results.map((result) => `${result.label}: ${formatEur(result.gain, { signed: true })}${unit} in ${year}.`),
    assumptions: [growthAssumption(report), monthlyAssumption(report)],
  };
}

/** What starting the same plan a year later leaves by the answer's date. */
export function waitingFinding({ report }: FindingContext): Finding | null {
  const { scenario, goal } = report;
  const months = horizonOf(report);
  if (months === null || months < 24) return null;
  const now = valueAt(scenario, months);
  // The same capital and monthly amount, invested a year later: one year less by that date.
  const later = valueAt(scenario, months - 12);
  const cost = now - later;
  if (cost < Math.max(500, goal.status.target * 0.02)) return null;
  const year = yearOf(report, months);
  return {
    id: "waiting",
    value: formatEurRounded(cost),
    text: `Starting a year later leaves you ${formatEurRounded(cost)} less by ${year}.`,
    tone: "info",
    calculation: [
      `Start now: ${formatEur(now)} by ${year}.`,
      `Start the same plan a year later: ${formatEur(later)}.`,
      `Difference: ${formatEur(cost)}.`,
    ],
    assumptions: [growthAssumption(report), monthlyAssumption(report), TODAYS_EUROS],
  };
}

/** What the goal's amount, in money of that year, is worth today. */
export function inflationFinding({ report }: FindingContext): Finding | null {
  const { plan, goal, answer, scenario } = report;
  // A goal already reached costs what it costs today.
  if (answer.mode === "goal" && answer.months === 0) return null;
  const months = horizonOf(report);
  if (months === null) return null;
  const years = months / 12;
  if (years < 5 || plan.inflation <= 0) return null;
  // What the account holds then, in today's euros: the goal when it is reached, else the projection.
  const real = answer.mode === "goal" ? goal.status.target : valueAt(scenario, months);
  if (real <= 0) return null;
  const factor = Math.pow(1 + plan.inflation, years);
  const nominal = real * factor;
  const year = yearOf(report, months);
  return {
    id: "inflation",
    value: `~${formatEurRounded(nominal)}`,
    text: `In ${year} your account will show ~${formatEurRounded(nominal)} — worth ${formatEurRounded(real)} of today's money.`,
    tone: "info",
    calculation: [
      `Prices rising ${formatRate(plan.inflation)} a year for ${Math.round(years)} years: × ${factor.toFixed(2)}.`,
      `${formatEur(real)} × ${factor.toFixed(2)} = ${formatEur(nominal)} in euros of ${year}.`,
      `Every amount in Wealth Lens is in today's euros; your broker will show euros of ${year}.`,
    ],
    assumptions: [`Inflation ${formatRate(plan.inflation)} a year.`, "Growth rates are after inflation, so they already allow for it."],
  };
}

/** A fund charging 1 % a year against one charging 0.2 %. */
export function feesFinding({ report }: FindingContext): Finding | null {
  const { scenario, goal } = report;
  const months = horizonOf(report);
  if (months === null || months < 60) return null;
  const cheap: Scenario = { ...scenario, realReturn: scenario.realReturn - 0.002 };
  const dear: Scenario = { ...scenario, realReturn: scenario.realReturn - 0.01 };
  const cost = valueAt(cheap, months) - valueAt(dear, months);
  if (cost < 1000) return null;
  const year = yearOf(report, months);
  const target = goal.status.target;
  const delay = monthsTo(dear, target) - monthsTo(cheap, target);
  return {
    id: "fees",
    value: formatEurRounded(cost),
    text: `A 1% fund instead of 0.2% costs you ${formatEurRounded(cost)} by ${year}.`,
    tone: "info",
    calculation: [
      `At 0.2% a year: ${formatEur(valueAt(cheap, months))} by ${year}.`,
      `At 1% a year: ${formatEur(valueAt(dear, months))}.`,
      ...(withinReach(monthsTo(dear, target)) && delay >= 1 ? [`Reaching ${formatEur(target)} takes ${formatYears(delay)} longer.`] : []),
    ],
    assumptions: [
      "The index returns here are before fund costs. Index funds cost about 0.1-0.3% a year; many other funds 1% or more.",
      growthAssumption(report),
    ],
  };
}

/**
 * Stopping work: where the money already pays for a life, or how much sooner
 * than at home. Living abroad: that country against stopping work at home.
 */
export function geographyFinding({ report }: FindingContext): Finding | null {
  const countries = report.statuses.filter((status) => status.connection.group === "country");
  const home = report.statuses.find((status) => status.connection.id === "life:stop-working");
  if (countries.length === 0 || !home) return null;
  const homeName = home.connection.source.match(/Country: (.+)\.$/)?.[1] ?? "home";
  const HomeName = homeName[0].toUpperCase() + homeName.slice(1);
  const { mission } = report.goal;
  if (mission.kind === "live-abroad") return abroadFinding(report, home, homeName);
  if (mission.kind !== "stop-working") return null;
  const place = (name: string) => name.replace(/^Live in /, "");
  const covered = countries.filter((status) => status.months === 0);
  const soonest = [...countries].sort((a, b) => a.months - b.months);
  const assumptions = ["One person, country averages, rent included where you rent (Numbeo + Wise, Sep 2026). Estimates; cities vary."];
  const when = (months: number) => (months === 0 ? "now" : withinReach(months) ? `in ${formatYears(months)}` : `not within ${MAX_YEARS} years`);
  const listing = soonest
    .slice(0, 5)
    .map((status) => `${place(status.connection.name)}: ${when(status.months)} (${formatEur(status.connection.amount)}/month).`);

  if (covered.length > 0) {
    const text =
      covered.length === 1
        ? `Your money already covers living in ${place(covered[0].connection.name)}.`
        : `Your money already covers living costs in ${covered.length} countries.`;
    return {
      id: "geography",
      value: covered.length === 1 ? "Now" : `${covered.length} countries`,
      text,
      tone: "info",
      calculation: [...listing, `${HomeName}: ${when(home.months)}.`],
      assumptions,
    };
  }
  const best = soonest[0];
  if (!withinReach(best.months)) return null;
  const homeReachable = withinReach(home.months);
  const gap = home.months - best.months;
  if (homeReachable && gap < 24) return null;
  const name = place(best.connection.name);
  return {
    id: "geography",
    value: homeReachable ? formatYears(gap) : formatYears(best.months),
    text: homeReachable
      ? `Living in ${name} comes ${formatYears(gap)} before ${homeName}.`
      : `Living in ${name} is within reach in ${formatYears(best.months)}; ${homeName} is not.`,
    tone: "info",
    calculation: [...listing, `${HomeName}: ${when(home.months)}.`],
    assumptions,
  };
}

/** The mission's country against stopping work at home. */
function abroadFinding(report: Report, home: Report["statuses"][number], homeName: string): Finding | null {
  const abroad = report.goal.status;
  if (abroad.months === 0 || abroad.connection.amount === home.connection.amount) return null;
  const place = abroad.connection.name.replace(/^Live in /, "");
  const calculation = [
    `${place}: ${formatEur(abroad.connection.amount)} a month, ${formatEur(abroad.target)} needed.`,
    `Stopping work in ${homeName}: ${formatEur(home.connection.amount)} a month, ${formatEur(home.target)} needed.`,
  ];
  const assumptions = ["One person, country averages, rent included where you rent (Numbeo + Wise, Sep 2026). Estimates; cities vary."];
  const abroadReach = withinReach(abroad.months);
  const homeReach = withinReach(home.months);
  if (abroadReach && homeReach) {
    const gap = home.months - abroad.months;
    if (Math.abs(gap) < 24) return null;
    return {
      id: "geography",
      value: formatYears(Math.abs(gap)),
      text: `Living in ${place} comes ${formatYears(Math.abs(gap))} ${gap > 0 ? "before" : "after"} stopping work in ${homeName}.`,
      tone: "info",
      calculation,
      assumptions,
    };
  }
  if (abroadReach === homeReach) return null;
  return {
    id: "geography",
    value: abroadReach ? `${place}: yes` : `${place}: no`,
    text: abroadReach
      ? `${place} is within ${MAX_YEARS} years; stopping work in ${homeName} is not.`
      : `Stopping work in ${homeName} is within ${MAX_YEARS} years; ${place} is not.`,
    tone: "info",
    calculation,
    assumptions,
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
      instrument
        ? `Projections count it as the ${INDEXES[instrument.index].name}; one company can fall much further than an index.`
        : "Projections count it as world stocks; one company can fall much further than an index.",
    ],
    assumptions: ["Only holdings priced in euros are counted."],
  };
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
    assumptions: ["Wealth Lens does not convert currencies, so the goal and income only use euro holdings."],
  };
}

/** A bad first decade (the 10th percentile of history-based simulations). */
export function sequenceFinding({ report }: FindingContext): Finding | null {
  const { scenario, investment, goal } = report;
  const months = horizonOf(report);
  if (months === null || months < 60) return null;
  const decade = Math.min(10, Math.floor(months / 12));
  const { p10, p50 } = wealthPercentiles({
    start: scenario.capital,
    monthly: scenario.monthly,
    returns: investment.returns,
    years: decade,
    key: investment.key,
  });
  const bad = p10[decade];
  const typical = p50[decade];
  const period = decade === 10 ? "decade" : `${decade} years`;
  const calculation = [
    `After ${decade} years: ${formatEur(typical)} in a typical case, ${formatEur(bad)} in a bad one (1 in 10).`,
    "From then on, growth at the average rate.",
  ];
  const assumptions = [
    `1,000 simulations drawing each year's return from the ${investment.name} history (${periodText(investment)}).`,
    monthlyAssumption(report),
  ];
  const rest = months - decade * 12;

  if (report.answer.mode === "goal") {
    const target = goal.status.target;
    const typicalMonths = decade * 12 + monthsToGoal(typical, scenario.monthly, scenario.realReturn, target);
    const badMonths = decade * 12 + monthsToGoal(bad, scenario.monthly, scenario.realReturn, target);
    const delay = badMonths - typicalMonths;
    // A bad start that pushes the goal past MAX_YEARS would quote a date that far out.
    if (!withinReach(badMonths) || !withinReach(typicalMonths) || delay < 12) return null;
    return {
      id: "sequence",
      value: `+${formatYears(delay)}`,
      text: `A bad first ${period} (1 in 10) pushes it back ${formatYears(delay)}.`,
      tone: "warning",
      calculation: [...calculation, `Goal reached in ${formatYears(typicalMonths)} typically, ${formatYears(badMonths)} after a bad start.`],
      assumptions,
    };
  }
  const after = (start: number) => valueAt({ ...scenario, capital: start }, rest);
  const shortfall = after(typical) - after(bad);
  if (shortfall < Math.max(1000, after(typical) * 0.05)) return null;
  const year = yearOf(report, months);
  return {
    id: "sequence",
    value: formatEurRounded(-shortfall),
    text: `A bad first ${period} (1 in 10) leaves ${formatEurRounded(shortfall)} less by ${year}.`,
    tone: "warning",
    calculation: [...calculation, `By ${year}: ${formatEur(after(typical))} typically, ${formatEur(after(bad))} after a bad start.`],
    assumptions,
  };
}

/** A withdrawal rate that ran out of money in more than 1 history in 10. */
export function withdrawalFinding({ report }: FindingContext): Finding | null {
  const { goal, scenario, investment } = report;
  if (goal.status.connection.kind !== "live") return null;
  const lasted = cachedSuccessRate(investment.key, investment.returns, scenario.withdrawalRate);
  if (lasted >= 0.9) return null;
  const failed = 1 - lasted;
  return {
    id: "withdrawal",
    value: `1 in ${Math.max(2, Math.round(1 / failed))}`,
    text: `At ${formatRate(scenario.withdrawalRate)} a year, the money ran out in ${formatPercent(failed, { decimals: 0 })} of histories.`,
    tone: "warning",
    calculation: [
      `5,000 simulated 30-year retirements taking ${formatRate(scenario.withdrawalRate)} of the starting capital each year.`,
      `Lasted 30 years: ${formatPercent(lasted, { decimals: 0 })}.`,
    ],
    assumptions: [`Each year's return drawn from the ${investment.name} history (${periodText(investment)}). All in stocks, no fees, no taxes.`],
  };
}

/** How much of the money at the answer's date is growth rather than savings. */
export function growthShareFinding({ report }: FindingContext): Finding | null {
  const { scenario } = report;
  const months = horizonOf(report);
  if (months === null || months < 60) return null;
  const total = valueAt(scenario, months);
  const saved = scenario.capital + scenario.monthly * months;
  const share = total > 0 ? (total - saved) / total : 0;
  if (share < 0.3) return null;
  const year = yearOf(report, months);
  const pct = formatPercent(share, { decimals: 0 });
  return {
    id: "growth-share",
    value: pct,
    text: `By ${year}, ${pct} of your money is growth, not savings.`,
    tone: "info",
    calculation: [`By ${year}: ${formatEur(total)}.`, `You put in ${formatEur(saved)}.`, `Growth: ${formatEur(total - saved)}.`],
    assumptions: [growthAssumption(report), monthlyAssumption(report)],
  };
}

/** How long money takes to double at the plan's growth. */
export function doublingFinding({ report }: FindingContext): Finding | null {
  const rate = report.scenario.realReturn;
  if (rate < 0.02) return null;
  const years = Math.log(2) / Math.log1p(rate);
  return {
    id: "doubling",
    value: formatYears(years * 12),
    text: `At ${formatRate(rate)} after inflation, money doubles every ${formatYears(years * 12)}.`,
    tone: "info",
    calculation: [`(1 + ${formatRate(rate)}) ^ ${years.toFixed(1)} = 2.`],
    assumptions: [growthAssumption(report)],
  };
}

/** A single stock chosen as the investment: its own past is not what is projected. */
export function stockPastFinding({ report, market }: FindingContext): Finding | null {
  const { investment } = report;
  if (investment.investment.kind !== "stock" || !investment.proxyIndex) return null;
  const growth = market.prices[investment.investment.id]?.growth;
  if (!growth) return null;
  const index = INDEXES[investment.proxyIndex];
  const pct = formatPercent(growth.perYear, { decimals: 0 });
  return {
    id: "stock-past",
    value: `${pct}/yr`,
    text: `${investment.name} grew ${pct} a year; projections use the ${index.name}'s ${formatRate(index.averageReturn)} (${index.firstYear}–${index.lastYear}).`,
    tone: "info",
    calculation: [
      `${investment.name}: ${pct} a year since ${growth.from.slice(0, 4)} (price, before inflation). Past, not a forecast.`,
      `${index.name}: ${formatRate(index.averageReturn)} a year after inflation, ${index.firstYear}–${index.lastYear} average.`,
    ],
    assumptions: ["Decades of a single company's growth are not projected: few companies keep it up."],
  };
}

const RULES: Record<FindingId, (context: FindingContext) => Finding | null> = {
  lever: leverFinding,
  waiting: waitingFinding,
  inflation: inflationFinding,
  fees: feesFinding,
  geography: geographyFinding,
  concentration: concentrationFinding,
  currency: currencyFinding,
  sequence: sequenceFinding,
  withdrawal: withdrawalFinding,
  "growth-share": growthShareFinding,
  doubling: doublingFinding,
  "stock-past": stockPastFinding,
};

/**
 * The findings that can matter for each kind of mission, in the order they
 * are shown: risks the user carries, then what moves the mission, then
 * general facts. Living off the money adds the withdrawal rate, a bad first
 * decade weighs more, and where else the money goes further; a purchase or
 * an amount does not depend on either.
 */
export const MISSION_ORDER: Readonly<Record<"live" | "buy", readonly FindingId[]>> = {
  live: ["concentration", "currency", "lever", "sequence", "withdrawal", "inflation", "waiting", "fees", "geography", "stock-past", "growth-share", "doubling"],
  buy: ["concentration", "currency", "lever", "inflation", "waiting", "fees", "sequence", "stock-past", "growth-share", "doubling"],
};

/** Every finding that matters for this user's mission, in the mission's order. */
export function allFindings(report: Report, holdings: readonly Holding[], market: PricesFile = MARKET): Finding[] {
  const context: FindingContext = { report, holdings, market };
  return MISSION_ORDER[report.goal.status.connection.kind]
    .map((id) => RULES[id](context))
    .filter((finding): finding is Finding => finding !== null);
}

/** The ones the report shows: at most five. */
export function topFindings(report: Report, holdings: readonly Holding[], market: PricesFile = MARKET): Finding[] {
  return allFindings(report, holdings, market).slice(0, MAX_FINDINGS);
}
