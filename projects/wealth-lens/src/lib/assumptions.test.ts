import { describe, expect, it } from "vitest";
import { assumptionsLine, assumptionsNote, growthIn, swingsText } from "./assumptions";
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
  it("says the growth, the swings and the years they come from", () => {
    const sp500 = resolveInvestment({ kind: "asset", asset: "sp500" }, []);
    expect(assumptionsLine(sp500, "real")).toMatch(/^7\.5% a year after inflation · swings ±1\d% · 1988–2022$/);
  });

  it("can show the growth before inflation, with the country's inflation", () => {
    const sp500 = resolveInvestment({ kind: "asset", asset: "sp500" }, []);
    expect(growthIn(sp500, "nominal")).toBeCloseTo((1 + sp500.realReturn) * 1.02 - 1, 12);
    expect(assumptionsLine(sp500, "nominal")).toMatch(/^9\.\d% a year before inflation · /);
  });

  it("gives a savings account its interest and inflation, and no swings", () => {
    const savings = resolveInvestment({ kind: "asset", asset: "savings" }, []);
    expect(assumptionsLine(savings, "real")).toBe("-0.5% a year after inflation · no swings · 1.5% interest, 2% inflation");
    expect(assumptionsLine(savings, "nominal")).toBe("1.5% a year before inflation · no swings · 1.5% interest, 2% inflation");
  });

  it("says when the figures are the user's", () => {
    const changed = resolveInvestment({ kind: "asset", asset: "world" }, [], { pricesOf: "NL", assumptions: { ...STANDARD_ASSUMPTIONS, growth: { rate: 0.04, basis: "real" } } });
    expect(assumptionsLine(changed, "real")).toMatch(/^4% a year after inflation · swings ±\d+% · your figures, not the data$/);
    expect(assumptionsLine(resolveInvestment({ kind: "custom" }, []), "real")).toMatch(/ · your figures$/);
  });

  it("writes swings as a plus-minus spread", () => {
    expect(swingsText(0.172)).toBe("swings ±17%");
    expect(swingsText(0)).toBe("no swings");
  });
});

describe("the note under it", () => {
  it("says gold protects rather than grows", () => {
    expect(assumptionsNote(resolveInvestment({ kind: "asset", asset: "gold" }, []))).toMatch(/^Low long-term growth, big swings: gold protects, it hardly grows\. Past, not a promise\./);
  });

  it("says My portfolio is a simple projection", () => {
    expect(assumptionsNote(resolveInvestment({ kind: "portfolio" }, [holding]))).toMatch(
      /^Simple projection: each stock grows like its index\. Stocks can't be predicted\./,
    );
  });

  it("says when dividends are left out, and that amounts are in today's euros", () => {
    expect(assumptionsNote(resolveInvestment({ kind: "asset", asset: "nasdaq100" }, []))).toBe(
      "Price only: dividends (roughly 1% a year) not included. Past, not a promise. Amounts in today's euros.",
    );
  });
});
