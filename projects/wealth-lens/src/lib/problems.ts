/**
 * What went wrong reading a file or a form, or what a loaded file had that
 * the app no longer does: a code and its values. The words are in the
 * dictionaries (`problems` in src/i18n/messages), so every language says it
 * its own way; this code never writes a sentence.
 */

type None = Record<never, never>;

export interface ProblemValues {
  // Any file.
  "file-unreadable": { file: string };
  // Data files.
  "data-not-json": None;
  "data-not-ours": None;
  "data-newer": None;
  /** A single stock or a stock in a mix (versions 5 to 10): counted as US stocks now. */
  "stocks-now-us": None;
  /** World stocks or the Nasdaq-100 (versions 1 to 10): no open data, so US stocks now. */
  "series-retired": { series: string };
  /** My portfolio (versions 6 to 10): holdings are no longer kept, and the plan invests in US stocks. */
  "portfolio-retired": None;
  /** Holdings beside a plan that did not invest in them (versions 1 to 10): no longer kept; the plan is unchanged. */
  "holdings-retired": None;
  /** Goals to live in a country (versions 1 to 10): the cost is now one official figure, housing included. */
  "country-costs-official": None;
  /** Goals that were things of the old price list: there is no list any more. */
  "goal-items-retired": { count: number };
}

export type ProblemCode = keyof ProblemValues;

export type Problem = { [K in ProblemCode]: { code: K } & ProblemValues[K] }[ProblemCode];

/** How a dictionary says each problem. */
export type ProblemTexts = { [K in ProblemCode]: (values: ProblemValues[K]) => string };

export function problem<K extends ProblemCode>(code: K, ...values: None extends ProblemValues[K] ? [] : [ProblemValues[K]]): Problem {
  return { code, ...(values[0] ?? {}) } as Problem;
}

/** A problem in words, with the texts of one language. */
export function problemText(item: Problem, texts: ProblemTexts): string {
  return (texts[item.code] as (values: Problem) => string)(item);
}
