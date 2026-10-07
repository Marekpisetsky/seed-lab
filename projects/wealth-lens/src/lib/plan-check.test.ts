import { describe, expect, it } from "vitest";
import { ADVICE, plainLanguageProblems } from "@seed-kit/plain-language.ts";
import { EN, getI18n } from "@/i18n";
import { checkWords } from "@/i18n/check-text";
import { priceHoldings } from "./auto-price";
import { calculate, type CalculatorPlan } from "./calculator";
import { parseIsoDate } from "./dates";
import { futureValueWithContributions } from "./finance";
import { INDEXES } from "./indexes";
import { mixStock } from "./mix";
import { CHECK_ORDER, concentrationCheck, horizonCheck, planChecks, savingsCheck, SHORT_YEARS, type PlanCheck } from "./plan-check";
import { FUTURES, samplesFor } from "./projections";
import { STANDARD_ASSUMPTIONS, type Goal, type Holding, type Investment } from "./types";

const ES = getI18n("es");
const today = parseIsoDate("2026-10-07");

const plan = (overrides: Partial<CalculatorPlan> = {}): CalculatorPlan => ({
  invested: 10_000,
  monthlyContribution: 200,
  investment: { kind: "asset", asset: "sp500" },
  years: 20,
  withdrawalRate: 0.04,
  pricesOf: "NL",
  assumptions: STANDARD_ASSUMPTIONS,
  goals: [],
  ...overrides,
});

const holding = (ticker: string, quantity: number, price: number, currency = "EUR"): Holding => ({
  id: ticker,
  ticker,
  quantity,
  costBasis: quantity * price,
  currency,
  currentPrice: price,
  priceSource: "manual",
  priceDate: null,
});

const checksOf = (overrides: Partial<CalculatorPlan> = {}, holdings: Holding[] = []) => {
  const p = plan(overrides);
  const priced = priceHoldings(holdings);
  return planChecks(calculate(p, priced, today), p, priced);
};

/** A mix with one stock at `weight` percent, the rest world stocks. */
const withStock = (weight: number): Investment => {
  const nvda = mixStock("NVDA");
  if (!nvda) throw new Error("NVDA is on the list");
  return { kind: "mix", rebalance: true, parts: [{ asset: "world", weight: 100 - weight }, { asset: nvda.index, weight, stock: "NVDA" }] };
};

describe("few years, money that moves", () => {
  it("counts the possible futures that end below what was put in, for a plan under 5 years", () => {
    const calc = calculate(plan({ years: 3 }), [], today);
    const check = horizonCheck(calc);
    // €10,000 and €200 a month for 3 years: €17,200 put in.
    expect(check).toMatchObject({ id: "horizon", years: 3, goal: null, putIn: 17_200, futures: FUTURES });
    // The very futures of the chart's band, counted at year 3.
    const ends = samplesFor(calc.investment, { start: 10_000, monthly: 200, years: 3 }, FUTURES).map((path) => path[3]);
    expect(check?.below).toBe(ends.filter((value) => value < 17_200).length);
    expect(check!.below).toBeGreaterThanOrEqual(FUTURES / 10);
    expect(check!.bad).toBeLessThan(17_200);
  });

  it("says nothing from 5 years on, or for money that does not move", () => {
    expect(horizonCheck(calculate(plan({ years: SHORT_YEARS }), [], today))).toBeNull();
    expect(horizonCheck(calculate(plan({ years: 20 }), [], today))).toBeNull();
    expect(horizonCheck(calculate(plan({ years: 3, investment: { kind: "asset", asset: "savings" } }), [], today))).toBeNull();
    expect(horizonCheck(calculate(plan({ years: 3, investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.05, volatility: 0 } }), [], today))).toBeNull();
  });

  it("says nothing when fewer than 1 in 10 futures end below what was put in", () => {
    // Bonds hardly move: over 4 years, almost no future ends below.
    const bonds = calculate(plan({ years: 4, investment: { kind: "asset", asset: "bonds" } }), [], today);
    const ends = samplesFor(bonds.investment, { start: 10_000, monthly: 200, years: 4 }, FUTURES).map((path) => path[4]);
    const below = ends.filter((value) => value < 10_000 + 200 * 48).length;
    expect(horizonCheck(bonds) === null).toBe(below < FUTURES / 10);
  });

  it("speaks of the soonest goal under 5 years away in a longer plan", () => {
    const car: Goal = { id: "car", kind: "buy", item: "used-car" };
    const calc = calculate(plan({ goals: [car] }), [], today);
    const goal = calc.goals[0];
    expect(goal.months).toBeGreaterThan(0);
    expect(goal.months).toBeLessThan(SHORT_YEARS * 12);
    const check = horizonCheck(calc);
    expect(check?.goal?.goal).toBe(car);
    expect(check?.years).toBe(Math.ceil(goal.months / 12));
    // A goal already reached, or further than 5 years, is not about the next few years.
    expect(horizonCheck(calculate(plan({ invested: 50_000, goals: [car] }), [], today))).toBeNull();
    expect(horizonCheck(calculate(plan({ invested: 0, monthlyContribution: 100, goals: [car] }), [], today))).toBeNull();
  });
});

