import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { INITIAL_STATE } from "./app-store";
import { PRICE_COUNTRIES } from "./connections";
import { serializeState } from "./data-file";
import { setWishCountry, startingWishCountry, wishCountryStore } from "./wish-country";

describe("Prices of", () => {
  it("starts from the country of the browser's language", () => {
    expect(startingWishCountry("es-ES")).toBe("ES");
    expect(startingWishCountry("nl-NL")).toBe("NL");
    expect(startingWishCountry("de-DE")).toBe("DE");
    expect(startingWishCountry("fr")).toBe("FR");
    expect(startingWishCountry("it-IT")).toBe("IT");
    expect(startingWishCountry("pt-PT")).toBe("PT");
  });

  it("starts from the Netherlands when there are no prices for that country", () => {
    for (const language of ["en-US", "en-GB", "pt-BR", "de-AT", "es-MX", "es-419", "", undefined]) expect(startingWishCountry(language)).toBe("NL");
    expect(PRICE_COUNTRIES[0]).toBe("NL");
  });

  it("renders the static page with the Netherlands, and keeps a pick in memory only", () => {
    expect(wishCountryStore.getServerSnapshot()).toBe("NL");
    // Outside a browser (these tests), there is no language to read.
    expect(wishCountryStore.get()).toBe("NL");
    const told = vi.fn();
    const stop = wishCountryStore.subscribe(told);
    setWishCountry("ES");
    expect(wishCountryStore.get()).toBe("ES");
    expect(told).toHaveBeenCalledTimes(1);
    // Not a country of the prices, or the same one: nothing changes.
    setWishCountry("US");
    setWishCountry("ES");
    expect(wishCountryStore.get()).toBe("ES");
    expect(told).toHaveBeenCalledTimes(1);
    stop();
    setWishCountry("NL");
  });

  it("is never saved: not in the data file, not in the browser", () => {
    setWishCountry("ES");
    expect(serializeState(INITIAL_STATE, new Date("2026-10-07T00:00:00Z"))).not.toMatch(/wishCountry|"ES"/);
    setWishCountry("NL");
    const source = readFileSync(new URL("./wish-country.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/localStorage|sessionStorage\.|indexedDB|document\.cookie|fetch\(/);
  });
});
