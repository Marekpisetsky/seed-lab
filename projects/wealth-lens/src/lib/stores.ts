import { createPersistentStore, type PersistentStore } from "./persistent-store";
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_FIRE_SETTINGS,
  DEFAULT_GOAL,
  DEFAULT_HOLDINGS,
  DEFAULT_INVESTED,
  parseAssumptions,
  parseFireSettings,
  parseGoal,
  parseHoldings,
  parseInvested,
  parseUploadedPrices,
  STORAGE_KEYS,
  uploadedPricesKey,
  type UploadedPrices,
} from "./storage";
import type { Assumptions, FireSettings, Goal, Holding } from "./types";

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

/** Amount invested, from the first-use questions (used while there are no holdings). */
export const investedStore = createPersistentStore<number | null>({
  key: STORAGE_KEYS.invested,
  parse: parseInvested,
  fallback: DEFAULT_INVESTED,
});

export const fireSettingsStore = createPersistentStore<FireSettings>({
  key: STORAGE_KEYS.fire,
  parse: parseFireSettings,
  fallback: DEFAULT_FIRE_SETTINGS,
});

const uploadedPricesStores = new Map<string, PersistentStore<UploadedPrices | null>>();

/** Price series the user uploaded for a ticker (one store per ticker, created on demand). */
export function uploadedPricesStore(ticker: string): PersistentStore<UploadedPrices | null> {
  let store = uploadedPricesStores.get(ticker);
  if (!store) {
    store = createPersistentStore<UploadedPrices | null>({
      key: uploadedPricesKey(ticker),
      parse: parseUploadedPrices,
      fallback: null,
    });
    uploadedPricesStores.set(ticker, store);
  }
  return store;
}
