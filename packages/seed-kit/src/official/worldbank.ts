/**
 * The World Bank's API (api.worldbank.org/v2), read into Horalis's series:
 * pure functions over its JSON answers, so the tests can check them on
 * small examples and the yearly download (scripts/official-data.ts) only
 * fetches.
 */

import { toRow, type Row } from "./series.ts";

export const WB_API = "https://api.worldbank.org/v2";

/** One row of an indicator's answer. */
interface WbObservation {
  indicator?: { id?: string };
  country?: { id?: string; value?: string };
  countryiso3code?: string;
  date?: string;
  value?: number | null;
}

/** One economy of /country. */
interface WbCountry {
  id?: string;
  iso2Code?: string;
  name?: string;
  region?: { id?: string; value?: string };
  incomeLevel?: { id?: string };
}

export interface Economy {
  iso2: string;
  iso3: string;
  /** The World Bank's region code ("ECS", "LCN"…). */
  region: string;
  /** "HIC", "UMC", "LMC", "LIC" or "INX" (not classified). */
  income: string;
  /** Its English name at the World Bank, for the reports only (the tools name countries with Intl). */
  name: string;
}

/** The address of an indicator for every economy, every year, on one page. */
export function indicatorUrl(code: string, from = 1960, to = new Date().getUTCFullYear()): string {
  return `${WB_API}/country/all/indicator/${code}?format=json&per_page=20000&date=${from}:${to}`;
}

/** The public mirror a provisional start can be read from (scripts/official-data.ts, --mirror). */
export const MIRROR_URL = "https://github.com/datasets/world-development-indicators";

/** The mirror's data.csv (Country Name, Country Code, Year, Value) → figures by country and year, for the economies given. */
export function fromMirrorCsv(csv: string, keep: ReadonlyMap<string, Economy>): Map<string, Map<number, number>> {
  const byIso3 = new Map([...keep.values()].map((economy) => [economy.iso3, economy.iso2]));
  const out = new Map<string, Map<number, number>>();
  const lines = csv.trim().split(/\r?\n/);
  if (!/Country Code,Year,Value\s*$/.test(lines[0] ?? "")) throw new Error("mirror: not the expected columns");
  for (const line of lines.slice(1)) {
    // The country's name may hold commas inside quotes; the last three fields never do.
    const parts = line.split(",");
    const [code, year, value] = parts.slice(-3);
    const iso2 = byIso3.get(code);
    const number = Number(value);
    if (!iso2 || value === "" || !Number.isFinite(number) || !/^\d{4}$/.test(year)) continue;
    if (!out.has(iso2)) out.set(iso2, new Map());
    out.get(iso2)?.set(Number(year), number);
  }
  return out;
}

export const COUNTRIES_URL = `${WB_API}/country?format=json&per_page=400`;

/** An indicator's licence, from the World Bank's metadata for it. */
export function metadataUrl(code: string): string {
  return `${WB_API}/sources/2/series/${code}/metadata?format=json`;
}

/** The first page of an answer, refusing one that was cut into several pages or is an error message. */
function rowsOf<T>(answer: unknown, what: string): T[] {
  if (!Array.isArray(answer) || answer.length < 2 || typeof answer[0] !== "object" || answer[0] === null) {
    const message = Array.isArray(answer) && answer[0] && typeof answer[0] === "object" && "message" in answer[0] ? JSON.stringify(answer[0]) : "";
    throw new Error(`World Bank: ${what} is not a data answer ${message}`);
  }
  const head = answer[0] as { pages?: number; total?: number };
  if ((head.pages ?? 1) > 1) throw new Error(`World Bank: ${what} came in ${head.pages} pages; ask for more per page`);
  return (answer[1] ?? []) as T[];
}

/** Real economies only (not regions or income groups), by their two-letter code. */
export function economies(answer: unknown): Map<string, Economy> {
  const out = new Map<string, Economy>();
  for (const country of rowsOf<WbCountry>(answer, "the country list")) {
    if (!country.iso2Code || !country.id || country.region?.id === "NA" || country.region?.value === "Aggregates") continue;
    if (!/^[A-Z][A-Z0-9]$/.test(country.iso2Code)) continue;
    out.set(country.iso2Code, { iso2: country.iso2Code, iso3: country.id, region: country.region?.id ?? "", income: country.incomeLevel?.id ?? "", name: country.name ?? country.iso2Code });
  }
  return out;
}

/** An indicator's figures by country and year, for the economies given (aggregates are dropped). */
export function observations(answer: unknown, code: string, keep: ReadonlyMap<string, Economy>): Map<string, Map<number, number>> {
  const byIso3 = new Map([...keep.values()].map((economy) => [economy.iso3, economy.iso2]));
  const out = new Map<string, Map<number, number>>();
  for (const row of rowsOf<WbObservation>(answer, code)) {
    if (row.indicator?.id && row.indicator.id !== code) throw new Error(`World Bank: asked for ${code}, got ${row.indicator.id}`);
    const iso2 = byIso3.get(row.countryiso3code ?? "") ?? (keep.has(row.country?.id ?? "") ? row.country?.id : undefined);
    if (!iso2 || typeof row.value !== "number" || !Number.isFinite(row.value)) continue;
    const year = Number(row.date);
    if (!Number.isInteger(year)) continue;
    if (!out.has(iso2)) out.set(iso2, new Map());
    out.get(iso2)?.set(year, row.value);
  }
  return out;
}

/** Figures by country and year → compact rows. */
export function rows(byCountry: ReadonlyMap<string, ReadonlyMap<number, number>>, digits: number): Record<string, Row> {
  const out: Record<string, Row> = {};
  for (const code of [...byCountry.keys()].sort()) {
    const row = toRow(byCountry.get(code) ?? new Map(), digits);
    if (row) out[code] = row;
  }
  return out;
}

/** a / b, year by year, where both have a figure (household spending ÷ people = spending per person). */
export function divide(a: ReadonlyMap<string, ReadonlyMap<number, number>>, b: ReadonlyMap<string, ReadonlyMap<number, number>>): Map<string, Map<number, number>> {
  const out = new Map<string, Map<number, number>>();
  for (const [code, years] of a) {
    for (const [year, value] of years) {
      const divisor = b.get(code)?.get(year);
      if (divisor === undefined || divisor <= 0) continue;
      if (!out.has(code)) out.set(code, new Map());
      out.get(code)?.set(year, value / divisor);
    }
  }
  return out;
}

/**
 * The licence the World Bank's metadata gives an indicator ("CC BY-4.0"),
 * wherever it sits in the answer (a concept "License_Type"); null if none.
 */
export function licenseOf(answer: unknown): { type: string; url: string | null } | null {
  let type: string | null = null;
  let url: string | null = null;
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === "object") {
      const entry = node as { id?: unknown; value?: unknown };
      if (entry.id === "License_Type" && typeof entry.value === "string") type ??= entry.value;
      if (entry.id === "License_URL" && typeof entry.value === "string") url ??= entry.value;
      Object.values(node).forEach(walk);
    }
  };
  walk(answer);
  return type === null ? null : { type, url };
}
