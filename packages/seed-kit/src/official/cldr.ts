/**
 * Each country's currency today (ISO 4217), from the Unicode CLDR's
 * supplemental currency data: the currency in use now, legal tender, for
 * each region. Countries change currency rarely (Croatia took the euro in
 * 2023, Bulgaria in 2026), so the yearly download refreshes it too.
 */

export const CLDR_PACKAGE = "cldr-core";
export const CLDR_LICENSE = { license: "Unicode License v3", licenseUrl: "https://www.unicode.org/license.txt" } as const;

interface CurrencyData {
  supplemental?: { currencyData?: { region?: Record<string, Array<Record<string, { _from?: string; _to?: string; _tender?: string }>>> } };
}

/** Where the CLDR lists more than one currency in use and its order would mislead. */
const PREFERRED: Readonly<Record<string, string>> = { PS: "ILS" };

/**
 * Region → its current tender currency, as of `today`: the country's own
 * (its code starts with the region's: HTG for Haiti, PAB for Panama) when it
 * is in use, otherwise the one in use for longest (BG: the euro once the lev
 * ended), with PREFERRED where that misleads.
 */
export function currencies(answer: unknown, today = new Date()): Map<string, string> {
  const regions = (answer as CurrencyData)?.supplemental?.currencyData?.region;
  if (!regions) throw new Error("CLDR: no currencyData.region");
  const day = today.toISOString().slice(0, 10);
  const out = new Map<string, string>();
  for (const [region, list] of Object.entries(regions)) {
    if (!/^[A-Z]{2}$/.test(region)) continue;
    const current = list
      .flatMap((entry) => Object.entries(entry))
      .filter(([, info]) => info._tender !== "false" && (info._from ?? "0000") <= day && (info._to === undefined || info._to > day))
      .sort(([, a], [, b]) => (a._from ?? "").localeCompare(b._from ?? ""));
    const own = current.find(([code]) => code.startsWith(region));
    const chosen = PREFERRED[region] ?? own?.[0] ?? current[0]?.[0];
    if (chosen) out.set(region, chosen);
  }
  return out;
}

/**
 * Since when each region uses the currency `chosen` gives it ("VE" →
 * "2018-08-20", the day the bolívar soberano replaced the bolívar fuerte);
 * `null` where the CLDR gives no date. A rate from before that day is of
 * the currency it replaced, even under the same country (money-tables.ts).
 */
export function currencySince(answer: unknown, chosen: ReadonlyMap<string, string>): Map<string, string | null> {
  const regions = (answer as CurrencyData)?.supplemental?.currencyData?.region;
  if (!regions) throw new Error("CLDR: no currencyData.region");
  const out = new Map<string, string | null>();
  for (const [region, code] of chosen) {
    const entry = (regions[region] ?? []).flatMap((item) => Object.entries(item)).find(([name, info]) => name === code && info._tender !== "false");
    out.set(region, entry?.[1]._from ?? null);
  }
  return out;
}

/**
 * Countries by their two- and three-letter ISO codes, from the CLDR's code
 * mappings: the economies a World Bank file names by ISO alpha-3, so its
 * regions and income groups ("WLD", "EUU"…) drop out. Kosovo, which has no
 * ISO code, is "XK" / "XKX" at the World Bank.
 */
export function economiesFromCldr(answer: unknown): Map<string, { iso2: string; iso3: string; region: string; income: string; name: string }> {
  const mappings = (answer as { supplemental?: { codeMappings?: Record<string, { _alpha3?: string }> } })?.supplemental?.codeMappings;
  if (!mappings) throw new Error("CLDR: no codeMappings");
  const out = new Map<string, { iso2: string; iso3: string; region: string; income: string; name: string }>();
  for (const [code, entry] of Object.entries(mappings)) {
    if (!/^[A-Z]{2}$/.test(code) || !entry._alpha3 || /^(AA|Q[M-Z]|X[A-Z]|ZZ|EU|EZ|UN)$/.test(code)) continue;
    out.set(code, { iso2: code, iso3: entry._alpha3, region: "", income: "", name: code });
  }
  out.set("XK", { iso2: "XK", iso3: "XKX", region: "", income: "", name: "Kosovo" });
  return out;
}
