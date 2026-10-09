/**
 * The languages the app speaks. Adding one takes an entry here and a
 * dictionary in src/i18n/messages/: every page exists under /<prefix>/
 * for it (app/[lang]/), and no component changes.
 *
 * English lives at the site's root ("/", "/test"); every other language
 * under its prefix ("/es", "/es/test").
 *
 * A language can be built but not shown yet (`pendingReview`, as in
 * seed-kit's locales.ts): its pages exist, but the language switch, the
 * sitemap and hreflang leave it out, search engines are asked not to
 * index it and no browser is sent to it. Dutch waits for a native
 * speaker's review and Marek's approval.
 */

export const LOCALES = ["en", "es", "nl"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export interface LocaleSettings {
  /** Number, currency and date formats (Intl): "112,288 €" or "€112,288". */
  intl: string;
  /** On the language switch. */
  label: string;
  /** Its own name, for screen readers and the switch's title. */
  name: string;
  /** Built but not shown until a native speaker has reviewed it (see above). */
  pendingReview?: true;
}

export const LOCALE_SETTINGS: Readonly<Record<Locale, LocaleSettings>> = {
  en: { intl: "en-US", label: "EN", name: "English" },
  es: { intl: "es-ES", label: "ES", name: "Español" },
  nl: { intl: "nl-NL", label: "NL", name: "Nederlands", pendingReview: true },
};

/** The languages offered and linked: every one not waiting for review. */
export const SHOWN_LOCALES: readonly Locale[] = LOCALES.filter((locale) => !LOCALE_SETTINGS[locale].pendingReview);

/** Whether a language's pages are built but hidden (see above). */
export function isPendingReview(locale: Locale): boolean {
  return LOCALE_SETTINGS[locale].pendingReview === true;
}

/** Every language but English: the ones with their own prefix. */
export const PREFIXED_LOCALES: readonly Locale[] = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** The pages of the site, as English addresses. */
export const PAGES = {
  money: "/",
  test: "/test",
  about: "/about",
  howItWorks: "/how-it-works",
  privacy: "/privacy",
  terms: "/terms",
} as const;
export type PageId = keyof typeof PAGES;

/** A page's address in a language: ("/test", "es") → "/es/test"; ("/", "es") → "/es". */
export function localePath(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** The language of an address and the page without its prefix: "/es/test" → es, "/test". */
export function splitPath(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (isLocale(first) && first !== DEFAULT_LOCALE) return { locale: first, path: `/${rest.join("/")}`.replace(/\/$/, "") || "/" };
  return { locale: DEFAULT_LOCALE, path: pathname.replace(/\/$/, "") || "/" };
}
