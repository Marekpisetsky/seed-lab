import type { Metadata } from "next";
import { getI18n } from ".";
import { LOCALE_SETTINGS, LOCALES, localePath, PAGES, type Locale, type PageId } from "./locales";

/** Where the site is published: absolute links for sharing cards and the other languages. */
export const SITE_URL = "https://seed-lab-omega.vercel.app";

/** A page's title, description, languages and sharing card, in `locale`. */
export function pageMetadata(locale: Locale, page: PageId): Metadata {
  const { m } = getI18n(locale);
  const { title, description } = m.meta[page];
  const path = localePath(PAGES[page], locale);
  const fullTitle = page === "money" ? `${m.site.name} · ${title}` : `${title} · ${m.site.name}`;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: {
      canonical: path,
      languages: { ...Object.fromEntries(LOCALES.map((other) => [LOCALE_SETTINGS[other].intl, localePath(PAGES[page], other)])), "x-default": PAGES[page] },
    },
    openGraph: {
      type: "website",
      siteName: m.site.name,
      title: fullTitle,
      description,
      url: path,
      locale: LOCALE_SETTINGS[locale].intl.replace("-", "_"),
    },
  };
}
