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

  it("assumes nothing about the user's life: no items priced from a home country", () => {
    expect("live" in raw).toBe(false);
    const ids = connectionsData.buy.map((item) => item.id);
    expect(ids).not.toContain("cushion");
    expect(ids).not.toContain("sabbatical");
    // Names describe the thing, not the user's life: no "your roof", "your home".
    for (const item of connectionsData.buy) expect(item.name, item.id).not.toMatch(/\byour?\b/i);
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
    // Same USD rate as the cost-of-living dataset.
    expect(connectionsData.usdPerEur).toBe(costOfLiving.conversion.usdPerEur);
  });

  it("fails loudly on bad entries", () => {
    const base = raw as unknown as { buy: Record<string, unknown>[] };
    const withBuy = (patch: Record<string, unknown>) => ({ ...base, buy: [{ ...base.buy[0], ...patch }] });
    expect(() => parseConnections(withBuy({ amount: -1 }), codes)).toThrow(/amount or monthsAt/);
    expect(() => parseConnections(withBuy({ source: "" }), codes)).toThrow(/source/);
    expect(() => parseConnections(withBuy({ referenceDate: "last year" }), codes)).toThrow(/referenceDate/);
    expect(() => parseConnections(withBuy({ amount: undefined, monthsAt: { countries: ["ZZ"], months: 3 } }), codes)).toThrow(
      /known country codes/,
    );
    expect(() => parseConnections({ ...base, buy: [base.buy[0], base.buy[0]] }, codes)).toThrow(/duplicate/);
  });
});
