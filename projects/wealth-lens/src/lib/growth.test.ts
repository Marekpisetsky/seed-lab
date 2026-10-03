import { describe, expect, it } from "vitest";
import { EN } from "@/i18n";
import { calculate, yearlyPath, type CalculatorPlan } from "./calculator";
import { parseIsoDate } from "./dates";
import { formatMultiple, formatShare, gainedShareOf, growsText, multipleOf, timesPutInText, yearTooltip } from "./growth";
import { toNominal } from "./investment";
import { SP500_PLAN } from "./sp500-plan";

const today = parseIsoDate("2026-09-30");
const plan = (patch: Partial<CalculatorPlan> = {}): CalculatorPlan => ({ ...SP500_PLAN, ...patch });

describe("the growth line under the result", () => {
  it("says how much the money grows a year, after rising prices, with the figure before them beside it", () => {
    const { investment } = calculate(plan(), [], today);
    expect(growsText(investment.realReturn, EN)).toBe("Grows about 7.5% a year");
    expect(EN.m.growth.before(EN.f.rate(toNominal(investment.realReturn, investment.inflation)))).toBe("≈ 9.7% before inflation");
    expect(growsText(-0.0049, EN)).toBe("Shrinks about 0.5% a year");
    expect(growsText(0.0002, EN)).toBe("Stays about the same every year");
  });

  it("gives ×Z, the end total over what was put in, never a percent that grows huge", () => {
    // EUR 1,000 + EUR 200 a month for 20 years in the S&P 500: EUR 49,000 put in.
    const { result } = calculate(plan(), [], today);
    const multiple = result.total / 49_000;
    expect(result.putIn).toBe(49_000);
    expect(multipleOf(result)).toBeCloseTo(multiple, 12);
    expect(gainedShareOf(result)).toBeCloseTo(multiple - 1, 12);
    expect(timesPutInText(result, EN)).toBe("×2.3 what you put in");
    expect(timesPutInText({ total: 9_000, putIn: 10_000 }, EN)).toBe("×0.90 what you put in");
  });

  it("has nothing to say with nothing put in", () => {
    expect(timesPutInText({ total: 0, putIn: 0 }, EN)).toBeNull();
    expect(multipleOf({ total: 0, putIn: 0 })).toBeNull();
  });

  it("writes multiples and shares plainly", () => {
    expect(formatMultiple(2.2918, EN)).toBe("×2.3");
    expect(formatMultiple(12.44, EN)).toBe("×12.4");
    expect(formatMultiple(0.952, EN)).toBe("×0.95");
    expect(formatShare(1.2916, EN)).toBe("+129%");
    expect(formatShare(0.004, EN)).toBe("+0.4%");
    expect(formatShare(-0.05, EN)).toBe("-5%");
    expect(formatShare(0, EN)).toBe("0%");
  });
});

describe("the chart's labels", () => {
  const calc = calculate(plan(), [], today);
  const points = yearlyPath(calc.scenario, 20);

  it("put what the money became at the end of the curve, as a multiple: no “+5,411%”", () => {
    expect(timesPutInText(points[20], EN)).toBe("×2.3 what you put in");
    const long = calculate(plan({ years: 60, invested: 1_000, monthlyContribution: 0 }), [], today);
    expect(timesPutInText(long.result, EN)).toMatch(/^×\d+(\.\d)? what you put in$/);
  });

  it("give any year's value in euros", () => {
    expect(yearTooltip(points[20], 2026, EN)).toMatch(/^2046: €112,\d{3}$/);
    expect(yearTooltip(points[0], 2026, EN)).toBe("2026: €1,000");
    expect(yearTooltip({ year: 0, putIn: 0, total: 0 }, 2026, EN)).toBe("2026: €0");
  });
});
