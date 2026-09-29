/**
 * Which price symbol to ask for a holding, in Yahoo Finance notation: US
 * listings have no suffix ("AAPL"), other markets carry the exchange
 * ("VWCE.DE" Xetra, "ASML.AS" Euronext Amsterdam, "VUSA.L" London).
 *
 * European funds and shares are not US listings, so the guess uses a table
 * of well-known tickers and, failing that, the holding's currency: a EUR
 * holding tries Xetra first. Every guess can be overridden per holding.
 *
 * Stooq, the fallback source, uses its own notation ("vwce.de", "aapl.us")
 * and has no Euronext listings; yahooToStooq() translates when it can.
 */

import { normalizeYahooSymbol } from "./yahoo";

/** Well-known European tickers → Yahoo symbol of a listing quoted in EUR. */
export const KNOWN_SYMBOLS: Readonly<Record<string, string>> = {
  // Broad ETFs
  VWCE: "VWCE.DE", // Vanguard FTSE All-World Acc (Xetra)
  VWRL: "VWRL.AS", // Vanguard FTSE All-World Dist (Amsterdam)
  VGWL: "VGWL.DE",
  VUAA: "VUAA.DE", // Vanguard S&P 500 Acc (Xetra)
  VUSA: "VUSA.DE", // Vanguard S&P 500 Dist (Xetra)
  CSPX: "SXR8.DE", // iShares Core S&P 500 Acc (Xetra ticker SXR8)
  SXR8: "SXR8.DE",
  IWDA: "IWDA.AS", // iShares Core MSCI World Acc (Amsterdam)
  EUNL: "EUNL.DE",
  EQQQ: "EQQQ.DE", // Invesco EQQQ Nasdaq-100 (Xetra)
  EXS1: "EXS1.DE", // iShares Core DAX
  // Large European shares
  ASML: "ASML.AS", // ASML Holding (Amsterdam)
  SAP: "SAP.DE",
  SIE: "SIE.DE",
  ALV: "ALV.DE",
  MC: "MC.PA", // LVMH (Paris)
};

/** Yahoo exchange suffix for the usual listing of each currency ("" = US). */
const SUFFIX_BY_CURRENCY: Readonly<Record<string, string>> = {
  EUR: ".DE",
  USD: "",
  GBP: ".L",
  GBX: ".L",
  JPY: ".T",
  HKD: ".HK",
  PLN: ".WA",
  CHF: ".SW",
};

/**
 * Yahoo symbols to try for a holding, best first. An explicit override
 * wins; then the known-ticker table; then the listing matching the
 * currency, with the US listing as a last resort.
 */
export function priceSymbolCandidates(ticker: string, currency: string, override?: string): string[] {
  if (override) return [override];
  const clean = ticker.trim().toUpperCase();
  if (clean.includes(".") || clean.startsWith("^")) return [clean];
  const known = KNOWN_SYMBOLS[clean];
  if (known) return [known];
  const suffix = SUFFIX_BY_CURRENCY[currency];
  const candidates = suffix ? [`${clean}${suffix}`] : [];
  if (!candidates.includes(clean)) candidates.push(clean);
  return candidates;
}

/** Euronext listings Stooq lacks, mapped to the same security on Xetra. */
const STOOQ_EQUIVALENTS: Readonly<Record<string, string>> = {
  "ASML.AS": "asme.de",
  "MC.PA": "moh.de",
  "IWDA.AS": "eunl.de",
  "VWRL.AS": "vgwl.de",
};

const STOOQ_SUFFIX_BY_YAHOO: Readonly<Record<string, string>> = {
  DE: "de",
  L: "uk",
  T: "jp",
  HK: "hk",
  WA: "pl",
};

/** The Stooq symbol for a Yahoo symbol, or `null` when Stooq has no equivalent. */
export function yahooToStooq(symbol: string): string | null {
  const known = STOOQ_EQUIVALENTS[symbol];
  if (known) return known;
  if (symbol.startsWith("^")) return null;
  const dot = symbol.lastIndexOf(".");
  if (dot === -1) return `${symbol.toLowerCase()}.us`;
  const suffix = STOOQ_SUFFIX_BY_YAHOO[symbol.slice(dot + 1)];
  return suffix ? `${symbol.slice(0, dot).toLowerCase()}.${suffix}` : null;
}

const YAHOO_SUFFIX_BY_STOOQ: Readonly<Record<string, string>> = {
  us: "",
  de: ".DE",
  uk: ".L",
  jp: ".T",
  hk: ".HK",
  pl: ".WA",
};

/**
 * Converts a symbol saved by earlier versions (Stooq notation, lower case,
 * e.g. "aapl.us", "vwce.de") to Yahoo notation. Anything already in Yahoo
 * notation is only validated. `null` if it is not a usable symbol.
 */
export function toYahooSymbol(saved: string): string | null {
  const legacy = /^([a-z0-9-]+)\.([a-z]+)$/.exec(saved);
  if (legacy) {
    const suffix = YAHOO_SUFFIX_BY_STOOQ[legacy[2]];
    if (suffix !== undefined) return normalizeYahooSymbol(`${legacy[1]}${suffix}`);
  }
  return normalizeYahooSymbol(saved);
}
