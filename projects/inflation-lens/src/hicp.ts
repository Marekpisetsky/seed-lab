/**
 * Eurostat's HICP data, as Inflation Lens keeps it (src/data/hicp.json):
 * validated when it is read, so a bad edit stops the build instead of
 * showing nonsense; turned into the series the page carries, named in its
 * language; and, for `npm run data`, read from Eurostat's own JSON-stat
 * answer. Read when the site is built, not in the browser.
 */

import { countryInSentence, countryName } from "../../../packages/seed-kit/src/country-names.ts";
import { LOCALE_SETTINGS, type Locale } from "../../../packages/seed-kit/src/locales.ts";
import type { Series } from "./calc.ts";
import raw from "./data/hicp.json" with { type: "json" };

export interface HicpDataset {
  description: string;
  source: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  unit: string;
  /** When it was taken from Eurostat, YYYY-MM-DD. */
  retrievedOn: string;
  /** Typed by hand, not downloaded: the page says so, and the tool cannot be listed. */
  provisional: boolean;
  provisionalNote?: string;
  series: Record<string, { from: number; rates: number[]; checked: boolean }>;
}

/** The groups Eurostat publishes besides the countries. */
export const GROUPS = ["EA", "EU"] as const;

function fail(message: string): never {
  throw new Error(`hicp.json: ${message}`);
}

export function parseHicp(value: unknown): HicpDataset {
  const data = value as Partial<HicpDataset> | null;
  if (!data || typeof data !== "object") fail("not an object");
  for (const key of ["description", "source", "sourceUrl", "license", "licenseUrl", "unit", "retrievedOn"] as const) {
    if (typeof data[key] !== "string" || data[key] === "") fail(`needs its ${key}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.retrievedOn as string)) fail("retrievedOn must be YYYY-MM-DD");
  if (typeof data.provisional !== "boolean") fail("provisional must be true or false");
  if (data.provisional && !data.provisionalNote) fail("a provisional file says why");
  const series = data.series;
  if (!series || typeof series !== "object" || !series.EA) fail("needs the euro area's series");
  for (const [code, entry] of Object.entries(series)) {
    if (!/^[A-Z]{2}$/.test(code)) fail(`${code}: not a two-letter code`);
    if (!Number.isInteger(entry.from) || entry.from < 1996) fail(`${code}: from must be a year`);
    if (!Array.isArray(entry.rates) || entry.rates.length === 0) fail(`${code}: no rates`);
    for (const rate of entry.rates) if (typeof rate !== "number" || !Number.isFinite(rate) || rate < -10 || rate > 1100) fail(`${code}: ${rate} is not a yearly rate`);
    if (typeof entry.checked !== "boolean") fail(`${code}: checked must be true or false`);
  }
  return data as HicpDataset;
}

export const HICP: HicpDataset = parseHicp(raw);

/** Every series, in a language: the euro area and the EU first, then the countries by name. */
export function seriesFor(locale: Locale, groupNames: Readonly<Record<(typeof GROUPS)[number], { name: string; sentence: string }>>, dataset = HICP): Series[] {
  const collator = new Intl.Collator(LOCALE_SETTINGS[locale].intl);
  const all = Object.entries(dataset.series).map(([code, { from, rates }]) => {
    const group = (GROUPS as readonly string[]).includes(code) ? groupNames[code as (typeof GROUPS)[number]] : null;
    return { code, name: group?.name ?? countryName(code, locale), sentence: group?.sentence ?? countryInSentence(code, locale), from, rates };
  });
  const groups = GROUPS.flatMap((code) => all.filter((series) => series.code === code));
  return [...groups, ...all.filter((series) => !(GROUPS as readonly string[]).includes(series.code)).sort((a, b) => collator.compare(a.name, b.name))];
}

/** Eurostat's codes that differ from ISO's. */
const EUROSTAT_CODES: Readonly<Record<string, string>> = { EL: "GR", EU27_2020: "EU" };

/**
 * The yearly rates in Eurostat's JSON-stat answer (dataset prc_hicp_aind,
 * unit RCH_A_AVG, one coicop): for each place, its first year with a rate
 * and the rates from there on, stopping at the first missing year.
 */
export function fromJsonStat(answer: unknown): HicpDataset["series"] {
  const stat = answer as {
    id: string[];
    size: number[];
    dimension: Record<string, { category: { index: Record<string, number> } }>;
    value: Record<string, number | null>;
  };
  if (!Array.isArray(stat?.id) || !Array.isArray(stat.size) || !stat.dimension || !stat.value) throw new Error("JSON-stat: not a dataset");
  const strides = stat.size.map((_, index) => stat.size.slice(index + 1).reduce((product, size) => product * size, 1));
  const geoAt = stat.id.indexOf("geo");
  const timeAt = stat.id.indexOf("time");
  if (geoAt < 0 || timeAt < 0) throw new Error("JSON-stat: no geo or time");
  for (const [at, dimension] of stat.id.entries()) {
    if (at !== geoAt && at !== timeAt && stat.size[at] !== 1) throw new Error(`JSON-stat: ${dimension} must hold one value`);
  }
  const years = Object.entries(stat.dimension.time.category.index).sort(([, a], [, b]) => a - b);
  const series: HicpDataset["series"] = {};
  for (const [geo, geoIndex] of Object.entries(stat.dimension.geo.category.index)) {
    const rates: { year: number; rate: number }[] = [];
    for (const [year, timeIndex] of years) {
      const rate = stat.value[String(geoIndex * strides[geoAt] + timeIndex * strides[timeAt])];
      if (typeof rate === "number") rates.push({ year: Number(year), rate });
      else if (rates.length > 0) break;
    }
    if (rates.length > 0) series[EUROSTAT_CODES[geo] ?? geo] = { from: rates[0].year, rates: rates.map(({ rate }) => rate), checked: true };
  }
  return series;
}
