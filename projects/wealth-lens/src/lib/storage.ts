/**
 * Persistence in the browser's localStorage. There is no backend: everything
 * the user enters lives on their own device.
 *
 * localStorage can be missing (server render), blocked (privacy settings throw
 * a SecurityError on access), full (QuotaExceededError) or hold data written by
 * an older version of the app. Every access is wrapped in try/catch and every
 * value read back is validated, falling back to defaults instead of crashing.
 */

import type { Assumptions, Goal, Holding } from "./types";

/** The subset of the Web Storage API this module needs (easy to fake in tests). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Turns untrusted JSON into a valid value, or `null` if it cannot. */
export type Parser<T> = (value: unknown) => T | null;

const KEY_PREFIX = "wealth-lens:v1:";

export const STORAGE_KEYS = {
  holdings: `${KEY_PREFIX}holdings`,
  goal: `${KEY_PREFIX}goal`,
  assumptions: `${KEY_PREFIX}assumptions`,
} as const;

export const DEFAULT_HOLDINGS: readonly Holding[] = [];

export const DEFAULT_GOAL: Goal = { amount: 100_000, targetDate: null };

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  realReturn: 0.07,
  withdrawalRate: 0.04,
  monthlyContribution: 0,
  inflation: 0.02,
};

/** `window.localStorage`, or `null` on the server or when access is blocked. */
export function getBrowserStorage(): KeyValueStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** True when a write/remove round trip succeeds (not blocked, not full). */
export function isStorageWritable(storage: KeyValueStorage | null): boolean {
  if (!storage) return false;
  const probe = `${KEY_PREFIX}probe`;
  try {
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Reads and validates a JSON value; any failure yields `fallback`. */
export function readValue<T>(
  storage: KeyValueStorage | null,
  key: string,
  parse: Parser<T>,
  fallback: T,
): T {
  if (!storage) return fallback;
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return fallback;
  }
  if (raw === null) return fallback;
  try {
    return parse(JSON.parse(raw)) ?? fallback;
  } catch {
    return fallback;
  }
}

/** Serializes and writes a value. Returns `false` if it could not be saved. */
export function writeValue(storage: KeyValueStorage | null, key: string, value: unknown): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Parsers for the persisted shapes
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
  const { id, ticker, quantity, costBasis, currency, currentPrice } = value;
  if (typeof id !== "string" || id === "") return null;
  if (typeof ticker !== "string" || ticker.trim() === "") return null;
  if (!isNonNegativeNumber(quantity) || !isNonNegativeNumber(costBasis)) return null;
  if (!isCurrencyCode(currency)) return null;
  if (currentPrice !== null && !isNonNegativeNumber(currentPrice)) return null;
  return { id, ticker, quantity, costBasis, currency, currentPrice };
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

/** Field by field, so one bad or missing field does not reset the others. */
export function parseAssumptions(value: unknown): Assumptions | null {
  if (!isRecord(value)) return null;
  const pick = (key: keyof Assumptions, valid: (v: unknown) => v is number): number => {
    const candidate = value[key];
    return valid(candidate) ? candidate : DEFAULT_ASSUMPTIONS[key];
  };
  const isRate = (v: unknown): v is number => isFiniteNumber(v) && v > -1 && v < 1;
  const isPositiveRate = (v: unknown): v is number => isRate(v) && v > 0;
  return {
    realReturn: pick("realReturn", isRate),
    withdrawalRate: pick("withdrawalRate", isPositiveRate),
    monthlyContribution: pick("monthlyContribution", isNonNegativeNumber),
    inflation: pick("inflation", isRate),
  };
}
