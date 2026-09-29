import { describe, expect, it } from "vitest";
import { latestPriceUpdate } from "./auto-price";
import type { Holding } from "./types";

const points = [
  { time: "2026-09-24", close: 130 },
  { time: "2026-09-25", close: 131.5 },
];
const holding: Holding = {
  id: "1",
  ticker: "VWCE",
  quantity: 10,
  costBasis: 1000,
  currency: "EUR",
  currentPrice: null,
  priceSource: "auto",
  priceDate: null,
};

describe("latestPriceUpdate", () => {
  it("fills an automatic price with the latest close and its date", () => {
    expect(latestPriceUpdate(holding, "EUR", points)).toEqual({ currentPrice: 131.5, priceDate: "2026-09-25" });
  });

  it("never overwrites a price typed by the user", () => {
    expect(latestPriceUpdate({ ...holding, currentPrice: 120, priceSource: "manual" }, "EUR", points)).toBeNull();
  });

  it("skips series quoted in another currency", () => {
    expect(latestPriceUpdate(holding, "USD", points)).toBeNull();
    expect(latestPriceUpdate({ ...holding, currency: "GBP" }, "GBX", points)).toBeNull(); // pence
    expect(latestPriceUpdate(holding, null, points)).toBeNull(); // unknown currency
  });

  it("does nothing when already up to date or without data", () => {
    expect(latestPriceUpdate({ ...holding, currentPrice: 131.5, priceDate: "2026-09-25" }, "EUR", points)).toBeNull();
    expect(latestPriceUpdate(holding, "EUR", [])).toBeNull();
  });
});
