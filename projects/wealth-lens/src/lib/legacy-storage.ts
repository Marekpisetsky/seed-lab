/**
 * Earlier versions of Wealth Lens (now Horalis Growth) saved everything in localStorage under
 * "wealth-lens:v1:*". The app no longer stores anything, so data left by
 * those versions is offered once, to load into memory or just delete; either
 * way it is removed from the browser. This module only reads and deletes,
 * it never writes. Their holdings and price files are no longer used: only
 * the plan is kept.
 */

import type { AppState } from "./app-store";
import { STANDARD_ASSUMPTIONS, type Plan } from "./types";
import { DEFAULT_PLAN, FORMER_CUSTOM_VOLATILITY, isRecord, parseGoal } from "./validation";

const PREFIX = "wealth-lens:v1:";

/** The subset of the Web Storage API this module needs (easy to fake in tests). */
export interface LegacyStorage {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

/** `window.localStorage`, or `null` on the server or when access is blocked. */
export function browserStorage(): LegacyStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function legacyKeys(storage: LegacyStorage): string[] {
  const keys: string[] = [];
  try {
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
  } catch {
    return [];
  }
  return keys;
}

function read(storage: LegacyStorage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function hasLegacyData(storage: LegacyStorage | null): boolean {
  return storage !== null && legacyKeys(storage).length > 0;
}

/** What an earlier version saved, turned into today's state; `null` if nothing usable. */
export function readLegacyData(storage: LegacyStorage | null): AppState | null {
  if (!storage) return null;
  const invested = read(storage, `${PREFIX}invested`);
  const assumptions = read(storage, `${PREFIX}assumptions`);
  const goal = parseGoal(read(storage, `${PREFIX}goal`));
  // The saved euro goal becomes the goal "reach an amount"; amounts not saved are 0, not a first visit's examples.
  // What earlier versions started on: the S&P 500 with its standard figures.
  const plan: Plan = {
    ...DEFAULT_PLAN,
    investment: { kind: "asset", asset: "sp500" },
    assumptions: STANDARD_ASSUMPTIONS,
    invested: 0,
    monthlyContribution: 0,
    goals: goal && goal.amount > 0 ? [{ id: "g1", kind: "amount", amount: goal.amount }] : [],
  };
  const typedInvested = typeof invested === "number" && Number.isFinite(invested) && invested >= 0;
  if (typedInvested) plan.invested = invested;
  // Something to load: an amount invested or added a month (holdings are no longer kept).
  const answered = typedInvested || (isRecord(assumptions) && typeof assumptions.monthlyContribution === "number" && assumptions.monthlyContribution >= 0);
  if (isRecord(assumptions)) {
    const { monthlyContribution, withdrawalRate, inflation, realReturn } = assumptions;
    if (typeof monthlyContribution === "number" && monthlyContribution >= 0) plan.monthlyContribution = monthlyContribution;
    if (typeof withdrawalRate === "number" && withdrawalRate > 0 && withdrawalRate < 1) plan.withdrawalRate = withdrawalRate;
    // Inflation or a growth rate other than the old defaults (2 %, 7 %) was chosen on purpose.
    if (typeof inflation === "number" && inflation > -1 && inflation < 1 && Math.abs(inflation - 0.02) > 1e-9) {
      plan.assumptions = { ...plan.assumptions, inflation };
    }
    if (typeof realReturn === "number" && realReturn > -1 && realReturn < 1 && Math.abs(realReturn - 0.07) > 1e-9) {
      plan.investment = { kind: "custom" };
      plan.assumptions = { ...plan.assumptions, growth: realReturn, volatility: FORMER_CUSTOM_VOLATILITY };
    }
  }
  if (!answered) return null;
  return { plan, whatIf: null };
}

/** Removes everything earlier versions saved. */
export function deleteLegacyData(storage: LegacyStorage | null): void {
  if (!storage) return;
  for (const key of legacyKeys(storage)) {
    try {
      storage.removeItem(key);
    } catch {
      // Blocked storage: nothing we can do, and nothing new is written either.
    }
  }
}
