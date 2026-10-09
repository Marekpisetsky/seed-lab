/** The languages of the hub: seed-kit's, with the hub's own pages. */

export { DEFAULT_LOCALE, isPendingReview, LOCALE_SETTINGS, LOCALES, localePath, SHOWN_LOCALES } from "../../../packages/seed-kit/src/locales.ts";
export type { Locale } from "../../../packages/seed-kit/src/locales.ts";

/** The pages, by their address without the language. */
export const PAGES = { home: "/", principles: "/principles/", about: "/about/", roadmap: "/roadmap/" } as const;
export type PageId = keyof typeof PAGES;
