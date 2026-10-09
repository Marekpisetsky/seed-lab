/**
 * Official data, the one copy every Horalis tool reads: each series with
 * its source, address, licence, download date and data year, kept beside
 * its numbers (src/data/official/*.json). Only official bodies, and only
 * series whose licence allows commercial use and redistribution:
 *
 * - World Bank, World Development Indicators (CC BY 4.0; each indicator's
 *   own licence is read from the World Bank's metadata at download time).
 * - Eurostat, for the European Union only (reuse with attribution,
 *   Commission Decision 2011/833/EU). Eurostat's figures for countries
 *   outside the EU, EFTA and the candidates do not allow commercial use,
 *   so they come from the World Bank instead.
 * - Unicode CLDR, for each country's currency (Unicode License v3).
 *
 * The IMF is not used: its terms ask for permission for commercial use
 * and for automated downloads. Nothing here is read in the browser while a
 * tool is used: a tool's build picks what its pages need.
 *
 * This file holds the shape, the list of series and the checks, pure and
 * shared by the yearly download (scripts/official-data.ts) and the tests.
 */

/** Where a series comes from: its body, its dataset and how it may be reused. */
export interface SeriesMeta {
  id: string;
  title: string;
  /** What one number means: "%", "local currency per US dollar"… */
  unit: string;
  /** "World Bank, World Development Indicators". */
  source: string;
  /** The indicator or dataset code(s) at the source. */
  codes: string[];
  /** A page a person can open to see the series at its source. */
  url: string;
  /** The address the numbers were downloaded from. */
  api: string;
  license: string;
  licenseUrl: string;
  /** How the numbers were made from the source, when they are not copied as they are. */
  method?: string;
  /** YYYY-MM-DD. */
  retrievedOn: string;
  /** The latest year most countries have a figure for. */
  dataYear: number;
  /** Set when the numbers did not come straight from the source's own servers: the page says so. */
  provisional?: string;
}

/** A country's figures: its first year, then one number a year (null where the source has none). */
export type Row = [first: number, ...values: (number | null)[]];

export interface OfficialSeries {
  meta: SeriesMeta;
  values: Record<string, Row>;
}

/** What a series may hold, to catch a bad download before anyone sees it. */
export interface SeriesSpec {
  id: string;
  title: string;
  unit: string;
  /** Plausible values: anything outside stops the update. */
  range: readonly [number, number];
  /** At least this many countries, or the update stops. */
  minCountries: number;
  /** Significant digits kept. */
  digits: number;
  /** "level": a price, rate or index, whose year-to-year jumps are checked; "change": a yearly % change. */
  kind: "level" | "change";
}

