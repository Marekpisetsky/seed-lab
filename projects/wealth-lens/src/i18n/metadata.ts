import type { Metadata } from "next";
import { getI18n } from ".";
import { WEALTH_LENS_URL } from "@/lib/site";
import { LOCALE_SETTINGS, LOCALES, localePath, PAGES, type Locale, type PageId } from "./locales";

/**
 * What the pages' relative addresses ("/stocks", "/og.png") resolve
 * against: Wealth Lens's folder on seed-lab's site
 * ("https://…/wealth-lens/"), so canonical and language links and the
 * sharing card are absolute and inside it (Next joins the two paths).
 */
export const METADATA_BASE = new URL(WEALTH_LENS_URL);

/** The sharing picture (app/og.png/route.tsx), the same for every page and language. */
const SHARE_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "Wealth Lens" };

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
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [SHARE_IMAGE] },
  };
}
