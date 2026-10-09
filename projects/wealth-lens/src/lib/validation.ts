/**
 * Turns untrusted JSON (a data file the user loads) into valid values.
 * Everything is checked field by field: a bad field falls back to its
 * default without resetting the others. What earlier versions had and the
 * app no longer does (stocks, My portfolio, a price list) becomes the
 * nearest thing it does, with a notice.
 */

import { isAssetId } from "./assets";
import { DEFAULT_PRICES_OF, isPriceCountry, referenceRate } from "@seed-kit/inflation-rates.ts";
import { isIndexId, RETIRED_SERIES } from "./index-ids";
import { resolveInvestment, toReal } from "./investment";
import { MAX_PARTS, mixPartKey } from "./mix";
import { problem, type Problem } from "./problems";
import { snapWithdrawal } from "./withdrawal";
import type { AssetId } from "./assets";
import { STANDARD_ASSUMPTIONS, type AssumptionOverrides, type Goal, type Investment, type LegacyGoal, type MixPart, type NewGoal, type Plan } from "./types";

/** The euro goal of version 1 files, which becomes the goal "reach an amount". */
export const DEFAULT_GOAL: LegacyGoal = { amount: 100_000, targetDate: null };

/** The largest amount accepted anywhere (invested, monthly, a price): EUR 1 billion. */
export const MAX_AMOUNT = 1e9;

/**
 * The growth step 3 starts with, after rising prices: world stocks grew
 * 5.2 % a year from 1900 to 2024 (UBS Global Investment Returns Yearbook
 * 2025, Dimson, Marsh and Staunton, a published average), rounded down.
 * Custom growth, with the ups and downs of US stocks.
 */
export const STARTING_GROWTH = 0.05;

/**
 * The growth a year after rising prices a plan accepts, as fractions: from
 * −50 % to 500 % (step 3 and the data file). 500 % is a technical limit,
 * not a judgement: at it, 60 years give figures of about 10⁴⁷ €, still far
 * inside what the browser's numbers hold (about 10³⁰⁸), also for the
 * highest of the possible futures, and the page writes them in words or as
 * a power of ten (seed-kit format.ts). Above 50 % step 3 says plainly that
 * the data has nothing like it (lib/realism.ts).
 */
export const GROWTH_LIMITS = { min: -0.5, max: 5 } as const;

/**
 * A first visit starts with these: the amounts empty, to be typed (the page
 * shows only the steps until they are), Custom growth at 5 % (STARTING_GROWTH),
 * prices of the Netherlands and 20 years. No goals: the user adds them if
 * they want.
 */
export const DEFAULT_PLAN: Plan = {
  invested: null,
  monthlyContribution: null,
  investment: { kind: "custom" },
  years: 20,
  withdrawalRate: 0.04,
  pricesOf: DEFAULT_PRICES_OF,
  assumptions: { ...STANDARD_ASSUMPTIONS, growth: STARTING_GROWTH },
  goals: [],
};

/** The examples the empty fields show in grey ("e.g. 1,000"), never used as data. */
export const EXAMPLE_AMOUNTS = { invested: 1000, monthlyContribution: 200 } as const;

/** The first visit's plan with the example amounts typed in: what the examples would give. */
export const EXAMPLE_PLAN: Plan = { ...DEFAULT_PLAN, ...EXAMPLE_AMOUNTS };

/** The most swings a year accepted: 100 % (more says nothing a plan can use). */
export const MAX_VOLATILITY = 1;

/** Years the calculator accepts. */
export const MIN_YEARS = 1;
export const MAX_YEARS_AHEAD = 60;
/** At most this many goals are read from a file. */
export const MAX_GOALS = 50;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

/** A yearly rate between −100 % and 100 % (exclusive). */
function isRate(value: unknown): value is number {
  return isFiniteNumber(value) && value > -1 && value < 1;
}

/** A growth a year in GROWTH_LIMITS. */
function isGrowth(value: unknown): value is number {
  return isFiniteNumber(value) && value >= GROWTH_LIMITS.min && value <= GROWTH_LIMITS.max;
}

const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const COUNTRY_PATTERN = /^[A-Z]{2}$/;