describe("one stock that weighs too much", () => {
  it("names a stock over a fifth of the mix, with its euros of today's money", () => {
    const check = concentrationCheck(calculate(plan({ investment: withStock(25) }), [], today), []);
    expect(check).toMatchObject({ id: "concentration", where: "mix", name: "NVDA", share: 0.25, amount: 2500, total: 10_000, atEnd: false, reference: "nasdaq100" });
    expect(check?.fall?.max).toBeGreaterThan(0);
    // A fifth exactly is not over it.
    expect(concentrationCheck(calculate(plan({ investment: withStock(20) }), [], today), [])).toBeNull();
  });

  it("with no money today, gives its euros of the total at the end", () => {
    const calc = calculate(plan({ invested: 0, investment: withStock(30) }), [], today);
    const check = concentrationCheck(calc, []);
    expect(check).toMatchObject({ atEnd: true, total: calc.result.total });
    expect(check?.amount).toBeCloseTo(0.3 * calc.result.total, 6);
  });

  it("names a stock over a fifth of My portfolio, leaving index funds aside", () => {
    // ASML: 2 × €1,601.20 = €3,202.40 of €3,202.40 + 50 × €169.40 = €11,672.40, 27%.
    const priced = priceHoldings([holding("ASML", 2, 1601.2), holding("VWCE", 50, 169.4)]);
    const check = concentrationCheck(calculate(plan(), priced, today), priced);
    expect(check).toMatchObject({ where: "portfolio", name: "ASML", amount: 3202.4, total: 11_672.4 });
    expect(check?.share).toBeCloseTo(3202.4 / 11_672.4, 9);
    // A fund, however big, is not one company; a stock under a fifth is not shown.
    expect(concentrationCheck(calculate(plan(), priceHoldings([holding("VWCE", 90, 169.4)]), today), priceHoldings([holding("VWCE", 90, 169.4)]))).toBeNull();
    const small = priceHoldings([holding("ASML", 1, 1601.2), holding("VWCE", 50, 169.4)]);
    expect(concentrationCheck(calculate(plan(), small, today), small)).toBeNull();
  });
});

describe("savings for a long time", () => {
  const savings: Investment = { kind: "asset", asset: "savings" };

  it("sets what savings keep against what was put in and against world stocks", () => {
    const calc = calculate(plan({ investment: savings, years: 30 }), [], today);
    const check = savingsCheck(calc, plan());
    // 1.5% interest and prices rising 2%: savings lose a little every year.
    expect(check).toMatchObject({ id: "savings", years: 30, total: calc.result.total, putIn: 10_000 + 200 * 360 });
    expect(check!.total).toBeLessThan(check!.putIn);
    // World stocks with the same amounts, at their 1988–2022 average after rising prices.
    expect(check?.world.typical).toBeCloseTo(futureValueWithContributions(10_000, 200, INDEXES.world.averageReturn, 30), 6);
    expect(check?.world.period).toEqual([1988, 2022]);
    expect(check!.world.bad).toBeLessThan(check!.world.typical);
  });

  it("says nothing under 10 years, or for anything but savings", () => {
    expect(savingsCheck(calculate(plan({ investment: savings, years: 9 }), [], today), plan())).toBeNull();
    expect(savingsCheck(calculate(plan({ investment: savings, years: 10 }), [], today), plan())).not.toBeNull();
    expect(savingsCheck(calculate(plan({ years: 30 }), [], today), plan())).toBeNull();
  });
});

