/**
 * Numbers, money, percents and dates, in the formats of each language and
 * country ("€112,288" in English, "112.288 €" in Spanish, "MX$112,288" in
 * Mexican Spanish), in any currency (ISO 4217), for every Horalis tool (it
 * began in Wealth Lens). The words around them ("3 years", "in 2
 * months") belong to each app's dictionaries.
 *
 * The same code formats on the server (the static HTML) and in the browser,
 * and their ICU data may use different spaces (a no-break space or a narrow
 * one before "€" and "%"): every result uses the no-break space, so the page
 * never changes between the two.
 *
 * A negative number takes the true minus sign (−, U+2212), not the hyphen
 * Intl writes: as wide as "+", so a loss and a gain line up, and screen
 * readers say "minus". parseNumber() reads both.
 */

import { LOCALE_SETTINGS, type Locale } from "./locales.ts";

/** The euro: the currency a format uses unless it is given another. */
export const DEFAULT_CURRENCY = "EUR";

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
  /** The currency `cur` and its kin write (ISO 4217). */
  currency: string;
  /** Its symbol as this language writes it beside a number: "€", "US$", "MX$", "PEN". */
  symbol: string;
  /** 1234.5, "EUR" → "€1,234.50". */
  money(amount: number, currency: string, options?: MoneyOptions): string;
  /**
   * Whole units of the currency: 1234.5 → "€1,235". From a thousand
   * million on, in words, three figures ("€1.23 billion", "1230 millones de
   * euros"); from 10¹⁸, as a power of ten ("€4.35 × 10¹⁸"): such figures
   * are not read in full.
   */
  cur(amount: number, options?: { signed?: boolean }): string;
  /** Rounded the way a brief says it: €8,429 → "€8,400", €66,827 → "€67,000". */
  curRounded(amount: number, options?: { signed?: boolean }): string;
  /** A whole count, in words and powers of ten as `cur` writes its amounts: 12346 → "12,346", 3.66e15 → "3,660 trillion". */
  count(value: number): string;
  /** Short, for an axis: "€1.2M", "€99K" ("1,2 M €", "99 mil €"); from 10¹⁸, "€4.4 × 10¹⁸". */
  curCompact(amount: number): string;
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

/** From here an amount is written in words, and from `POWER_FROM` as a power of ten. */
const WORDS_FROM = 1e9;
const POWER_FROM = 1e18;
const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/**
 * The big amounts each language writes in words, largest first: English
 * says billion (10⁹) and trillion (10¹²); Spain counts thousands of millions
 * ("1230 millones") up to the billón (10¹²), as its press does. A language
 * without its words here uses the power of ten from `WORDS_FROM`.
 */
const SCALES: Record<string, { from: number; unit: number; one: string; many: string }[]> = {
  en: [
    { from: 1e12, unit: 1e12, one: "trillion", many: "trillion" },
    { from: 1e9, unit: 1e9, one: "billion", many: "billion" },
  ],
  es: [
    { from: 1e12, unit: 1e12, one: "billón", many: "billones" },
    { from: 1e9, unit: 1e6, one: "millón", many: "millones" },
  ],
  nl: [
    { from: 1e12, unit: 1e12, one: "biljoen", many: "biljoen" },
    { from: 1e9, unit: 1e9, one: "miljard", many: "miljard" },
  ],
};

/** Euros beside a figure in words: "€1.2 billion"; Spanish writes the name, "1,2 billones de euros". Other currencies, and other languages, take their symbol where Intl puts it. */
const MONEY_WORDS: Record<string, { before?: string; after?: string }> = { en: { before: "€" }, es: { after: " de euros" } };

const spaces = (text: string) => text.replace(/[\u202f\u00a0]/g, "\u00a0");
/** A formatted number: no-break spaces and the true minus sign (numbers never hold a hyphen otherwise). */
const typeset = (text: string) => spaces(text).replace(/-/g, "\u2212");

