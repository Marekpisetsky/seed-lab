import { describe, expect, it } from "vitest";
import { parseIsoDate } from "./dates";
import { monthsToGoal, requiredMonthlyContribution } from "./finance";
import { INDEXES } from "./indexes";
import { buildReport, enoughFor, hasReport, shareOf, STOP_WORKING_ID, type ReportPlan } from "./report";
import type { Holding } from "./types";

const today = parseIsoDate("2026-09-29");
const sp500 = INDEXES.sp500.averageReturn;

const plan = (overrides: Partial<ReportPlan> = {}): ReportPlan => ({
  invested: 1000,
  monthlyContribution: 200,
  investment: { kind: "index", index: "sp500" },
  withdrawalRate: 0.04,
  inflation: 0.02,
  housing: "rent",
  homeCountry: "NL",
  mission: { kind: "live-abroad", country: "IN" },
  horizonYears: null,
  customConnections: [],
  ...overrides,
});

describe("the mission", () => {
  it("is the user's, for each kind", () => {
    const goal = (mission: ReportPlan["mission"]) => buildReport(plan({ mission }), [], today).goal;
    expect(goal({ kind: "stop-working" })).toMatchObject({ title: "Stop working in the Netherlands", status: { connection: { id: STOP_WORKING_ID } } });
    expect(goal({ kind: "stop-working" }).status.target).toBeCloseTo((2190 * 12) / 0.04, 6);
    expect(goal({ kind: "live-abroad", country: "PT" })).toMatchObject({ title: "Live in Portugal", status: { connection: { id: "country:PT" } } });
    expect(goal({ kind: "buy", item: "used-car" })).toMatchObject({ title: "A used car", status: { target: 24_326 } });
    expect(goal({ kind: "buy-own", name: "A boat", amount: 15_000 })).toMatchObject({ title: "A boat", status: { target: 15_000 } });
    expect(goal({ kind: "amount", amount: 100_000 })).toMatchObject({ title: "Reach €100,000", status: { target: 100_000 } });
  });

  it("never changes on its own, whatever the numbers", () => {
    // Before, the app picked a goal: stopping work, or the cheapest place not yet covered.
    for (const invested of [0, 1000, 120_000, 10_000_000]) {
      for (const monthlyContribution of [0, 200, 5000]) {
        const { goal } = buildReport(plan({ invested, monthlyContribution, mission: { kind: "live-abroad", country: "PT" } }), [], today);
        expect(goal.status.connection.id).toBe("country:PT");
      }
    }
  });

  it("living 'abroad' in the user's own country is stopping work there", () => {
    const { goal } = buildReport(plan({ mission: { kind: "live-abroad", country: "NL" } }), [], today);
    expect(goal.title).toBe("Live in the Netherlands");
    expect(goal.status.target).toBeCloseTo((2190 * 12) / 0.04, 6);
  });

  it("can only be built once the user has chosen one that the data still has", () => {
    expect(hasReport(plan({ mission: null } as never))).toBe(false);
    expect(hasReport(plan({ mission: { kind: "buy", item: "gone" } }))).toBe(false);
    expect(hasReport(plan({ mission: { kind: "live-abroad", country: "ZZ" } }))).toBe(false);
    expect(hasReport(plan())).toBe(true);
    expect(() => buildReport(plan({ mission: { kind: "buy", item: "gone" } }), [], today)).toThrow(RangeError);
  });

  it("follows a lower withdrawal rate, which needs more capital", () => {
    const report = buildReport(plan({ withdrawalRate: 0.03 }), [], today);
    expect(report.goal.status.target).toBeCloseTo(132_000, 6);
  });

  it("gets there as the formula says", () => {
    const report = buildReport(plan(), [], today);
    expect(report.answer.months).toBeCloseTo(monthsToGoal(1000, 200, sp500, 99_000), 9);
  });
});

