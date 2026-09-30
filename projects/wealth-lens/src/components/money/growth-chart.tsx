"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CalculationBundle } from "@/hooks/use-calculation";
import { yearlyPath, type YearPoint } from "@/lib/calculator";
import { formatEur } from "@/lib/format";
import { bandsFor } from "@/lib/projections";
import type { WealthPercentiles } from "@/lib/simulation";

const HEIGHT = 200;
const PAD = { left: 2, right: 58, top: 10, bottom: 22 };
const FONT = 11;
/** The upper dashed line may leave the chart: past this multiple of the projection it would squash the areas. */
const MAX_OVER_PROJECTION = 2.2;

/** €1,234,567 → "€1.2M", €1,000,000 → "€1M", €99,000 → "€99k": short labels for an axis. */
export function compactEur(amount: number): string {
  if (amount >= 1e6) return `€${(amount / 1e6).toFixed(amount >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (amount >= 1e3) return `€${Math.round(amount / 1e3)}k`;
  return `€${Math.round(amount)}`;
}

/** Round axis ticks: 0 and two to four more at a clean step. */
function ticks(max: number): number[] {
  if (max <= 0) return [0];
  const rough = max / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= rough) ?? rough;
  return [0, step, step * 2, step * 3, step * 4].filter((value) => value <= max * 1.001);
}

/** The element's width in CSS pixels, so the chart is drawn at its real size and its text stays legible. */
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

const noSubscribe = () => () => {};
/** False on the server and during hydration: the chart's calendar years depend on today. */
function useMounted(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

function Swatch({ color, dashed = false }: { color: string; dashed?: boolean }) {
  return dashed ? (
    <svg aria-hidden="true" width="16" height="8" className="inline-block">
      <line x1="0" x2="16" y1="4" y2="4" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  ) : (
    <span aria-hidden="true" className="inline-block size-2.5 rounded-sm" style={{ background: color }} />
  );
}

function Plot({ points, band, startYear }: { points: YearPoint[]; band: WealthPercentiles; startYear: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [frame, width] = useWidth<HTMLDivElement>(320);
  const clip = useId();
  const years = points.length - 1;
  const end = points[years];
  const projected = Math.max(...points.map((point) => point.total), ...points.map((point) => point.putIn));
  const upper = Math.max(...band.p90);
  const top = Math.max(projected, Math.max(...band.p10), Math.min(upper, projected * MAX_OVER_PROJECTION)) * 1.04 || 1;
  const clipped = upper > top;
  // Never narrower than a readable plot, even while the frame is being measured.
  const plotRight = Math.max(PAD.left + 40, width - PAD.right);
  const x = (year: number) => PAD.left + (years === 0 ? 0 : (year / years) * (plotRight - PAD.left));
  const y = (value: number) => PAD.top + (1 - Math.max(0, value) / top) * (HEIGHT - PAD.top - PAD.bottom);
  const line = (values: readonly number[]) => values.map((value, year) => `${year === 0 ? "M" : "L"}${x(year).toFixed(1)},${y(value).toFixed(1)}`).join("");
  // When the money shrinks, what is left is all "put in" and growth has no height.
  const putInTop = points.map((point) => Math.min(point.putIn, point.total));
  const totals = points.map((point) => point.total);
  const base = `L${x(years).toFixed(1)},${y(0).toFixed(1)}L${x(0).toFixed(1)},${y(0).toFixed(1)}Z`;
  const putInArea = `${line(putInTop)}${base}`;
  const growthArea =
    line(totals) +
    [...putInTop.keys()]
      .reverse()
      .map((year) => `L${x(year).toFixed(1)},${y(putInTop[year]).toFixed(1)}`)
      .join("") +
    "Z";
  const growthEnd = end.total - Math.min(end.putIn, end.total);
  const labelYears = years <= 1 ? [0, years] : [0, Math.round(years / 2), years];
  const shown = hover === null ? null : points[hover];

  // Direct labels at the right end, in the middle of each area when it is tall enough.
  const putInLabelY = (y(0) + y(putInTop[years])) / 2;
  const growthLabelY = (y(putInTop[years]) + y(end.total)) / 2;
  const labelsFit = Math.abs(putInLabelY - growthLabelY) >= FONT + 2;

  return (
    <div ref={frame} className="relative">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="block touch-pan-y select-none"
        role="img"
        aria-label={`Year by year to ${startYear + years}: ${formatEur(end.putIn)} put in, ${formatEur(growthEnd)} of growth. 8 in 10 histories ended between ${formatEur(band.p10[years])} and ${formatEur(band.p90[years])}.`}
        onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const year = Math.round(((event.clientX - box.left - PAD.left) / (plotRight - PAD.left)) * years);
          setHover(Math.min(years, Math.max(0, year)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <clipPath id={clip}>
            <rect x={0} y={PAD.top} width={plotRight} height={HEIGHT - PAD.top - PAD.bottom + 1} />
          </clipPath>
        </defs>
        {ticks(top / 1.04).map((value) => (
          <g key={value}>
            <line x1={PAD.left} x2={plotRight} y1={y(value)} y2={y(value)} stroke="var(--border)" strokeWidth={1} />
            {value > 0 && (
              <text x={PAD.left + 2} y={y(value) - 3} fontSize={FONT} fill="var(--muted)">
                {compactEur(value)}
              </text>
            )}
          </g>
        ))}
        <path d={putInArea} fill="var(--chart-put-in)" />
        <path d={growthArea} fill="var(--chart-growth)" />
        {/* A 2px gap in the surface colour between the two areas. */}
        <path d={line(putInTop)} fill="none" stroke="var(--card)" strokeWidth={2} strokeLinejoin="round" />
        <g clipPath={`url(#${clip})`} fill="none" stroke="var(--foreground)" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="4 3">
          <path d={line(band.p10)} />
          <path d={line(band.p90)} />
        </g>
        {labelsFit && (
          <>
            <text x={plotRight + 6} y={growthLabelY + FONT / 3} fontSize={FONT} fill="var(--foreground)">
              Growth
            </text>
            <text x={plotRight + 6} y={putInLabelY + FONT / 3} fontSize={FONT} fill="var(--foreground)">
              Put in
            </text>
          </>
        )}
        {labelYears.map((year) => (
          <text key={year} x={x(year)} y={HEIGHT - 6} fontSize={FONT} fill="var(--muted)" textAnchor={year === 0 ? "start" : year === years ? "end" : "middle"}>
            {startYear + year}
          </text>
        ))}
        {shown && (
          <g>
            <line x1={x(shown.year)} x2={x(shown.year)} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--muted)" strokeWidth={1} />
            <circle cx={x(shown.year)} cy={y(shown.total)} r={4} fill="var(--foreground)" stroke="var(--card)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {shown && (
        <div
          className="pointer-events-none absolute top-0 z-10 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-xs shadow-sm tabular-nums"
          style={{ left: x(shown.year), transform: shown.year > years / 2 ? "translateX(calc(-100% - 8px))" : "translateX(8px)" }}
        >
          <p className="font-medium">
            {startYear + shown.year}: {formatEur(shown.total)}
          </p>
          <p>
            <Swatch color="var(--chart-put-in)" /> Put in {formatEur(shown.putIn)}
          </p>
          <p>
            <Swatch color="var(--chart-growth)" /> Growth {formatEur(shown.total - Math.min(shown.putIn, shown.total))}
          </p>
          <p className="text-muted">
            8 in 10: {formatEur(band.p10[shown.year])} – {formatEur(band.p90[shown.year])}
          </p>
        </div>
      )}
      {clipped && (
        <p className="mt-1 text-xs text-muted">
          The upper dashed line leaves the chart: 1 in 10 histories ended above {compactEur(band.p90[years])}.
        </p>
      )}
    </div>
  );
}

