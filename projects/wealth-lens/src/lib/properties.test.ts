import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { EN, getI18n } from "@/i18n";
import { calculate, effectiveGrowth, valueAt, whatIfEffects, type CalculatorPlan } from "./calculator";
import { parseIsoDate } from "./dates";
import { futureValueWithContributions, monthlyWithdrawal, monthsToGoal, requiredCapital, requiredMonthlyContribution } from "./finance";
import { formatShare, gainedShareOf, multipleOf } from "./growth";
import { DEFAULT_PLAN } from "./validation";

const ES = getI18n("es");
const whenText = EN.f.when;
const { eur: formatEur, eurRounded: formatEurRounded, rate: formatRate } = EN.f;

/**
 * Properties the money math must keep for any input, checked on random
 * ones (fast-check): more money in never gives less, more time never gives
 * less while it grows, more growth never gives less, and the formulas undo
 * each other.
 */

// FC_RUNS=5000 npx vitest run src/lib/properties.test.ts: a deeper search than the default 100 cases.
if (process.env.FC_RUNS) fc.configureGlobal({ numRuns: Number(process.env.FC_RUNS) });

/** Nothing, or at least a cent: amounts are euros, not floating-point dust. */
const euros = (max: number) => fc.oneof(fc.constant(0), fc.double({ min: 0.01, max, noNaN: true }));
const money = euros(5_000_000);
const monthly = euros(50_000);
const rate = fc.double({ min: -0.5, max: 0.3, noNaN: true });
const growing = fc.double({ min: 0, max: 0.3, noNaN: true });
const years = fc.integer({ min: 0, max: 60 });
/** Relative closeness, with a floor for amounts near zero. */
const close = (a: number, b: number, tolerance = 1e-9) => Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));

describe("future value", () => {
  it("never gives less with more put in each month", () => {
    fc.assert(
      fc.property(money, monthly, monthly, rate, years, (start, a, b, r, n) => {
        const [low, high] = a <= b ? [a, b] : [b, a];
        return futureValueWithContributions(start, low, r, n) <= futureValueWithContributions(start, high, r, n) * (1 + 1e-12);
      }),
    );
  });

  it("never gives less with more to start with", () => {
    fc.assert(
      fc.property(money, money, monthly, rate, years, (a, b, pmt, r, n) => {
        const [low, high] = a <= b ? [a, b] : [b, a];
        return futureValueWithContributions(low, pmt, r, n) <= futureValueWithContributions(high, pmt, r, n) * (1 + 1e-12);
      }),
    );
  });

  it("never gives less with more years, while it grows", () => {
    fc.assert(
      fc.property(money, monthly, growing, years, years, (start, pmt, r, a, b) => {
        const [low, high] = a <= b ? [a, b] : [b, a];
        return futureValueWithContributions(start, pmt, r, low) <= futureValueWithContributions(start, pmt, r, high) * (1 + 1e-12);
      }),
    );
  });

  it("never gives less with more growth", () => {
    fc.assert(
      fc.property(money, monthly, rate, rate, years, (start, pmt, a, b, n) => {
        const [low, high] = a <= b ? [a, b] : [b, a];
        return futureValueWithContributions(start, pmt, low, n) <= futureValueWithContributions(start, pmt, high, n) * (1 + 1e-12);
      }),
    );
  });

  it("is at least what was put in when it grows, and never below zero", () => {
    fc.assert(
      fc.property(money, monthly, rate, years, (start, pmt, r, n) => {
        const total = futureValueWithContributions(start, pmt, r, n);
        const putIn = start + pmt * 12 * n;
        return total >= 0 && (r < 0 || total >= putIn * (1 - 1e-12));
      }),
    );
  });
});

