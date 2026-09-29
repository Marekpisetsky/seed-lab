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
    expect(latestPriceUpdate(holding, "vwce.de", points)).toEqual({ currentPrice: 131.5, priceDate: "2026-09-25" });
  });

  it("never overwrites a price typed by the user", () => {
    expect(latestPriceUpdate({ ...holding, currentPrice: 120, priceSource: "manual" }, "vwce.de", points)).toBeNull();
  });

  it("skips series quoted in another currency", () => {
    expect(latestPriceUpdate(holding, "vwce.us", points)).toBeNull();
    expect(latestPriceUpdate({ ...holding, currency: "GBP" }, "vusa.uk", points)).toBeNull(); // pence
  });

  it("does nothing when already up to date or without data", () => {
    expect(latestPriceUpdate({ ...holding, currentPrice: 131.5, priceDate: "2026-09-25" }, "vwce.de", points)).toBeNull();
    expect(latestPriceUpdate(holding, "vwce.de", [])).toBeNull();
  });
});
