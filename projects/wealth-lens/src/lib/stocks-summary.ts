/**
 * My stocks in one card under the result: what the euro holdings are worth
 * today, how that changed over the last 12 months, and its line. The year
 * comes from each holding's weekly line (the daily job's, from 100 a year
 * ago): a holding worth V today was worth V × first ÷ last then, with the
 * shares held now. A holding without that line counts as unchanged, and is
 * named.
 */

import { gainLoss, holdingValue, type GainLoss } from "./finance";
import { instrumentForHolding, MARKET, type PricesFile } from "./market-data";
import { BASE_CURRENCY, type Holding } from "./types";

export interface StocksSummary {
  /** What the euro holdings are worth today. */
  worth: number;
  /** Over the last 12 months: from what they were worth then. */
  change: GainLoss;
  /** Their value week by week, oldest first, ending today. */
  line: number[];
  /** Tickers without a year of prices: counted as unchanged. */
  missing: string[];
}

/** `null` with nothing priced in euros: then there is no card. */
export function stocksSummary(holdings: readonly Holding[], market: PricesFile = MARKET): StocksSummary | null {
  const priced = holdings
    .filter((holding) => holding.currency === BASE_CURRENCY)
    .map((holding) => {
      const instrument = instrumentForHolding(holding.ticker, holding.currency);
      const line = instrument ? market.prices[instrument.id]?.line1y : null;
      return { holding, value: holdingValue(holding) ?? 0, line: line && line.length > 1 ? line : null };
    })
    .filter((entry) => entry.value > 0);
  if (priced.length === 0) return null;
  const worth = priced.reduce((sum, entry) => sum + entry.value, 0);
  const lines = priced.flatMap((entry) => (entry.line ? [entry.line] : []));
  const weeks = lines.length > 0 ? Math.min(...lines.map((line) => line.length)) : 2;
  // Each week's value, aligned from today backwards.
  const line = Array.from({ length: weeks }, (_, week) =>
    priced.reduce((sum, entry) => {
      if (!entry.line) return sum + entry.value;
      const at = entry.line[entry.line.length - weeks + week];
      return sum + (entry.value * at) / entry.line[entry.line.length - 1];
    }, 0),
  );
  return {
    worth,
    change: gainLoss(line[0], worth),
    line,
    missing: priced.filter((entry) => !entry.line).map((entry) => entry.holding.ticker),
  };
}
