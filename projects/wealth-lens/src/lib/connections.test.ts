import { describe, expect, it } from "vitest";
import raw from "@/data/connections.json";
import { allConnections, connectionsData, parseConnections, targetCapital } from "./connections";
import { costOfLiving } from "./cost-of-living";

const codes = new Set(costOfLiving.countries.map((country) => country.code));
const nl = { homeCountry: "NL", housing: "rent" as const, custom: [] };
const byId = (list: ReturnType<typeof allConnections>) => new Map(list.map((item) => [item.id, item]));

describe("connections dataset", () => {
  it("has 25-40 own entries, each with a source and a reference date", () => {
    const count = connectionsData.live.length + connectionsData.buy.length;
    expect(count).toBeGreaterThanOrEqual(25);
    expect(count).toBeLessThanOrEqual(40);
    for (const item of [...connectionsData.live, ...connectionsData.buy]) {
      expect(item.source.length, item.id).toBeGreaterThan(20);
      expect(item.referenceDate, item.id).toMatch(/^\d{4}(-\d{2})?$/);
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
    // Same USD rate as the cost-of-living dataset.
    expect(connectionsData.usdPerEur).toBe(costOfLiving.conversion.usdPerEur);
  });

  it("fails loudly on bad entries", () => {
    const base = raw as unknown as { live: Record<string, unknown>[]; buy: Record<string, unknown>[] };
    const withBuy = (patch: Record<string, unknown>) => ({ ...base, buy: [{ ...base.buy[0], ...patch }] });
    expect(() => parseConnections(withBuy({ amount: -1 }), codes)).toThrow(/amount or monthsAt/);
    expect(() => parseConnections(withBuy({ source: "" }), codes)).toThrow(/source/);
    expect(() => parseConnections(withBuy({ referenceDate: "last year" }), codes)).toThrow(/referenceDate/);
    expect(() => parseConnections(withBuy({ amount: undefined, monthsAt: { countries: ["ZZ"], months: 3 } }), codes)).toThrow(
      /known country codes/,
    );
    expect(() => parseConnections({ ...base, buy: [base.buy[0], base.buy[0]] }, codes)).toThrow(/duplicate/);
    expect(() => parseConnections({ ...base, live: [{ ...base.live[0], share: 2 }] }, codes)).toThrow(/share/);
  });
});

describe("allConnections", () => {
  const list = allConnections(nl);
  const map = byId(list);

  it("lists life items, every other country and the purchases", () => {
    expect(list.filter((item) => item.group === "life")).toHaveLength(4);
    expect(list.filter((item) => item.group === "country")).toHaveLength(costOfLiving.countries.length - 1);
    expect(map.has("country:NL")).toBe(false); // home is "Stop working"
    expect(list.filter((item) => item.group === "buy")).toHaveLength(connectionsData.buy.length);
  });

  it("works out life items from the home country: the Netherlands, renting", () => {
    // NL: EUR 1,020 without rent, EUR 2,190 with rent.
    expect(map.get("life:rent")?.amount).toBe(1170);
    expect(map.get("life:four-days")?.amount).toBe(440); // 20% of 2,190, to the nearest 10
    expect(map.get("life:half-time")?.amount).toBe(1100);
    expect(map.get("life:stop-working")?.amount).toBe(2190);
    expect(map.get("country:IN")).toMatchObject({ name: "Live in India", kind: "live", amount: 330 });
  });

  it("derives purchases from living costs", () => {
    expect(map.get("buy:sabbatical")?.amount).toBe(12 * 2190);
    expect(map.get("buy:cushion")?.amount).toBe(6 * 2190);
    // Thailand 770, Vietnam 620, Indonesia 510, Malaysia 710, Philippines 600 → 642/month.
    expect(map.get("buy:southeast-asia")?.amount).toBe(7700);
    expect(map.get("buy:masters-nl")?.amount).toBe(12 * 2190 + 2601);
    expect(map.get("buy:three-months-japan")?.amount).toBe(3 * 1060);
  });

  it("follows the user's country and housing", () => {
    const owner = byId(allConnections({ homeCountry: "PE", housing: "own", custom: [] }));
    expect(owner.has("life:rent")).toBe(false);
    expect(owner.get("life:stop-working")?.amount).toBe(470); // Peru without rent
    expect(owner.get("country:IN")?.amount).toBe(250);
    expect(owner.has("country:NL")).toBe(true);
    expect(owner.has("country:PE")).toBe(false);
    // Abroad you rent, even if you own at home.
    expect(owner.get("buy:six-months-portugal")?.amount).toBe(6 * 1410);
  });

  it("puts the user's own connections first", () => {
    const custom = [{ id: "a1", name: "Boat", kind: "buy" as const, amount: 12000 }];
    const [first] = allConnections({ ...nl, custom });
    expect(first).toMatchObject({ id: "custom:a1", kind: "buy", group: "custom", name: "Boat", amount: 12000 });
  });
});

describe("targetCapital", () => {
  it("is the yearly cost ÷ withdrawal rate for living, the price for buying", () => {
    expect(targetCapital({ kind: "live", amount: 330 }, 0.04)).toBeCloseTo(99_000, 6);
    expect(targetCapital({ kind: "live", amount: 330 }, 0.03)).toBeCloseTo(132_000, 6);
    expect(targetCapital({ kind: "buy", amount: 24_326 }, 0.04)).toBe(24_326);
  });
});
