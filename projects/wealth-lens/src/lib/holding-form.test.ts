import { describe, expect, it } from "vitest";
import { EMPTY_HOLDING_FORM, holdingToFormValues, validateHoldingForm } from "./holding-form";

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
    const holding = { id: "1", ticker: "AAPL", quantity: 1.5, costBasis: 280, currency: "USD", currentPrice: 190 };
    const result = validateHoldingForm(holdingToFormValues(holding));
    expect(result).toEqual({ ok: true, value: { ticker: "AAPL", quantity: 1.5, costBasis: 280, currency: "USD", currentPrice: 190 } });
  });
});
