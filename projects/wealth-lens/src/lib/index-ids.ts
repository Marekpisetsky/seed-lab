/**
 * The stock index a plan can grow with, and the other historical series it
 * can be projected with: asset classes only, never a product. Only series
 * whose data may be published: US stocks (Robert Shiller's S&P Composite),
 * German government bonds and gold (World Bank). World stocks (MSCI World)
 * and the Nasdaq-100 are left out: their data's terms do not allow
 * publishing it, and no open series replaces them (research/wealth-lens/
 * crecimiento.md). The datasets live in lib/indexes.ts.
 */

export const INDEX_IDS = ["sp500"] as const;
export type IndexId = (typeof INDEX_IDS)[number];

export function isIndexId(value: unknown): value is IndexId {
  return typeof value === "string" && (INDEX_IDS as readonly string[]).includes(value);
}

/** Every asset with a long yearly history: US stocks, German government bonds and gold. */
export const SERIES_IDS = [...INDEX_IDS, "bonds", "gold"] as const;
export type SeriesId = (typeof SERIES_IDS)[number];

export function isSeriesId(value: unknown): value is SeriesId {
  return typeof value === "string" && (SERIES_IDS as readonly string[]).includes(value);
}

/** Series earlier versions offered, and what a saved file that names one becomes (data-file.ts says so). */
export const RETIRED_SERIES: Readonly<Record<string, SeriesId>> = { world: "sp500", nasdaq100: "sp500" };
