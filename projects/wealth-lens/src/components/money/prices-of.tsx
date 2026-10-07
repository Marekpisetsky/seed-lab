"use client";

import { useId } from "react";
import { useI18n } from "@/components/i18n";
import { byCountryName, countryName } from "@/i18n/countries";
import { PRICE_COUNTRIES } from "@/lib/connections";
import { setWishCountry } from "@/lib/wish-country";

/**
 * "Prices of: Spain": the country whose prices wishes and goals use
 * (lib/wish-country.ts). Small, beside what it changes; picking another
 * country is kept in memory only.
 */
export function PricesOf({ country }: { country: string }) {
  const i18n = useI18n();
  const id = useId();
  const countries = byCountryName(
    PRICE_COUNTRIES.map((code) => ({ code })),
    i18n,
  );
  return (
    // Wraps under its label when the text is large, never wider than the page.
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted">
      <label htmlFor={id}>{i18n.m.things.pricesOf}:</label>
      <select
        id={id}
        value={country}
        onChange={(event) => setWishCountry(event.target.value)}
        className="min-h-11 min-w-0 max-w-full rounded-md border border-border bg-card px-2 text-sm font-medium text-foreground hover:border-accent"
      >
        {countries.map(({ code }) => (
          <option key={code} value={code}>
            {countryName(code, i18n)}
          </option>
        ))}
      </select>
    </span>
  );
}
