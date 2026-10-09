import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { COUNTRIES, OFFICIAL } from "../src/official/data.ts";
import { buildCurrencies, buildExchangeRates, firstWholeYear, NEW_CURRENCY_JUMP, RATES_FROM } from "../src/official/money-tables.ts";
import { valueIn } from "../src/official/series.ts";
import { convert, countryFromLanguage, currencyOf, EXCHANGE_RATES_SOURCE, latestSharedYear, ratePerDollar, RATED_CURRENCIES, roundMoney } from "../src/money.ts";

describe("the money tables the pages carry", () => {
  it("are what the official data give: else run npm run money-tables", () => {
    const currencies = JSON.parse(readFileSync(new URL("../src/data/currencies.json", import.meta.url), "utf8"));
    assert.deepEqual(currencies, buildCurrencies());
    const rates = JSON.parse(readFileSync(new URL("../src/data/exchange-rates.json", import.meta.url), "utf8"));
    assert.deepEqual(rates, buildExchangeRates());
  });

  it("give every country its own currency, as CLDR says, ISO 4217", () => {
    assert.equal(currencyOf("PE"), "PEN");
    assert.equal(currencyOf("NL"), "EUR");
    assert.equal(currencyOf("US"), "USD");
    assert.equal(currencyOf("EC"), "USD");
    assert.equal(currencyOf("XX"), null);
    for (const [code, info] of Object.entries(COUNTRIES)) if (info.currency) assert.match(currencyOf(code) ?? "", /^[A-Z]{3}$/, code);
  });

  it("give each currency the World Bank's yearly rate, from a country that uses it", () => {
    assert.equal(ratePerDollar("USD", 2024), 1);
    assert.equal(ratePerDollar("PEN", 2024), valueIn(OFFICIAL["wb-fx"].values.PE, 2024));
    assert.equal(ratePerDollar("EUR", 2024), valueIn(OFFICIAL["wb-fx"].values.DE, 2024));
    assert.ok((ratePerDollar("EUR", 2024) ?? 0) > 0.8 && (ratePerDollar("EUR", 2024) ?? 0) < 1);
    assert.ok(RATED_CURRENCIES.length > 120);
    // Only recent years: a page converts recent figures.
    assert.equal(ratePerDollar("EUR", RATES_FROM - 1), null);
  });

  it("never mix a currency with the one it replaced", () => {
    for (const currency of RATED_CURRENCIES) {
      const years = Object.keys(JSON.parse(readFileSync(new URL("../src/data/exchange-rates.json", import.meta.url), "utf8")).rates[currency]).map(Number);
      for (const year of years.slice(1)) {
        const ratio = (ratePerDollar(currency, year) ?? 1) / (ratePerDollar(currency, year - 1) ?? 1);
        if (ratePerDollar(currency, year - 1) !== null) assert.ok(ratio < NEW_CURRENCY_JUMP && ratio > 1 / NEW_CURRENCY_JUMP, `${currency} ${year}`);
      }
    }
    // A currency that began after the data's years has no rates of the one it replaced (CLDR's start date):
    // the bolívar soberano (2018) none of the bolívar fuerte's; the ouguiya of 2018 none of the old one's.
    assert.equal(ratePerDollar("VES", 2017), null);
    assert.equal(ratePerDollar("MRU", 2017), null);
    assert.equal(ratePerDollar("SLE", 2022), null);
    assert.equal(firstWholeYear("2018-08-20"), 2019);
    assert.equal(firstWholeYear("2023-01-01"), 2023);
    assert.equal(firstWholeYear(null), Number.NEGATIVE_INFINITY);
    // The euro took Germany's rates, not Croatia's kuna or Bulgaria's lev.
    for (let year = RATES_FROM; year <= 2024; year += 1) assert.ok((ratePerDollar("EUR", year) ?? 0) < 1, String(year));
  });

  it("say where they come from", () => {
    assert.equal(EXCHANGE_RATES_SOURCE.license, "CC-BY-4.0");
    assert.match(EXCHANGE_RATES_SOURCE.url, /PA\.NUS\.FCRF/);
  });
});

describe("a conversion", () => {
  it("uses one year's rates for both currencies, and says which", () => {
    const pen = convert(100, "EUR", "PEN", 2024);
    assert.ok(pen);
    assert.equal(pen.year, 2024);
    assert.ok(Math.abs(pen.value - (100 * (ratePerDollar("PEN", 2024) ?? 0)) / (ratePerDollar("EUR", 2024) ?? 1)) < 1e-9);
    // Back again: the same amount.
    assert.ok(Math.abs((convert(pen.value, "PEN", "EUR", 2024)?.value ?? 0) - 100) < 1e-9);
    assert.deepEqual(convert(5, "EUR", "EUR", 2024), { value: 5, year: 2024, rate: 1 });
  });

  it("takes the latest shared year when none is given, and the nearest one when the year has no rate", () => {
    const latest = latestSharedYear("EUR", "PEN");
    assert.ok(latest !== null && latest >= 2024);
    assert.equal(convert(1, "EUR", "PEN")?.year, latest);
    assert.equal(convert(1, "EUR", "PEN", 1990)?.year, RATES_FROM);
    assert.equal(convert(1, "EUR", "XXX"), null);
  });
});

describe("rounding a cost", () => {
  it("is as fine as the data: units under 95, tens under 10,000, three figures above", () => {
    assert.deepEqual([roundMoney(23.6), roundMoney(0.2), roundMoney(94.4), roundMoney(214), roundMoney(9876), roundMoney(245_678), roundMoney(1_234_567)], [24, 1, 94, 210, 9880, 246_000, 1_230_000]);
  });
});

describe("the country a tool starts with", () => {
  it("is the one the browser's language names, if the tool has it", () => {
    const supported = ["NL", "ES", "MX", "US", "GB"];
    assert.equal(countryFromLanguage("es-MX", supported, "NL"), "MX");
    assert.equal(countryFromLanguage("en-GB", supported, "NL"), "GB");
    assert.equal(countryFromLanguage("en", supported, "NL"), "US");
    assert.equal(countryFromLanguage("pt-BR", supported, "NL"), "NL");
  });
});
