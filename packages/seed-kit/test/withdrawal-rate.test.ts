import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FEW_PERIODS, maxRate, safeRate, steadyRate, withEarlyCrash, type YearReturn } from "../src/withdrawal-rate.ts";

const history = (from: number, returns: readonly number[]): YearReturn[] => returns.map((realReturn, index) => ({ year: from + index, realReturn }));

/** Plays a path year by year: withdraw at the start, then grow. Whether the money paid every year. */
function lasts(rate: number, returns: readonly number[]): boolean {
  let balance = 1;
  for (const r of returns) {
    if (balance < rate - 1e-12) return false;
    balance = (balance - rate) * (1 + r);
  }
  return true;
}

describe("the largest rate one run of years pays", () => {
  it("is 1 ÷ years with no growth: 25 years of 4 %", () => {
    assert.ok(Math.abs(maxRate(Array(25).fill(0)) - 0.04) < 1e-12);
    assert.equal(maxRate([0]), 1);
  });

  it("is an annuity paid at the start of each year with steady growth", () => {
    const g = 0.03;
    const n = 30;
    const annuityDue = (1 - (1 + g) ** -n) / (1 - 1 / (1 + g));
    assert.ok(Math.abs(maxRate(Array(n).fill(g)) - 1 / annuityDue) < 1e-12);
    assert.ok(Math.abs(steadyRate(g, n) - 1 / annuityDue) < 1e-12);
  });

  it("is exactly the rate that just lasts when played year by year", () => {
    const path = [-0.37, 0.26, 0.15, 0.02, -0.1, 0.21, 0.05, 0.3, -0.05, 0.12];
    const rate = maxRate(path);
    assert.ok(lasts(rate, path));
    assert.ok(!lasts(rate * 1.001, path));
  });

  it("is lower when the fall comes first: the same years in another order", () => {
    const fallFirst = [-0.4, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
    const fallLast = [...fallFirst.slice(1), -0.4];
    assert.ok(maxRate(fallFirst) < maxRate(fallLast));
  });

  it("is 0 when everything is lost before the end, and refuses an empty run", () => {
    assert.equal(maxRate([0.1, -1, 0.2]), 0);
    // Lost in the last year: every withdrawal was paid before it.
    assert.ok(Math.abs(maxRate([0, -1]) - 0.5) < 1e-12);
    assert.throws(() => maxRate([]), RangeError);
  });
});

describe("the safe rate of a history", () => {
  it("is the lowest of every start's largest rate, and names the worst start", () => {
    const data = history(2000, [-0.3, 0.1, 0.1, 0.1, 0.2, 0.2, -0.1, 0.05]);
    const result = safeRate(data, 5);
    const each = [0, 1, 2, 3].map((start) => maxRate(data.slice(start, start + 5).map((entry) => entry.realReturn)));
    assert.equal(result.rate, Math.min(...each));
    assert.equal(result.worstStart, 2000 + each.indexOf(Math.min(...each)));
    assert.equal(result.periods, 4);
    assert.deepEqual([result.years, result.askedYears, result.from, result.to], [5, 5, 2000, 2007]);
    for (let start = 0; start < 4; start += 1) assert.ok(lasts(result.rate, data.slice(start, start + 5).map((entry) => entry.realReturn)));
  });

  it("uses every year when the data are shorter than asked, and says it is a rough guide", () => {
    const data = history(1988, Array(35).fill(0.02));
    const result = safeRate(data, 40);
    assert.deepEqual([result.years, result.askedYears, result.periods, result.few], [35, 40, 1, true]);
    assert.ok(Math.abs(result.rate - steadyRate(0.02, 35)) < 1e-12);
  });

  it(`says when fewer than ${FEW_PERIODS} periods are behind it`, () => {
    const data = history(1988, Array(35).fill(0.02));
    assert.deepEqual([safeRate(data, 30).periods, safeRate(data, 30).few], [6, true]);
    assert.deepEqual([safeRate(data, 26).periods, safeRate(data, 26).few], [10, false]);
  });

  it("is lower the more years it must last", () => {
    const data = history(1928, Array.from({ length: 95 }, (_, i) => Math.sin(i) * 0.2 + 0.05));
    const rates = [10, 20, 30, 40].map((years) => safeRate(data, years).rate);
    for (let index = 1; index < rates.length; index += 1) assert.ok(rates[index] < rates[index - 1]);
  });

  it("refuses broken input: no years, gaps, or years that are not whole", () => {
    assert.throws(() => safeRate([], 30), RangeError);
    assert.throws(() => safeRate([{ year: 2000, realReturn: 0 }, { year: 2002, realReturn: 0 }], 1), RangeError);
    assert.throws(() => safeRate(history(2000, [0]), 0), RangeError);
    assert.throws(() => safeRate(history(2000, [0]), 2.5), RangeError);
  });
});

describe("a fall at the start, for growth with no history", () => {
  it("lasts every year when the rate is low enough, and says what is left", () => {
    const outcome = withEarlyCrash(0.03, 0.05, -0.37, 30);
    assert.equal(outcome.lastsAll, true);
    assert.equal(outcome.lasted, 30);
    assert.ok(outcome.left > 0);
  });

  it("runs out sooner than without the fall", () => {
    const fall = withEarlyCrash(0.06, 0.05, -0.37, 40);
    const none = withEarlyCrash(0.06, 0.05, 0.05, 40);
    assert.equal(fall.lastsAll, false);
    assert.ok(fall.lasted < none.lasted || (none.lastsAll && !fall.lastsAll));
  });

  it("pays nothing more after the money is gone, and handles a total loss", () => {
    assert.deepEqual(withEarlyCrash(0.5, 0, -1, 10), { lasted: 1, lastsAll: false, left: 0 });
    assert.deepEqual(withEarlyCrash(0.25, 0, 0, 4), { lasted: 4, lastsAll: true, left: 0 });
  });
});
