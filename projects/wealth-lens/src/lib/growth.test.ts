import { describe, expect, it } from "vitest";
import { calculate, yearlyPath, type CalculatorPlan } from "./calculator";
import { parseIsoDate } from "./dates";
import {
  beforeInflationText,
  endLabel,
  formatMultiple,
  formatShare,
  gainedShareOf,
  growsText,
  moneyLine,
  multipleOf,
  yearTooltip,
} from "./growth";
import { toNominal } from "./investment";
import { DEFAULT_PLAN } from "./validation";

const today = parseIsoDate("2026-09-30");
const plan = (patch: Partial<CalculatorPlan> = {}): CalculatorPlan => ({ ...DEFAULT_PLAN, ...patch });

describe("the growth line under the result", () => {
  it("says how much the money grows a year, after rising prices, with the figure before them beside it", () => {
    const { investment } = calculate(plan(), [], today);
    expect(growsText(investment.realReturn)).toBe("Grows about 7.5% a year");
    expect(beforeInflationText(toNominal(investment.realReturn, investment.inflation))).toBe("(≈9.7% before inflation)");
    expect(growsText(-0.0049)).toBe("Shrinks about 0.5% a year");
    expect(growsText(0.0002)).toBe("Stays about the same every year");
  });

  it("gives ×Z, the end total over what was put in, and P%, what growth added over it", () => {
    // EUR 1,000 + EUR 200 a month for 20 years in the S&P 500: EUR 49,000 put in.
    const { result } = calculate(plan(), [], today);
    const multiple = result.total / 49_000;
    expect(result.putIn).toBe(49_000);
    expect(multipleOf(result)).toBeCloseTo(multiple, 12);
    expect(gainedShareOf(result)).toBeCloseTo(multiple - 1, 12);
    expect(moneyLine(result, true)).toBe(
      `Your money: ${formatMultiple(multiple)} · growth added +€${Math.round(result.total - 49_000).toLocaleString("en-US")} (${formatShare(multiple - 1)})`,
    );
    expect(moneyLine(result, true)).toMatch(/^Your money: ×2\.3 · growth added \+€63,\d{3} \(\+129%\)$/);
  });

  it("says what was taken when the money shrank", () => {
    const { result } = calculate(plan({ investment: { kind: "asset", asset: "savings" } }), [], today);
    expect(moneyLine(result, false)).toMatch(/^Your money: ×0\.9\d · rising prices took €\d,\d{3} \(-\d%\)$/);
    expect(moneyLine({ total: 9_000, putIn: 10_000 }, true)).toBe("Your money: ×0.90 · the market took €1,000 (-10%)");
  });

  it("has nothing to say with nothing put in", () => {
    expect(moneyLine({ total: 0, putIn: 0 }, true)).toBeNull();
    expect(multipleOf({ total: 0, putIn: 0 })).toBeNull();
  });

  it("writes multiples and shares plainly", () => {
    expect(formatMultiple(2.2918)).toBe("×2.3");
    expect(formatMultiple(12.44)).toBe("×12.4");
    expect(formatMultiple(0.952)).toBe("×0.95");
    expect(formatShare(1.2916)).toBe("+129%");
    expect(formatShare(0.004)).toBe("+0.4%");
    expect(formatShare(-0.05)).toBe("-5%");
    expect(formatShare(0)).toBe("0%");
  });
});

describe("the chart's labels", () => {
  const calc = calculate(plan(), [], today);
  const points = yearlyPath(calc.scenario, 20);

  it("puts the % gained in all at the end of the curve", () => {
    expect(endLabel(points[20])).toBe(formatShare(gainedShareOf(calc.result) ?? 0));
    expect(endLabel(points[20])).toBe("+129%");
  });

  it("gives any year's value and what it has gained so far", () => {
    expect(yearTooltip(points[20], 2026)).toMatch(/^Year 2046: €112,\d{3} · \+129% so far$/);
    const year10 = points[10];
    expect(yearTooltip(year10, 2026)).toBe(`Year 2036: €${Math.round(year10.total).toLocaleString("en-US")} · ${formatShare((year10.total - year10.putIn) / year10.putIn)} so far`);
    expect(yearTooltip(points[0], 2026)).toBe("Year 2026: €1,000 · 0% so far");
    expect(yearTooltip({ year: 0, putIn: 0, total: 0 }, 2026)).toBe("Year 2026: €0");
  });
});