describe("the formulas undo each other", () => {
  it("reaches the goal after the months monthsToGoal says", () => {
    fc.assert(
      fc.property(money, monthly, rate, fc.double({ min: 1, max: 10_000_000, noNaN: true }), (start, pmt, r, goal) => {
        const months = monthsToGoal(start, pmt, r, goal);
        if (months === 0) return goal <= start;
        if (!Number.isFinite(months)) return true;
        return close(futureValueWithContributions(start, pmt, r, months / 12), goal, 1e-6);
      }),
    );
  });

  it("gets there sooner, never later, with more each month", () => {
    fc.assert(
      fc.property(money, monthly, monthly, rate, fc.double({ min: 1, max: 10_000_000, noNaN: true }), (start, a, b, r, goal) => {
        const [low, high] = a <= b ? [a, b] : [b, a];
        return monthsToGoal(start, high, r, goal) <= monthsToGoal(start, low, r, goal) * (1 + 1e-9);
      }),
    );
  });

  it("reaches the goal with the monthly amount requiredMonthlyContribution asks for", () => {
    fc.assert(
      fc.property(money, rate, fc.integer({ min: 1, max: 720 }), fc.double({ min: 1, max: 10_000_000, noNaN: true }), (start, r, months, goal) => {
        const needed = requiredMonthlyContribution(start, r, months, goal);
        const reached = futureValueWithContributions(start, needed, r, months / 12);
        return needed === 0 ? reached >= goal * (1 - 1e-9) : close(reached, goal, 1e-6);
      }),
    );
  });

  it("pays the expenses from the capital requiredCapital gives", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1_000_000, noNaN: true }), fc.double({ min: 0.001, max: 0.2, noNaN: true }), (yearly, withdrawal) =>
        close(monthlyWithdrawal(requiredCapital(yearly, withdrawal), withdrawal) * 12, yearly),
      ),
    );
  });
});

const today = parseIsoDate("2026-09-30");
const assets = fc.constantFrom<CalculatorPlan["investment"]>(
  { kind: "asset", asset: "sp500" },
  { kind: "asset", asset: "world" },
  { kind: "asset", asset: "bonds" },
  { kind: "asset", asset: "gold" },
  { kind: "asset", asset: "savings" },
);
const plans = fc.record({
  invested: fc.integer({ min: 0, max: 2_000_000 }),
  monthlyContribution: fc.integer({ min: 0, max: 20_000 }),
  years: fc.integer({ min: 1, max: 60 }),
  withdrawalRate: fc.constantFrom(0.03, 0.04, 0.05),
  investment: assets,
});
const planOf = (patch: Partial<CalculatorPlan>): CalculatorPlan => ({ ...DEFAULT_PLAN, goals: [], ...patch });

describe("the whole calculation", () => {
  it("adds up: put in, growth, income and the growth line agree with the total", () => {
    fc.assert(
      fc.property(plans, (patch) => {
        const { result } = calculate(planOf(patch), [], today);
        const putIn = patch.invested + patch.monthlyContribution * 12 * patch.years;
        const multiple = multipleOf(result);
        const share = gainedShareOf(result);
        return (
          close(result.putIn, putIn) &&
          close(result.growth, result.total - result.putIn) &&
          close(result.income, (Math.max(0, result.total) * patch.withdrawalRate) / 12) &&
          (putIn === 0 ? multiple === null : close((multiple ?? NaN) * putIn, result.total) && close((share ?? NaN) + 1, multiple ?? NaN))
        );
      }),
      { numRuns: 60 },
    );
  });

  it("never gives less with more each month or more to start with", () => {
    fc.assert(
      fc.property(plans, fc.integer({ min: 1, max: 5000 }), (patch, more) => {
        const base = calculate(planOf(patch), [], today).result.total;
        const moreMonthly = calculate(planOf({ ...patch, monthlyContribution: patch.monthlyContribution + more }), [], today).result.total;
        const moreStart = calculate(planOf({ ...patch, invested: patch.invested + more }), [], today).result.total;
        return moreMonthly >= base && moreStart >= base;
      }),
      { numRuns: 40 },
    );
  });

  it("marks a country ✓ exactly when the income after the chosen years pays it", () => {
    fc.assert(
      fc.property(plans, (patch) => {
        const { result, countries } = calculate(planOf(patch), [], today);
        return countries.every((row) =>
          [row.withoutHousing, row.withHousing].every((cell) => {
            // Right at the edge, rounding may fall either way.
            if (Math.abs(result.income - cell.amount) < 1e-6 * cell.amount) return true;
            return cell.covered === result.income >= cell.amount;
          }),
        );
      }),
      { numRuns: 40 },
    );
  });

  it("gives each What if…? the sign it should have", () => {
    fc.assert(
      fc.property(plans, (patch) => {
        const effects = Object.fromEntries(whatIfEffects(calculate(planOf(patch), [], today)).map((effect) => [effect.id, effect]));
        const growthCounts = patch.invested + patch.monthlyContribution > 0;
        return (
          effects["monthly-50"].change >= 0 &&
          (!growthCounts || effects["grow-more"].change > 0) &&
          effects["grow-less"].change <= 0 &&
          effects["grow-more"].change >= effects["grow-less"].change
        );
      }),
      { numRuns: 40 },
    );
  });
});