function YearTable({ points, band, startYear }: { points: YearPoint[]; band: WealthPercentiles | null; startYear: number }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="text-xs" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer text-muted hover:text-foreground">Year by year, as a table</summary>
      {open && band && (
      <div className="mt-2 max-h-72 overflow-auto">
        <table className="w-full text-right tabular-nums">
          <thead className="sticky top-0 bg-card text-muted">
            <tr>
              <th scope="col" className="py-1 text-left font-medium">
                Year
              </th>
              <th scope="col" className="py-1 font-medium">
                Put in
              </th>
              <th scope="col" className="py-1 font-medium">
                Growth
              </th>
              <th scope="col" className="py-1 font-medium">
                Total
              </th>
              <th scope="col" className="py-1 pl-2 font-medium">
                8 in 10
              </th>
            </tr>
          </thead>
          <tbody>
            {points.slice(1).map((point) => (
              <tr key={point.year} className="border-t border-border">
                <th scope="row" className="py-1 text-left font-normal">
                  {startYear + point.year}
                </th>
                <td>{formatEur(point.putIn)}</td>
                <td>{formatEur(point.total - Math.min(point.putIn, point.total))}</td>
                <td>{formatEur(point.total)}</td>
                <td className="pl-2 text-muted">
                  {compactEur(band.p10[point.year])}–{compactEur(band.p90[point.year])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </details>
  );
}

/**
 * The years to the result: what was put in and what growth added, stacked,
 * with dashed lines where 8 in 10 simulated histories ended (1,000 runs
 * drawing each year's return from the index's past).
 */
export function GrowthChart({ bundle }: { bundle: CalculationBundle }) {
  const mounted = useMounted();
  const { calc, today } = bundle;
  const { scenario, investment, result } = calc;
  const points = useMemo(() => yearlyPath(scenario, result.years), [scenario, result.years]);
  const band = useMemo(
    () =>
      mounted
        ? bandsFor(investment, { start: scenario.capital, monthly: scenario.monthly, years: result.years })
        : null,
    [mounted, scenario.capital, scenario.monthly, investment, result.years],
  );
  const startYear = today.getUTCFullYear();
  return (
    <figure className="space-y-2">
      <figcaption className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        <span>
          <Swatch color="var(--chart-put-in)" /> Put in
        </span>
        <span>
          <Swatch color="var(--chart-growth)" /> Growth
        </span>
        <span>
          <Swatch color="var(--foreground)" dashed /> 8 in 10 {investment.modelShort} ended between the lines
        </span>
      </figcaption>
      {band ? <Plot points={points} band={band} startYear={startYear} /> : <div style={{ height: HEIGHT }} aria-hidden="true" />}
      <YearTable points={points} band={band} startYear={startYear} />
    </figure>
  );
}
