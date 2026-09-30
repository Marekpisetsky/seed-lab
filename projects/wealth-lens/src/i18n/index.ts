/**
 * The app's words and formats in one language: `m`, the dictionary
 * (messages/en.ts, messages/es.ts), and `f`, numbers, money and spans of
 * time as that language writes them. Pure and made once per language, so
 * the server (the static pages) and the browser write the same text.
 */

import { addMonths } from "@/lib/dates";
import { numberFormats, type NumberFormats } from "@/lib/format";
import { LOCALE_SETTINGS, type Locale } from "./locales";
import { en, type Messages } from "./messages/en";
import { es } from "./messages/es";

const MESSAGES: Readonly<Record<Locale, Messages>> = { en, es };

export interface Formats extends NumberFormats {
  /** Months → "9 years 8 months" (partial months round up). */
  duration(months: number): string;
  /** Months → what a person would say: 3 → "3 months", 18 → "2 years". */
  span(months: number): string;
  /** When the plan gets somewhere: "now", "in 12 years (2038)", "not at this pace". */
  when(months: number, today?: Date): string;
}

export interface I18n {
  locale: Locale;
  m: Messages;
  f: Formats;
}

/** Beyond this a date is not a plan (calculator.ts MAX_YEARS). */
const MAX_MONTHS = 60 * 12;

function createI18n(locale: Locale): I18n {
  const m = MESSAGES[locale];
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
  };
  return { locale, m, f };
}

const made = new Map<Locale, I18n>();

export function getI18n(locale: Locale): I18n {
  let i18n = made.get(locale);
  if (!i18n) {
    i18n = createI18n(locale);
    made.set(locale, i18n);
  }
  return i18n;
}

/** English: the default for tests and for code that has no reader. */
export const EN = getI18n("en");
