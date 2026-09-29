import { describe, expect, it } from "vitest";
import {
  averageCost,
  futureValue,
  futureValueWithContributions,
  gainLoss,
  holdingGain,
  holdingValue,
  monthlyRate,
  monthsToGoal,
  nominalReturn,
  requiredCapital,
  requiredMonthlyContribution,
  summarizeByCurrency,
  sustainableAnnualIncome,
  yearsToGoal,
} from "./finance";
import type { Holding } from "./types";

/** Month-by-month simulation, used as an independent check of the closed forms. */
function simulateMonthsToGoal(pv: number, pmt: number, annualRate: number, goal: number): number {
  const i = Math.pow(1 + annualRate, 1 / 12) - 1;
  let balance = pv;
  let months = 0;
  while (balance < goal) {
    balance = balance * (1 + i) + pmt;
    months += 1;
    if (months > 12 * 200) return Infinity;
  }
  return months;
}

function holding(overrides: Partial<Holding>): Holding {
  return {
    id: "h",
    ticker: "TEST",
    quantity: 1,
    costBasis: 100,
    currency: "EUR",
    currentPrice: null,
    ...overrides,
  };
}

describe("monthlyRate", () => {
  it("compounds back to the annual rate over 12 months", () => {
    expect(Math.pow(1 + monthlyRate(0.07), 12) - 1).toBeCloseTo(0.07, 12);
  });

  it("is 0 for a 0 % annual rate", () => {
    expect(monthlyRate(0)).toBe(0);
  });

  it("rejects rates of -100 % or lower", () => {
    expect(() => monthlyRate(-1)).toThrow(RangeError);
  });
});

describe("futureValue", () => {
  it("grows €1000 at 7 % for 10 years to €1967.15", () => {
    // 1.07^10 = 1.9671513...
    expect(futureValue(1000, 0.07, 10)).toBeCloseTo(1967.15, 2);
  });

  it("returns the present value when no time passes", () => {
    expect(futureValue(1000, 0.07, 0)).toBe(1000);
  });

  it("rejects negative durations", () => {
    expect(() => futureValue(1000, 0.07, -1)).toThrow(RangeError);
  });
});

describe("futureValueWithContributions", () => {
  it("matches the lump-sum formula when there are no contributions", () => {
    expect(futureValueWithContributions(1000, 0, 0.07, 10)).toBeCloseTo(1967.15, 2);
  });

  it("adds contributions linearly at a 0 % return", () => {
    expect(futureValueWithContributions(1000, 100, 0, 2)).toBe(1000 + 100 * 24);
  });

  it("values 12 × €100 at 7 % as 100 · 0.07 / i = €1238.03", () => {
    // (1+i)^12 − 1 is exactly 0.07, so FV = 100 · 0.07 / i with i = 1.07^(1/12) − 1.
    expect(futureValueWithContributions(0, 100, 0.07, 1)).toBeCloseTo(1238.03, 2);
  });
});

describe("monthsToGoal / yearsToGoal", () => {
  it("takes ln 2 / ln 1.07 = 10.2448 years to double at 7 % without contributions", () => {
    expect(yearsToGoal(1000, 0, 0.07, 2000)).toBeCloseTo(10.2448, 4);
  });

  it("inverts futureValue: €1000 → €1967.15 at 7 % takes 10 years", () => {
    expect(yearsToGoal(1000, 0, 0.07, futureValue(1000, 0.07, 10))).toBeCloseTo(10, 9);
  });

  it("takes exactly 24 months to save €12,000 at €500/month and 0 %", () => {
    expect(monthsToGoal(0, 500, 0, 12_000)).toBe(24);
    expect(yearsToGoal(0, 500, 0, 12_000)).toBe(2);
  });

  it("takes 1 year for 12 × €100 at 7 % to reach €1238.03", () => {
    expect(yearsToGoal(0, 100, 0.07, 1238.0297145511)).toBeCloseTo(1, 6);
  });

  it("solves €10k + €500/month at 7 % → €100k in 115.17 months, matching a simulation", () => {
    const months = monthsToGoal(10_000, 500, 0.07, 100_000);
    expect(months).toBeCloseTo(115.1742, 4);
    // The goal is crossed during month ⌈m⌉.
    expect(Math.ceil(months)).toBe(simulateMonthsToGoal(10_000, 500, 0.07, 100_000));
    // Plugging m back into the future-value formula lands on the goal.
    expect(futureValueWithContributions(10_000, 500, 0.07, months / 12)).toBeCloseTo(100_000, 6);
  });

  it("is not a rule of three: returns compound, so it is faster than saving alone", () => {
    const linearMonths = (100_000 - 10_000) / 500; // 180
    expect(monthsToGoal(10_000, 500, 0.07, 100_000)).toBeLessThan(linearMonths);
  });

  it("returns 0 when the goal is already met", () => {
    expect(monthsToGoal(5000, 0, 0.07, 5000)).toBe(0);
    expect(monthsToGoal(5000, 0, 0.07, 1000)).toBe(0);
  });

  it("returns Infinity with nothing invested and nothing added", () => {
    expect(monthsToGoal(0, 0, 0.07, 1000)).toBe(Infinity);
    expect(monthsToGoal(1000, 0, 0, 2000)).toBe(Infinity);
  });

  it("returns Infinity when a negative return shrinks the balance", () => {
    expect(monthsToGoal(1000, 0, -0.02, 2000)).toBe(Infinity);
  });

  it("returns Infinity when a negative return caps the balance below the goal", () => {
    // At -5 % the balance converges to -PMT/i ≈ €23,445 and never reaches €50,000.
    expect(monthsToGoal(1000, 100, -0.05, 50_000)).toBe(Infinity);
  });

  it("still solves reachable goals with a negative return", () => {
    const months = monthsToGoal(1000, 100, -0.05, 2000);
    expect(months).toBeCloseTo(10.6626, 4);
    expect(Math.ceil(months)).toBe(simulateMonthsToGoal(1000, 100, -0.05, 2000));
  });

  it("rejects negative contributions", () => {
    expect(() => monthsToGoal(1000, -1, 0.07, 2000)).toThrow(RangeError);
  });
});

