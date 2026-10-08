import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getI18n } from "@/i18n";
import { LOCALES } from "@/i18n/locales";
import { en } from "@/i18n/messages/en";
import { enPages } from "@/i18n/messages/en-pages";
import { es } from "@/i18n/messages/es";

/**
 * The words of the pages the server writes whole (About, How it works,
 * Privacy, Terms, titles) are not in the browser's dictionary, so the first
 * screen does not download them; the server has every word.
 */
describe("the pages' words", () => {
  const PAGE_KEYS = Object.keys(enPages);

  it("stay out of the dictionary the browser gets", () => {
    expect(PAGE_KEYS.sort()).toEqual(["about", "howItWorks", "meta", "notFound", "privacy", "terms"]);
    for (const dictionary of [en, es]) for (const key of PAGE_KEYS) expect(key in dictionary, key).toBe(false);
    // The browser's words come from en.ts or es.ts alone, never from the pages' files or index.ts.
    for (const file of ["i18n-en.tsx", "i18n-es.tsx"]) {
      const code = readFileSync(new URL(`../components/${file}`, import.meta.url), "utf8");
      expect(code, file).not.toMatch(/-pages|from "@\/i18n"/);
    }
  });

  it("are all on the server, in every language, with the footer's titles", () => {
    for (const locale of LOCALES) {
      const { m } = getI18n(locale);
      for (const key of PAGE_KEYS) expect(m[key as keyof typeof m], `${locale} ${key}`).toBeTruthy();
      for (const page of ["about", "howItWorks", "privacy", "terms"] as const) expect(m[page].title).toBe(m.site.footer[page]);
    }
  });
});
