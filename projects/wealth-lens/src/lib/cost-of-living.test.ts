import { describe, expect, it } from "vitest";
import raw from "@/data/cost-of-living.json";
import { costOfLiving, parseDataset, REGIONS } from "./cost-of-living";

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
  });
});
