import assert from "node:assert/strict";
import { describe, it } from "node:test";
import names from "../src/data/country-names.json" with { type: "json" };
import { costOfLiving, countryByCode, REFERENCE_INFLATION, referenceInflation } from "../src/cost-of-living.ts";
import { buildLivingCosts, countryCost, eurosPerDollar, roundEuros, usPricesSince2021 } from "../src/official/living-costs.ts";
import { DEFAULT_PRICES_OF, isPriceCountry, referenceRate } from "../src/inflation-rates.ts";
import rates from "../src/data/inflation-rates.json" with { type: "json" };
import { OFFICIAL } from "../src/official/data.ts";
import { latest } from "../src/official/series.ts";

describe("the cost of living, from official data only", () => {
  it("is the table the pages read, equal to what the official data give: else run npm run living-costs", () => {
    const built = buildLivingCosts();
    assert.equal(costOfLiving.priceYear, built.priceYear);
    assert.equal(costOfLiving.provisional, built.provisional);
    assert.deepEqual(
      costOfLiving.countries.map(({ code, monthlyCostEur, priceYear, surveyYear }) => ({ code, monthlyCostEur, priceYear, surveyYear })),
      built.countries.map(({ code, monthlyCostEur, priceYear, surveyYear }) => ({ code, monthlyCostEur, priceYear, surveyYear })),
    );
    for (const [index, country] of costOfLiving.countries.entries()) assert.ok(Math.abs(country.monthlyCostUsd - built.countries[index].monthlyCostUsd) < 0.01, country.code);
  });

  it("has every country with a household survey and a price level, each once, and no other", () => {
    const { countries } = costOfLiving;
    assert.ok(countries.length >= 100, String(countries.length));
    assert.equal(new Set(countries.map((country) => country.code)).size, countries.length);
    for (const country of countries) {
      assert.ok(OFFICIAL["wb-survey-mean"].values[country.code] && OFFICIAL["wb-price-level"].values[country.code], country.code);
    }
  });

  it("works each figure out by hand: survey dollars, US inflation since 2021, price level, days, euros", () => {
    const nl = countryCost("NL");
    assert.ok(nl);
    const survey = latest(OFFICIAL["wb-survey-mean"].values.NL)?.value ?? 0;
    const level = latest(OFFICIAL["wb-price-level"].values.NL);
    assert.ok(level);
    const usd = survey * usPricesSince2021(level.year) * level.value * (365.25 / 12);
    assert.ok(Math.abs(nl.monthlyCostUsd - usd) < 1e-9);
    assert.ok(Math.abs((countryByCode("NL")?.monthlyCostUsd ?? 0) - usd) < 0.01);
    assert.equal(nl.monthlyCostEur, Math.round((usd * eurosPerDollar(level.year)) / 10) * 10);
    // Under €100, to the nearest euro: €10 steps would be too coarse there.
    assert.deepEqual([roundEuros(23.6), roundEuros(94.4), roundEuros(95), roundEuros(214), roundEuros(0.2)], [24, 94, 100, 210, 1]);
    assert.equal(nl.priceYear, level.year);
    assert.equal(usPricesSince2021(2021), 1);
    assert.ok(usPricesSince2021(2024) > 1.1 && usPricesSince2021(2024) < 1.2);
  });

  it("gives figures that make sense: dearer in rich countries, cheaper in poor ones", () => {
    const eur = (code: string) => countryByCode(code)?.monthlyCostEur ?? Number.NaN;
    assert.ok(eur("NL") > 1000 && eur("NL") < 4000, String(eur("NL")));
    assert.ok(eur("US") > eur("NL"));
    assert.ok(eur("PE") < 500, String(eur("PE")));
    assert.ok(eur("ES") < eur("NL"));
  });

  it("says where every figure comes from and when", () => {
    for (const country of costOfLiving.countries) {
      assert.match(country.source, /household survey mean \(\d{4}\), price level \(\d{4}\)/, country.code);
      assert.match(country.referenceDate, /^\d{4}$/, country.code);
      assert.ok(country.surveyYear >= 2000, country.code);
    }
  });

  it("names every country in every language", () => {
    const table: Record<string, Record<string, string>> = names;
    for (const country of costOfLiving.countries) assert.ok(table[country.code]?.en && table[country.code]?.es, country.code);
  });

  it("leaves out a country the data lack, instead of inventing a figure", () => {
    assert.equal(countryCost("XX"), null);
  });
});

describe("the inflation rates on their own", () => {
  it("are every country's reference rate: else run scripts/inflation-rates.ts", () => {
    for (const [code, reference] of Object.entries(REFERENCE_INFLATION)) {
      assert.ok(isPriceCountry(code), code);
      assert.equal(referenceRate(code), reference.rate, code);
    }
    assert.deepEqual(Object.keys(rates.rates).sort(), Object.keys(REFERENCE_INFLATION).sort());
  });

  it("give the default country's rate for any other code", () => {
    assert.equal(isPriceCountry("XX"), false);
    assert.equal(referenceRate("XX"), referenceInflation("XX").rate);
    assert.equal(referenceRate("XX"), referenceRate(DEFAULT_PRICES_OF));
  });
});
