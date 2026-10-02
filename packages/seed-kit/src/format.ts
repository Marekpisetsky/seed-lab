/**
 * Numbers, money, percents and dates, in the formats of each language
 * ("€112,288" in English, "112.288 €" in Spanish), for every seed-lab
 * tool (it began in Wealth Lens). The words around them ("3 years", "in 2
 * months") belong to each app's dictionaries.
 *
 * The same code formats on the server (the static HTML) and in the browser,
 * and their ICU data may use different spaces (a no-break space or a narrow
 * one before "€" and "%"): every result uses the no-break space, so the page
 * never changes between the two.
 */

import { LOCALE_SETTINGS, type Locale } from "./locales.ts";

interface MoneyOptions {
  /** Fraction digits; defaults to 2. */
  decimals?: number;
  /** Prefix positive amounts with "+" (for gains). */
  signed?: boolean;
}

interface PercentOptions {
  decimals?: number;
  signed?: boolean;
}

export interface NumberFormats {
  /** 1234.5, "EUR" → "€1,234.50". */
  money(amount: number, currency: string, options?: MoneyOptions): string;
  /** Whole euros: 1234.5 → "€1,235". */
  eur(amount: number, options?: { signed?: boolean }): string;
  /** Rounded the way a brief says it: €8,429 → "€8,400", €66,827 → "€67,000". */
  eurRounded(amount: number, options?: { signed?: boolean }): string;
  /** Short, for an axis: "€1.2M", "€99K" ("1,2 M €", "99 mil €"). */
  eurCompact(amount: number): string;
  /** 0.0914 → "9.1%". */
  percent(fraction: number, options?: PercentOptions): string;
  /** A rate without needless decimals: 0.04 → "4%", 0.045 → "4.5%". */
  rate(rate: number): string;
  /** Plain number with up to `maxDecimals` fraction digits (share counts). */
  number(value: number, maxDecimals?: number): string;
  /** Whole number with its thousands always marked, as an example to copy: "1,000", "1.000". */
  grouped(value: number): string;
  /** "." or ",": how this language writes 1.5, so typed numbers are read its way. */
  decimalSeparator: string;
  /** Exactly `decimals` fraction digits: 0.9, 2 → "0.90" ("0,90"). */
  fixed(value: number, decimals: number): string;
  /** Price per share without a currency: 2 decimals, up to 4 for small prices. */
  price(value: number): string;
  /** "Jun 2036". */
  monthYear(date: Date): string;
  /** "2026-09-25" → "25/09". */
  dayMonth(isoDate: string): string;
  /** "2026-09-25" → "Sep 25, 2026" ("25 sept 2026"). */
  date(isoDate: string): string;
}

/**
 * Rounded to what is shown, with −0 turned into 0: −€0.30 shown in whole
 * euros is "€0", never "-€0".
 */
function shown(value: number, decimals: number): number {
  const rounded = Number(value.toFixed(decimals));
  return rounded === 0 ? 0 : rounded;
}

const spaces = (text: string) => text.replace(/[\u202f\u00a0]/g, "\u00a0");

