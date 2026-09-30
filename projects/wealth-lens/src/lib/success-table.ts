/**
 * How often 3, 4 and 5 % a year lasted 30 years, for each asset with a
 * history, worked out ahead so the first screen simulates nothing. The
 * simulation is seeded, so these are exactly what lib/monte-carlo.ts gives
 * for the same history; success-table.test.ts recomputes them and fails if
 * the data change.
 */
export const PRECOMPUTED_SUCCESS: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  "asset:sp500": { "0.0300": 0.977, "0.0400": 0.9288, "0.0500": 0.8556 },
  "asset:world": { "0.0300": 0.885, "0.0400": 0.7662, "0.0500": 0.619 },
  "asset:nasdaq100": { "0.0300": 0.916, "0.0400": 0.8576, "0.0500": 0.784 },
  "asset:bonds": { "0.0300": 0.9532, "0.0400": 0.745, "0.0500": 0.382 },
  "asset:gold": { "0.0300": 0.6966, "0.0400": 0.4462, "0.0500": 0.245 },
};
