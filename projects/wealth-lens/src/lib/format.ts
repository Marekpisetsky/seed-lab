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

/** "2026-09-25" → "25/09" (day/month, as in "price from 25/09"). */
export function formatDayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

/** Months → "~16 years" or "~5 months": the rough figure for a headline. */
export function formatApproxDuration(months: number): string {
  if (!Number.isFinite(months)) return "never";
  const whole = Math.max(0, Math.ceil(months - 1e-9));
  if (whole < 12) return `~${whole} month${whole === 1 ? "" : "s"}`;
  const years = Math.round(whole / 12);
  return `~${years} year${years === 1 ? "" : "s"}`;
}

/** A rate without needless decimals: 0.04 → "4%", 0.045 → "4.5%". */
export function formatRate(rate: number): string {
  const tenths = Math.round(rate * 1000);
  return formatPercent(rate, { decimals: tenths % 10 === 0 ? 0 : 1 });
}

/** Whole euros: 1234.5 → "€1,235". */
export function formatEur(amount: number, { signed = false }: { signed?: boolean } = {}): string {
  return formatMoney(amount, "EUR", { decimals: 0, signed });
}

/**
 * A span of time for a sentence, rounded to what a person would say:
 * 3 → "3 months", 18 → "2 years" (from 12 months on, whole years),
 * Infinity → "never".
 */
export function formatYears(months: number): string {
  if (!Number.isFinite(months)) return "never";
  const abs = Math.abs(months);
  if (abs < 11.5) {
    const whole = Math.max(1, Math.round(abs));
    return `${whole} month${whole === 1 ? "" : "s"}`;
  }
  const years = Math.round(abs / 12);
  return `${years} year${years === 1 ? "" : "s"}`;
}

/**
 * A euro amount rounded the way a brief would say it, for headline numbers
 * (calculations keep the exact figure): €8,429 → "€8,400", €66,827 → "€67,000".
 */
export function formatEurRounded(amount: number, { signed = false }: { signed?: boolean } = {}): string {
  const abs = Math.abs(amount);
  const step = abs >= 10_000 ? 1000 : abs >= 1000 ? 100 : abs >= 100 ? 10 : 1;
  return formatEur(Math.round(amount / step) * step, { signed });
}