function createFormats(intl: string, currency: string): NumberFormats {
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
    typeset(
      numberFormat(`money|${currency}|${decimals}|${signed}`, {
        style: "currency",
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        signDisplay: signed ? "exceptZero" : "auto",
      }).format(Number.isFinite(amount) ? shown(amount, decimals) : amount),
    );
  const percent: NumberFormats["percent"] = (fraction, { decimals = 1, signed = false } = {}) =>
    typeset(
      numberFormat(`percent|${decimals}|${signed}`, {
        style: "percent",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        signDisplay: signed ? "exceptZero" : "auto",
      }).format(Number.isFinite(fraction) ? shown(fraction, decimals + 2) : fraction),
    );
  const language = intl.split("-")[0];
  // Made on first use, like every formatter here: a page that never shows a date or a huge amount never builds one.
  let affixCache: { before: string; after: string } | null = null;
  /** The currency and the space beside it, as this language writes it: "€" before, " €" after, "S/ " before. */
  const affixes = () => {
    if (affixCache) return affixCache;
    const parts = new Intl.NumberFormat(intl, { style: "currency", currency }).formatToParts(1);
    const at = parts.findIndex((part) => part.type === "currency");
    const first = parts.findIndex((part) => part.type === "integer");
    const near = at < first ? parts.slice(at, first) : parts.slice(parts.findLastIndex((part) => part.type === "integer" || part.type === "fraction") + 1, at + 1);
    const text = spaces(near.filter((part) => part.type === "currency" || part.type === "literal").map((part) => part.value).join(""));
    affixCache = at < first ? { before: text, after: "" } : { before: "", after: text };
    return affixCache;
  };
  const symbol = () => (affixes().before || affixes().after).trim();
  const figures = (value: number, digits: number) => typeset(numberFormat(`figures|${digits}`, { maximumSignificantDigits: digits }).format(value));
  /** "4.35 × 10¹⁸". */
  const power = (abs: number, digits: number) => {
    let exponent = Math.floor(Math.log10(abs));
    let mantissa = Number((abs / 10 ** exponent).toPrecision(digits));
    if (mantissa >= 10) {
      mantissa /= 10;
      exponent += 1;
    }
    return `${figures(mantissa, digits)}\u00a0×\u00a010${[...String(exponent)].map((digit) => SUPERSCRIPT[Number(digit)]).join("")}`;
  };
  /** "4.35 × 10¹⁸" with the currency where the language puts it. */
  const powerCur = (abs: number, sign: string, digits: number) => `${sign}${affixes().before}${power(abs, digits)}${affixes().after}`;
  /** "1.23 billion", "1230 millones", three figures; `null` where the language has no word for it (10¹⁸ and more). */
  const inWords = (abs: number): string | null => {
    // Rounded first, so 999,999,999,999 is "1 trillion", never "1000 billion".
    const rounded = Number(abs.toPrecision(3));
    const scale = SCALES[language]?.find((entry) => rounded >= entry.from);
    if (!scale || rounded >= POWER_FROM) return null;
    const count = rounded / scale.unit;
    return `${figures(count, 3)}\u00a0${count === 1 ? scale.one : scale.many}`;
  };
  const cur: NumberFormats["cur"] = (amount, { signed = false } = {}) => {
    const abs = Math.abs(amount);
    if (!Number.isFinite(amount) || abs < WORDS_FROM) return money(amount, currency, { decimals: 0, signed });
    const sign = amount < 0 ? "\u2212" : signed ? "+" : "";
    const words = inWords(abs);
    if (!words) return powerCur(abs, sign, 3);
    const { before = "", after = "" } = (currency === "EUR" ? MONEY_WORDS[language] : undefined) ?? affixes();
    // The number keeps its word; "de euros" may go to the next line.
    return `${sign}${before}${words}${after}`;
  };
  let monthYearFormat: Intl.DateTimeFormat | null = null;
  let fullDateFormat: Intl.DateTimeFormat | null = null;
  let decimal: string | null = null;
  return {
    currency,
    get symbol() {
      return symbol();
    },
    get decimalSeparator() {
      return (decimal ??= new Intl.NumberFormat(intl).formatToParts(1.5).find((part) => part.type === "decimal")?.value ?? ".");
    },
    money,
    cur,
    curRounded(amount, { signed = false } = {}) {
      const abs = Math.abs(amount);
      const step = abs >= 10_000 ? 1000 : abs >= 1000 ? 100 : abs >= 100 ? 10 : 1;
      return cur(Math.round(amount / step) * step, { signed });
    },
    count(value) {
      const abs = Math.abs(value);
      if (!Number.isFinite(value) || abs < WORDS_FROM) return typeset(numberFormat("count", { maximumFractionDigits: 0 }).format(value));
      return `${value < 0 ? "\u2212" : ""}${inWords(abs) ?? power(abs, 3)}`;
    },
    curCompact(amount) {
      if (Number.isFinite(amount) && Math.abs(amount) >= POWER_FROM) return powerCur(Math.abs(amount), amount < 0 ? "\u2212" : "", 2);
      const digits = amount >= 1e6 && amount < 1e7 ? 1 : 0;
      return typeset(numberFormat(`compact|${digits}`, { style: "currency", currency, notation: "compact", maximumFractionDigits: digits }).format(amount));
    },
    percent,
    rate(rate) {
      const tenths = Math.round(rate * 1000);
      return percent(rate, { decimals: tenths % 10 === 0 ? 0 : 1 });
    },
    number(value, maxDecimals = 4) {
      return typeset(numberFormat(`number|${maxDecimals}`, { maximumFractionDigits: maxDecimals }).format(value));
    },
    grouped(value) {
      return typeset(numberFormat("grouped", { maximumFractionDigits: 0, useGrouping: "always" }).format(value));
    },
    fixed(value, decimals) {
      return typeset(numberFormat(`fixed|${decimals}`, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(shown(value, decimals)));
    },
    price(value) {
      const maxDecimals = Math.abs(value) < 1 ? 4 : 2;
      return typeset(numberFormat(`price|${maxDecimals}`, { minimumFractionDigits: 2, maximumFractionDigits: maxDecimals }).format(value));
    },
    monthYear(date) {
      monthYearFormat ??= new Intl.DateTimeFormat(intl, { month: "short", year: "numeric", timeZone: "UTC" });
      return spaces(monthYearFormat.format(date));
    },
    dayMonth(isoDate) {
      const [, month, day] = isoDate.split("-");
      return `${day}/${month}`;
    },
    date(isoDate) {
      fullDateFormat ??= new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
      return spaces(fullDateFormat.format(new Date(`${isoDate}T00:00:00Z`)));
    },
  };
}

const byIntl = new Map<string, NumberFormats>();

/** The formats of a language ("en-US", "es-MX") in a currency (euros unless given), made once. */
export function numberFormats(intl: string, currency: string = DEFAULT_CURRENCY): NumberFormats {
  const key = `${intl}|${currency}`;
  let formats = byIntl.get(key);
  if (!formats) {
    formats = createFormats(intl, currency);
    byIntl.set(key, formats);
  }
  return formats;
}

/**
 * The Intl tag for a Horalis language in a country: its numbers written
 * the way that country writes them ("es" in Mexico → "es-MX": 1,234.5;
 * in Spain → "es-ES": 1234,5). Without a country, or one the browser's
 * Intl does not know with that language, the language's own tag.
 */
export function intlFor(locale: Locale, country?: string | null): string {
  const base = LOCALE_SETTINGS[locale].intl;
  if (!country || !/^[A-Z]{2}$/.test(country)) return base;
  const tag = `${locale}-${country}`;
  try {
    return Intl.NumberFormat.supportedLocalesOf(tag).length > 0 ? tag : base;
  } catch {
    return base;
  }
}

/** The formats of a Horalis language (in a country, in a currency); the kit's default Intl tag and euros unless given. */
export function formatsFor(locale: Locale, { country, currency }: { country?: string | null; currency?: string } = {}): NumberFormats {
  return numberFormats(intlFor(locale, country), currency ?? DEFAULT_CURRENCY);
}

/**
 * A number as someone types it in their language: "2.500,5" or "2500,5"
 * in Spanish, "2,500.5" in English; spaces, "%" and a currency ("€", "US$", "PEN") are ignored, and a
 * decimal mark typed the other language's way is still read ("2.5" in
 * Spanish is 2.5, "1.000" is 1000); a minus is "-" or "−". NaN when it
 * is not a number.
 */
export function parseNumber(text: string, decimalSeparator: string): number {
  // Spaces, "%" and a currency's symbol or code before or after ("€", "US$", "PEN") are not part of the number.
  const typed = text
    .replace(/[\s\u00a0\u202f%\p{Sc}]/gu, "")
    // A currency code or a symbol's letters ("PEN", "US" of "US$"): capitals only, so "12abc" stays no number.
    .replace(/^[A-Z]{1,3}|[A-Z]{1,3}$/g, "")
    .replace(/^\+/, "")
    .replace(/^\u2212/, "-");
  const group = decimalSeparator === "," ? "." : ",";
  let plain: string;
  if (typed.includes(decimalSeparator)) plain = typed.split(group).join("").replace(decimalSeparator, ".");
  else if (new RegExp(`^-?\\d{1,3}(\\${group}\\d{3})+$`).test(typed)) plain = typed.split(group).join("");
  else plain = typed.replace(group, ".");
  return /^-?(\d+\.?\d*|\.\d+)$/.test(plain) ? Number(plain) : Number.NaN;
}

/**
 * An amount as the pages show a cost: to the nearest unit under 95, to the
 * nearest 10 under 10,000, and to three figures above (¥245,678 → ¥246,000):
 * finer steps would claim a precision the data do not have.
 */
export function roundMoney(amount: number): number {
  const abs = Math.abs(amount);
  if (abs < 95) return Math.sign(amount) * Math.max(1, Math.round(abs));
  if (abs < 10_000) return Math.round(amount / 10) * 10;
  const step = 10 ** (Math.floor(Math.log10(abs)) - 2);
  return Math.round(amount / step) * step;
}
