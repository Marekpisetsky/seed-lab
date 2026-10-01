/** The languages of the hub. Adding one: its dictionary in this folder, and an entry here. */

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_SETTINGS: Readonly<Record<Locale, { label: string; name: string; intl: string }>> = {
  en: { label: "EN", name: "English", intl: "en-GB" },
  es: { label: "ES", name: "Español", intl: "es-ES" },
};

/** The pages, by their address without the language. */
export const PAGES = { home: "/", principles: "/principles/", about: "/about/", roadmap: "/roadmap/" } as const;
export type PageId = keyof typeof PAGES;

/** "/principles/" in a language: "/es/principles/" in Spanish, as is in English. */
export function localePath(path: string, locale: Locale): string {
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}