export const WB_LICENSE = { license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" } as const;
export const EUROSTAT_LICENSE = {
  license: "Eurostat: reuse free of charge with attribution (Commission Decision 2011/833/EU; CC BY 4.0). EU countries only.",
  licenseUrl: "https://ec.europa.eu/eurostat/about-us/policies/copyright",
} as const;

/** Every series the tools use. The World Bank's indicator code is the series' `codes[0]`. */
export const SPECS: readonly SeriesSpec[] = [
  { id: "wb-inflation", title: "Inflation, consumer prices (annual %)", unit: "% a year", range: [-50, 100000], minCountries: 150, digits: 4, kind: "change" },
  { id: "wb-fx", title: "Official exchange rate (local currency per US$, period average)", unit: "local currency per US dollar", range: [1e-15, 1e13], minCountries: 150, digits: 6, kind: "level" },
  { id: "wb-ppp", title: "PPP conversion factor, GDP (local currency per international $)", unit: "local currency per international dollar", range: [1e-15, 1e13], minCountries: 150, digits: 6, kind: "level" },
  { id: "wb-price-level", title: "Price level ratio of PPP conversion factor (GDP) to market exchange rate", unit: "ratio (1 = US prices)", range: [0.001, 10], minCountries: 150, digits: 4, kind: "level" },
  { id: "wb-survey-mean", title: "Survey mean consumption or income per capita, total population (2021 PPP $ per day)", unit: "2021 international dollars per person per day", range: [0.1, 500], minCountries: 100, digits: 4, kind: "level" },
  { id: "eurostat-hicp", title: "HICP, all items, annual average rate of change", unit: "% a year", range: [-10, 100], minCountries: 27, digits: 3, kind: "change" },
];

/** The World Bank indicator behind each of its series. */
export const WB_CODES: Readonly<Record<string, string>> = {
  "wb-inflation": "FP.CPI.TOTL.ZG",
  "wb-fx": "PA.NUS.FCRF",
  "wb-ppp": "PA.NUS.PPP",
  "wb-price-level": "PA.NUS.PPPC.RF",
  "wb-survey-mean": "SI.SPR.PCAP",
};

export function specOf(id: string): SeriesSpec {
  const spec = SPECS.find((entry) => entry.id === id);
  if (!spec) throw new Error(`official data: no series "${id}"`);
  return spec;
}

/** A number with `digits` significant digits, so the files stay small and stable. */
export function round(value: number, digits: number): number {
  if (value === 0 || !Number.isFinite(value)) return value;
  return Number(value.toPrecision(digits));
}

/** A country's value in a year, or null. */
export function valueIn(row: Row | undefined, year: number): number | null {
  if (!row) return null;
  const index = year - row[0] + 1;
  return index >= 1 && index < row.length ? (row[index] ?? null) : null;
}

/** A country's latest figure and its year, or null. */
export function latest(row: Row | undefined, upTo = Infinity): { year: number; value: number } | null {
  if (!row) return null;
  for (let index = row.length - 1; index >= 1; index -= 1) {
    const year = row[0] + index - 1;
    const value = row[index];
    if (year <= upTo && typeof value === "number") return { year, value };
  }
  return null;
}

/** Years → a compact row, trimmed of empty years at both ends; null when there is no figure. */
export function toRow(byYear: ReadonlyMap<number, number>, digits: number): Row | null {
  const years = [...byYear.keys()].sort((a, b) => a - b);
  if (years.length === 0) return null;
  const row: Row = [years[0]];
  for (let year = years[0]; year <= years[years.length - 1]; year += 1) {
    const value = byYear.get(year);
    row.push(value === undefined ? null : round(value, digits));
  }
  return row;
}

/** The latest year with figures for at least half as many countries as the best-covered year. */
export function dataYearOf(values: Readonly<Record<string, Row>>): number {
  const counts = new Map<number, number>();
  for (const row of Object.values(values)) {
    row.slice(1).forEach((value, index) => {
      if (typeof value === "number") counts.set(row[0] + index, (counts.get(row[0] + index) ?? 0) + 1);
    });
  }
  const best = Math.max(0, ...counts.values());
  return Math.max(...[...counts.entries()].filter(([, count]) => count >= best / 2).map(([year]) => year));
}

export interface CheckResult {
  errors: string[];
  warnings: string[];
}

/**
 * Does a series make sense? Its shape and licence, every value in range,
 * enough countries, a recent data year, and no absurd jumps between two
 * years of a level (more than ×50). Old series hold real ones: a currency
 * replaced (the euro, Zimbabwe's dollars) or hyperinflation. So a jump is
 * only an error when it is new: absent from the series in use (`before`)
 * and not explained by prices rising as much that year. On a first
 * download, with nothing in use, jumps are listed to look at.
 */
export function checkSeries(
  series: OfficialSeries,
  today = new Date(),
  inflation?: OfficialSeries,
  before?: OfficialSeries | null,
  /** False when a tool is built: data that is years old still works; only the yearly download must bring recent data. */
  checkAge = true,
): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const spec = SPECS.find((entry) => entry.id === series.meta?.id);
  if (!spec) return { errors: [`unknown series ${series.meta?.id}`], warnings };
  const meta = series.meta;
  for (const key of ["title", "unit", "source", "url", "api", "license", "licenseUrl", "retrievedOn"] as const) {
    if (typeof meta[key] !== "string" || meta[key] === "") errors.push(`${spec.id}: no ${key}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.retrievedOn ?? "")) errors.push(`${spec.id}: retrievedOn must be YYYY-MM-DD`);
  if (!Array.isArray(meta.codes) || meta.codes.length === 0) errors.push(`${spec.id}: no source codes`);
  if (!/CC[- ]BY[- ]?4\.0|2011\/833\/EU/i.test(meta.license ?? "")) errors.push(`${spec.id}: licence "${meta.license}" is not one that allows reuse`);
  const countries = Object.keys(series.values ?? {});
  if (countries.length < spec.minCountries) errors.push(`${spec.id}: ${countries.length} countries, fewer than ${spec.minCountries}`);
  const thisYear = today.getUTCFullYear();
  for (const [code, row] of Object.entries(series.values ?? {})) {
    if (!/^[A-Z][A-Z0-9]$/.test(code)) errors.push(`${spec.id}: "${code}" is not a two-letter country code`);
    if (!Array.isArray(row) || !Number.isInteger(row[0]) || row[0] < 1950 || row[0] > thisYear) {
      errors.push(`${spec.id} ${code}: bad first year`);
      continue;
    }
    // Yearly figures are only complete once the year is over: none for this year or later.
    if (row[0] + row.length - 2 >= thisYear) errors.push(`${spec.id} ${code}: figures for a year not yet complete`);
    let previous: { year: number; value: number } | null = null;
    row.slice(1).forEach((value, index) => {
      const year = row[0] + index;
      if (value === null) return;
      if (typeof value !== "number" || !Number.isFinite(value)) {
        errors.push(`${spec.id} ${code} ${year}: not a number`);
        return;
      }
      if (value < spec.range[0] || value > spec.range[1]) errors.push(`${spec.id} ${code} ${year}: ${value} is outside ${spec.range[0]}…${spec.range[1]}`);
      if (spec.kind === "level" && previous && previous.year === year - 1 && previous.value > 0) {
        const ratio = value / previous.value;
        if (ratio > 50 || ratio < 1 / 50) {
          const rise = valueIn(inflation?.values[code], year);
          const was = valueIn(before?.values[code], year);
          const wasBefore = valueIn(before?.values[code], year - 1);
          const known = was !== null && wasBefore !== null && wasBefore > 0 && Math.abs(Math.log(was / wasBefore / ratio)) < Math.log(2);
          const line = `${spec.id} ${code} ${year}: jumps ×${ratio.toPrecision(3)} in a year${rise !== null ? `, with prices up ${Math.round(rise)}%` : ""}`;
          if (known) return void (previous = { year, value });
          if (before && (rise === null || rise < 300)) errors.push(`${line} (new since the series in use)`);
          else warnings.push(line);
        }
      }
      previous = { year, value };
    });
  }
  if (countries.length > 0) {
    const year = dataYearOf(series.values);
    if (meta.dataYear !== year) errors.push(`${spec.id}: dataYear says ${meta.dataYear}, the figures say ${year}`);
    const allowed = spec.id === "wb-survey-mean" ? 8 : 4;
    if (checkAge && year < thisYear - allowed) errors.push(`${spec.id}: its latest year (${year}) is more than ${allowed} years old`);
  }
  return { errors, warnings };
}

/**
 * A new download against the one in use: never fewer countries, never an
 * older data year; values revised by more than a quarter are listed, so a
 * person can look at them, without stopping the update (new price
 * comparison rounds revise whole series).
 */
export function compareSeries(before: OfficialSeries, after: OfficialSeries): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const id = after.meta.id;
  const lost = Object.keys(before.values).filter((code) => !(code in after.values));
  if (Object.keys(after.values).length < Object.keys(before.values).length) {
    errors.push(`${id}: ${Object.keys(after.values).length} countries, fewer than the ${Object.keys(before.values).length} in use (missing: ${lost.join(", ")})`);
  } else if (lost.length > 0) warnings.push(`${id}: no longer has ${lost.join(", ")}`);
  if (after.meta.dataYear < before.meta.dataYear) errors.push(`${id}: data year ${after.meta.dataYear}, older than the ${before.meta.dataYear} in use`);
  let revised = 0;
  const examples: string[] = [];
  for (const [code, row] of Object.entries(before.values)) {
    row.slice(1).forEach((old, index) => {
      const year = row[0] + index;
      const now = valueIn(after.values[code], year);
      if (typeof old !== "number" || now === null) return;
      const change = Math.abs(now - old) / Math.max(Math.abs(old), 1e-9);
      const big = specOf(id).kind === "change" ? Math.abs(now - old) > 5 : change > 0.25;
      if (big) {
        revised += 1;
        if (examples.length < 5) examples.push(`${code} ${year}: ${old} → ${now}`);
      }
    });
  }
  if (revised > 0) warnings.push(`${id}: ${revised} figures revised a lot (${examples.join("; ")}${revised > examples.length ? "; …" : ""})`);
  return { errors, warnings };
}
