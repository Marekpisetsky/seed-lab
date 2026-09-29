/**
 * Calendar helpers. Everything works in UTC on date-only values so results do
 * not shift with the user's time zone.
 */

/** "2036-06-15" → Date at 00:00 UTC. */
export function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Date → "2036-06-15" (UTC). */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The calendar day of `date` (UTC), at 00:00 UTC. */
export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Adds whole months, clamping to the end of shorter months (Jan 31 + 1 → Feb 28/29). */
export function addMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
}

/** Complete months from `from` to `to`; negative when `to` is earlier. */
export function wholeMonthsBetween(from: Date, to: Date): number {
  if (to < from) return -wholeMonthsBetween(to, from);
  let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  if (addMonths(from, months) > to) months -= 1;
  return months;
}
