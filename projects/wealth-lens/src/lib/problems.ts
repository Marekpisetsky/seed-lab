/**
 * What went wrong reading a file or a form, or what a loaded file had that
 * the app no longer does: a code and its values. The words are in the
 * dictionaries (`problems` in src/i18n/messages), so every language says it
 * its own way; this code never writes a sentence.
 */

import type { IndexId } from "./index-ids";

type None = Record<never, never>;

export interface ProblemValues {
  // Any file.
  "file-unreadable": { file: string };
  "file-empty": None;
  "file-no-rows": None;
  "file-unknown": { columns: string };
  // Holdings files.
  "holdings-missing-columns": { columns: string; expected: string };
  "t212-missing-columns": { columns: string };
  "t212-unsupported": { action: string };
  "missing-ticker": None;
  "bad-quantity": { ticker: string; raw: string };
  "bad-cost": { ticker: string };
  "bad-currency": { ticker: string; raw: string };
  "negative-price": { ticker: string };
  "bad-price": { ticker: string; raw: string };
  "bad-shares": { ticker: string; raw: string };
  "bad-share-price": { ticker: string; raw: string };
  "currency-differs": { ticker: string; currency: string; earlier: string };
  oversold: { ticker: string; shares: number; held: number };
  // Price files.
  "prices-no-columns": None;
  "prices-no-rows": None;
  // Data files.
  "data-not-json": None;
  "data-not-ours": None;
  "data-newer": None;
  "stock-now-portfolio": { name: string };
  "stock-now-index": { name: string; index: IndexId };
  "mix-had-stocks": None;
  // The holding form.
  "form-ticker-empty": None;
  "form-ticker-long": None;
  "form-quantity": None;
  "form-cost": None;
  "form-currency": None;
  "form-price": None;
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
