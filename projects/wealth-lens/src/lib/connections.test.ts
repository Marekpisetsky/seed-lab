import { describe, expect, it } from "vitest";
import raw from "@/data/connections.json";
import { connectionsData, parseConnections } from "./connections";
import { costOfLiving } from "./cost-of-living";

const codes = new Set(costOfLiving.countries.map((country) => country.code));

describe("connections dataset", () => {
  it("has 15-30 purchases, each with a source and a reference date", () => {
    expect(connectionsData.buy.length).toBeGreaterThanOrEqual(15);
    expect(connectionsData.buy.length).toBeLessThanOrEqual(30);
    for (const item of connectionsData.buy) {
      expect(item.source.length, item.id).toBeGreaterThan(20);
      expect(item.referenceDate, item.id).toMatch(/^\d{4}(-\d{2})?$/);
    }
  });

  it("guesses only the country of the prices, which the user sees and changes", () => {
    expect("live" in raw).toBe(false);
    expect(connectionsData.priceCountries).toEqual(["NL", "ES", "DE", "FR", "IT", "PT"]);
    for (const item of connectionsData.buy) {
      // Names describe the thing, not the user's life: no "your roof", "your home".
      expect(item.name, item.id).not.toMatch(/\byour?\b/i);
      // A figure for each country always has the Netherlands', the prices shown when the browser's country has none.
      if (item.prices) expect(Object.keys(item.prices), item.id).toContain("NL");
      // A fee is needed in every country: a year at university is listed in all of them.
      if (item.monthsHome?.fees) expect(Object.keys(item.monthsHome.fees).sort(), item.id).toEqual([...connectionsData.priceCountries].sort());
    }
    const ids = connectionsData.buy.map((item) => item.id);
    expect(ids).not.toContain("cushion");
  });

  it("has examples for each area the line shows, each with its icon", () => {
    const by = (area: string) => connectionsData.buy.filter((item) => item.area === area).map((item) => item.id);
    expect(by("experiences")).toEqual(["weekend-capital", "month-southeast-asia", "trip-japan"]);
    expect(by("housing").sort()).toEqual(["home", "home-deposit"]);
    expect(by("time")).toEqual(["sabbatical"]);
    for (const item of connectionsData.buy) if (item.area) expect(item.icon, item.id).toBeTruthy();
  });

  it("names who published each country's figure, what it measures and when", () => {
    for (const item of connectionsData.buy) {
      for (const [country, price] of [...Object.entries(item.prices ?? {}), ...Object.entries(item.monthsHome?.fees ?? {})]) {
        const where = `${item.id} ${country}`;
        // Shown as it is in every language: a name, not an English sentence.
        expect(price.source, where).not.toMatch(/\b(the|of|and|average|price)\b/);
        expect(price.note.length, where).toBeGreaterThan(15);
        expect(price.referenceDate, where).toMatch(/^20\d\d(-\d\d)?$/);
      }
    }
  });

  it("says it is an estimate", () => {
    expect(raw.description).toMatch(/estimates/i);
  });

  /** Calculated amounts keep their inputs: recomputing them catches a bad edit. */
  it("recomputes every calculated amount from its published inputs", () => {
    const items = new Map(connectionsData.buy.map((item) => [item.id, item]));
    const lima = items.get("flat-lima");
    expect(lima?.calc).toEqual({ squareMetres: 80, pricePerSquareMetre: 1868, currency: "USD" });
    expect(lima?.amount).toBe(Math.round((80 * 1868) / connectionsData.usdPerEur / 10) * 10);
    // The BCRP index covers well-off districts only, and the entry says so.
    expect(lima?.name).toMatch(/upscale Lima/);
    expect(lima?.source).toMatch(/not all of Lima/);
    expect(items.get("flat-portugal")?.amount).toBe(80 * 2239);
    expect(items.get("home-deposit-nl")?.amount).toBe(0.1 * 480000);
    expect(items.get("home-nl")?.amount).toBe(480000);
    expect(items.get("small-business")?.amount).toBe(4 * 50000 * 0.35);
    // Two nights at Eurostat's €224 a night on short trips abroad.
    expect(items.get("weekend-capital")?.amount).toBe(2 * 224);
    // ¥392,251 at ¥169.04 to the euro, to the nearest €10.
    expect(items.get("trip-japan")?.amount).toBe(Math.round(392251 / 169.04 / 10) * 10);
    // A home: 80 m² at each country's price per m²; its deposit, 20% of it.
    for (const [country, price] of Object.entries(items.get("home")?.prices ?? {})) {
      const perM2 = Number(price.calc?.eurPerSquareMetre);
      expect(price.amount, country).toBe(80 * perM2);
      expect(items.get("home-deposit")?.prices?.[country]?.amount, country).toBe(Math.round(0.2 * 80 * perM2));
    }
    // Spain's university fees: €15.37 a credit × 60 credits.
    expect(items.get("study-year")?.monthsHome?.fees?.ES.amount).toBe(Math.round(15.37 * 60));
    // Same USD rate as the cost-of-living dataset.
    expect(connectionsData.usdPerEur).toBe(costOfLiving.conversion.usdPerEur);
  });

  it("fails loudly on bad entries", () => {
    const base = raw as unknown as { buy: Record<string, unknown>[] };
    const withBuy = (patch: Record<string, unknown>) => ({ ...base, buy: [{ ...base.buy[0], ...patch }] });
    expect(() => parseConnections(withBuy({ amount: -1 }), codes)).toThrow(/invalid amount/);
    expect(() => parseConnections(withBuy({ monthsAt: { countries: ["JP"], months: 1 } }), codes)).toThrow(/exactly one/);
    expect(() => parseConnections(withBuy({ country: "JP" }), codes)).toThrow(/country of the prices/);
    expect(() => parseConnections(withBuy({ area: "experiences" }), codes)).toThrow(/icon/);
    expect(() => parseConnections(withBuy({ area: "soon", icon: "plane" }), codes)).toThrow(/unknown area/);
    const noNetherlands = { amount: undefined, prices: { ES: { amount: 1, basis: "survey", source: "X", note: "A note long enough", referenceDate: "2025" } } };
    expect(() => parseConnections(withBuy(noNetherlands), codes)).toThrow(/no price for NL/);
    const badBasis = { amount: undefined, prices: { NL: { amount: 1, basis: "guess", source: "X", note: "A note long enough", referenceDate: "2025" } } };
    expect(() => parseConnections(withBuy(badBasis), codes)).toThrow(/basis/);
    expect(() => parseConnections(withBuy({ source: "" }), codes)).toThrow(/source/);
    expect(() => parseConnections(withBuy({ referenceDate: "last year" }), codes)).toThrow(/referenceDate/);
    expect(() => parseConnections(withBuy({ amount: undefined, monthsAt: { countries: ["ZZ"], months: 3 } }), codes)).toThrow(
      /known country codes/,
    );
    expect(() => parseConnections({ ...base, buy: [base.buy[0], base.buy[0]] }, codes)).toThrow(/duplicate/);
  });
});