function createFormats(intl: string): NumberFormats {
  const cache = new Map<string, Intl.NumberFormat>();
  const numberFormat = (key: string, options: Intl.NumberFormatOptions) => {
    let formatter = cache.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat(intl, options);
      cache.set(key, formatter);
    }
    return formatter;
  };
  const money: NumberFormats["money"] = (amount, currency, { decimals = 2, signed = false } = {}) =>
    spaces(
      numberFormat(`money|${currency}|${decimals}|${signed}`, {
        style: "currency",
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        signDisplay: signed ? "exceptZero" : "auto",
      }).format(Number.isFinite(amount) ? shown(amount, decimals) : amount),
    );
  const percent: NumberFormats["percent"] = (fraction, { decimals = 1, signed = false } = {}) =>
    spaces(
      numberFormat(`percent|${decimals}|${signed}`, {
        style: "percent",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        signDisplay: signed ? "exceptZero" : "auto",
      }).format(Number.isFinite(fraction) ? shown(fraction, decimals + 2) : fraction),
    );
  const eur: NumberFormats["eur"] = (amount, { signed = false } = {}) => money(amount, "EUR", { decimals: 0, signed });
  const monthYear = new Intl.DateTimeFormat(intl, { month: "short", year: "numeric", timeZone: "UTC" });
  const fullDate = new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return {
    decimalSeparator: new Intl.NumberFormat(intl).formatToParts(1.5).find((part) => part.type === "decimal")?.value ?? ".",
    money,
    eur,
    eurRounded(amount, { signed = false } = {}) {
      const abs = Math.abs(amount);
      const step = abs >= 10_000 ? 1000 : abs >= 1000 ? 100 : abs >= 100 ? 10 : 1;
      return eur(Math.round(amount / step) * step, { signed });
    },
    eurCompact(amount) {
      const digits = amount >= 1e6 && amount < 1e7 ? 1 : 0;
      return spaces(numberFormat(`compact|${digits}`, { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: digits }).format(amount));
    },
    percent,
    rate(rate) {
      const tenths = Math.round(rate * 1000);
      return percent(rate, { decimals: tenths % 10 === 0 ? 0 : 1 });
    },
    number(value, maxDecimals = 4) {
      return spaces(numberFormat(`number|${maxDecimals}`, { maximumFractionDigits: maxDecimals }).format(value));
    },
    grouped(value) {
      return spaces(numberFormat("grouped", { maximumFractionDigits: 0, useGrouping: "always" }).format(value));
    },
    fixed(value, decimals) {
      return spaces(numberFormat(`fixed|${decimals}`, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(shown(value, decimals)));
    },
    price(value) {
      const maxDecimals = Math.abs(value) < 1 ? 4 : 2;
      return spaces(numberFormat(`price|${maxDecimals}`, { minimumFractionDigits: 2, maximumFractionDigits: maxDecimals }).format(value));
    },
    monthYear(date) {
      return spaces(monthYear.format(date));
    },
    dayMonth(isoDate) {
      const [, month, day] = isoDate.split("-");
      return `${day}/${month}`;
    },
    date(isoDate) {
      return spaces(fullDate.format(new Date(`${isoDate}T00:00:00Z`)));
    },
  };
}

const byIntl = new Map<string, NumberFormats>();

/** The formats of a language ("en-US", "es-ES"), made once. */
export function numberFormats(intl: string): NumberFormats {
  let formats = byIntl.get(intl);
  if (!formats) {
    formats = createFormats(intl);
    byIntl.set(intl, formats);
  }
  return formats;
}

/** The formats of a seed-lab language, with the kit's default Intl tag (locales.ts). */
export function formatsFor(locale: Locale): NumberFormats {
  return numberFormats(LOCALE_SETTINGS[locale].intl);
}

/**
 * A number as someone types it in their language: "2.500,5" or "2500,5"
 * in Spanish, "2,500.5" in English; spaces, "€" and "%" are ignored, and a
 * decimal mark typed the other language's way is still read ("2.5" in
 * Spanish is 2.5, "1.000" is 1000). NaN when it is not a number.
 */
export function parseNumber(text: string, decimalSeparator: string): number {
  const typed = text.replace(/[\s\u00a0\u202f€%]/g, "").replace(/^\+/, "");
  const group = decimalSeparator === "," ? "." : ",";
  let plain: string;
  if (typed.includes(decimalSeparator)) plain = typed.split(group).join("").replace(decimalSeparator, ".");
  else if (new RegExp(`^-?\\d{1,3}(\\${group}\\d{3})+$`).test(typed)) plain = typed.split(group).join("");
  else plain = typed.replace(group, ".");
  return /^-?(\d+\.?\d*|\.\d+)$/.test(plain) ? Number(plain) : Number.NaN;
}
