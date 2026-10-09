/**
 * What it costs to live in each country, from official data only (A1,
 * src/official/): one person, one month, in the prices of a recent year.
 * Worked out here, at build time, from the official series; the pages read
 * the small table it writes (scripts/living-costs.ts → data/living-costs.json,
 * through ../cost-of-living.ts), never the series themselves.
 *
 * The method, in plain words (research/datos-oficiales.md and
 * research/wealth-lens/coste-de-vida.md):
 *
 * 1. The World Bank's household surveys say what an average person in the
 *    country lives on: their mean consumption or income per day, in
 *    international dollars of 2021 (SI.SPR.PCAP), from the latest survey.
 * 2. An international dollar is a US dollar at US prices. US inflation
 *    (FP.CPI.TOTL.ZG) brings it from 2021 to the year of the latest price
 *    level.
 * 3. The country's price level (PA.NUS.PPPC.RF: its prices next to the
 *    US's, at market exchange rates) turns it into the market dollars
 *    that buy the same there.
 * 4. Times 365.25 / 12 days; then into any currency with the official
 *    exchange rate of that same year (PA.NUS.FCRF), rounded (roundEuros).
 *
 * Countries without a survey or a price level are left out: no figure is
 * invented. It is a national average: a big city can cost much more.
 */

import { OFFICIAL } from "./data.ts";
import { latest, valueIn, type Row } from "./series.ts";
import type { CostOfLivingDataset, LivingCost } from "../cost-of-living.ts";

/** The year international dollars of the survey series are given in. */
export const SURVEY_DOLLARS_YEAR = 2021;
const DAYS_A_MONTH = 365.25 / 12;

/** US prices in `year` next to 2021's, from the World Bank's yearly US inflation. */
export function usPricesSince2021(year: number, inflation: Row | undefined = OFFICIAL["wb-inflation"].values.US): number {
  // Prices before 2021 would need deflating, not inflating: never guessed.
  if (year < SURVEY_DOLLARS_YEAR) throw new Error(`cost of living: prices of ${year} are older than the survey dollars (${SURVEY_DOLLARS_YEAR})`);
  let factor = 1;
  for (let at = SURVEY_DOLLARS_YEAR + 1; at <= year; at += 1) {
    const rate = valueIn(inflation, at);
    if (rate === null) throw new Error(`cost of living: no US inflation for ${at}`);
    factor *= 1 + rate / 100;
  }
  return factor;
}

/** Euros per US dollar in a year: the official rate of the euro area's countries (Germany's, the same for all). */
export function eurosPerDollar(year: number): number {
  const rate = valueIn(OFFICIAL["wb-fx"].values.DE, year);
  if (rate === null) throw new Error(`cost of living: no euro rate for ${year}`);
  return rate;
}

/**
 * A monthly cost as the pages show it: to the nearest €10, or to the
 * nearest euro under €100, where €10 steps would be too coarse (€24 and
 * €26 are not "the same"); never below €1.
 */
export function roundEuros(euros: number): number {
  return euros < 95 ? Math.max(1, Math.round(euros)) : Math.round(euros / 10) * 10;
}

/** One country's monthly cost, or null when the official data lack its survey or price level. */
export function countryCost(code: string): LivingCost | null {
  const survey = latest(OFFICIAL["wb-survey-mean"].values[code]);
  const level = latest(OFFICIAL["wb-price-level"].values[code]);
  if (!survey || !level) return null;
  // A year without US inflation or a euro rate leaves the country out, the same way.
  let usd: number;
  let euros: number;
  try {
    usd = survey.value * usPricesSince2021(level.year) * level.value * DAYS_A_MONTH;
    euros = usd * eurosPerDollar(level.year);
  } catch {
    return null;
  }
  return {
    code,
    monthlyCostUsd: usd,
    monthlyCostEur: roundEuros(euros),
    priceYear: level.year,
    surveyYear: survey.year,
  };
}

/** Every country the official data can price, as data/living-costs.json keeps them. */
export function buildLivingCosts(): Omit<CostOfLivingDataset, "countries"> & { countries: LivingCost[] } {
  const codes = Object.keys(OFFICIAL["wb-survey-mean"].values).sort();
  const countries = codes.map(countryCost).filter((country): country is LivingCost => country !== null);
  const metas = [OFFICIAL["wb-survey-mean"].meta, OFFICIAL["wb-price-level"].meta, OFFICIAL["wb-inflation"].meta, OFFICIAL["wb-fx"].meta];
  return {
    description:
      "What an average person lives on in each country, a month: the World Bank's household survey mean (2021 international dollars a day), brought to the prices of the latest price level with US inflation and the country's price level, in US dollars and euros at that year's official rate.",
    priceYear: Math.max(...countries.map((country) => country.priceYear)),
    compiledOn: metas.map((meta) => meta.retrievedOn).sort()[0],
    provisional: metas.find((meta) => meta.provisional)?.provisional ?? null,
    countries,
  };
}
