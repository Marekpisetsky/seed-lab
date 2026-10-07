/**
 * "Prices of": the country whose prices wishes and goals use (a home
 * deposit, a car, a year off work). It starts as the country of the
 * browser's language (es-ES → Spain), worked out on the device by
 * seed-kit, or the Netherlands when there are no prices for that one; the
 * user can change it beside the wishes and in My goals.
 *
 * It lives in this module's memory only: not in the plan, not in "Download
 * my data", not in the browser's storage, never sent. Reloading the page
 * starts from the browser's language again. It changes nothing else: the
 * country's rising prices (More options) and the countries table stay as
 * they are.
 */

import { pricesCountry } from "@seed-kit/detect.ts";
import { DEFAULT_PRICE_COUNTRY, PRICE_COUNTRIES } from "./connections";

/** The country to start with for a browser language. */
export function startingWishCountry(language: string | undefined): string {
  return pricesCountry(language, PRICE_COUNTRIES, DEFAULT_PRICE_COUNTRY);
}

/** Read from the browser's language the first time it is asked for, in the browser; never stored anywhere else. */
let value: string | null = null;
const listeners = new Set<() => void>();

/**
 * Shaped for React's `useSyncExternalStore`: the static HTML is rendered
 * with the Netherlands; in the browser, the first read starts from its
 * language (without telling anyone: nothing has read it before).
 */
export const wishCountryStore = {
  get(): string {
    if (value === null) value = typeof window !== "undefined" && typeof navigator !== "undefined" ? startingWishCountry(navigator.language) : DEFAULT_PRICE_COUNTRY;
    return value;
  },
  getServerSnapshot: (): string => DEFAULT_PRICE_COUNTRY,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** Picked in "Prices of"; anything that is not a country of the prices is ignored. */
export function setWishCountry(country: string): void {
  if (!PRICE_COUNTRIES.includes(country) || country === value) return;
  value = country;
  listeners.forEach((listener) => listener());
}
