import { describe, expect, it } from "vitest";
import { calculate, MAX_MONTHS, monthsTo, pricedItems, type CalculatorPlan, type Scenario } from "./calculator";
import { parseIsoDate } from "./dates";
import { STANDARD_ASSUMPTIONS, type Goal } from "./types";
import { LINE_AREAS, MAX_WISHES, pick, wishesFor } from "./wishes";

/** A plan in today's euros: what is there, what goes in a month, growth after rising prices, 4% taken out a year. */
const plan = (capital: number, monthly: number, realReturn = 0.05): Scenario => ({ capital, monthly, realReturn, withdrawalRate: 0.04 });
/** What each wish is: a thing of the list, living without working, or a goal of the person's own. */
const ids = (scenario: Scenario, years: number, country = "NL") => wishesFor(scenario, years, [], country).map((wish) => wish.item?.id ?? wish.goal?.kind);

describe("picking an example", () => {
  const a = { target: 100, months: 10 };
  const b = { target: 300, months: 30 };
  const c = { target: 900, months: 90 };

  it("takes the dearest the plan reaches by the end of its years", () => {
    expect(pick([a, b, c], 36)).toBe(b);
    expect(pick([a, b, c], 120)).toBe(c);
  });

  it("takes the cheapest when none comes within the plan's years, and none never reached", () => {
    expect(pick([b, c], 12)).toBe(b);
    expect(pick([{ target: 5, months: MAX_MONTHS + 1 }, c], 12)).toBe(c);
    expect(pick([{ target: 5, months: Infinity }], 12)).toBeNull();
  });
});

describe("With this you could", () => {
  it("shows one example from each area: an experience, a home and time, in that order", () => {
    expect(LINE_AREAS).toEqual(["experiences", "housing", "time"]);
    // €20,000 and €400 a month for 20 years at Dutch prices: Japan now; a deposit on a Dutch home (€75,616); a year off work.
    expect(ids(plan(20_000, 400), 20)).toEqual(["trip-japan", "home-deposit", "sabbatical"]);
    // At Spain's prices the whole 80 m² home (€178,400) comes within the 20 years.
    expect(ids(plan(20_000, 400), 20, "ES")).toEqual(["trip-japan", "home", "sabbatical"]);
  });

  it("lets the plan's own years set how far: no fixed short, medium or long", () => {
    // €10,000 and €500 a month: living without working in the Netherlands (€657,000) comes in about 34 years.
    const freedom = monthsTo(plan(10_000, 500), (2190 * 12) / 0.04);
    expect(freedom).toBeGreaterThan(20 * 12);
    expect(freedom).toBeLessThan(40 * 12);
    expect(ids(plan(10_000, 500), 20).at(-1)).toBe("sabbatical");
    expect(ids(plan(10_000, 500), 40).at(-1)).toBe("freedom");
    // A trip: the dearest within the plan's years; within 1 year only the weekend in a capital (€448) comes.
    expect(ids(plan(0, 50), 1)[0]).toBe("weekend-capital");
  });

  it("takes the cheapest example of an area, with its date, when none comes within the plan's years", () => {
    // €10 a month for 3 years: no trip yet; the weekend in a capital (€448) comes in about 4 years.
    const [trip] = wishesFor(plan(0, 10), 3);
    expect(trip.item?.id).toBe("weekend-capital");
    expect(trip.months).toBeGreaterThan(3 * 12);
    // An example that never comes within 60 years is left out: €1 a month reaches only the weekend away.
    expect(ids(plan(0, 1), 20)).toEqual(["weekend-capital"]);
    expect(wishesFor(plan(0, 0), 20)).toEqual([]);
  });

  it("prices living without working where the prices are from, rent included, and adds it as the person's priority", () => {
    const freedom = wishesFor(plan(100_000, 1000), 30, [], "ES").find((wish) => wish.goal?.kind === "freedom");
    // €1,440 a month in Spain with rent × 12 ÷ 4% = €432,000.
    expect(freedom).toMatchObject({ area: "time", monthly: true, amount: 1440, target: 432_000 });
    expect(freedom?.goal).toEqual({ kind: "freedom", amount: 1440, country: "ES", estimateDate: "2026-09", important: true });
  });

  it("puts the person's own priorities first, and examples only for the areas they leave open", () => {
    const today = parseIsoDate("2026-10-07");
    const base: CalculatorPlan = {
      invested: 20_000,
      monthlyContribution: 400,
      investment: { kind: "custom" },
      years: 20,
      withdrawalRate: 0.04,
      pricesOf: "NL",
      assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.05 },
      goals: [],
    };
    const goals: Goal[] = [
      { id: "mine", kind: "amount", amount: 50_000, label: "A boat", important: true },
      { id: "car", kind: "buy", item: "used-car" },
      { id: "home", kind: "buy", item: "home-deposit", important: true },
    ];
    const calc = calculate({ ...base, goals }, [], today);
    const wishes = wishesFor(calc.scenario, 20, calc.goals);
    // Their two priorities, in their order (a goal not marked as one is not a wish here), then the first open area: an experience.
    expect(wishes.map((wish) => wish.key)).toEqual(["mine", "home", "example:trip-japan"]);
    expect(wishes[0]).toMatchObject({ own: { goal: goals[0] }, months: calc.goals[0].months });
    expect(wishes).toHaveLength(MAX_WISHES);
  });

  it("only offers things listed for the country of the prices", () => {
    for (const country of ["NL", "ES", "DE", "FR", "IT", "PT"]) {
      const listed = new Set(pricedItems(country).map((item) => item.id));
      for (const wish of wishesFor(plan(20_000, 400), 20, [], country)) if (wish.item) expect(listed.has(wish.item.id), `${country} ${wish.item.id}`).toBe(true);
    }
  });

  it("depends on the plan, its goals and the prices only", () => {
    expect(ids(plan(5000, 200), 15)).toEqual(ids(plan(5000, 200), 15));
    // Already there: a trip the money already pays is "now".
    expect(wishesFor(plan(100_000, 0), 10)[0].months).toBe(0);
  });
});
