/**
 * The official data in this build, read and checked once (the files in
 * src/data/official/, written by scripts/official-data.ts). For a tool's
 * build, never for the browser: a page carries only the figures it shows.
 * A file that fails its checks stops the build, so a bad edit is never
 * published.
 */

import countriesJson from "../data/official/countries.json" with { type: "json" };
import hicp from "../data/official/eurostat-hicp.json" with { type: "json" };
import fx from "../data/official/wb-fx.json" with { type: "json" };
import inflation from "../data/official/wb-inflation.json" with { type: "json" };
import ppp from "../data/official/wb-ppp.json" with { type: "json" };
import priceLevel from "../data/official/wb-price-level.json" with { type: "json" };
import surveyMean from "../data/official/wb-survey-mean.json" with { type: "json" };
import { checkSeries, SPECS, type OfficialSeries, type SeriesMeta } from "./series.ts";

export type SeriesId = "wb-inflation" | "wb-fx" | "wb-ppp" | "wb-price-level" | "wb-survey-mean" | "eurostat-hicp";

export interface CountryInfo {
  iso3: string;
  region?: string;
  income?: string;
  /** ISO 4217, the currency in use today; null when the CLDR gives none. */
  currency: string | null;
  /** A member of the European Union (its inflation is Eurostat's). */
  eu: boolean;
}

export interface CountriesFile {
  meta: Omit<SeriesMeta, "id" | "title" | "unit" | "codes" | "dataYear"> & { id: string; title: string; currencyLicense: string; currencyLicenseUrl: string };
  countries: Record<string, CountryInfo>;
}

function checked(raw: unknown, inflationSeries?: OfficialSeries): OfficialSeries {
  const series = raw as OfficialSeries;
  const { errors } = checkSeries(series, new Date(), inflationSeries);
  if (errors.length > 0) throw new Error(`official data, ${series.meta?.id}: ${errors.slice(0, 5).join("; ")}`);
  return series;
}

const INFLATION = checked(inflation);

export const OFFICIAL: Readonly<Record<SeriesId, OfficialSeries>> = {
  "wb-inflation": INFLATION,
  "wb-fx": checked(fx, INFLATION),
  "wb-ppp": checked(ppp, INFLATION),
  "wb-price-level": checked(priceLevel, INFLATION),
  "wb-survey-mean": checked(surveyMean, INFLATION),
  "eurostat-hicp": checked(hicp),
};

if (SPECS.some((spec) => !(spec.id in OFFICIAL))) throw new Error("official data: a series of SPECS has no file");

export const COUNTRIES_FILE = countriesJson as CountriesFile;
export const COUNTRIES: Readonly<Record<string, CountryInfo>> = COUNTRIES_FILE.countries;

/** Every series' source, licence, dates and, if any, why it is provisional: for a methodology page or a footer. */
export function sourcesOf(ids: readonly SeriesId[]): SeriesMeta[] {
  return ids.map((id) => OFFICIAL[id].meta);
}
