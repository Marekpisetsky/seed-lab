import { describe, expect, it } from "vitest";
import { LANGUAGE_SCRIPT } from "./detect";

/** Runs the head script on a page of the site, as a browser would, and says where it went. */
function visit(pathname: string, { languages = ["es-ES", "en"], referrer = "", type = "navigate" } = {}) {
  const went: string[] = [];
  const document = { documentElement: { lang: "" }, referrer };
  const location = { pathname, search: "", hash: "", origin: "https://seed-lab.example", replace: (to: string) => went.push(to) };
  const performance = { getEntriesByType: () => [{ type }] };
  const navigator = { languages, language: languages[0] };
  new Function("document", "location", "performance", "navigator", LANGUAGE_SCRIPT)(document, location, performance, navigator);
  return { lang: document.documentElement.lang, went: went[0] ?? null };
}

describe("the language script, inside Wealth Lens's folder", () => {
  it("names the page's language from the address after the folder", () => {
    expect(visit("/wealth-lens/es/stocks/").lang).toBe("es");
    expect(visit("/wealth-lens/stocks/", { languages: ["en"] }).lang).toBe("en");
  });

  it("sends a first visit with a Spanish browser to the same page in Spanish, in the folder", () => {
    expect(visit("/wealth-lens/").went).toBe("/wealth-lens/es/");
    expect(visit("/wealth-lens/stocks/").went).toBe("/wealth-lens/es/stocks/");
    expect(visit("/wealth-lens").went).toBe("/wealth-lens/es/");
  });

  it("leaves the page alone when coming from the same site (the hub too), on a reload or in English", () => {
    expect(visit("/wealth-lens/", { referrer: "https://seed-lab.example/es/" }).went).toBeNull();
    expect(visit("/wealth-lens/", { type: "reload" }).went).toBeNull();
    expect(visit("/wealth-lens/", { languages: ["en-GB", "es"] }).went).toBeNull();
    expect(visit("/wealth-lens/es/").went).toBeNull();
  });
});
