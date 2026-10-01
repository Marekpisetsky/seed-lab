import { describe, expect, it } from "vitest";
import site from "../../../../deploy/site.json" with { type: "json" };
import sitemap from "@/app/sitemap";
import { LOCALES, PAGES } from "@/i18n/locales";
import { BASE_PATH, pageHref, pageUrl, publicPath, SITE_ORIGIN, WEALTH_LENS_URL } from "./site";

describe("where Wealth Lens is published", () => {
  it("takes the site's address and its folder from deploy/site.json, the one place to change them", () => {
    expect(SITE_ORIGIN).toBe(site.origin);
    expect(BASE_PATH).toBe(site.wealthLensPath);
    expect(WEALTH_LENS_URL).toBe(`${site.origin}${site.wealthLensPath}/`);
  });

  it("writes pages, full addresses and public files inside its folder, with the trailing slash pages have", () => {
    expect(pageHref("/")).toBe("/wealth-lens/");
    expect(pageHref("/es/stocks")).toBe("/wealth-lens/es/stocks/");
    expect(pageUrl("/es")).toBe(`${SITE_ORIGIN}/wealth-lens/es/`);
    expect(publicPath("/data/lines/VWCE.json")).toBe("/wealth-lens/data/lines/VWCE.json");
  });

  it("lists every page in every language in its sitemap, with the other languages beside each", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(Object.keys(PAGES).length * LOCALES.length);
    for (const entry of entries) {
      expect(entry.url.startsWith(WEALTH_LENS_URL)).toBe(true);
      expect(entry.url.endsWith("/")).toBe(true);
      expect(Object.keys(entry.alternates?.languages ?? {})).toEqual(["en-US", "es-ES", "x-default"]);
    }
    expect(entries.map((entry) => entry.url)).toContain(`${SITE_ORIGIN}/wealth-lens/es/how-it-works/`);
  });
});
