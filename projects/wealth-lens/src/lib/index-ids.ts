/**
 * The indexes a plan can grow with, and the other historical series it can
 * be projected with. Kept free of imports so the daily price job (plain
 * Node, see scripts/) can use it too; the datasets live in lib/indexes.ts.
 */

export const INDEX_IDS = ["sp500", "world", "nasdaq100"] as const;
export type IndexId = (typeof INDEX_IDS)[number];

export function isIndexId(value: unknown): value is IndexId {
  return typeof value === "string" && (INDEX_IDS as readonly string[]).includes(value);
}

/** Every asset with a long yearly history: the three stock indexes, euro government bonds and gold. */
export const SERIES_IDS = [...INDEX_IDS, "bonds", "gold"] as const;
export type SeriesId = (typeof SERIES_IDS)[number];

export function isSeriesId(value: unknown): value is SeriesId {
  return typeof value === "string" && (SERIES_IDS as readonly string[]).includes(value);
}
