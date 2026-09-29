import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSettler, SETTLE_DELAY_MS } from "./settle";

describe("createSettler", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("applies only the last value, 500 ms after the last keystroke", () => {
    const applied: number[] = [];
    const settler = createSettler<number>((value) => applied.push(value));
    // Typing "1000", 150 ms between keys: 1, 10, 100 are never applied.
    for (const value of [1, 10, 100, 1000]) {
      settler.typed(value);
      vi.advanceTimersByTime(150);
    }
    expect(applied).toEqual([]);
    vi.advanceTimersByTime(SETTLE_DELAY_MS - 150 - 1);
    expect(applied).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(applied).toEqual([1000]);
  });

  it("applies at once when the user leaves the field, and only once", () => {
    const applied: number[] = [];
    const settler = createSettler<number>((value) => applied.push(value));
    settler.typed(250);
    settler.flush();
    expect(applied).toEqual([250]);
    vi.advanceTimersByTime(SETTLE_DELAY_MS * 2);
    settler.flush();
    expect(applied).toEqual([250]);
  });

  it("drops a pending value when the text stops reading as one", () => {
    const applied: number[] = [];
    const settler = createSettler<number>((value) => applied.push(value));
    settler.typed(12);
    settler.cancel();
    vi.advanceTimersByTime(SETTLE_DELAY_MS);
    settler.flush();
    expect(applied).toEqual([]);
  });

  it("applies each pause's value when the user stops more than once", () => {
    const applied: number[] = [];
    const settler = createSettler<number>((value) => applied.push(value));
    settler.typed(5);
    vi.advanceTimersByTime(SETTLE_DELAY_MS);
    settler.typed(50);
    vi.advanceTimersByTime(SETTLE_DELAY_MS);
    expect(applied).toEqual([5, 50]);
  });
});
