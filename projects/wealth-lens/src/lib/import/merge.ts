import type { Holding } from "../types";
import type { ImportedPosition } from "./types";

/**
 * Builds the new holdings list from imported positions. Imports replace the
 * list. A price in the file counts as typed by the user (manual); otherwise
 * the price already known for the same ticker and currency is kept, and if
 * there is none the price is left to be filled automatically.
 */
export function mergeImportedHoldings(
  existing: readonly Holding[],
  positions: readonly ImportedPosition[],
  makeId: () => string,
): Holding[] {
  const known = new Map(existing.map((holding) => [`${holding.ticker}|${holding.currency}`, holding]));
  return positions.map((position): Holding => {
    const id = makeId();
    if (position.currentPrice !== null) {
      return { ...position, id, priceSource: "manual", priceDate: null };
    }
    const previous = known.get(`${position.ticker}|${position.currency}`);
    if (!previous) return { ...position, id, priceSource: "auto", priceDate: null };
    const { currentPrice, priceSource, priceDate } = previous;
    return { ...position, id, currentPrice, priceSource, priceDate };
  });
}
