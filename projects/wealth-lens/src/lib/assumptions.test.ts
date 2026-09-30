import { describe, expect, it } from "vitest";
import { assumptionsLine, assumptionsNote, growthIn, upsAndDownsExample, upsAndDownsText } from "./assumptions";
import { resolveInvestment } from "./investment";
import { STANDARD_ASSUMPTIONS, type Holding } from "./types";

const holding: Holding = {
  id: "1",
  ticker: "VWCE",
  quantity: 1,
  costBasis: 1000,
  currency: "EUR",
  currentPrice: 1000,
  priceSource: "manual",
  priceDate: null,
};

describe("the compact line under the calculator", () => {
  it("says in plain words how much it grows, how much it can move and the years of data", () => {
    const sp500 = resolveInvestment({ kind: "asset", asset: "sp500" }, []);
    expect(assumptionsLine(sp500, "real")).toMatch(/^Grows 7\.5% a year after rising prices · can move ±1\d% in a year · data 1988–2022$/);
  });

  it("can show the growth before rising prices, with the country's inflation", () => {
    const sp500 = resolveInvestment({ kind: "asset", asset: "sp500" }, []);
    expect(growthIn(sp500, "nominal")).toBeCloseTo((1 + sp500.realReturn) * 1.02 - 1, 12);
    expect(assumptionsLine(sp500, "nominal")).toMatch(/^Grows 9\.\d% a year before rising prices · /);
  });

  it("gives a savings account its interest and rising prices, the same every year", () => {
    const savings = resolveInvestment({ kind: "asset", asset: "savings" }, []);
    expect(assumptionsLine(savings, "real")).toBe("Shrinks 0.5% a year after rising prices · the same every year · 1.5% interest, prices rise 2%");
    expect(assumptionsLine(savings, "nominal")).toBe("Grows 1.5% a year before rising prices · the same every year · 1.5% interest, prices rise 2%");
  });

  it("says when the figures are the user's", () => {
    const changed = resolveInvestment({ kind: "asset", asset: "world" }, [], { pricesOf: "NL", assumptions: { ...STANDARD_ASSUMPTIONS, growth: { rate: 0.04, basis: "real" } } });
    expect(assumptionsLine(changed, "real")).toMatch(/^Grows 4% a year after rising prices · can move ±\d+% in a year · your figures, not the data$/);
    expect(assumptionsLine(resolveInvestment({ kind: "custom" }, []), "real")).toMatch(/ · your figures$/);
  });

  it("writes the ups and downs as how much it can move in a year", () => {
    expect(upsAndDownsText(0.172)).toBe("can move ±17% in a year");
    expect(upsAndDownsText(0)).toBe("the same every year");
  });
});

describe("the Edit panel's example", () => {
  it("shows a normal year's ups and downs on €10,000", () => {
    expect(upsAndDownsExample(0.08)).toBe("e.g. a €10,000 year could end between €9,200 and €10,800.");
    expect(upsAndDownsExample(0.172)).toBe("e.g. a €10,000 year could end between €8,280 and €11,720.");
    expect(upsAndDownsExample(0)).toBe("0: it grows the same every year.");
    expect(upsAndDownsExample(1)).toBe("e.g. a €10,000 year could end between €0 and €20,000.");
  });
});

describe("the note under it", () => {
  it("says gold protects rather than grows", () => {
    expect(assumptionsNote(resolveInvestment({ kind: "asset", asset: "gold" }, []))).toMatch(/^Low long-term growth, big ups and downs: gold protects, it hardly grows\. Past, not a promise\./);
  });

  it("says My portfolio's figures come from the past", () => {
    expect(assumptionsNote(resolveInvestment({ kind: "portfolio" }, [holding]))).toBe("Past, not a promise. Amounts in today's euros.");
  });

  it("says when dividends are left out, and that amounts are in today's euros", () => {
    expect(assumptionsNote(resolveInvestment({ kind: "asset", asset: "nasdaq100" }, []))).toBe(
      "Price only: dividends (roughly 1% a year) not included. Past, not a promise. Amounts in today's euros.",
    );
  });
});
