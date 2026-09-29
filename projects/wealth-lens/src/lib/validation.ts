/**
 * Turns untrusted JSON (a data file the user loads) into valid values.
 * Everything is checked field by field: a bad field falls back to its
 * default without resetting the others, and invalid holdings are dropped
 * while the valid ones are kept.
 */

import { isIndexId } from "./index-ids";
import type { PricePoint } from "./prices";
import type { CustomConnection, Goal, Holding, Investment, Mission, Plan } from "./types";

/** The euro goal of version 1 files, which becomes the mission "reach an amount". */
export const DEFAULT_GOAL: Goal = { amount: 100_000, targetDate: null };

/** The largest amount accepted anywhere (invested, monthly, a price): EUR 1 billion. */
export const MAX_AMOUNT = 1e9;

/**
 * A first visit starts with these: real, editable values (EUR 1,000 and
 * EUR 200 a month), shown in the fields and on the levers alike. No mission:
 * the user chooses it.
 */
export const DEFAULT_PLAN: Plan = {
  invested: 1000,
  monthlyContribution: 200,
  investment: { kind: "index", index: "sp500" },
  withdrawalRate: 0.04,
  inflation: 0.02,
  housing: "rent",
  homeCountry: "NL",
  mission: null,
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

const ID_PATTERN = /^[A-Za-z0-9-]{1,40}$/;
const isAmount = (value: unknown): value is number => isFiniteNumber(value) && value > 0 && value <= MAX_AMOUNT;
const isName = (value: unknown): value is string => typeof value === "string" && value.trim() !== "" && value.length <= 60;

export function parseMission(value: unknown): Mission | null {
  if (!isRecord(value)) return null;
  switch (value.kind) {
    case "stop-working":
      return { kind: "stop-working" };
    case "live-abroad":
      return typeof value.country === "string" && COUNTRY_PATTERN.test(value.country)
        ? { kind: "live-abroad", country: value.country }
        : null;
    case "buy":
      return typeof value.item === "string" && ID_PATTERN.test(value.item) ? { kind: "buy", item: value.item } : null;
    case "buy-own":
      return isName(value.name) && isAmount(value.amount) ? { kind: "buy-own", name: value.name.trim(), amount: value.amount } : null;
    case "amount":
      return isAmount(value.amount) ? { kind: "amount", amount: value.amount } : null;
    default:
      return null;
  }
}

/**
 * Version 2 pinned a connection ("country:PT", "buy:used-car",
 * "custom:<id>", "life:…") or nothing (the app chose); version 1 had a euro
 * goal and an optional country goal. Whatever can be a mission becomes one,
 * and a pinned custom item stops being listed separately. Anything else,
 * including "the app chose", leaves the mission to the user.
 */
function missionFromEarlierVersions(
  value: Record<string, unknown>,
  custom: CustomConnection[],
): { mission: Mission | null; customConnections: CustomConnection[] } {
  const none = { mission: null, customConnections: custom };
  if (!("pinned" in value)) {
    if (typeof value.goalCountry === "string" && COUNTRY_PATTERN.test(value.goalCountry)) {
      return { mission: { kind: "live-abroad", country: value.goalCountry }, customConnections: custom };
    }
    const goal = parseGoal(value.goal);
    return goal && isAmount(goal.amount) ? { mission: { kind: "amount", amount: goal.amount }, customConnections: custom } : none;
  }
  const pinned = typeof value.pinned === "string" ? value.pinned : "";
  const [group, id] = pinned.split(":");
  if (!id || !ID_PATTERN.test(id)) return none;
  switch (group) {
    case "life":
      return id === "stop-working" ? { mission: { kind: "stop-working" }, customConnections: custom } : none;
    case "country":
      return COUNTRY_PATTERN.test(id) ? { mission: { kind: "live-abroad", country: id }, customConnections: custom } : none;
    case "buy":
      return { mission: { kind: "buy", item: id }, customConnections: custom };
    case "custom": {
      const item = custom.find((entry) => entry.id === id);
      if (!item || item.kind !== "buy") return none;
      const rest = custom.filter((entry) => entry !== item);
      // Version 1's euro goal, carried by version 2 as "My goal".
      const mission: Mission =
        id === "goal" && item.name === "My goal"
          ? { kind: "amount", amount: item.amount }
          : { kind: "buy-own", name: item.name, amount: item.amount };
      return { mission, customConnections: rest };
    }
    default:
      return none;
  }
}

export function parseCustomConnection(value: unknown): CustomConnection | null {
  if (!isRecord(value)) return null;
  const { id, name, kind, amount } = value;
  if (typeof id !== "string" || !/^[A-Za-z0-9-]{1,40}$/.test(id)) return null;
  if (typeof name !== "string" || name.trim() === "" || name.length > 60) return null;
  if (kind !== "live" && kind !== "buy") return null;
  if (!isAmount(amount)) return null;
  return { id, name: name.trim(), kind, amount };
}

/**
 * Field by field, so one bad or missing field does not reset the others.
 * Amounts missing from a file are 0, never the example values of a first
 * visit. Also reads the plans of versions 1 and 2 (see above).
 */
export function parsePlan(value: unknown): Plan | null {
  if (!isRecord(value)) return null;
  const pick = <K extends keyof Plan>(key: K, parse: (v: unknown) => Plan[K] | null | undefined): Plan[K] =>
    parse(value[key]) ?? DEFAULT_PLAN[key];
  const custom = Array.isArray(value.customConnections)
    ? value.customConnections.map(parseCustomConnection).filter((item): item is CustomConnection => item !== null)
    : [];
  const { mission, customConnections } =
    "mission" in value ? { mission: parseMission(value.mission), customConnections: custom } : missionFromEarlierVersions(value, custom);
  const horizon = value.horizonYears;
  const amount = (v: unknown) => (isNonNegativeNumber(v) && v <= MAX_AMOUNT ? v : 0);
  return {
    invested: amount(value.invested),
    monthlyContribution: amount(value.monthlyContribution),
    investment: pick("investment", parseInvestment),
    withdrawalRate: pick("withdrawalRate", (v) => (isRate(v) && v > 0 ? v : null)),
    inflation: pick("inflation", (v) => (isRate(v) ? v : null)),
    housing: value.housing === "own" ? "own" : "rent",
    homeCountry: pick("homeCountry", (v) => (typeof v === "string" && COUNTRY_PATTERN.test(v) ? v : null)),
    mission,
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
