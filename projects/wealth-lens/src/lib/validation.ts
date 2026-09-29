/**
 * Turns untrusted JSON (a data file the user loads) into valid values.
 * Everything is checked field by field: a bad field falls back to its
 * default without resetting the others, and invalid holdings are dropped
 * while the valid ones are kept.
 */

import { isIndexId } from "./index-ids";
import type { PricePoint } from "./prices";
import type { Goal, Holding, Investment, Plan } from "./types";

export const DEFAULT_GOAL: Goal = { amount: 100_000, targetDate: null };

export const DEFAULT_PLAN: Plan = {
  invested: null,
  monthlyContribution: 0,
  goal: DEFAULT_GOAL,
  goalCountry: null,
  investment: { kind: "index", index: "sp500" },
  withdrawalRate: 0.04,
  inflation: 0.02,
  housing: "rent",
  homeCountry: "NL",
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

/** Field by field, so one bad or missing field does not reset the others. */
export function parsePlan(value: unknown): Plan | null {
  if (!isRecord(value)) return null;
  const pick = <K extends keyof Plan>(key: K, parse: (v: unknown) => Plan[K] | null | undefined): Plan[K] =>
    parse(value[key]) ?? DEFAULT_PLAN[key];
  return {
    invested: isNonNegativeNumber(value.invested) ? value.invested : null,
    monthlyContribution: pick("monthlyContribution", (v) => (isNonNegativeNumber(v) ? v : null)),
    goal: pick("goal", parseGoal),
    goalCountry: typeof value.goalCountry === "string" && COUNTRY_PATTERN.test(value.goalCountry) ? value.goalCountry : null,
    investment: pick("investment", parseInvestment),
    withdrawalRate: pick("withdrawalRate", (v) => (isRate(v) && v > 0 ? v : null)),
    inflation: pick("inflation", (v) => (isRate(v) ? v : null)),
    housing: value.housing === "own" ? "own" : "rent",
    homeCountry: pick("homeCountry", (v) => (typeof v === "string" && COUNTRY_PATTERN.test(v) ? v : null)),
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
