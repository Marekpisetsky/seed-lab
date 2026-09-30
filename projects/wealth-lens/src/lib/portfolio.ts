/**
 * "My portfolio" as a projection: a simple one. Each holding grows like an
 * asset with a long history (lib/assets.ts), which the user can change:
 *
 * - a stock of the curated list: the index of its market (instruments.json:
 *   US tech on the Nasdaq-100, other US stocks the S&P 500, European ones
 *   World);
 * - an index ETF, a bond ETF or a gold ETC: what it holds (the trackers in
 *   instruments.json);
 * - anything else: World, marked as assumed.
 *
 * The holdings are weighted by their value in euros (the app never converts
 * currencies) and simulated together (lib/mix.ts), a curated stock with its
 * own ups and downs when its prices say how big they are. Its own past
 * growth is never projected: stocks can't be predicted.
 */

import type { AssetId } from "./assets";
import { holdingValue } from "./finance";
import { isIndexId, SERIES_IDS } from "./indexes";
import { INDEX_TRACKERS, instrumentForHolding, type Instrument } from "./market-data";
import type { ModelInput } from "./mix";
import { BASE_CURRENCY, type Holding } from "./types";


/** What a holding grows like when the user has not chosen, and whether that is a guess. */
export function defaultReference(holding: Pick<Holding, "ticker" | "currency">): { asset: AssetId; assumed: boolean } {
  const instrument = instrumentForHolding(holding.ticker, holding.currency);
  if (instrument) return { asset: instrument.index, assumed: false };
  const ticker = holding.ticker.trim().toUpperCase().split(".")[0];
  const tracked = SERIES_IDS.find((id) => INDEX_TRACKERS[id].includes(ticker));
  return tracked ? { asset: tracked, assumed: false } : { asset: "world", assumed: true };
}

/** What a holding grows like: the user's choice, or the default. */
export function referenceFor(holding: Pick<Holding, "ticker" | "currency" | "reference">): { asset: AssetId; assumed: boolean; chosen: boolean } {
  if (holding.reference) return { asset: holding.reference, assumed: false, chosen: true };
  return { ...defaultReference(holding), chosen: false };
}

export interface AllocationEntry {
  holding: Holding;
  /** EUR value. */
  value: number;
  /** Share of the counted value, 0 to 1. */
  weight: number;
  asset: AssetId;
  assumed: boolean;
  chosen: boolean;
  /** A curated stock, simulated with its own ups and downs while it grows like a stock index. */
  stock: Instrument | null;
}

export interface Allocation {
  entries: AllocationEntry[];
  /** EUR value of the holdings counted. */
  total: number;
  /** Holdings left out: another currency, or no price. */
  left: Holding[];
}

/** How the holdings split, by value: only priced holdings in euros count, as for the result. */
export function portfolioAllocation(holdings: readonly Holding[]): Allocation {
  const counted: Omit<AllocationEntry, "weight">[] = [];
  const left: Holding[] = [];
  for (const holding of holdings) {
    const value = holdingValue(holding);
    if (holding.currency !== BASE_CURRENCY || value === null || value <= 0) {
      left.push(holding);
      continue;
    }
    const reference = referenceFor(holding);
    const instrument = instrumentForHolding(holding.ticker, holding.currency);
    const stock = instrument?.kind === "stock" && isIndexId(reference.asset) ? instrument : null;
    counted.push({ holding, value, ...reference, stock });
  }
  const total = counted.reduce((sum, entry) => sum + entry.value, 0);
  return { entries: counted.map((entry) => ({ ...entry, weight: entry.value / total })), total, left };
}

/** The mix the holdings make, for lib/mix.ts: holdings growing like the same asset merged, curated stocks kept apart. */
export function portfolioInputs(allocation: Allocation): ModelInput[] {
  const inputs = new Map<string, ModelInput>();
  for (const entry of allocation.entries) {
    const id = entry.stock ? `stock:${entry.stock.id}@${entry.asset}` : entry.asset;
    const kept = inputs.get(id);
    if (kept) kept.weight += entry.weight * 100;
    else inputs.set(id, { asset: entry.asset, weight: entry.weight * 100, ...(entry.stock ? { stock: entry.stock } : {}) });
  }
  return [...inputs.values()];
}
