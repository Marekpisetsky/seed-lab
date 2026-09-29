/**
 * How often does a fixed withdrawal rate survive 30 years? A Monte Carlo
 * bootstrap over historical annual real returns: those of what the plan
 * invests in (lib/investment.ts), from the index datasets in src/data/.
 *
 * Model
 * - The portfolio starts at 1 and is 100 % stocks. Returns are real, so
 *   amounts are in today's money.
 * - Each year the same real amount is withdrawn (withdrawalRate × starting
 *   capital: the "4 % rule" adjusted for inflation), at the start of the
 *   year, and the rest earns that year's return.
 * - A scenario draws each year's return at random, with replacement, from
 *   the historical years (i.i.d. bootstrap). This keeps the real spread of
 *   good and bad years but not their historical order or streaks.
 * - A scenario succeeds if money is left after the last withdrawal.
 * - The random generator is seeded, so results are reproducible.
 */

/** Mulberry32: a tiny, fast, seedable PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Plays one sequence of annual returns: withdraw at the start of each year,
 * then apply the return. True if the money never runs out.
 */
export function survives(returns: readonly number[], withdrawalRate: number): boolean {
  let balance = 1;
  for (const annualReturn of returns) {
    balance -= withdrawalRate;
    if (balance <= 0) return false;
    balance *= 1 + annualReturn;
  }
  return true;
}

export interface SuccessRateOptions {
  withdrawalRate: number;
  /** Pool of annual real returns to draw from. */
  returns: readonly number[];
  years?: number;
  simulations?: number;
  seed?: number;
}

export const DEFAULT_SIMULATIONS = 5000;
export const DEFAULT_YEARS = 30;
export const DEFAULT_SEED = 20260929;

/** Share of simulated scenarios (0–1) in which the money lasts `years` years. */
export function successRate({
  withdrawalRate,
  returns,
  years = DEFAULT_YEARS,
  simulations = DEFAULT_SIMULATIONS,
  seed = DEFAULT_SEED,
}: SuccessRateOptions): number {
  if (returns.length === 0) throw new RangeError("returns must not be empty");
  if (!(withdrawalRate >= 0)) throw new RangeError(`withdrawalRate must be 0 or more, got ${withdrawalRate}`);
  const random = mulberry32(seed);
  const sequence = new Array<number>(years);
  let successes = 0;
  for (let run = 0; run < simulations; run++) {
    for (let year = 0; year < years; year++) {
      sequence[year] = returns[Math.floor(random() * returns.length)];
    }
    if (survives(sequence, withdrawalRate)) successes += 1;
  }
  return successes / simulations;
}

/**
 * `successRate` for several withdrawal rates at once, over the very same
 * simulated sequences: drawing the returns is most of the work, so this
 * costs little more than a single rate. Same seed, same results as calling
 * `successRate` for each rate.
 */
export function successRates({
  withdrawalRates,
  returns,
  years = DEFAULT_YEARS,
  simulations = DEFAULT_SIMULATIONS,
  seed = DEFAULT_SEED,
}: Omit<SuccessRateOptions, "withdrawalRate"> & { withdrawalRates: readonly number[] }): number[] {
  if (returns.length === 0) throw new RangeError("returns must not be empty");
  const random = mulberry32(seed);
  const sequence = new Array<number>(years);
  const successes = withdrawalRates.map(() => 0);
  for (let run = 0; run < simulations; run++) {
    for (let year = 0; year < years; year++) {
      sequence[year] = returns[Math.floor(random() * returns.length)];
    }
    withdrawalRates.forEach((rate, index) => {
      if (survives(sequence, rate)) successes[index] += 1;
    });
  }
  return successes.map((count) => count / simulations);
}

