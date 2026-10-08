/**
 * The words and formats of one language, made from its dictionary. Apart
 * from index.ts, so a page's code holds only its own language's words
 * (components/i18n-en.tsx, i18n-es.tsx).
 */

import { addMonths } from "@/lib/dates";
import { numberFormats, type NumberFormats } from "@/lib/format";
import { LOCALE_SETTINGS, type Locale } from "./locales";
import type { Messages } from "./messages/en";
import type { PageMessages } from "./messages/en-pages";

export interface Formats extends NumberFormats {
  /** Months → "9 years 8 months" (partial months round up). */
  duration(months: number): string;
  /** Months → what a person would say: 3 → "3 months", 18 → "2 years". */
  span(months: number): string;
  /** When the plan gets somewhere: "now", "in 12 years (2038)", "not at this pace". */
  when(months: number, today?: Date): string;
  /**
   * When the plan gets somewhere, against its own years, always with a date:
   * by then it is reached (✓ "from 2031, in 5 years", "from today"); later,
   * "in 25 years (2051)"; past 60 years, "not at this pace".
   */
  reach(months: number, horizonMonths: number, today: Date): Reach;
  /** Whole euros, but "under €1" for a few cents: €1 invested pays €0.003 a month, not €0. */
  smallEur(amount: number): string;
}

/** When the plan gets somewhere, in one line (`text`) and in two short ones for a narrow cell (`lines`). */
export interface Reach {
  reached: boolean;
  text: string;
  lines: readonly [string, string];
}

export interface I18n {
  locale: Locale;
  m: Messages;
  f: Formats;
}

/**
 * The server's words: also those of the pages it writes whole (About, How
 * it works, Privacy, Terms, titles). The browser's `I18n` has no need of
 * them, so they stay out of its code (messages/en-pages.ts).
 */
export interface PageI18n extends I18n {
  m: Messages & PageMessages;
}

/** Beyond this a date is not a plan (calculator.ts MAX_YEARS). */
const MAX_MONTHS = 60 * 12;

export function createI18n(locale: Locale, m: Messages): I18n {
  const numbers = numberFormats(LOCALE_SETTINGS[locale].intl);
  const { months: monthsText, years: yearsText } = m.units;
  const f: Formats = {
    ...numbers,
    duration(months) {
      if (!Number.isFinite(months)) return m.units.never;
      const total = Math.max(0, Math.ceil(months - 1e-9));
      const years = Math.floor(total / 12);
      const rest = total % 12;
      if (years === 0) return monthsText(rest);
      if (rest === 0) return yearsText(years);
      return `${yearsText(years)} ${monthsText(rest)}`;
    },
    span(months) {
      if (!Number.isFinite(months)) return m.units.never;
      const abs = Math.abs(months);
      if (abs < 11.5) return monthsText(Math.max(1, Math.round(abs)));
      return yearsText(Math.round(abs / 12));
    },
    when(months, today) {
      // A few billionths of a month is now: never "in 0 months".
      if (months <= 1e-9) return m.when.now;
      if (!(months <= MAX_MONTHS)) return m.when.notAtThisPace;
      const whole = Math.ceil(months - 1e-9);
      const span = whole < 12 ? monthsText(whole) : yearsText(Math.ceil(whole / 12));
      return m.when.inSpan(span, today ? addMonths(today, whole).getUTCFullYear() : null);
    },
    reach(months, horizonMonths, today) {
      if (months <= 1e-9) return { reached: true, text: m.when.fromToday, lines: [m.when.fromToday, ""] };
      if (!(months <= MAX_MONTHS)) return { reached: false, text: m.when.notAtThisPace, lines: [m.when.notAtThisPace, ""] };
      const whole = Math.ceil(months - 1e-9);
      const span = whole < 12 ? monthsText(whole) : yearsText(Math.ceil(whole / 12));
      const year = addMonths(today, whole).getUTCFullYear();
      return months <= horizonMonths + 1e-9
        ? { reached: true, text: m.when.from(year, span), lines: [m.when.since(year), m.when.inSpan(span, null)] }
        : { reached: false, text: m.when.inSpan(span, year), lines: [m.when.inSpan(span, null), `(${year})`] };
    },
    smallEur(amount) {
      return amount > 0 && amount < 0.5 ? m.result.underOne : numbers.eur(amount);
    },
  };
  return { locale, m, f };
}
