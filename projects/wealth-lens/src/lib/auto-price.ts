/**
 * Current prices for holdings, from the daily closes the app ships with
 * (lib/market-data.ts). Worked out when the holdings are read instead of
 * being stored, so every screen sees the same prices without any request.
 *
 * Only automatic prices are filled (a price typed by the user is never
 * replaced), and only from a listing in the holding's own currency, since the
 * app never converts currencies.
 */

import { instrumentForHolding, MARKET, type PricesFile } from "./market-data";
import type { Holding } from "./types";

/** Latest downloaded close for a holding's instrument, or `null` when there is none. */
export function marketPrice(holding: Pick<Holding, "ticker" | "currency">, market: PricesFile = MARKET) {
  const instrument = instrumentForHolding(holding.ticker, holding.currency);
  const entry = instrument ? market.prices[instrument.id] : undefined;
  if (!entry || entry.currency !== holding.currency) return null;
  return { close: entry.close, date: entry.date };
}

/**
 * Holdings with their automatic price filled from the market data. Holdings
 * that do not change are returned as the same objects.
 */
export function priceHoldings(holdings: readonly Holding[], market: PricesFile = MARKET): Holding[] {
  return holdings.map((holding) => {
    if (holding.priceSource !== "auto") return holding;
    const price = marketPrice(holding, market);
    if (!price || (holding.currentPrice === price.close && holding.priceDate === price.date)) return holding;
    return { ...holding, currentPrice: price.close, priceDate: price.date };
  });
}
