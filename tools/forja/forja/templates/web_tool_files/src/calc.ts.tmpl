/**
 * The calculation: how much a number changed from before to after, in its
 * own units and in percent. Pure (no page, no browser), so the page built
 * ahead, the browser and the tests all run the same code.
 *
 * This is Forja's example: replace it with the tool's own calculation,
 * and its tests in test/calc.test.ts.
 */

export interface Change {
  before: number;
  after: number;
  /** after − before. */
  amount: number;
  /** The change against the size of `before` (0.25 is 25 %); null from 0, where a percent means nothing. */
  fraction: number | null;
}

/** The change between two numbers; null when either is not a number. */
export function change(before: number, after: number): Change | null {
  if (!Number.isFinite(before) || !Number.isFinite(after)) return null;
  const amount = after - before;
  return { before, after, amount, fraction: before === 0 ? null : amount / Math.abs(before) };
}
