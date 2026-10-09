/**
 * The languages every Horalis tool speaks: English at the root of its
 * site, every other language under its own prefix ("/es/…"). Adding one
 * takes an entry here and its words in each dictionary (one file per
 * language).
 *
 * A language can be built but not shown yet (`pendingReview`): its pages
 * exist and work, but the language switch does not offer it, no page
 * links to it (hreflang, sitemaps), search engines are asked not to index
 * it, and a browser in that language is not sent to it. Dutch waits for a
 * native speaker's review and Marek's approval.
 */

export const LOCALES = ["en", "es", "nl"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Every language but English: the ones with their own prefix (pages built for each, shown or not). */
export const PREFIXED_LOCALES: readonly Locale[] = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

export interface LocaleSettings {
  /** On the language switch. */
  label: string;
  /** Its own name, for screen readers and the switch's title. */
  name: string;
  /** Number, money and date formats (Intl) for tools without their own: "€2,500" or "2500 €". */
  intl: string;
  /** Built but not shown until a native speaker has reviewed it (see above). */
  pendingReview?: true;
}

export const LOCALE_SETTINGS: Readonly<Record<Locale, LocaleSettings>> = {
  en: { label: "EN", name: "English", intl: "en-GB" },
  es: { label: "ES", name: "Español", intl: "es-ES" },
  nl: { label: "NL", name: "Nederlands", intl: "nl-NL", pendingReview: true },
};

/** The languages offered and linked: every one not waiting for review. */
export const SHOWN_LOCALES: readonly Locale[] = LOCALES.filter((locale) => !LOCALE_SETTINGS[locale].pendingReview);

/** The shown languages with their own prefix: where a browser may be sent automatically. */
export const SHOWN_PREFIXED_LOCALES: readonly Locale[] = SHOWN_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

/** Whether a language's pages are built but hidden (see above). */
export function isPendingReview(locale: Locale): boolean {
  return LOCALE_SETTINGS[locale].pendingReview === true;
}

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
