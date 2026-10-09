import { describe, expect, it } from "vitest";
import { parseLooseNumber } from "./number";

describe("parseLooseNumber", () => {
  it.each([
    ["1234.5", 1234.5],
    ["1,234.50", 1234.5],
    ["1.234,50", 1234.5],
    ["1234,5", 1234.5],
    ["0,123", 0.123],
    ["1,234", 1234],
    ["1.234.567", 1234567],
    ["1.234", 1.234],
    ["€ 1 234,56", 1234.56],
    ["1'234.50", 1234.5],
    ["-12.5%", -12.5],
    ["USD 99", 99],
    [".5", 0.5],
    ["2.0000000000", 2],
  ])("reads %j as %d", (raw, expected) => {
    expect(parseLooseNumber(raw)).toBeCloseTo(expected, 10);
  });

  it.each(["", "   ", "abc", "1.2.3,4,5", "--1", "12abc34", undefined])("rejects %j", (raw) => {
    expect(parseLooseNumber(raw)).toBeNull();
  });

  it.each([
    ["10.000", 10_000],
    ["1.000,5", 1000.5],
    ["1,5", 1.5],
    ["1,234", 1.234],
    ["7.5", 7.5],
    ["0.125", 0.125],
    ["1.234.567", 1_234_567],
    ["1,234.5", 1234.5],
  ])("reads %j the Spanish way (decimal comma) as %d", (raw, expected) => {
    expect(parseLooseNumber(raw, true)).toBeCloseTo(expected, 10);
  });
});
