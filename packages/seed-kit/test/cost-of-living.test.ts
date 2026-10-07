import assert from "node:assert/strict";
import { describe, it } from "node:test";
import names from "../src/data/country-names.json" with { type: "json" };
import { costOfLiving, countryByCode, parseDataset, referenceInflation } from "../src/cost-of-living.ts";
import { DEFAULT_PRICES_OF, isPriceCountry, referenceRate } from "../src/inflation-rates.ts";
import rates from "../src/data/inflation-rates.json" with { type: "json" };

describe("the cost-of-living data", () => {
  it("has 172 countries: 30 detailed and 142 estimated, each once", () => {
    const { countries } = costOfLiving;
    assert.equal(countries.length, 172);
    assert.equal(countries.filter((country) => country.method === "detailed").length, 30);
    assert.equal(countries.filter((country) => country.method === "estimated").length, 142);
    assert.equal(new Set(countries.map((country) => country.code)).size, 172);
  });

  it("says where every figure comes from and when, and which are estimates", () => {
    for (const country of costOfLiving.countries) {
      assert.ok(country.source.length > 0 && /^\d{4}-\d{2}$/.test(country.referenceDate), country.code);
      assert.equal(country.method === "estimated", country.priceLevel !== null, country.code);
      if (country.method === "estimated") assert.match(country.source, /World Bank price level \(\d{4}\)/, country.code);
    }
  });

  it("names every country in English and Spanish", () => {
    const table: Record<string, { en: string; es: string }> = names;
    for (const country of costOfLiving.countries) assert.ok(table[country.code]?.en && table[country.code]?.es, country.code);
  });

  it("costs more with housing than without, everywhere", () => {
    for (const { code, monthlyCostEur } of costOfLiving.countries) assert.ok(monthlyCostEur.withRent > monthlyCostEur.withoutRent && monthlyCostEur.withoutRent > 0, code);
    assert.equal(countryByCode("NL")?.method, "detailed");
  });

  it("refuses a bad edit instead of showing nonsense", () => {
    assert.throws(() => parseDataset({ countries: [] }), /no countries/);
  });
});

describe("the inflation rates on their own", () => {
  it("are every country's reference rate, the same as the whole dataset: else run scripts/inflation-rates.ts", () => {
    for (const country of costOfLiving.countries) {
      assert.ok(isPriceCountry(country.code), country.code);
      assert.equal(referenceRate(country.code), country.inflation.rate, country.code);
    }
    // No country of its own either.
    assert.deepEqual(Object.keys(rates.rates).sort(), costOfLiving.countries.map((country) => country.code).sort());
  });

  it("give the default country's rate for any other code, as the dataset does", () => {
    assert.equal(isPriceCountry("XX"), false);
    assert.equal(referenceRate("XX"), referenceInflation("XX").rate);
    assert.equal(referenceRate("XX"), referenceRate(DEFAULT_PRICES_OF));
  });
});
