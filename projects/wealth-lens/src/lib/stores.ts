import { createPersistentStore } from "./persistent-store";
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_GOAL,
  DEFAULT_HOLDINGS,
  parseAssumptions,
  parseGoal,
  parseHoldings,
  STORAGE_KEYS,
} from "./storage";
import type { Assumptions, Goal, Holding } from "./types";

export const holdingsStore = createPersistentStore<readonly Holding[]>({
  key: STORAGE_KEYS.holdings,
  parse: parseHoldings,
  fallback: DEFAULT_HOLDINGS,
});

export const goalStore = createPersistentStore<Goal>({
  key: STORAGE_KEYS.goal,
  parse: parseGoal,
  fallback: DEFAULT_GOAL,
});

export const assumptionsStore = createPersistentStore<Assumptions>({
  key: STORAGE_KEYS.assumptions,
  parse: parseAssumptions,
  fallback: DEFAULT_ASSUMPTIONS,
});
