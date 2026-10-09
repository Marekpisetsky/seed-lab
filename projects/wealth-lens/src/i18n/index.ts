/**
 * The app's words and formats in one language: `m`, the dictionary
 * (messages/en.ts, es.ts, nl.ts, and the server-only pages' words in
 * messages/en-pages.ts, es-pages.ts, nl-pages.ts), and `f`, numbers, money and spans of
 * time as that language writes them. Pure and made once per language, so
 * the server (the static pages) and the browser write the same text.
 */

import type { Locale } from "./locales";
import { createI18n, type PageI18n } from "./make";
import { en, type Messages } from "./messages/en";
import { enPages, type PageMessages } from "./messages/en-pages";
import { es } from "./messages/es";
import { esPages } from "./messages/es-pages";
import { nl } from "./messages/nl";
import { nlPages } from "./messages/nl-pages";

export type { Formats, I18n, PageI18n, Reach } from "./make";

const MESSAGES: Readonly<Record<Locale, Messages>> = { en, es, nl };
const PAGES: Readonly<Record<Locale, PageMessages>> = { en: enPages, es: esPages, nl: nlPages };

const made = new Map<Locale, PageI18n>();

export function getI18n(locale: Locale): PageI18n {
  let i18n = made.get(locale);
  if (!i18n) {
    const words = createI18n(locale, MESSAGES[locale]);
    i18n = { ...words, m: { ...words.m, ...PAGES[locale] } };
    made.set(locale, i18n);
  }
  return i18n;
}

/** English: the default for tests and for code that has no reader. */
export const EN = getI18n("en");
