import type { MetadataRoute } from "next";
import { LOCALE_SETTINGS, LOCALES, localePath, PAGES } from "@/i18n/locales";
import { pageUrl } from "@/lib/site";

/** Written once at build time: the export makes it a file, /wealth-lens/sitemap.xml. */
export const dynamic = "force-static";

/**
 * Every page in every language, each with its other languages (the same
 * hreflang codes as the pages' own links, i18n/metadata.ts). The hub's
 * robots.txt, at the root of the site, points to it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(PAGES).flatMap((path) =>
    LOCALES.map((locale) => ({
      url: pageUrl(localePath(path, locale)),
      alternates: {
        languages: { ...Object.fromEntries(LOCALES.map((other) => [LOCALE_SETTINGS[other].intl, pageUrl(localePath(path, other))])), "x-default": pageUrl(path) },
      },
    })),
  );
}
