import { describe, expect, it } from "vitest";
import raw from "@/data/cost-of-living.json";
import estimatedRaw from "@/data/estimated-countries.json";
import names from "@/data/country-names.json";
import { costOfLiving, countryByCode, DEFAULT_PRICES_OF, ESTIMATE_METHOD, parseDataset, referenceInflation, REGIONS } from "./cost-of-living";

const detailed = costOfLiving.countries.filter((country) => country.method === "detailed");
const estimated = costOfLiving.countries.filter((country) => country.method === "estimated");
const roundTo10 = (value: number) => Math.round(value / 10) * 10;

describe("cost-of-living dataset", () => {
  it("has the 30 detailed countries and over 150 in all, across every region, including Peru", () => {
    expect(detailed).toHaveLength(30);
    expect(costOfLiving.countries.length).toBeGreaterThanOrEqual(150);
    for (const region of REGIONS) {
      expect(costOfLiving.countries.some((country) => country.region === region), region).toBe(true);
    }
    expect(detailed.map((country) => country.name)).toContain("Peru");
  });

  it("names every country in every language", () => {
    for (const country of costOfLiving.countries) {
      expect((names as Record<string, { en: string; es: string }>)[country.code], country.code).toMatchObject({ en: expect.any(String), es: expect.any(String) });
    }
  });

  it("credits the sources of the detailed countries without publishing their own figures", () => {
    for (const country of detailed) {
      expect(country.source).toMatch(/^Numbeo \(without rent\) and Wise/);
      expect(country.source, country.name).not.toMatch(/USD|GBP|\/month/);
      expect(country.referenceDate).toMatch(/^\d{4}-\d{2}$/);
      expect(country.priceLevel).toBeNull();
    }
  });

  /** Every estimate is the Netherlands' figures × its price level (rent: × its square), rounded to 10. */
  it("estimates the other countries from their price level next to the Netherlands'", () => {
    const netherlands = countryByCode("NL");
    const rent = (netherlands?.monthlyCostEur.withRent ?? 0) - (netherlands?.monthlyCostEur.withoutRent ?? 0);
    expect(ESTIMATE_METHOD.basket).toEqual({ country: "NL", withoutRent: netherlands?.monthlyCostEur.withoutRent, rent });
    expect(ESTIMATE_METHOD.rentExponent).toBe(2);
    for (const country of estimated) {
      const ratio = country.priceLevel?.ratio ?? NaN;
      const withoutRent = roundTo10(ESTIMATE_METHOD.basket.withoutRent * ratio);
      expect(country.monthlyCostEur, country.name).toEqual({ withoutRent, withRent: withoutRent + Math.max(10, roundTo10(rent * ratio ** 2)) });
      expect(country.priceLevel?.year, country.name).toBeGreaterThanOrEqual(2021);
      expect(country.source).toMatch(/World Bank price level/);
      expect(country.referenceDate).toBe(netherlands?.referenceDate);
    }
    // Checked on the detailed countries: typical errors, said in How it works.
    expect(ESTIMATE_METHOD.medianError.withoutRent).toBeLessThan(0.15);
    expect(ESTIMATE_METHOD.medianError.withRent).toBeLessThan(0.25);
  });

  it("never estimates a detailed country, and says why a country with data is left out", () => {
    const codes = new Set(detailed.map((country) => country.code));
    expect(estimated.some((country) => codes.has(country.code))).toBe(false);
    for (const left of estimatedRaw.excluded) {
      expect(left.reason).toMatch(/inflation data|prices rose about \d+% a year/);
      expect(countryByCode(left.code)).toBeUndefined();
    }
    // Prices rising over 30% a year on average: a cost in euros from a price level would not hold.
    expect(estimatedRaw.excluded.map((left) => left.code)).toEqual(expect.arrayContaining(["AR", "ZW"]));
  });

  it("rejects malformed data", () => {
    const valid = raw as unknown as { countries: Record<string, unknown>[] };
    const withCountry = (patch: Record<string, unknown>) => ({
      ...valid,
      countries: [{ ...valid.countries[0], ...patch }],
    });
    expect(() => parseDataset({ ...valid, countries: [] })).toThrow(/no countries/);
    expect(() => parseDataset(withCountry({ region: "Mars" }))).toThrow(/unknown region/);
    expect(() => parseDataset(withCountry({ monthlyCostEur: { withoutRent: 500, withRent: 400 } }))).toThrow(
      /withRent must exceed/,
    );
    expect(() => parseDataset(withCountry({ referenceDate: "Sep 2026" }))).toThrow(/YYYY-MM/);
    expect(() => parseDataset({ ...valid, countries: [valid.countries[0], valid.countries[0]] })).toThrow(
      /duplicate/,
    );
    expect(() => parseDataset(withCountry({ inflation: { rate: 2, basis: "x", asOf: "2026-09" } }))).toThrow(/fraction/);
    expect(() => parseDataset(withCountry({ inflation: { rate: 0.02, basis: "", asOf: "2026-09" } }))).toThrow(/basis/);
    expect(() => parseDataset(withCountry({ inflation: undefined }))).toThrow(/inflation/);
  });
});

