/**
 * Validation for the add/edit holding form, kept out of the component so it
 * can be tested. Numbers are read with the same tolerant parser as CSV files,
 * so "1.234,50" and "1,234.50" both work.
 */

import { parseLooseNumber } from "./csv";
import type { Holding } from "./types";

export interface HoldingFormValues {
  ticker: string;
  quantity: string;
  costBasis: string;
  currency: string;
  currentPrice: string;
}

export type HoldingFormErrors = Partial<Record<keyof HoldingFormValues, string>>;

export type HoldingFormResult =
  | { ok: true; value: Omit<Holding, "id"> }
  | { ok: false; errors: HoldingFormErrors };

export const EMPTY_HOLDING_FORM: HoldingFormValues = {
  ticker: "",
  quantity: "",
  costBasis: "",
  currency: "EUR",
  currentPrice: "",
};

export function holdingToFormValues(holding: Holding): HoldingFormValues {
  return {
    ticker: holding.ticker,
    quantity: String(holding.quantity),
    costBasis: String(holding.costBasis),
    currency: holding.currency,
    currentPrice: holding.currentPrice === null ? "" : String(holding.currentPrice),
  };
}

export function validateHoldingForm(values: HoldingFormValues): HoldingFormResult {
  const errors: HoldingFormErrors = {};

  const ticker = values.ticker.trim().toUpperCase();
  if (ticker === "") errors.ticker = "Enter a ticker.";
  else if (ticker.length > 20) errors.ticker = "Use at most 20 characters.";

  const quantity = parseLooseNumber(values.quantity);
  if (quantity === null || quantity <= 0) errors.quantity = "Enter a number of shares above 0.";

  const costBasis = parseLooseNumber(values.costBasis);
  if (costBasis === null || costBasis < 0) errors.costBasis = "Enter the total amount paid (0 or more).";

  const currency = values.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) errors.currency = "Use a 3-letter code such as EUR or USD.";

  let currentPrice: number | null = null;
  if (values.currentPrice.trim() !== "") {
    currentPrice = parseLooseNumber(values.currentPrice);
    if (currentPrice === null || currentPrice < 0) errors.currentPrice = "Enter a price of 0 or more, or leave it empty.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { ticker, quantity: quantity!, costBasis: costBasis!, currency, currentPrice },
  };
}
