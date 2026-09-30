import { describe, expect, it } from "vitest";
import raw from "@/data/cost-of-living.json";
import { costOfLiving, countryByCode, DEFAULT_PRICES_OF, parseDataset, referenceInflation, REGIONS } from "./cost-of-living";

describe("cost-of-living dataset", () => {
  it("has 25-30 countries across every region, including Peru", () => {
    const { countries } = costOfLiving;
    expect(countries.length).toBeGreaterThanOrEqual(25);
    expect(countries.length).toBeLessThanOrEqual(30);
    for (const region of REGIONS) {
      expect(countries.some((country) => country.region === region)).toBe(true);
    }
    expect(countries.map((country) => country.name)).toContain("Peru");
  });

  it("gives every entry a source and a reference date", () => {
    for (const country of costOfLiving.countries) {
      expect(country.source).toMatch(/Numbeo/);
      expect(country.referenceDate).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  /**
   * Each source string quotes the original figures and currencies. Converting
   * them again with the dataset's own rates must give the stored EUR values,
   * so a hand edit that breaks the link is caught.
   */
  it("matches the quoted source figures after conversion to EUR", () => {
    const { usdPerEur, gbpPerEur } = costOfLiving.conversion;
    const toEur = (value: number, currency: string) =>
      currency === "EUR" ? value : currency === "USD" ? value / usdPerEur : value / gbpPerEur;
    const roundTo10 = (value: number) => Math.round(value / 10) * 10;

    for (const country of costOfLiving.countries) {
      const figures = [...country.source.matchAll(/([\d,]+(?:\.\d+)?) (EUR|USD|GBP)\/month/g)].map(
        ([, amount, currency]) => toEur(Number(amount.replace(/,/g, "")), currency),
      );
      expect(figures, country.name).toHaveLength(2);
      const [withoutRent, rent] = figures;
      expect(country.monthlyCostEur.withoutRent, country.name).toBe(roundTo10(withoutRent));
      expect(country.monthlyCostEur.withRent, country.name).toBe(roundTo10(withoutRent) + roundTo10(rent));
    }
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
      expect(country.inflation.rate, country.name).toBeLessThanOrEqual(0.1);
      expect(country.inflation.basis, country.name).toMatch(/target|average|range/);
      expect(country.inflation.asOf, country.name).toBe("2026-09");
    }
    expect(costOfLiving.inflationNote).toMatch(/central bank/);
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
