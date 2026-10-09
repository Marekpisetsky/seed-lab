/**
 * Eurostat's dissemination API, read into Horalis's series: the yearly HICP
 * rates (dataset prc_hicp_aind) of the European Union's countries, the
 * euro area and the EU. Only these: Eurostat's figures for countries
 * outside the EU, EFTA and the candidates may not be used commercially.
 */

import type { Row } from "./series.ts";

/** The 27 member states, by ISO code (Eurostat writes Greece "EL"). */
export const EU27 = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"] as const;

/** Eurostat's codes that differ from ISO's, and its groups: the euro area ("EA", as it was each year) and the EU. */
const TO_ISO: Readonly<Record<string, string>> = { EL: "GR", EU27_2020: "EU" };
const FROM_ISO: Readonly<Record<string, string>> = { GR: "EL", EU: "EU27_2020" };

export const HICP_GEO = ["EA", "EU", ...EU27] as const;

export function hicpUrl(coicop = "CP00"): string {
  const url = new URL("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_aind");
  for (const [key, value] of [["format", "JSON"], ["lang", "EN"], ["unit", "RCH_A_AVG"], ["coicop", coicop]]) url.searchParams.set(key, value);
  for (const geo of HICP_GEO) url.searchParams.append("geo", FROM_ISO[geo] ?? geo);
  return url.toString();
}

/**
 * The yearly rates in a JSON-stat answer with one value in every
 * dimension but place and time: for each place, its first year with a
 * figure and every year after it (null where a year is missing).
 */
export function fromJsonStat(answer: unknown): Record<string, Row> {
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
  const years = Object.entries(stat.dimension.time.category.index)
    .map(([year, index]) => [Number(year), index] as const)
    .sort(([a], [b]) => a - b);
  const out: Record<string, Row> = {};
  for (const [geo, geoIndex] of Object.entries(stat.dimension.geo.category.index)) {
    const values = years.map(([, timeIndex]) => stat.value[String(geoIndex * strides[geoAt] + timeIndex * strides[timeAt])]);
    const first = values.findIndex((value) => typeof value === "number");
    if (first < 0) continue;
    let last = values.length - 1;
    while (typeof values[last] !== "number") last -= 1;
    out[TO_ISO[geo] ?? geo] = [years[first][0], ...values.slice(first, last + 1).map((value) => (typeof value === "number" ? value : null))];
  }
  return out;
}
