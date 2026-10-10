/**
 * The yearly download of Horalis's official data (src/official/series.ts):
 *
 *   node --experimental-strip-types scripts/official-data.ts [--out DIR] [--report FILE]
 *   … --mirror DIR [--mirror-date TEXT] [--hicp FILE]   (a provisional start, see below)
 *
 * It downloads every series from its source (World Bank, Eurostat, CLDR),
 * checks each one on its own and against the files in use, and only then
 * writes them. If any check fails it writes nothing but the report, and
 * exits with 1, so the yearly workflow opens a pull request that explains
 * what went wrong and changes no data. The report (markdown) is written in
 * both cases.
 *
 * `--mirror DIR` reads the World Bank's figures from a local copy of the
 * public mirror github.com/datasets/world-development-indicators instead
 * of api.worldbank.org, and `--hicp FILE` takes Eurostat's from a file in
 * the format of projects/inflation-lens/src/data/hicp.json. Both mark every
 * series "provisional", with where it came from, and the pages say so; the
 * next run from the sources replaces them. It exists because the session
 * that built this module could reach neither the World Bank nor Eurostat.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { CLDR_LICENSE, CLDR_PACKAGE, currencies, economiesFromCldr } from "../src/official/cldr.ts";
import { EU27, fromJsonStat, hicpUrl } from "../src/official/eurostat.ts";
import { checkSeries, compareSeries, dataYearOf, EUROSTAT_LICENSE, specOf, WB_CODES, WB_LICENSE, round, type OfficialSeries, type Row, type SeriesMeta } from "../src/official/series.ts";
import { COUNTRIES_URL, economies, fromMirrorCsv, indicatorUrl, licenseOf, metadataUrl, MIRROR_URL, observations, rows, type Economy } from "../src/official/worldbank.ts";

const args = process.argv.slice(2);
const option = (name: string, fallback: string) => {
  const at = args.indexOf(name);
  return at >= 0 && args[at + 1] ? args[at + 1] : fallback;
};
const OUT = option("--out", fileURLToPath(new URL("../src/data/official/", import.meta.url)));
const REPORT = option("--report", join(OUT, "REPORT.md"));
const MIRROR = option("--mirror", "");
const HICP_FILE = option("--hicp", "");
const mirrorDate = option("--mirror-date", "unknown date");
const today = new Date();
const retrievedOn = today.toISOString().slice(0, 10);

/** A download that gives up after two minutes, and tries again only when trying again can help (network, 429, 5xx). */
async function get(url: string, as: "json" | "bytes" = "json"): Promise<unknown> {
  let last: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** (attempt - 1)));
    try {
      const response = await fetch(url, { headers: { "user-agent": "Horalis yearly data (github.com/Marekpisetsky/seed-lab)" }, signal: AbortSignal.timeout(120_000) });
      if (!response.ok) {
        const error = new Error(`${response.status} ${response.statusText}`);
        if (response.status !== 429 && response.status < 500) throw Object.assign(error, { final: true });
        throw error;
      }
      return as === "json" ? await response.json() : new Uint8Array(await response.arrayBuffer());
    } catch (error) {
      last = error;
      if ((error as { final?: boolean }).final) break;
    }
  }
  throw new Error(`could not download ${url}: ${last instanceof Error ? last.message : String(last)}`);
}

/** One file out of an npm package's .tgz (ustar), with no dependency. */
function fromTarball(tgz: Uint8Array, wanted: string): string {
  const tar = gunzipSync(tgz);
  for (let at = 0; at + 512 <= tar.length; ) {
    const header = tar.subarray(at, at + 512);
    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/s, "");
    if (name === "") break;
    const prefix = header.subarray(345, 500).toString("utf8").replace(/\0.*$/s, "");
    const size = parseInt(header.subarray(124, 136).toString("utf8").replace(/\0.*$/s, "").trim() || "0", 8);
    const path = prefix ? `${prefix}/${name}` : name;
    if (path === wanted) return tar.subarray(at + 512, at + 512 + size).toString("utf8");
    at += 512 + Math.ceil(size / 512) * 512;
  }
  throw new Error(`${wanted} is not in the package`);
}

const errors: string[] = [];
const warnings: string[] = [];
const written: OfficialSeries[] = [];

function meta(id: string, extra: Omit<SeriesMeta, "id" | "title" | "unit" | "retrievedOn" | "dataYear">, values: Record<string, Row>): SeriesMeta {
  const spec = specOf(id);
  return { id, title: spec.title, unit: spec.unit, ...extra, retrievedOn, dataYear: Object.keys(values).length > 0 ? dataYearOf(values) : 0 };
}

