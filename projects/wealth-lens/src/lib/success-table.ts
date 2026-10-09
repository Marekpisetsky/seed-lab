/**
 * How often each rate of the slider (2 % to 7 %, every 0.5 %) lasted 30
 * years, for each asset with a history and for the starting plan (Custom
 * growth at 5 %, with US stocks' ups and downs), worked out ahead so a
 * first result and the slider simulate nothing. The simulation is seeded,
 * so these are exactly what lib/monte-carlo.ts gives for the same history;
 * success-table.test.ts recomputes them and fails if the data change.
 */
export const PRECOMPUTED_SUCCESS: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  "asset:sp500": { "0.0200": 0.9956, "0.0250": 0.9904, "0.0300": 0.977, "0.0350": 0.9574, "0.0400": 0.9288, "0.0450": 0.895, "0.0500": 0.8556, "0.0550": 0.8066, "0.0600": 0.7524, "0.0650": 0.6844, "0.0700": 0.6214 },
  "asset:bonds": { "0.0200": 0.997, "0.0250": 0.987, "0.0300": 0.9532, "0.0350": 0.8666, "0.0400": 0.745, "0.0450": 0.5726, "0.0500": 0.382, "0.0550": 0.2172, "0.0600": 0.1054, "0.0650": 0.0448, "0.0700": 0.0134 },
  "asset:gold": { "0.0200": 0.9152, "0.0250": 0.818, "0.0300": 0.693, "0.0350": 0.5636, "0.0400": 0.4434, "0.0450": 0.3338, "0.0500": 0.2356, "0.0550": 0.1666, "0.0600": 0.1182, "0.0650": 0.0764, "0.0700": 0.0492 },
  "normal:0.050000:0.163877": { "0.0200": 0.986, "0.0250": 0.9644, "0.0300": 0.9336, "0.0350": 0.8828, "0.0400": 0.8184, "0.0450": 0.7482, "0.0500": 0.6662, "0.0550": 0.5852, "0.0600": 0.5052, "0.0650": 0.4308, "0.0700": 0.3616 },
};
