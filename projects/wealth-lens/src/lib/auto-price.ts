/**
 * Filling a holding's current price from the latest close of its price
 * series. Only automatic prices are touched (a price typed by the user is
 * never overwritten), and only when the series is quoted in the holding's
 * own currency, since the app never converts currencies.
 */

import type { PricePoint } from "./prices";
import type { Holding } from "./types";

export type PricePatch = Pick<Holding, "currentPrice" | "priceDate">;

export function latestPriceUpdate(
  holding: Holding,
  /** Currency the series is quoted in, as reported by the price source. */
  quoteCurrency: string | null,
  points: readonly PricePoint[],
): PricePatch | null {
  if (holding.priceSource !== "auto") return null;
  if (quoteCurrency !== holding.currency) return null;
  const last = points.at(-1);
  if (!last) return null;
  if (holding.currentPrice === last.close && holding.priceDate === last.time) return null;
  return { currentPrice: last.close, priceDate: last.time };
}
