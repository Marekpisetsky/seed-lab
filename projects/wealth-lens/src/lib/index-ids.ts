/**
 * The indexes a plan can grow with. Kept free of imports so the daily price
 * job (plain Node, see scripts/) can use it too; the datasets live in
 * lib/indexes.ts.
 */

export const INDEX_IDS = ["sp500", "world", "nasdaq100"] as const;
export type IndexId = (typeof INDEX_IDS)[number];

export function isIndexId(value: unknown): value is IndexId {
  return typeof value === "string" && (INDEX_IDS as readonly string[]).includes(value);
}
