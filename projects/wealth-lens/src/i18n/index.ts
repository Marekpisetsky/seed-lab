/**
 * The app's words and formats in one language: `m`, the dictionary
 * (messages/en.ts, messages/es.ts), and `f`, numbers, money and spans of
 * time as that language writes them. Pure and made once per language, so
 * the server (the static pages) and the browser write the same text.
 */

import type { Locale } from "./locales";
import { createI18n, type I18n } from "./make";
import { en, type Messages } from "./messages/en";
import { es } from "./messages/es";

export type { Formats, I18n } from "./make";

const MESSAGES: Readonly<Record<Locale, Messages>> = { en, es };

const made = new Map<Locale, I18n>();

export function getI18n(locale: Locale): I18n {
  let i18n = made.get(locale);
  if (!i18n) {
    i18n = createI18n(locale, MESSAGES[locale]);
    made.set(locale, i18n);
  }
  return i18n;
}

/** English: the default for tests and for code that has no reader. */
export const EN = getI18n("en");
