import { formatPercent } from "@/lib/format";

/** The calendar years of a price record, oldest first, with their change ("2022": −0.51). */
function sortedYears(years: Readonly<Record<string, number>> | undefined): [string, number][] {
  return Object.entries(years ?? {}).sort(([a], [b]) => a.localeCompare(b));
}

/** A few tiny bars, one per recent year, up in green or down in red; decorative, the figures beside it carry the meaning. */
export function YearStrip({ years, count = 6 }: { years: Readonly<Record<string, number>> | undefined; count?: number }) {
  const recent = sortedYears(years).slice(-count);
  if (recent.length === 0) return null;
  const top = Math.max(0.05, ...recent.map(([, change]) => Math.abs(change)));
  return (
    <svg viewBox={`0 0 ${count * 8} 28`} aria-hidden="true" className="h-7 w-16 shrink-0 sm:w-24">
      <line x1={0} x2={count * 8} y1={14} y2={14} stroke="var(--border)" strokeWidth={1} />
      {recent.map(([year, change], index) => {
        const height = Math.max(1, (Math.abs(change) / top) * 13);
        return (
          <rect
            key={year}
            x={(count - recent.length + index) * 8 + 1}
            y={change >= 0 ? 14 - height : 14}
            width={6}
            height={height}
            rx={1}
            fill={change >= 0 ? "var(--positive)" : "var(--negative)"}
          />
        );
      })}
    </svg>
  );
}

/** Each full calendar year's price change, as a labelled bar: "2022  −51%". */
export function YearChanges({ years }: { years: Readonly<Record<string, number>> | undefined }) {
  const all = sortedYears(years);
  if (all.length === 0) return null;
  const top = Math.max(0.05, ...all.map(([, change]) => Math.abs(change)));
  return (
    <ul aria-label="Price change each year" className="space-y-1 text-sm tabular-nums">
      {all.map(([year, change]) => (
        <li key={year} className="grid grid-cols-[3rem_1fr_4rem] items-center gap-2">
          <span className="text-muted">{year}</span>
          <span className="relative h-3" aria-hidden="true">
            <span className="absolute inset-y-0 left-1/2 w-px bg-border" />
            <span
              className={`absolute inset-y-0 rounded-sm ${change >= 0 ? "left-1/2 bg-positive" : "right-1/2 bg-negative"}`}
              style={{ width: `${(Math.abs(change) / top) * 50}%` }}
            />
          </span>
          <span className={`text-right font-medium ${change >= 0 ? "text-positive" : "text-negative"}`}>{formatPercent(change, { signed: true, decimals: 0 })}</span>
        </li>
      ))}
    </ul>
  );
}
