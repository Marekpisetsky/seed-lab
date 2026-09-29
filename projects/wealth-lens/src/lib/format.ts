/**
 * Display formatting. A fixed locale keeps server and client output identical
 * and the UI consistently in English.
 */

const LOCALE = "en-US";
const formatters = new Map<string, Intl.NumberFormat>();

function numberFormat(key: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, options);
    formatters.set(key, formatter);
  }
  return formatter;
}

interface MoneyOptions {
  /** Fraction digits; defaults to 2. */
  decimals?: number;
  /** Prefix positive amounts with "+" (for gains). */
  signed?: boolean;
}

export function formatMoney(amount: number, currency: string, { decimals = 2, signed = false }: MoneyOptions = {}): string {
  return numberFormat(`money|${currency}|${decimals}|${signed}`, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(amount);
}

interface PercentOptions {
  decimals?: number;
  signed?: boolean;
}

/** 0.0914 → "9.1%". */
export function formatPercent(fraction: number, { decimals = 1, signed = false }: PercentOptions = {}): string {
  return numberFormat(`percent|${decimals}|${signed}`, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(fraction);
}

/** Plain number with up to `maxDecimals` fraction digits (share counts, prices). */
export function formatNumber(value: number, maxDecimals = 4): string {
  return numberFormat(`number|${maxDecimals}`, { maximumFractionDigits: maxDecimals }).format(value);
}

/** Price per share without a currency symbol: always 2 decimals, up to 4 for small prices. */
export function formatPrice(value: number): string {
  const maxDecimals = Math.abs(value) < 1 ? 4 : 2;
  return numberFormat(`price|${maxDecimals}`, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

/**
 * Months → "9 years 8 months". Partial months round up, because monthly
 * contributions only reach the goal at the end of a month.
 */
export function formatDuration(months: number): string {
  if (!Number.isFinite(months)) return "never";
  const total = Math.max(0, Math.ceil(months - 1e-9));
  const years = Math.floor(total / 12);
  const rest = total % 12;
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;
  if (years === 0) return plural(rest, "month");
  if (rest === 0) return plural(years, "year");
  return `${plural(years, "year")} ${plural(rest, "month")}`;
}

const monthYear = new Intl.DateTimeFormat(LOCALE, { month: "short", year: "numeric", timeZone: "UTC" });

/** "Jun 2036". */
export function formatMonthYear(date: Date): string {
  return monthYear.format(date);
}