describe("requiredMonthlyContribution", () => {
  it("is €1000/month to save €12,000 in 12 months at 0 %", () => {
    expect(requiredMonthlyContribution(0, 0, 12, 12_000)).toBe(1000);
  });

  it("is €100/month to reach €1238.03 in 12 months at 7 %", () => {
    expect(requiredMonthlyContribution(0, 0.07, 12, 1238.0297145511)).toBeCloseTo(100, 6);
  });

  it("round-trips with futureValueWithContributions", () => {
    const pmt = requiredMonthlyContribution(5000, 0.07, 120, 50_000);
    expect(pmt).toBeCloseTo(234.81, 2);
    expect(futureValueWithContributions(5000, pmt, 0.07, 10)).toBeCloseTo(50_000, 6);
  });

  it("is 0 when the starting balance alone reaches the goal", () => {
    expect(requiredMonthlyContribution(1000, 0.07, 120, 1967)).toBe(0);
  });

  it("is Infinity when no time is left and the goal is not met", () => {
    expect(requiredMonthlyContribution(1000, 0.07, 0, 2000)).toBe(Infinity);
  });
});

describe("nominalReturn", () => {
  it("turns 7 % real at 2 % inflation into 9.14 % nominal", () => {
    expect(nominalReturn(0.07, 0.02)).toBeCloseTo(0.0914, 10);
  });

  it("equals the real return when there is no inflation", () => {
    expect(nominalReturn(0.07, 0)).toBeCloseTo(0.07, 12);
  });
});

describe("sustainableAnnualIncome", () => {
  it("withdraws €40/year from €1000 at 4 %", () => {
    expect(sustainableAnnualIncome(1000, 0.04)).toBeCloseTo(40, 10);
  });
});

describe("requiredCapital", () => {
  it("needs 25 × expenses at 4 %: €20,000/year → €500,000", () => {
    expect(requiredCapital(20_000, 0.04)).toBeCloseTo(500_000, 6);
  });

  it("needs more capital at a lower withdrawal rate: 3 % → 33.3 ×", () => {
    expect(requiredCapital(30_000, 0.03)).toBeCloseTo(1_000_000, 6);
  });

  it("rejects a zero withdrawal rate", () => {
    expect(() => requiredCapital(20_000, 0)).toThrow(RangeError);
  });
});

describe("gainLoss", () => {
  it("computes absolute and percentage gain", () => {
    expect(gainLoss(1000, 1250)).toEqual({ absolute: 250, percent: 0.25 });
  });

  it("computes losses as negative numbers", () => {
    expect(gainLoss(1000, 800)).toEqual({ absolute: -200, percent: -0.2 });
  });

  it("has no percentage for a zero cost basis", () => {
    expect(gainLoss(0, 10)).toEqual({ absolute: 10, percent: null });
  });
});

describe("holding helpers", () => {
  it("computes average cost per share", () => {
    expect(averageCost({ costBasis: 1500, quantity: 10 })).toBe(150);
    expect(averageCost({ costBasis: 0, quantity: 0 })).toBeNull();
  });

  it("values a holding at its current price", () => {
    expect(holdingValue({ quantity: 2.5, currentPrice: 40 })).toBe(100);
    expect(holdingValue({ quantity: 2.5, currentPrice: null })).toBeNull();
  });

  it("computes the gain of a single holding", () => {
    expect(holdingGain(holding({ quantity: 10, costBasis: 1500, currentPrice: 180 }))).toEqual({
      absolute: 300,
      percent: 0.2,
    });
    expect(holdingGain(holding({ currentPrice: null }))).toBeNull();
  });
});

describe("summarizeByCurrency", () => {
  it("totals each currency separately and skips unpriced holdings in money totals", () => {
    const summaries = summarizeByCurrency([
      holding({ id: "a", currency: "EUR", quantity: 10, costBasis: 1000, currentPrice: 120 }),
      holding({ id: "b", currency: "EUR", quantity: 5, costBasis: 500, currentPrice: 80 }),
      holding({ id: "c", currency: "EUR", quantity: 1, costBasis: 999, currentPrice: null }),
      holding({ id: "d", currency: "USD", quantity: 2, costBasis: 300, currentPrice: 100 }),
    ]);

    expect(summaries).toEqual([
      {
        currency: "EUR",
        holdingCount: 3,
        pricedCount: 2,
        costBasis: 1500,
        value: 1600,
        gain: { absolute: 100, percent: 100 / 1500 },
      },
      {
        currency: "USD",
        holdingCount: 1,
        pricedCount: 1,
        costBasis: 300,
        value: 200,
        gain: { absolute: -100, percent: -1 / 3 },
      },
    ]);
  });

  it("returns an empty list for an empty portfolio", () => {
    expect(summarizeByCurrency([])).toEqual([]);
  });
});