describe("reference inflation", () => {
  it("gives every country a rate, where it comes from and when it was checked", () => {
    for (const country of costOfLiving.countries) {
      expect(country.inflation.rate, country.name).toBeGreaterThanOrEqual(0);
      expect(country.inflation.rate, country.name).toBeLessThanOrEqual(0.3);
      expect(country.inflation.basis, country.name).toMatch(/target|average|range|objective/);
      expect(country.inflation.asOf, country.name).toBe("2026-09");
    }
    expect(costOfLiving.inflationNote).toMatch(/central bank/);
  });

  it("marks high inflation: prices that rose 10% a year or more on average in 2015–2024", () => {
    const high = costOfLiving.countries.filter((country) => country.inflation.recentAverage !== undefined);
    expect(high.length).toBeGreaterThan(0);
    for (const country of high) expect(country.inflation.recentAverage, country.name).toBeGreaterThanOrEqual(0.1);
    // A target far below recent inflation is still the target, as for every other central bank.
    expect(referenceInflation("TR")).toMatchObject({ rate: 0.05, recentAverage: expect.any(Number) });
    expect(referenceInflation("TR").recentAverage).toBeGreaterThan(0.2);
  });

  it("uses the ECB's 2% for the euro area's estimated countries too, Bulgaria included", () => {
    for (const code of ["AT", "BE", "BG", "CY", "EE", "FI", "HR", "LT", "LU", "LV", "MT", "SI", "SK"]) {
      expect(referenceInflation(code).rate, code).toBe(0.02);
      expect(referenceInflation(code).basis, code).toMatch(/European Central Bank/);
    }
  });

  it("is the ECB's 2% for every euro country, and each other central bank's own target", () => {
    for (const code of ["NL", "DE", "FR", "ES", "IT", "PT", "GR", "IE"]) {
      expect(referenceInflation(code).rate, code).toBe(0.02);
      expect(referenceInflation(code).basis, code).toMatch(/European Central Bank/);
    }
    expect(referenceInflation("US").rate).toBe(0.02);
    expect(referenceInflation("CH").rate).toBe(0.01);
    expect(referenceInflation("PL").rate).toBe(0.025);
    expect(referenceInflation("BR").rate).toBe(0.03);
    expect(referenceInflation("IN").rate).toBe(0.04);
  });

  it("starts with the Netherlands, and falls back to it for a code not on the list", () => {
    expect(DEFAULT_PRICES_OF).toBe("NL");
    expect(countryByCode("NL")?.name).toBe("Netherlands");
    expect(countryByCode("XX")).toBeUndefined();
    expect(referenceInflation("XX")).toEqual(referenceInflation("NL"));
  });
});
