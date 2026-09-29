/**
 * Which Stooq symbol to ask for a holding. Stooq needs a market suffix
 * ("aapl.us", "vwce.de") and European funds and shares are not US listings,
 * so the guess uses a table of well-known tickers and, failing that, the
 * holding's currency: a EUR holding tries the German (Xetra) listing first.
 *
 * Stooq has no Euronext listings; the EUR quote of Euronext names is their
 * Xetra line (ASML → asme.de). Every guess can be overridden per holding.
 */

/** Well-known European tickers → Stooq symbol quoted in EUR on Xetra. */
export const KNOWN_STOOQ_SYMBOLS: Readonly<Record<string, string>> = {
  // Broad ETFs (the Xetra line of the same fund)
  VWCE: "vwce.de", // Vanguard FTSE All-World Acc
  VWRL: "vgwl.de", // Vanguard FTSE All-World Dist (Xetra ticker VGWL)
  VGWL: "vgwl.de",
  VUAA: "vuaa.de", // Vanguard S&P 500 Acc
  VUSA: "vusa.de", // Vanguard S&P 500 Dist
  CSPX: "sxr8.de", // iShares Core S&P 500 Acc (Xetra ticker SXR8)
  SXR8: "sxr8.de",
  IWDA: "eunl.de", // iShares Core MSCI World Acc (Xetra ticker EUNL)
  EUNL: "eunl.de",
  EQQQ: "eqqq.de", // Invesco EQQQ Nasdaq-100
  EXS1: "exs1.de", // iShares Core DAX
  // Large European shares
  ASML: "asme.de", // ASML Holding (Xetra ticker ASME)
  SAP: "sap.de",
  SIE: "sie.de",
  ALV: "alv.de",
  MC: "moh.de", // LVMH (Xetra ticker MOH)
};

const SUFFIX_BY_CURRENCY: Readonly<Record<string, string>> = {
  EUR: "de",
  USD: "us",
  GBP: "uk",
  GBX: "uk",
  JPY: "jp",
  HKD: "hk",
  PLN: "pl",
  HUF: "hu",
};

/**
 * Stooq symbols to try for a holding, best first. An explicit override
 * wins; then the known-ticker table; then the listing matching the
 * currency, with the US listing as a last resort.
 */
export function stooqCandidates(ticker: string, currency: string, override?: string): string[] {
  if (override) return [override];
  const clean = ticker.trim().toUpperCase();
  if (clean.includes(".") || clean.startsWith("^")) return [clean.toLowerCase()];
  const known = KNOWN_STOOQ_SYMBOLS[clean];
  if (known) return [known];
  const base = clean.toLowerCase();
  const suffix = SUFFIX_BY_CURRENCY[currency];
  const candidates = suffix ? [`${base}.${suffix}`] : [];
  if (!candidates.includes(`${base}.us`)) candidates.push(`${base}.us`);
  return candidates;
}