describe("Check your plan", () => {
  it("shows nothing when nothing stands out, and at most one of each, in order", () => {
    expect(checksOf()).toEqual([]);
    const all = checksOf({ years: 3, investment: withStock(30) });
    expect(all.map((check) => check.id)).toEqual(["horizon", "concentration"]);
    for (const checks of [all, checksOf({ investment: { kind: "asset", asset: "savings" }, years: 30 })]) {
      const positions = checks.map((check) => CHECK_ORDER.indexOf(check.id));
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    }
  });

  /** Plans that show each check, in both languages. */
  const shown: PlanCheck[] = [
    ...checksOf({ years: 3 }),
    ...checksOf({ goals: [{ id: "car", kind: "buy", item: "used-car" }] }),
    ...checksOf({ investment: withStock(30) }),
    ...checksOf({ invested: 0, investment: withStock(30) }),
    ...checksOf({}, [holding("ASML", 9, 1601.2), holding("VWCE", 36, 169.4)]),
    ...checksOf({ investment: { kind: "asset", asset: "savings" }, years: 30 }),
  ];

  it("has a case for each kind of check", () => {
    expect(new Set(shown.map((check) => check.id))).toEqual(new Set(CHECK_ORDER));
  });

  it("says each with its euros, in short sentences, without advice, in English and in Spanish", () => {
    for (const i18n of [EN, ES]) {
      for (const check of shown) {
        const { lead, details } = checkWords(check, i18n);
        const texts = [...lead, ...details];
        // What stands out always comes with a figure in euros.
        expect(lead.join(" "), check.id).toMatch(/€/);
        // No percentage without its euros.
        for (const text of texts) if (/%/.test(text)) expect(text, check.id).toMatch(/€/);
        // Never what to buy, sell, keep or weigh: what is, never what to do.
        for (const text of texts) {
          expect(ADVICE[i18n.locale].test(text), text).toBe(false);
          expect(text, check.id).not.toMatch(/\b(buy|sell|switch|move to|reduce|increase|keep|compra|vende|cambia|reduce|aumenta|mantén|pasa a)\b/i);
        }
        expect(plainLanguageProblems(texts.map((text, index) => ({ path: `${check.id}.${index}`, text })), i18n.locale)).toEqual([]);
      }
    }
  });

  it("reads as the principle asks: a fall, in euros of the user's money", () => {
    const concentrated = shown.find((check) => check.id === "concentration" && check.where === "portfolio");
    const { details } = checkWords(concentrated!, EN);
    // ASML: 9 × €1,601.20 = €14,411; its worst fall since 2016, −48.42%, shows as −48%: 48% of €14,411 = −€6,917,
    // the sum a reader can check (as in "(−37%) = −€407 of your €1,100").
    expect(details[0]).toBe("A fall like its worst since 2016 (−48%) = −€6,917 of your €14,411.");
    expect(checkWords(concentrated!, ES).details[0]).toBe("Una caída como su peor desde 2016 (−48 %) = −6917 € de tus 14.411 €.");
  });

  it("subtracts the euros as they are shown, so the sums on the page add up", () => {
    // €370,414.60 and €151,175.40 show as €370,415 and €151,175: the gap shown is €219,240, not €219,239.
    const check: PlanCheck = { id: "savings", years: 30, total: 151_175.4, putIn: 164_000, world: { typical: 370_414.6, bad: 169_417, rate: 0.045, period: [1988, 2022] } };
    const { lead, details } = checkWords(check, EN);
    expect(lead).toEqual(["In 30 years, savings are worth €151,175 of today's money.", "That is €12,825 less than you put in."]);
    expect(details).toContain("World stocks (1988–2022) typically give €370,415: €219,240 more.");
  });

  it("gives the last 12 months as where its euros came from, so the percent can be checked by eye", () => {
    // €6,000 today after +25%: €4,800 a year ago. "+25% (+€1,200)" beside "€6,000" read as a wrong 25% of €6,000.
    const check: PlanCheck = { id: "concentration", where: "mix", name: "NVDA", share: 0.3, amount: 6000, total: 20_000, atEnd: false, fall: null, change1y: 0.25, reference: "nasdaq100" };
    expect(checkWords(check, EN).details[0]).toBe("Last 12 months: +25%, from €4,800 to €6,000.");
    expect(checkWords(check, ES).details[0]).toBe("Últimos 12 meses: +25 %, de 4800 € a 6000 €.");
    // +28.6% shows as +29%: €6,000 ÷ 1.29 = €4,651, so that €4,651 + 29% = €6,000 on the page.
    expect(checkWords({ ...check, change1y: 0.286 }, EN).details[0]).toBe("Last 12 months: +29%, from €4,651 to €6,000.");
    expect(checkWords({ ...check, change1y: -0.2 }, ES).details[0]).toBe("Últimos 12 meses: −20 %, de 7500 € a 6000 €.");
  });
});
