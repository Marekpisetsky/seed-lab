import { describe, expect, it } from "vitest";
import { MAX_MONTHS, monthsTo, pricedItems, type Scenario } from "./calculator";
import { LIVE_ABROAD, MEDIUM_WITHIN_YEARS, pick, SHORT_WITHIN_YEARS, wishesFor } from "./wishes";

/** A plan in today's euros: what is there, what goes in a month, growth after rising prices, 4% taken out a year. */
const plan = (capital: number, monthly: number, realReturn = 0.05): Scenario => ({ capital, monthly, realReturn, withdrawalRate: 0.04 });
const ids = (scenario: Scenario, country = "NL") => wishesFor(scenario, country).map((wish) => (wish.item ? wish.item.id : wish.goal));

describe("picking a wish", () => {
  const a = { amount: 100, months: 10 };
  const b = { amount: 300, months: 30 };
  const c = { amount: 900, months: 90 };

  it("takes the dearest reached soon enough", () => {
    expect(pick([a, b, c], 36)).toBe(b);
    expect(pick([a, b, c], 120)).toBe(c);
  });

  it("takes the cheapest when none is reached soon enough, and none never reached", () => {
    expect(pick([b, c], 12)).toBe(b);
    expect(pick([{ amount: 5, months: MAX_MONTHS + 1 }, c], 12)).toBe(c);
    expect(pick([{ amount: 5, months: Infinity }], 12)).toBeNull();
  });
});

describe("With this you could", () => {
  it("names a trip soon: the dearest the plan reaches within 3 years", () => {
    // €1,100 and €100 a month: Japan (≈ €2,330) in about a year, the dearest of the three trips.
    const [trip] = wishesFor(plan(1100, 100));
    expect(trip).toMatchObject({ horizon: "short", item: { id: "trip-japan" }, goal: { kind: "buy", item: "trip-japan" } });
    expect(trip.months).toBeLessThanOrEqual(SHORT_WITHIN_YEARS * 12);
    expect(trip.months).toBeCloseTo(monthsTo(plan(1100, 100), 2330), 9);
  });

  it("or, when no trip is that close, the cheapest one, with when it comes", () => {
    // €10 a month: a weekend in a capital (€448) takes more than 3 years.
    const [trip] = wishesFor(plan(0, 10));
    expect(trip.item?.id).toBe("weekend-capital");
    expect(trip.months).toBeGreaterThan(SHORT_WITHIN_YEARS * 12);
  });

  it("names something bigger: the dearest of a home deposit or a car within 15 years", () => {
    // Within 15 years €1,100 and €100 a month become about €28,800: a used car, not yet a new one.
    expect(ids(plan(1100, 100))[1]).toBe("used-car");
    // €10,000 and €500 a month: a deposit on a Dutch home (€75,616) is within 15 years.
    const [, medium] = wishesFor(plan(10_000, 500));
    expect(medium.item?.id).toBe("home-deposit");
    expect(medium.months).toBeLessThanOrEqual(MEDIUM_WITHIN_YEARS * 12);
    // At Spain's prices a new car (€44,419) costs more than the deposit (€35,680): by price, not by what matters more.
    expect(wishesFor(plan(10_000, 500), "ES")[1]).toMatchObject({ item: { id: "new-car", amount: 44419, country: "ES" } });
  });

  it("names stopping work at home when the plan gets there within 60 years", () => {
    const long = wishesFor(plan(10_000, 500)).at(-1);
    // €2,190 a month in the Netherlands with rent × 12 ÷ 4% = €657,000.
    expect(long).toMatchObject({ horizon: "long", item: null, amount: 2190, target: 657_000, goal: { kind: "live", country: "NL", housing: true, stopWorking: true } });
  });

  it("or living somewhere cheaper where many Europeans go: the dearest the plan reaches", () => {
    // €1,100 and €100 a month never reach €657,000 in 60 years; Spain's €432,000 just in time.
    const long = wishesFor(plan(1100, 100)).at(-1);
    expect(long?.goal).toEqual({ kind: "live", country: "ES", housing: true });
    expect(long?.months).toBeLessThanOrEqual(MAX_MONTHS);
    // With Spain's prices, stopping work in Spain is the long wish.
    expect(wishesFor(plan(1100, 100), "ES").at(-1)?.goal).toEqual({ kind: "live", country: "ES", housing: true, stopWorking: true });
    expect(LIVE_ABROAD).toEqual(["PT", "ES", "TH", "PE"]);
  });

  it("covers three horizons, each with when, and leaves out what never comes", () => {
    for (const scenario of [plan(1100, 100), plan(10_000, 500), plan(0, 50), plan(250_000, 0)]) {
      const wishes = wishesFor(scenario);
      expect(wishes.map((wish) => wish.horizon)).toEqual(["short", "medium", "long"]);
      for (const wish of wishes) expect(wish.months).toBeLessThanOrEqual(MAX_MONTHS);
    }
    // €1 a month: only the weekend away comes within 60 years.
    expect(wishesFor(plan(0, 1)).map((wish) => wish.horizon)).toEqual(["short"]);
    expect(wishesFor(plan(0, 0))).toEqual([]);
  });

  it("depends on the plan and the prices only: the same numbers, the same wishes", () => {
    expect(ids(plan(5000, 200))).toEqual(ids(plan(5000, 200)));
    // Already there: a deposit the money already pays is "now".
    const rich = wishesFor(plan(100_000, 0));
    expect(rich[0].months).toBe(0);
    expect(rich[1]).toMatchObject({ item: { id: "home-deposit" }, months: 0 });
  });

  it("only offers things listed for the country of the prices", () => {
    // No new car is priced for Portugal: its wish is a deposit or a used car.
    for (const scenario of [plan(1100, 100), plan(10_000, 500), plan(0, 30)]) {
      const medium = wishesFor(scenario, "PT").find((wish) => wish.horizon === "medium");
      expect(["home-deposit", "used-car"]).toContain(medium?.item?.id);
    }
    expect(pricedItems("PT").some((item) => item.id === "new-car")).toBe(false);
  });
});
