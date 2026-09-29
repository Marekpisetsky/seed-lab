/**
 * Turns untrusted JSON (a data file the user loads) into valid values.
 * Everything is checked field by field: a bad field falls back to its
 * default without resetting the others, and invalid holdings are dropped
 * while the valid ones are kept.
 */

import { isIndexId } from "./index-ids";
import type { PricePoint } from "./prices";
import type { CustomConnection, Goal, Holding, Investment, Plan } from "./types";

/** The euro goal of version 1 files, which becomes the custom connection "My goal". */
export const DEFAULT_GOAL: Goal = { amount: 100_000, targetDate: null };

export const DEFAULT_PLAN: Plan = {
  invested: null,
  monthlyContribution: 0,
  investment: { kind: "index", index: "sp500" },
  withdrawalRate: 0.04,
  inflation: 0.02,
  housing: "rent",
  homeCountry: "NL",
  pinned: null,
  horizonYears: null,
  customConnections: [],
};

/** Price series a user uploaded for a ticker without downloaded prices. */
export interface UploadedPrices {
  fileName: string;
  points: PricePoint[];
}

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

export function parseHolding(value: unknown): Holding | null {
  if (!isRecord(value)) return null;
  const { id, ticker, quantity, costBasis, currency, currentPrice, priceSource, priceDate } = value;
  if (typeof id !== "string" || id === "") return null;
  if (typeof ticker !== "string" || ticker.trim() === "") return null;
  if (!isNonNegativeNumber(quantity) || !isNonNegativeNumber(costBasis)) return null;
  if (!isCurrencyCode(currency)) return null;
  if (currentPrice !== null && !isNonNegativeNumber(currentPrice)) return null;
  // No source recorded: a typed price stays manual.
  const source =
    priceSource === "auto" || priceSource === "manual" ? priceSource : currentPrice === null ? "auto" : "manual";
  return {
    id,
    ticker,
    quantity,
    costBasis,
    currency,
    currentPrice,
    priceSource: source,
    priceDate: source === "auto" && isIsoDate(priceDate) ? priceDate : null,
  };
}

/** Keeps every valid holding and drops the ones that fail validation. */
export function parseHoldings(value: unknown): Holding[] | null {
  if (!Array.isArray(value)) return null;
  return value.map(parseHolding).filter((holding): holding is Holding => holding !== null);
}

export function parseGoal(value: unknown): Goal | null {
  if (!isRecord(value)) return null;
  return {
    amount: isNonNegativeNumber(value.amount) ? value.amount : DEFAULT_GOAL.amount,
    targetDate: isIsoDate(value.targetDate) ? value.targetDate : null,
  };
}

export function parseInvestment(value: unknown): Investment | null {
  if (!isRecord(value)) return null;
  switch (value.kind) {
    case "index":
      return isIndexId(value.index) ? { kind: "index", index: value.index } : null;
    case "stock":
      return typeof value.id === "string" && value.id !== "" ? { kind: "stock", id: value.id } : null;
    case "portfolio":
      return { kind: "portfolio" };
    case "custom":
      return isRate(value.realReturn) ? { kind: "custom", realReturn: value.realReturn } : null;
    default:
      return null;
  }
}

const PIN_PATTERN = /^(country|life|buy|custom):[A-Za-z0-9-]{1,40}$/;

export function parseCustomConnection(value: unknown): CustomConnection | null {
  if (!isRecord(value)) return null;
  const { id, name, kind, amount } = value;
  if (typeof id !== "string" || !/^[A-Za-z0-9-]{1,40}$/.test(id)) return null;
  if (typeof name !== "string" || name.trim() === "" || name.length > 60) return null;
  if (kind !== "live" && kind !== "buy") return null;
  if (!isFiniteNumber(amount) || amount <= 0 || amount > 1e9) return null;
  return { id, name: name.trim(), kind, amount };
}

/** "My goal": what a version 1 euro goal becomes. */
export function goalAsConnection(goal: Goal): CustomConnection {
  return { id: "goal", name: "My goal", kind: "buy", amount: goal.amount };
}

/**
 * Field by field, so one bad or missing field does not reset the others.
 * Also reads version 1 plans, which had a euro goal and an optional
 * country goal instead of a pinned connection: the euro goal becomes the
 * custom connection "My goal", and whichever goal was active is pinned.
 */
export function parsePlan(value: unknown): Plan | null {
  if (!isRecord(value)) return null;
  const pick = <K extends keyof Plan>(key: K, parse: (v: unknown) => Plan[K] | null | undefined): Plan[K] =>
    parse(value[key]) ?? DEFAULT_PLAN[key];
  const customConnections = Array.isArray(value.customConnections)
    ? value.customConnections.map(parseCustomConnection).filter((item): item is CustomConnection => item !== null)
    : [];
  let pinned = typeof value.pinned === "string" && PIN_PATTERN.test(value.pinned) ? value.pinned : null;
  if (!("pinned" in value)) {
    const goal = parseGoal(value.goal);
    if (goal && goal.amount > 0 && !customConnections.some((item) => item.id === "goal")) {
      customConnections.unshift(goalAsConnection(goal));
    }
    if (typeof value.goalCountry === "string" && COUNTRY_PATTERN.test(value.goalCountry)) pinned = `country:${value.goalCountry}`;
    else if (goal && goal.amount > 0) pinned = "custom:goal";
  }
  const horizon = value.horizonYears;
  return {
    invested: isNonNegativeNumber(value.invested) ? value.invested : null,
    monthlyContribution: pick("monthlyContribution", (v) => (isNonNegativeNumber(v) ? v : null)),
    investment: pick("investment", parseInvestment),
    withdrawalRate: pick("withdrawalRate", (v) => (isRate(v) && v > 0 ? v : null)),
    inflation: pick("inflation", (v) => (isRate(v) ? v : null)),
    housing: value.housing === "own" ? "own" : "rent",
    homeCountry: pick("homeCountry", (v) => (typeof v === "string" && COUNTRY_PATTERN.test(v) ? v : null)),
    pinned,
    horizonYears: Number.isInteger(horizon) && (horizon as number) >= 1 && (horizon as number) <= 60 ? (horizon as number) : null,
    customConnections,
  };
}

export function parseUploadedPrices(value: unknown): UploadedPrices | null {
  if (!isRecord(value) || typeof value.fileName !== "string" || !Array.isArray(value.points)) return null;
  const points = value.points.filter(
    (point): point is PricePoint =>
      isRecord(point) && isIsoDate(point.time) && isFiniteNumber(point.close) && point.close > 0,
  );
  return points.length > 0 ? { fileName: value.fileName, points } : null;
}