describe("the growth a year shown", () => {
  it("is the plan's own growth without a set start", () => {
    fc.assert(
      fc.property(plans, (patch) => {
        const { result, scenario } = calculate(planOf(patch), [], today);
        return result.growthRate === scenario.realReturn;
      }),
      { numRuns: 30 },
    );
  });

  it("after a bad first decade, turns the same money into the same total", () => {
    fc.assert(
      fc.property(plans, (patch) => {
        const calc = calculate(planOf({ ...patch, investment: { kind: "asset", asset: "sp500" } }), [], today, "bad-decade");
        const { scenario, result } = calc;
        if (scenario.capital + scenario.monthly === 0) return result.growthRate === scenario.realReturn;
        const again = futureValueWithContributions(scenario.capital, scenario.monthly, result.growthRate, result.years);
        return close(again, valueAt(scenario, result.years * 12), 1e-6) && result.growthRate <= scenario.realReturn + 1e-9;
      }),
      { numRuns: 30 },
    );
  });

  it("works without the head too", () => {
    expect(effectiveGrowth({ capital: 1000, monthly: 100, realReturn: 0.05, withdrawalRate: 0.04 }, 10)).toBe(0.05);
  });
});

describe("texts never contradict their numbers", () => {
  it("never write a minus zero", () => {
    fc.assert(
      fc.property(fc.double({ min: -0.49, max: 0.49, noNaN: true }), (tiny) =>
        [EN, ES].every(({ f }, index) =>
          [f.eur(tiny), f.eur(tiny, { signed: true }), f.eurRounded(tiny), f.eurRounded(tiny, { signed: true }), formatShare(tiny / 10_000, index ? ES : EN), f.rate(tiny / 10_000)].every(
            (text) => !/^[-−]/.test(text),
          ),
        ),
      ),
    );
  });

  it("never say “in 0 months” or a span longer than 60 years, in either language", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 800, noNaN: true }), (months) => {
        const text = whenText(months);
        const span = /^in (\d+) (month|year)s?$/.exec(text);
        if (!span) return text === "now" || text === "not at this pace";
        const count = Number(span[1]);
        const spanEs = /^en (\d+) (mes|meses|año|años)$/.exec(ES.f.when(months));
        if (!spanEs || Number(spanEs[1]) !== Number(span[1])) return false;
        return count >= 1 && (span[2] === "month" ? count < 12 : count <= 60) && (months > 0 || text === "now");
      }),
    );
  });
});

describe("found by these properties, kept as plain examples", () => {
  it("keeps the monthly amounts when the growth is a hair from zero", () => {
    // 1e-17 a year: 3% before rising prices less 3% rising prices, as floats can leave it.
    expect(futureValueWithContributions(0, 100, 1e-17, 10)).toBeCloseTo(12_000, 6);
    expect(futureValueWithContributions(1000, 100, 1.4e-15, 1)).toBeCloseTo(2200, 6);
    expect(requiredMonthlyContribution(0, 1e-17, 120, 12_000)).toBeCloseTo(100, 6);
  });

  it("does not mark ✓ a country the money pays today but not after the chosen years", () => {
    // €75,000 in savings shrinks 0.5% a year: after a year it pays a little less than today.
    const calc = calculate(planOf({ invested: 75_000, monthlyContribution: 0, years: 1, investment: { kind: "asset", asset: "savings" } }), [], today);
    const between = calc.countries.flatMap((row) => [row.withoutHousing, row.withHousing]).filter((cell) => cell.target <= 75_000 && cell.target > calc.result.total);
    expect(between.length).toBeGreaterThan(0);
    for (const cell of between) {
      expect(cell.covered).toBe(false);
      expect(whenText(cell.months)).toBe("not at this pace");
    }
  });

  it("writes €0 and 0%, never -€0 or -0%", () => {
    expect(formatEur(-0.3)).toBe("€0");
    expect(formatEurRounded(-0.3, { signed: true })).toBe("€0");
    expect(formatRate(-0.000001)).toBe("0%");
  });

  it("says now, never “in 0 months”, a few billionths of a month away", () => {
    expect(whenText(5e-324)).toBe("now");
    expect(whenText(0.2)).toBe("in 1 month");
  });
});
