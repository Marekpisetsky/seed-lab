/**
 * The languages every seed-lab tool speaks: English at the root of its
 * site, every other language under its own prefix ("/es/…"). Adding one
 * takes an entry here and its words in each dictionary.
 */

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Every language but English: the ones with their own prefix. */
export const PREFIXED_LOCALES: readonly Locale[] = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

export interface LocaleSettings {
  /** On the language switch. */
  label: string;
  /** Its own name, for screen readers and the switch's title. */
  name: string;
  /** Number, money and date formats (Intl) for tools without their own: "€2,500" or "2500 €". */
  intl: string;
}

export const LOCALE_SETTINGS: Readonly<Record<Locale, LocaleSettings>> = {
  en: { label: "EN", name: "English", intl: "en-GB" },
  es: { label: "ES", name: "Español", intl: "es-ES" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * A page of a static site in a language, with folder-style addresses:
 * ("/", "es") → "/es/", ("/principles/", "es") → "/es/principles/";
 * English stays as it is.
 */
export function localePath(path: string, locale: Locale): string {
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}

/** Text in every language, as the JSON files of the kit and the apps hold it. */
export type Localized = Readonly<Record<Locale, string>>;