export function isCurrencyCode(value: unknown): value is string {
  return typeof value === "string" && CURRENCY_PATTERN.test(value);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function parseGoal(value: unknown): LegacyGoal | null {
  if (!isRecord(value)) return null;
  return {
    amount: isNonNegativeNumber(value.amount) ? value.amount : DEFAULT_GOAL.amount,
    targetDate: isIsoDate(value.targetDate) ? value.targetDate : null,
  };
}

/** One-line notices for things a file had that the app no longer does, said once it is loaded. */
export type Notices = Problem[];

/** An asset of this version, or one an earlier version offered and what it becomes (with a notice). */
function readAsset(value: unknown, notices: Notices): AssetId | null {
  if (isAssetId(value)) return value;
  if (typeof value === "string" && value in RETIRED_SERIES) {
    if (!notices.some((notice) => notice.code === "series-retired")) notices.push(problem("series-retired", { series: value }));
    return RETIRED_SERIES[value];
  }
  return null;
}

/** A single stock (any version): US stocks now, said once. */
function stockAsUs(notices: Notices): AssetId {
  if (!notices.some((notice) => notice.code === "stocks-now-us")) notices.push(problem("stocks-now-us"));
  return "sp500";
}

/**
 * The parts of a mix: assets. Earlier versions also had stocks of a list
 * ("stock": "NVDA" in version 7, "ref": "stock:NVDA" in version 5) and
 * world stocks or the Nasdaq-100: they count as US stocks now (weights of
 * the same asset add up), with a notice.
 */
function parseMixParts(value: unknown[], notices: Notices): MixPart[] {
  const parts = new Map<string, MixPart>();
  for (const part of value) {
    if (!isRecord(part) || !isFiniteNumber(part.weight) || part.weight < 0 || part.weight > 100) continue;
    let asset: AssetId | null = null;
    if (part.stock !== undefined) asset = stockAsUs(notices);
    else if (part.asset !== undefined) asset = readAsset(part.asset, notices);
    else if (typeof part.ref === "string") {
      const [kind, id] = part.ref.split(":");
      if (kind === "index") asset = readAsset(id, notices);
      if (kind === "stock") asset = stockAsUs(notices);
    }
    if (!asset) continue;
    const read: MixPart = { asset, weight: part.weight };
    const key = mixPartKey(read);
    const kept = parts.get(key);
    if (kept) kept.weight = Math.min(100, kept.weight + read.weight);
    else if (parts.size < MAX_PARTS) parts.set(key, read);
  }
  return [...parts.values()];
}

/**
 * What the plan invests in. Also reads earlier versions: an index (versions
 * 1 to 5) is that asset; world stocks or the Nasdaq-100, a single stock
 * (version 5) and My portfolio (versions 6 to 10) become US stocks, each
 * with a notice.
 */
export function parseInvestment(value: unknown, notices: Notices = []): Investment | null {
  if (!isRecord(value)) return null;
  switch (value.kind) {
    case "asset": {
      const asset = readAsset(value.asset, notices);
      return asset ? { kind: "asset", asset } : null;
    }
    case "index": {
      const asset = isIndexId(value.index) ? value.index : readAsset(value.index, notices);
      return asset ? { kind: "asset", asset } : null;
    }
    case "stock":
      return { kind: "asset", asset: stockAsUs(notices) };
    case "portfolio":
      notices.push(problem("portfolio-retired"));
      return { kind: "asset", asset: "sp500" };
    case "mix": {
      if (!Array.isArray(value.parts)) return null;
      const parts = parseMixParts(value.parts, notices);
      return parts.length > 0 ? { kind: "mix", parts, rebalance: value.rebalance === true } : null;
    }
    case "custom":
      return { kind: "custom" };
    default:
      return null;
  }
}

/** The data file version whose plans store the growth after rising prices as one number (see parseAssumptions). */
const GROWTH_AFTER_PRICES_SINCE = 8;
/** Since version 9 a plan starts at Custom growth of 5 %; before, on the S&P 500. (From 9 to 10 Custom growth moved like world stocks; since 11, like US stocks.) */
const CUSTOM_LIKE_WORLD_SINCE = 9;

/** Growth before rising prices as the growth after them with this inflation: the very same result. */
function afterPrices(rate: number, inflation: number): number | null {
  const real = toReal(rate, inflation);
  return isGrowth(real) ? real : null;
}

/**
 * The user's changes to the standard assumptions; a bad field keeps the
 * standard one. The growth is after rising prices (version 8). Version 7
 * stored one number as banks quote it, before rising prices; version 6
 * `{ rate, basis }`, before or after them. Growth before them becomes the
 * growth after them with the file's inflation (its own, or `pricesOf`'s),
 * so the result is the same.
 */
export function parseAssumptions(value: unknown, pricesOf: string = DEFAULT_PRICES_OF, version: number = GROWTH_AFTER_PRICES_SINCE): AssumptionOverrides {
  if (!isRecord(value)) return STANDARD_ASSUMPTIONS;
  const volatility = isFiniteNumber(value.volatility) && value.volatility >= 0 && value.volatility <= MAX_VOLATILITY ? value.volatility : null;
  const inflation = isRate(value.inflation) ? value.inflation : null;
  const fileInflation = inflation ?? referenceRate(pricesOf);
  let growth: AssumptionOverrides["growth"] = null;
  if (isFiniteNumber(value.growth)) growth = version >= GROWTH_AFTER_PRICES_SINCE ? (isGrowth(value.growth) ? value.growth : null) : afterPrices(value.growth, fileInflation);
  else if (isRecord(value.growth) && isFiniteNumber(value.growth.rate)) {
    const { rate, basis } = value.growth;
    if (basis === "nominal") growth = afterPrices(rate, fileInflation);
    if (basis === "real") growth = isGrowth(rate) ? rate : null;
  }
  return { growth, volatility, inflation };
}

/** What a file without a usable investment invests in: what a first visit started with when it was saved. */
function startingInvestment(version: number): Investment {
  return version < CUSTOM_LIKE_WORLD_SINCE ? { kind: "asset", asset: "sp500" } : DEFAULT_PLAN.investment;
}

/** The ups and downs Custom growth had until version 8: the S&P 500's. */
export const FORMER_CUSTOM_VOLATILITY = resolveInvestment({ kind: "asset", asset: "sp500" }).volatility;

/**
 * Since version 8 a typed growth is "My %", Custom growth: the calculator
 * shows one number and its chips are investments. A file that changed the
 * growth of an asset or a mix becomes Custom growth with that growth and
 * the ups and downs it had, so its result does not change.
 */
function withGrowthAsCustom(investment: Investment, assumptions: AssumptionOverrides, pricesOf: string): { investment: Investment; assumptions: AssumptionOverrides } {
  if (assumptions.growth === null || investment.kind === "custom") return { investment, assumptions };
  const volatility = resolveInvestment(investment, { pricesOf, assumptions: { ...assumptions, growth: null } }).volatility;
  return { investment: { kind: "custom" }, assumptions: { ...assumptions, volatility } };
}

const ID_PATTERN = /^[A-Za-z0-9-]{1,40}$/;
const isAmount = (value: unknown): value is number => isFiniteNumber(value) && value > 0 && value <= MAX_AMOUNT;
const isName = (value: unknown): value is string => typeof value === "string" && value.trim() !== "" && value.length <= 60;
const isYears = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= MIN_YEARS && (value as number) <= MAX_YEARS_AHEAD;

/** One goal of "My goals", or `null` when it is not a valid one. A thing of the old price list ("buy") is no longer one: `retired` counts it. */
export function parseGoalItem(value: unknown, retired?: { count: number }): Goal | null {
  if (!isRecord(value) || typeof value.id !== "string" || !ID_PATTERN.test(value.id)) return null;
  if (value.important !== undefined && typeof value.important !== "boolean") return null;
  const { id } = value;
  const base = { id, ...(value.important === true ? { important: true as const } : {}) };
  switch (value.kind) {
    case "live":
      // Until version 10 a country came with or without housing: one figure now, housing included.
      return typeof value.country === "string" && COUNTRY_PATTERN.test(value.country) ? { ...base, kind: "live", country: value.country } : null;
    case "buy":
      if (retired) retired.count += 1;
      return null;
    case "buy-own":
      return isName(value.name) && isAmount(value.amount) ? { ...base, kind: "buy-own", name: value.name.trim(), amount: value.amount } : null;
    case "amount":
      return isAmount(value.amount) ? { ...base, kind: "amount", amount: value.amount, ...(isName(value.label) ? { label: value.label.trim() } : {}) } : null;
    case "freedom":
      if (value.estimateDate !== undefined) {
        if (typeof value.estimateDate !== "string" || !/^\d{4}(?:-\d{2}){0,2}$/.test(value.estimateDate)) return null;
        const complete = value.estimateDate.length === 4 ? `${value.estimateDate}-01-01` : value.estimateDate.length === 7 ? `${value.estimateDate}-01` : value.estimateDate;
        if (!isIsoDate(complete)) return null;
      }
      return isAmount(value.amount) && (value.country === null || (typeof value.country === "string" && COUNTRY_PATTERN.test(value.country)))
        ? { ...base, kind: "freedom", amount: value.amount, country: value.country, ...(typeof value.estimateDate === "string" && value.country ? { estimateDate: value.estimateDate } : {}) }
        : null;
    case "monthly":
    // Version 4 called it "income", with its label in "name".
    case "income":
    case "spending": {
      const label = [value.label, value.name].find(isName);
      return isAmount(value.amount) ? { ...base, kind: "monthly", amount: value.amount, label: label ? label.trim() : null } : null;
    }
    default:
      return null;
  }
}

/** The goals of a file, in their order; invalid and repeated ones are dropped, and things of the old price list said once. */
function parseGoals(value: unknown, notices: Notices): Goal[] {
  if (!Array.isArray(value)) return [];
  const goals: Goal[] = [];
  const ids = new Set<string>();
  const retired = { count: 0 };
  for (const entry of value) {
    const goal = parseGoalItem(entry, retired);
    if (!goal || ids.has(goal.id)) continue;
    ids.add(goal.id);
    goals.push(goal);
    if (goals.length === MAX_GOALS) break;
  }
  if (retired.count > 0) notices.push(problem("goal-items-retired", { count: retired.count }));
  return goals;
}

interface OwnItem {
  id: string;
  name: string;
  kind: "live" | "buy";
  amount: number;
}

/** An item added to "What it means in real life" in versions 2 and 3. */
function parseOwnItem(value: unknown): OwnItem | null {
  if (!isRecord(value)) return null;
  const { id, name, kind, amount } = value;
  if (typeof id !== "string" || !ID_PATTERN.test(id) || !isName(name) || (kind !== "live" && kind !== "buy") || !isAmount(amount)) {
    return null;
  }
  return { id, name: name.trim(), kind, amount };
}

function ownAsGoal(item: OwnItem): NewGoal {
  // Version 1's euro goal, carried by version 2 as "My goal".
  if (item.id === "goal" && item.name === "My goal") return { kind: "amount", amount: item.amount };
  return item.kind === "buy" ? { kind: "buy-own", name: item.name, amount: item.amount } : { kind: "monthly", amount: item.amount, label: item.name };
}

/** The one goal a version 3 mission, a version 2 pinned connection or a version 1 goal named. */
function chosenGoal(value: Record<string, unknown>, own: OwnItem[], notices: Notices): { goal: NewGoal; ownId: string | null } | null {
  const listed = () => {
    notices.push(problem("goal-items-retired", { count: 1 }));
    return null;
  };
  const home = typeof value.homeCountry === "string" && COUNTRY_PATTERN.test(value.homeCountry) ? value.homeCountry : "NL";
  const isCountry = (code: unknown): code is string => typeof code === "string" && COUNTRY_PATTERN.test(code);
  const found = (goal: NewGoal, ownId: string | null = null) => ({ goal, ownId });
  if (isRecord(value.mission)) {
    const mission = value.mission;
    if (mission.kind === "stop-working") return found({ kind: "live", country: home });
    if (mission.kind === "live-abroad" && isCountry(mission.country)) return found({ kind: "live", country: mission.country });
    if (mission.kind === "buy-own" && isName(mission.name) && isAmount(mission.amount)) {
      return found({ kind: "buy-own", name: mission.name.trim(), amount: mission.amount });
    }
    if (mission.kind === "amount" && isAmount(mission.amount)) return found({ kind: "amount", amount: mission.amount });
    if (mission.kind === "buy" && typeof mission.item === "string") return listed();
    return null;
  }
  if ("pinned" in value) {
    const [group, id] = typeof value.pinned === "string" ? value.pinned.split(":") : [];
    if (group === "life" && id === "stop-working") return found({ kind: "live", country: home });
    if (group === "country" && isCountry(id)) return found({ kind: "live", country: id });
    if (group === "buy" && id) return listed();
    const item = group === "custom" ? own.find((entry) => entry.id === id) : undefined;
    return item ? found(ownAsGoal(item), item.id) : null;
  }
  if (isCountry(value.goalCountry)) return found({ kind: "live", country: value.goalCountry });
  const goal = parseGoal(value.goal);
  return goal && isAmount(goal.amount) ? found({ kind: "amount", amount: goal.amount }) : null;
}

/**
 * Versions 1 to 3 had one chosen goal (a euro goal, a pinned connection, a
 * mission) and items of the user's own; all of them become goals of "My
 * goals", the chosen one first. The "home country" and housing those
 * versions asked for only matter here: stopping work at home becomes living
 * there. Anything else ("the app chose", working 4 days...) is left out; a
 * thing of the old price list too, with a notice.
 */
function goalsFromEarlierVersions(value: Record<string, unknown>, notices: Notices): Goal[] {
  const own = Array.isArray(value.customConnections)
    ? value.customConnections.map(parseOwnItem).filter((item): item is OwnItem => item !== null)
    : [];
  const chosen = chosenGoal(value, own, notices);
  const goals = [...(chosen ? [chosen.goal] : []), ...own.filter((item) => item.id !== chosen?.ownId).map(ownAsGoal)];
  return goals.slice(0, MAX_GOALS).map((goal, index) => ({ ...goal, id: `g${index + 1}` }) as Goal);
}

/**
 * Field by field, so one bad or missing field does not reset the others.
 * Amounts missing from a file are 0, never the example values of a first
 * visit. Also reads the plans of versions 1 to 5 (see above): their
 * inflation, when it was not the old 2 % default, and a custom growth rate
 * become changed assumptions. What the app no longer does is said in
 * `notices`.
 */
export function parsePlan(value: unknown, notices: Notices = [], version: number = CUSTOM_LIKE_WORLD_SINCE): Plan | null {
  if (!isRecord(value)) return null;
  const pick = <K extends keyof Plan>(key: K, parse: (v: unknown) => Plan[K] | null | undefined): Plan[K] =>
    parse(value[key]) ?? DEFAULT_PLAN[key];
  // Saved before it was typed (version 8): still to type. Missing or bad: 0, never the examples.
  const amount = (v: unknown) => (v === null && version >= GROWTH_AFTER_PRICES_SINCE ? null : isNonNegativeNumber(v) && v <= MAX_AMOUNT ? v : 0);
  const pricesOf = typeof value.pricesOf === "string" && isPriceCountry(value.pricesOf) ? value.pricesOf : DEFAULT_PRICES_OF;
  let assumptions = parseAssumptions(value.assumptions, pricesOf, version);
  if (!("assumptions" in value)) {
    const inflation = isRate(value.inflation) && Math.abs(value.inflation - referenceRate(pricesOf)) > 1e-9 ? value.inflation : null;
    const investment = isRecord(value.investment) ? value.investment : {};
    const growth = investment.kind === "custom" && isGrowth(investment.realReturn) ? investment.realReturn : null;
    assumptions = { growth, volatility: null, inflation };
  }
  const chosen = withGrowthAsCustom(parseInvestment(value.investment, notices) ?? startingInvestment(version), assumptions, pricesOf);
  // Custom growth of an earlier version keeps the S&P 500's ups and downs it had, so its result does not change.
  if (version < CUSTOM_LIKE_WORLD_SINCE && chosen.investment.kind === "custom" && chosen.assumptions.volatility === null) {
    chosen.assumptions = { ...chosen.assumptions, volatility: FORMER_CUSTOM_VOLATILITY };
  }
  return {
    invested: amount(value.invested),
    monthlyContribution: amount(value.monthlyContribution),
    investment: chosen.investment,
    // Versions 2 and 3 called it horizonYears.
    years: [value.years, value.horizonYears].find(isYears) ?? DEFAULT_PLAN.years,
    // On the slider's steps: 2–7 %, every 0.5 % (earlier versions offered 3, 4 and 5 %).
    withdrawalRate: pick("withdrawalRate", (v) => (isRate(v) && v > 0 ? snapWithdrawal(v) : null)),
    pricesOf,
    assumptions: chosen.assumptions,
    goals: "goals" in value ? parseGoals(value.goals, notices) : goalsFromEarlierVersions(value, notices),
  };
}
