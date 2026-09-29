import { describe, expect, it } from "vitest";
import { EMPTY_HOLDING_FORM, holdingToFormValues, validateHoldingForm, withPriceSource } from "./holding-form";
import type { Holding } from "./types";

describe("validateHoldingForm", () => {
  it("normalizes and accepts valid input", () => {
    expect(
      validateHoldingForm({ ticker: " vwce ", quantity: "12,5", costBasis: "1.250,40", currency: "eur", currentPrice: "" }),
    ).toEqual({
      ok: true,
      value: { ticker: "VWCE", quantity: 12.5, costBasis: 1250.4, currency: "EUR", currentPrice: null },
    });
  });

  it("reads an optional current price", () => {
    const result = validateHoldingForm({ ...EMPTY_HOLDING_FORM, ticker: "A", quantity: "1", costBasis: "10", currentPrice: "12.5" });
    expect(result.ok && result.value.currentPrice).toBe(12.5);
  });

  it("reports every invalid field", () => {
    expect(
      validateHoldingForm({ ticker: "", quantity: "0", costBasis: "-5", currency: "euro", currentPrice: "abc" }),
    ).toEqual({
      ok: false,
      errors: {
        ticker: "Enter a ticker.",
        quantity: "Enter a number of shares above 0.",
        costBasis: "Enter the total amount paid (0 or more).",
        currency: "Use a 3-letter code such as EUR or USD.",
        currentPrice: "Enter a price of 0 or more, or leave it empty.",
      },
    });
  });

  it("round-trips a holding through the form values", () => {
    const holding = {
      id: "1",
      ticker: "AAPL",
      quantity: 1.5,
      costBasis: 280,
      currency: "USD",
      currentPrice: 190,
      priceSource: "manual" as const,
      priceDate: null,
    };
    const result = validateHoldingForm(holdingToFormValues(holding));
    expect(result).toEqual({ ok: true, value: { ticker: "AAPL", quantity: 1.5, costBasis: 280, currency: "USD", currentPrice: 190 } });
  });
});

describe("withPriceSource", () => {
  const input = { ticker: "VWCE", quantity: 10, costBasis: 1000, currency: "EUR", currentPrice: 131.5 };
  const auto: Holding = { ...input, id: "1", priceSource: "auto", priceDate: "2026-09-25" };

  it("marks a typed price on a new holding as manual", () => {
    expect(withPriceSource(input, null)).toMatchObject({ priceSource: "manual", priceDate: null });
  });

  it("leaves a new holding without price to the automatic source", () => {
    expect(withPriceSource({ ...input, currentPrice: null }, null)).toMatchObject({ priceSource: "auto" });
  });

  it("keeps an unchanged automatic price automatic", () => {
    expect(withPriceSource({ ...input, quantity: 12 }, auto)).toMatchObject({
      currentPrice: 131.5,
      priceSource: "auto",
      priceDate: "2026-09-25",
    });
  });

  it("turns an edited price into a manual one", () => {
    expect(withPriceSource({ ...input, currentPrice: 140 }, auto)).toMatchObject({
      currentPrice: 140,
      priceSource: "manual",
      priceDate: null,
    });
  });

  it("gives the price back to the automatic source when it is cleared", () => {
    const manual: Holding = { ...auto, priceSource: "manual", priceDate: null };
    expect(withPriceSource({ ...input, currentPrice: null }, manual)).toMatchObject({ priceSource: "auto" });
  });

  it("drops an automatic price when the instrument changes", () => {
    expect(withPriceSource({ ...input, ticker: "VUAA" }, auto)).toMatchObject({
      currentPrice: null,
      priceSource: "auto",
      priceDate: null,
    });
  });
});