async function worldBank(list: Map<string, Economy>): Promise<OfficialSeries[]> {
  const out: OfficialSeries[] = [];
  for (const [id, code] of Object.entries(WB_CODES)) {
    try {
      let licence: string;
      let byCountry: Map<string, Map<number, number>>;
      if (MIRROR) {
        const folder = join(MIRROR, "indicators", code.toLowerCase());
        const pack = JSON.parse(readFileSync(join(folder, "datapackage.json"), "utf8")) as { licenses?: { name?: string }[] };
        licence = pack.licenses?.[0]?.name ?? "none";
        byCountry = fromMirrorCsv(readFileSync(join(folder, "data.csv"), "utf8"), list);
      } else {
        licence = licenseOf(await get(metadataUrl(code)))?.type ?? "none";
        byCountry = observations(await get(indicatorUrl(code)), code, list);
      }
      if (!/CC[- ]BY[- ]?4\.0/i.test(licence)) throw new Error(`${code}: the licence given is "${licence}", not CC BY 4.0`);
      // Two of these the World Bank compiles from the IMF's International Financial Statistics; it publishes them under CC BY 4.0.
      const values = rows(byCountry, specOf(id).digits);
      out.push({
        meta: meta(
          id,
          {
            source: "World Bank, World Development Indicators",
            codes: [code],
            url: `https://data.worldbank.org/indicator/${code}`,
            api: MIRROR ? `${MIRROR_URL}/tree/main/indicators/${code.toLowerCase()}` : indicatorUrl(code),
            license: licence,
            licenseUrl: WB_LICENSE.licenseUrl,
            method: `Copied as published, one figure per country and year; regions and income groups left out. Licence read from the ${MIRROR ? "mirror's datapackage.json" : "World Bank's metadata"}: ${licence}.`,
            ...(MIRROR ? { provisional: `Taken from the public mirror of the World Bank's data (${MIRROR_URL}, its automated update of ${mirrorDate}), not from api.worldbank.org. The yearly download replaces it from the World Bank.` } : {}),
          },
          values,
        ),
        values,
      });
    } catch (error) {
      errors.push(`${id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return out;
}

/** Eurostat's HICP; "CP00" (all items) until ECOICOP 2, "TOTAL" in case the code changed with it. */
async function hicpFromEurostat(): Promise<Record<string, Row>> {
  let last: unknown;
  for (const coicop of ["CP00", "TOTAL"]) {
    try {
      return fromJsonStat(await get(hicpUrl(coicop)));
    } catch (error) {
      last = error;
    }
  }
  throw last;
}

async function eurostat(): Promise<OfficialSeries | null> {
  try {
    const all: Record<string, Row> = HICP_FILE
      ? Object.fromEntries(Object.entries((JSON.parse(readFileSync(HICP_FILE, "utf8")) as { series: Record<string, { from: number; rates: number[] }> }).series).map(([code, entry]) => [code, [entry.from, ...entry.rates] as Row]))
      : await hicpFromEurostat();
    const keep = new Set<string>(["EA", "EU", ...EU27]);
    const values = Object.fromEntries(
      Object.entries(all)
        .filter(([code]) => keep.has(code))
        .map(([code, row]) => [code, [row[0], ...row.slice(1).map((value) => (typeof value === "number" ? round(value, specOf("eurostat-hicp").digits) : null))] as Row]),
    );
    return {
      meta: meta(
        "eurostat-hicp",
        {
          source: "Eurostat, Harmonised index of consumer prices (HICP), annual data",
          codes: ["prc_hicp_aind", "unit=RCH_A_AVG", "coicop=CP00"],
          url: "https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_aind/default/table",
          api: hicpUrl(),
          ...EUROSTAT_LICENSE,
          method: "The EU's 27 countries, the euro area (EA, as it was each year) and the EU (EU27_2020) only.",
          ...(HICP_FILE ? { provisional: "Typed by hand from Eurostat's published annual rates (projects/inflation-lens, 2026-10-02), because the session that built this could not reach Eurostat. It stops at 2024, although Eurostat has published 2025, and its figures may differ by about 0.1 points from Eurostat's current ones. The yearly download replaces them from Eurostat." } : {}),
        },
        values,
      ),
      values,
    };
  } catch (error) {
    errors.push(`eurostat-hicp: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

let cldrTarball: Uint8Array | null = null;
let cldrVersion = "";
/** A file of the CLDR's npm package (downloaded once). */
async function cldrFile(path: string): Promise<string> {
  if (!cldrTarball) {
    const latest = (await get(`https://registry.npmjs.org/${CLDR_PACKAGE}/latest`)) as { version: string; dist: { tarball: string } };
    cldrVersion = latest.version;
    cldrTarball = (await get(latest.dist.tarball, "bytes")) as Uint8Array;
  }
  return fromTarball(cldrTarball, path);
}

async function countryList(list: Map<string, Economy>): Promise<object | null> {
  try {
    const money = await currencyMap();
    return {
      meta: {
        id: "countries",
        title: "Economies of the World Bank, with their region, income group and currency",
        source: MIRROR
          ? `Unicode CLDR (${CLDR_PACKAGE} ${cldrVersion}): the economies in the World Bank's figures with an ISO code (supplemental/codeMappings.json) and their currency (supplemental/currencyData.json)`
          : `World Bank country list; currencies from Unicode CLDR (${CLDR_PACKAGE} ${cldrVersion}, supplemental/currencyData.json)`,
        url: MIRROR ? "https://cldr.unicode.org/" : "https://datahelpdesk.worldbank.org/knowledgebase/articles/906519",
        api: MIRROR ? `https://registry.npmjs.org/${CLDR_PACKAGE}` : `${COUNTRIES_URL} ; https://registry.npmjs.org/${CLDR_PACKAGE}`,
        ...(MIRROR ? CLDR_LICENSE : WB_LICENSE),
        currencyLicense: CLDR_LICENSE.license,
        currencyLicenseUrl: CLDR_LICENSE.licenseUrl,
        retrievedOn,
        ...(MIRROR ? { provisional: "Economies taken from the CLDR's ISO codes, for figures read from the public mirror of the World Bank's data: no region or income group. The yearly download takes the World Bank's own list." } : {}),
      },
      countries: Object.fromEntries(
        [...list.values()]
          .sort((a, b) => a.iso2.localeCompare(b.iso2))
          .map((economy) => [
            economy.iso2,
            { iso3: economy.iso3, ...(economy.region ? { region: economy.region, income: economy.income } : {}), currency: money.get(economy.iso2) ?? null, eu: (EU27 as readonly string[]).includes(economy.iso2) },
          ]),
      ),
    };
  } catch (error) {
    errors.push(`countries: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/** The series in use, also when it is a provisional start: never fewer countries, never an older year. */
function readInUse(id: string): OfficialSeries | null {
  const file = join(OUT, `${id}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as OfficialSeries;
}

let currencyCache: Map<string, string> | null = null;
/** Each country's currency today, from the CLDR. */
async function currencyMap(): Promise<Map<string, string>> {
  currencyCache ??= currencies(JSON.parse(await cldrFile("package/supplemental/currencyData.json")), today);
  return currencyCache;
}

let countries: object | null = null;
try {
  let list = new Map<string, Economy>();
  try {
    if (MIRROR) {
      list = economiesFromCldr(JSON.parse(await cldrFile("package/supplemental/codeMappings.json")) as unknown);
    } else list = economies(await get(COUNTRIES_URL));
    if (list.size < 180) errors.push(`countries: only ${list.size} economies`);
  } catch (error) {
    errors.push(`countries: ${error instanceof Error ? error.message : String(error)}`);
  }
  const series = [...(await worldBank(list)), ...[await eurostat()].filter((entry): entry is OfficialSeries => entry !== null)];
  // Only economies some series has figures for (the CLDR also lists old codes: Yugoslavia, the USSR…).
  const named = new Set(series.flatMap((entry) => Object.keys(entry.values)));
  for (const code of [...list.keys()]) if (!named.has(code)) list.delete(code);
  // Every economy must have a currency to be used: one without (the Channel Islands, which have no ISO code) is left out of every series, and said.
  const money = await currencyMap();
  const without = [...list.keys()].filter((code) => !money.has(code));
  for (const code of without) list.delete(code);
  for (const entry of series) {
    entry.values = Object.fromEntries(Object.entries(entry.values).filter(([code]) => !without.includes(code)));
    entry.meta.dataYear = dataYearOf(entry.values);
  }
  if (without.length > 0) warnings.push(`countries: left out, no currency in the CLDR: ${without.join(", ")}`);
  countries = await countryList(list);
  const inflation = series.find((entry) => entry.meta.id === "wb-inflation");
  for (const entry of series) {
    const before = readInUse(entry.meta.id);
    const own = checkSeries(entry, today, inflation, before);
    errors.push(...own.errors);
    warnings.push(...own.warnings);
    if (before) {
      const compared = compareSeries(before, entry);
      errors.push(...compared.errors);
      warnings.push(...compared.warnings);
    }
    written.push(entry);
  }
  const expected = [...Object.keys(WB_CODES), "eurostat-hicp"];
  for (const id of expected) if (!series.some((entry) => entry.meta.id === id)) errors.push(`${id}: not downloaded`);

} catch (error) {
  // Whatever breaks, the report still says what happened, and nothing is written.
  errors.push(`the download stopped: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
}

const ok = errors.length === 0;
mkdirSync(OUT, { recursive: true });
if (ok) {
  for (const entry of written) writeFileSync(join(OUT, `${entry.meta.id}.json`), `${JSON.stringify(entry)}\n`);
  if (countries) writeFileSync(join(OUT, "countries.json"), `${JSON.stringify(countries, null, 1)}\n`);
}
const table = written.map((entry) => `| ${entry.meta.id} | ${entry.meta.codes.join(", ")} | ${Object.keys(entry.values).length} | ${entry.meta.dataYear} | ${entry.meta.license} |`).join("\n");
const report = `# Official data, ${retrievedOn}

${ok ? "**All checks passed.** The files below were updated." : "**The update stopped: no data was changed.** Fix what the errors say, then run it again."}

| Series | Source codes | Countries | Data year | Licence |
| --- | --- | --- | --- | --- |
${table}

## Errors (${errors.length})

${errors.length > 0 ? errors.map((line) => `- ${line}`).join("\n") : "None."}

## To look at (${warnings.length})

${warnings.length > 0 ? warnings.map((line) => `- ${line}`).join("\n") : "Nothing."}
`;
writeFileSync(REPORT, report);
console.log(report);
process.exit(ok ? 0 : 1);