describe("the headline", () => {
  it("answers with today's income, when, and what it means", () => {
    const { headline, answer } = buildReport(plan(), [], today);
    expect(headline.lead).toBe("Today your money pays");
    expect(headline.today.text).toBe("€3/month"); // 1,000 × 4% ÷ 12 = 3.33
    expect(headline.future?.when.text).toBe(`${Math.round(answer.months / 12)} years`);
    expect(headline.future?.value.text).toBe("€330/month");
    expect(headline.meaning).toBe("enough to live in India");
  });

  it("explains where every number comes from", () => {
    const { headline } = buildReport(plan(), [], today);
    expect(headline.today.explain.join(" ")).toMatch(/€1,000 invested.*× 4% taken out a year ÷ 12 = €3 a month/);
    expect(headline.future?.when.explain.join(" ")).toMatch(/€1,000 now \+ €200 a month.*S&P 500.*reaches €99,000/);
    expect(headline.future?.value.explain.join(" ")).toMatch(/€99,000 × 4% ÷ 12 = €330 a month.*Numbeo/);
  });

  it("says when the goal is already covered", () => {
    const { headline } = buildReport(plan({ invested: 120_000, mission: { kind: "live-abroad", country: "IN" } }), [], today);
    expect(headline.future).toBeNull();
    expect(headline.meaning).toBe("already enough to live in India");
  });

  it("says when it cannot get there, and what would get there in 20 and 30 years", () => {
    const { headline, answer } = buildReport(plan({ invested: 0, monthlyContribution: 0, mission: { kind: "live-abroad", country: "IN" } }), [], today);
    expect(answer).toMatchObject({ months: Infinity, reachable: false });
    expect(headline.future).toBeNull();
    expect(headline.meaning).toBe("not reachable at this pace");
    expect(headline.instead?.map((option) => option.years)).toEqual([20, 30]);
    const in20 = requiredMonthlyContribution(0, sp500, 240, 99_000);
    expect(headline.instead?.[0].monthly.text).toBe(`€${Math.round(in20).toLocaleString("en-US")}/month`);
    expect(headline.instead?.[0].monthly.explain[0]).toBe(`€0 now + €${Math.round(in20).toLocaleString("en-US")} a month for 20 years,`);
  });

  it("does not quote a date more than 60 years away", () => {
    // EUR 1,000 + EUR 1 a month: India (EUR 99,000) takes about 62 years.
    const { headline, answer } = buildReport(plan({ monthlyContribution: 1, mission: { kind: "live-abroad", country: "IN" } }), [], today);
    expect(answer.months).toBeGreaterThan(60 * 12);
    expect(Number.isFinite(answer.months)).toBe(true);
    expect(answer.reachable).toBe(false);
    expect(headline.future).toBeNull();
    expect(headline.meaning).toBe("not reachable at this pace");
    // Each alternative really gets there on time.
    for (const option of headline.instead ?? []) {
      const monthly = requiredMonthlyContribution(1000, sp500, option.years * 12, 99_000);
      expect(monthsToGoal(1000, monthly, sp500, 99_000)).toBeCloseTo(option.years * 12, 6);
    }
  });

  it("is reachable up to exactly 60 years", () => {
    const { answer } = buildReport(plan(), [], today);
    expect(answer.reachable).toBe(true);
    expect(answer.months).toBeLessThanOrEqual(60 * 12);
  });

  it("talks about money to spend for a purchase", () => {
    const { headline } = buildReport(plan({ mission: { kind: "buy", item: "used-car" } }), [], today);
    expect(headline.lead).toBe("Today you have");
    expect(headline.today.text).toBe("€1,000");
    expect(headline.future?.value.text).toBe("€24,326");
    expect(headline.meaning).toBe("enough for a used car");
  });

  it("calls an amount of one's own 'your target'", () => {
    const { headline } = buildReport(plan({ mission: { kind: "amount", amount: 100_000 } }), [], today);
    expect(headline.lead).toBe("Today you have");
    expect(headline.future?.value.text).toBe("€100,000");
    expect(headline.meaning).toBe("your target");
  });

  it("looks a fixed number of years ahead when asked, with how far along that is", () => {
    const report = buildReport(plan({ horizonYears: 10 }), [], today);
    expect(report.answer.mode).toBe("horizon");
    expect(report.headline.future?.when.text).toBe("10 years");
    expect(report.answer.progress).toBeLessThan(1);
    expect(report.headline.meaning).toBe(`${Math.round(report.answer.progress * 100)}% of what you need to live in India`);
    const later = buildReport(plan({ horizonYears: 35 }), [], today);
    expect(later.headline.meaning).toBe("enough to live in India");
  });
});

