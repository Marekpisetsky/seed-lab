import type { Metadata } from "next";
import { BRAND_NAME } from "@seed-kit/site.ts";
import { getI18n } from ".";
import { isPendingReview, LOCALE_SETTINGS, localePath, PAGES, SHOWN_LOCALES, type Locale, type PageId } from "./locales";

/** Where the site is published: absolute links for sharing cards and the other languages. */
export const SITE_URL = "https://seed-lab-omega.vercel.app";

/** The sharing picture (app/og.png/route.tsx), the same for every page and language. */
const SHARE_IMAGE = { url: "/og.png", width: 1200, height: 630 };

/** A page's title, description, languages and sharing card, in `locale`. */
export function pageMetadata(locale: Locale, page: PageId): Metadata {
  const { m } = getI18n(locale);
  const { title, description } = m.meta[page];
  const path = localePath(PAGES[page], locale);
  const fullTitle = page === "money" ? `${m.site.name} · ${title}` : `${title} · ${m.site.name}`;
  return {
    title: { absolute: fullTitle },
    description,
    // A language waiting for a native speaker's review is built, but neither linked nor indexed (locales.ts).
    ...(isPendingReview(locale)
      ? { robots: { index: false } }
      : {
          alternates: {
            canonical: path,
            languages: { ...Object.fromEntries(SHOWN_LOCALES.map((other) => [LOCALE_SETTINGS[other].intl, localePath(PAGES[page], other)])), "x-default": PAGES[page] },
          },
        }),
    openGraph: {
      type: "website",
      siteName: BRAND_NAME,
      title: fullTitle,
      description,
      url: path,
      locale: LOCALE_SETTINGS[locale].intl.replace("-", "_"),
      images: [{ ...SHARE_IMAGE, alt: m.site.name }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [{ ...SHARE_IMAGE, alt: m.site.name }] },
  };
}
