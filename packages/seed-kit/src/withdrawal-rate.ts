/**
 * The withdrawal rate the data back: the largest yearly withdrawal,
 * a share of the money at the start and then kept constant after rising
 * prices, that would have lasted `years` years from every start the data
 * have, the worst included (Bengen, 1994; the "Trinity study", Cooley,
 * Hubbard and Walz, 1998). Pure and small: every Horalis tool can use it
 * in the browser (research/wealth-lens/tasa-de-retiro.md).
 *
 * Each year's withdrawal is taken at its start, then the rest grows with
 * that year's return after inflation. A path of returns r₁…r_N lasts N
 * withdrawals of w when
 *
 *   w × (1 + 1/(1+r₁) + 1/((1+r₁)(1+r₂)) + … + 1/((1+r₁)…(1+r_{N−1}))) ≤ 1,
 *
 * so the largest rate a path allows is 1 over that sum (every earlier
 * balance is then above zero too: the sum only grows).
 */

/** Fewer starts than this behind a rate: the page says it is a rough guide. */
export const FEW_PERIODS = 10;

/** One year of a history: its return after inflation (0.07 = 7 %). */
export interface YearReturn {
  year: number;
  realReturn: number;
}

/** The largest constant withdrawal (a share of the start) that a run of yearly returns pays for `returns.length` years; 0 if the money is lost. */
export function maxRate(returns: readonly number[]): number {
  if (returns.length === 0) throw new RangeError("returns must not be empty");
  let sum = 0;
  let discount = 1;
  for (let index = 0; index < returns.length; index += 1) {
    sum += discount;
    const factor = 1 + returns[index];
    if (!(factor > 0) || !Number.isFinite(factor)) {
      // Everything lost in a year (or a broken figure): only the withdrawals before it were paid.
      return index === returns.length - 1 ? 1 / sum : 0;
    }
    discount /= factor;
  }
  return 1 / sum;
}

export interface SafeRate {
  /** The rate that lasted from every start: the lowest of the starts' largest rates. */
  rate: number;
  /** The years it lasts: the ones asked for, or fewer when the data are shorter. */
  years: number;
  /** The years asked for. */
  askedYears: number;
  /** How many starts of `years` years the data have: the periods behind the rate. */
  periods: number;
  /** Fewer than FEW_PERIODS, or fewer years than asked: a rough guide, and the page says so. */
  few: boolean;
  /** The worst start: the year whose run allowed the lowest rate. */
  worstStart: number;
  /** The years the data cover. */
  from: number;
  to: number;
}

/**
 * The rate that would have lasted `years` years from every start in
 * `history` (consecutive years, oldest first), and the periods behind it.
 * With fewer years of data than asked, it uses them all (one period) and
 * says so (`years` < `askedYears`, `few`).
 */
export function safeRate(history: readonly YearReturn[], years: number): SafeRate {
  if (history.length === 0) throw new RangeError("history must not be empty");
  if (!Number.isInteger(years) || years < 1) throw new RangeError(`years must be a whole number from 1, got ${years}`);
  for (let index = 1; index < history.length; index += 1) {
    if (history[index].year !== history[index - 1].year + 1) throw new RangeError(`${history[index].year} does not follow ${history[index - 1].year}`);
  }
  const span = Math.min(years, history.length);
  const returns = history.map((entry) => entry.realReturn);
  let rate = Number.POSITIVE_INFINITY;
  let worstStart = history[0].year;
  for (let start = 0; start + span <= history.length; start += 1) {
    const allowed = maxRate(returns.slice(start, start + span));
    if (allowed < rate) {
      rate = allowed;
      worstStart = history[start].year;
    }
  }
  const periods = history.length - span + 1;
  return {
    rate,
    years: span,
    askedYears: years,
    periods,
    few: periods < FEW_PERIODS || span < years,
    worstStart,
    from: history[0].year,
    to: history[history.length - 1].year,
  };
}

/** The rate a constant yearly return pays for `years` years (a savings account; no history): the same sum, every year alike. */
export function steadyRate(realReturn: number, years: number): number {
  if (!Number.isInteger(years) || years < 1) throw new RangeError(`years must be a whole number from 1, got ${years}`);
  return maxRate(Array.from({ length: years }, () => realReturn));
}

export interface CrashOutcome {
  /** The withdrawals it paid, in years: `years` when it lasted. */
  lasted: number;
  /** Whether it paid every year. */
  lastsAll: boolean;
  /** What is left after the last year, as a share of the start (0 when it ran out). */
  left: number;
}

/**
 * "Mi %" has no history: what a fall at the very start would do. The first
 * year returns `crash` (−0.37: a fall like the worst year of the most
 * similar asset); every later year, the steady `growth`. A withdrawal of
 * `rate` of the start, every year, for up to `years` years.
 */
export function withEarlyCrash(rate: number, growth: number, crash: number, years: number): CrashOutcome {
  let balance = 1;
  for (let year = 1; year <= years; year += 1) {
    if (balance < rate - 1e-12) return { lasted: year - 1, lastsAll: false, left: 0 };
    balance = (balance - rate) * (1 + (year === 1 ? crash : growth));
    if (balance <= 0) return { lasted: year, lastsAll: year === years, left: 0 };
  }
  return { lasted: years, lastsAll: true, left: balance };
}