describe("enoughFor / shareOf", () => {
  const live = { id: "life:rent", kind: "live" as const, group: "life" as const, name: "Pay your rent", amount: 1170, source: "", referenceDate: "" };
  const buy = { id: "buy:e-bike", kind: "buy" as const, group: "buy" as const, name: "An e-bike", amount: 2872, source: "", referenceDate: "" };
  const custom = { ...buy, id: "custom:x", group: "custom" as const, name: "Boat" };

  it("reads naturally for each kind", () => {
    expect(enoughFor(live)).toBe("enough to pay your rent");
    expect(enoughFor(buy)).toBe("enough for an e-bike");
    expect(enoughFor(custom)).toBe("enough for Boat");
    expect(shareOf(live, 0.58)).toBe("58% of what you need to pay your rent");
    expect(shareOf(buy, 0.4)).toBe("40% of the price of an e-bike");
    const amount = { ...buy, id: "mission:amount", group: "mission" as const, name: "Reach €100,000", amount: 100_000 };
    expect(enoughFor(amount)).toBe("your target");
    expect(shareOf(amount, 0.4)).toBe("40% of your €100,000 target");
  });
});

describe("a purchase as the mission", () => {
  it("shows the money left and how much later stopping work comes", () => {
    const report = buildReport(plan({ mission: { kind: "buy", item: "used-car" } }), [], today);
    const purchase = report.purchase;
    expect(purchase).not.toBeNull();
    expect(purchase?.before).toBe(24_326);
    expect(purchase?.after).toBe(0);
    // Always stopping work, never a milestone the app picks.
    expect(purchase?.milestone?.connection.id).toBe(STOP_WORKING_ID);
    // Starting over from zero after buying delays it.
    expect(purchase?.delayMonths).toBeGreaterThan(12);
    // The price, left invested until then, grows.
    expect(purchase?.forgone).toBeGreaterThan(24_326);
  });

  it("buys at once when the money is already there", () => {
    const purchase = buildReport(plan({ invested: 50_000, mission: { kind: "buy", item: "used-car" } }), [], today).purchase;
    expect(purchase).toMatchObject({ buyMonths: 0, before: 50_000 });
    expect(purchase?.after).toBeCloseTo(50_000 - 24_326, 6);
  });

  it("is only worked out for a purchase", () => {
    expect(buildReport(plan(), [], today).purchase).toBeNull();
    expect(buildReport(plan({ mission: { kind: "amount", amount: 30_000 } }), [], today).purchase).toBeNull();
    expect(buildReport(plan({ mission: { kind: "buy-own", name: "A boat", amount: 15_000 } }), [], today).purchase).not.toBeNull();
    expect(buildReport(plan({ mission: { kind: "live-abroad", country: "PT" } }), [], today).purchase).toBeNull();
  });
});

describe("capital", () => {
  it("comes from priced euro holdings when there are any", () => {
    const holdings: Holding[] = [
      { id: "1", ticker: "VWCE", quantity: 100, costBasis: 12_000, currency: "EUR", currentPrice: 150, priceSource: "manual", priceDate: null },
    ];
    const report = buildReport(plan({ invested: 1000 }), holdings, today);
    expect(report.capital).toEqual({ amount: 15_000, source: "holdings" });
    expect(report.headline.today.explain[0]).toBe("€15,000 in your holdings (euros only)");
  });
});
