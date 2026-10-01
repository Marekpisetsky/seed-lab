"use client";

import { useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/components/i18n";
import { Help } from "@/components/ui/help";
import type { CalculationBundle } from "@/hooks/use-calculation";
import { useWidth } from "@/hooks/use-width";
import { simulationsText } from "@/i18n/investment-text";
import { yearlyPath, type YearPoint } from "@/lib/calculator";
import { endLabel, yearTooltip } from "@/lib/growth";
import { bandsFor } from "@/lib/projections";
import type { WealthPercentiles } from "@/lib/simulation";
import { ticks } from "@/lib/ticks";

const HEIGHT = 200;
const PAD = { left: 2, right: 58, top: 10, bottom: 22 };
const FONT = 11;
/** The upper dashed line may leave the chart: past this multiple of the projection it would squash the areas. */
const MAX_OVER_PROJECTION = 2.2;

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

function Plot({ points, band, startYear, swings }: { points: YearPoint[]; band: WealthPercentiles; startYear: number; swings: boolean }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const [hover, setHover] = useState<number | null>(null);
  const [frame, width] = useWidth<HTMLDivElement>(320);
  const clip = useId();
  const years = points.length - 1;
  const end = points[years];
  const projected = Math.max(...points.map((point) => point.total), ...points.map((point) => point.putIn));
  const upper = Math.max(...band.p90);
  const top = (swings ? Math.max(projected, Math.max(...band.p10), Math.min(upper, projected * MAX_OVER_PROJECTION)) : projected) * 1.04 || 1;
  const clipped = upper > top;
  // Never narrower than a readable plot, even while the frame is being measured.
  // Room at the right for the end labels, which are longer in some languages ("Lo que pones").
  const padRight = Math.max(PAD.right, Math.ceil(Math.max(m.chart.putIn.length, m.chart.growth.length) * FONT * 0.6) + 10);
  const plotRight = Math.max(PAD.left + 40, width - padRight);
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
  // The year under the mouse or the finger.
  const showYearAt = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const year = Math.round(((event.clientX - box.left - PAD.left) / (plotRight - PAD.left)) * years);
    setHover(Math.min(years, Math.max(0, year)));
  };
  // The tooltip sits beside the hovered year, on the side with more room, and never leaves the chart.
  const tip = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = tip.current;
    if (!node || hover === null) return;
    const tipWidth = node.offsetWidth;
    const wanted = hover > years / 2 ? x(hover) - 8 - tipWidth : x(hover) + 8;
    node.style.left = `${Math.min(Math.max(0, wanted), Math.max(0, width - tipWidth))}px`;
  });

  // Direct labels at the right end, in the middle of each area when it is tall enough.
  const putInLabelY = (y(0) + y(putInTop[years])) / 2;
  const growthLabelY = (y(putInTop[years]) + y(end.total)) / 2;
  const labelsFit = Math.abs(putInLabelY - growthLabelY) >= FONT + 2;
  // What growth added in all, at the end of the curve: just above it, inside the plot.
  const gained = endLabel(end, i18n);
  const gainedY = Math.max(PAD.top + FONT, y(end.total) - 7);

  return (
    <div ref={frame} className="relative">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="block touch-pan-y select-none"
        role="img"
        aria-label={m.chart.aria(startYear + years, f.eur(end.putIn), f.eur(growthEnd)) + (swings ? m.chart.ariaBand(f.eur(band.p10[years]), f.eur(band.p90[years])) : "")}
        onPointerDown={showYearAt}
        onPointerMove={showYearAt}
        // A finger lifted leaves the year shown; a mouse that leaves hides it.
        onPointerLeave={(event) => event.pointerType === "mouse" && setHover(null)}
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
                {f.eurCompact(value)}
              </text>
            )}
          </g>
        ))}
        <path d={putInArea} fill="var(--chart-put-in)" />
        <path d={growthArea} fill="var(--chart-growth)" />
        {/* A 2px gap in the surface colour between the two areas. */}
        <path d={line(putInTop)} fill="none" stroke="var(--card)" strokeWidth={2} strokeLinejoin="round" />
        {swings && (
          <g clipPath={`url(#${clip})`} fill="none" stroke="var(--foreground)" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="4 3">
            <path d={line(band.p10)} />
            <path d={line(band.p90)} />
          </g>
        )}
        {gained && (
          <g>
            <circle cx={x(years)} cy={y(end.total)} r={3} fill="var(--foreground)" />
            <text x={x(years) - 6} y={gainedY} fontSize={FONT + 1} fontWeight={600} textAnchor="end" fill="var(--foreground)" stroke="var(--card)" strokeWidth={3} paintOrder="stroke">
              {gained}
            </text>
          </g>
        )}
        {labelsFit && (
          <>
            <text x={plotRight + 6} y={growthLabelY + FONT / 3} fontSize={FONT} fill="var(--foreground)">
              {m.chart.growth}
            </text>
            <text x={plotRight + 6} y={putInLabelY + FONT / 3} fontSize={FONT} fill="var(--foreground)">
              {m.chart.putIn}
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
        <div ref={tip} className="pointer-events-none absolute top-0 left-0 z-10 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-xs shadow-sm tabular-nums">
          <p className="font-medium">{yearTooltip(shown, startYear, i18n)}</p>
          <p>
            <Swatch color="var(--chart-put-in)" /> {m.chart.putIn} {f.eur(shown.putIn)}
          </p>
          <p>
            <Swatch color="var(--chart-growth)" /> {m.chart.growth} {f.eur(shown.total - Math.min(shown.putIn, shown.total))}
          </p>
          {swings && <p className="text-muted">{m.chart.eightInTen(f.eur(band.p10[shown.year]), f.eur(band.p90[shown.year]))}</p>}
        </div>
      )}
      {swings && clipped && (
        <p className="mt-1 text-xs text-muted">{m.chart.clipped(f.eurCompact(band.p90[years]))}</p>
      )}
    </div>
  );
}

function YearTable({ points, band, startYear, swings }: { points: YearPoint[]; band: WealthPercentiles | null; startYear: number; swings: boolean }) {
  const { m, f } = useI18n();
  const columns = m.chart.columns;
  const [open, setOpen] = useState(false);
  return (
    <details className="text-xs" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="flex min-h-11 cursor-pointer items-center text-muted hover:text-foreground">{m.chart.table}</summary>
      {open && band && (
      // Scrolls on its own: focusable, so a keyboard can scroll it too.
      <div className="mt-2 max-h-72 overflow-auto" tabIndex={0} role="region" aria-label={m.chart.table}>
        <table className="w-full text-right tabular-nums">
          <thead className="sticky top-0 bg-card text-muted">
            <tr>
              <th scope="col" className="py-1 text-left font-medium">
                {columns.year}
              </th>
              <th scope="col" className="py-1 font-medium">
                {columns.putIn}
              </th>
              <th scope="col" className="py-1 font-medium">
                {columns.growth}
              </th>
              <th scope="col" className="py-1 font-medium">
                {columns.total}
              </th>
              {swings && (
                <th scope="col" className="py-1 pl-2 font-medium">
                  {columns.range}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {points.slice(1).map((point) => (
              <tr key={point.year} className="border-t border-border">
                <th scope="row" className="py-1 text-left font-normal">
                  {startYear + point.year}
                </th>
                <td>{f.eur(point.putIn)}</td>
                <td>{f.eur(point.total - Math.min(point.putIn, point.total))}</td>
                <td>{f.eur(point.total)}</td>
                {swings && (
                  <td className="pl-2 text-muted">
                    {f.eurCompact(band.p10[point.year])}–{f.eurCompact(band.p90[point.year])}
                  </td>
                )}
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
  const i18n = useI18n();
  const { m } = i18n;
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
          <Swatch color="var(--chart-put-in)" /> {m.chart.putIn}
        </span>
        <span>
          <Swatch color="var(--chart-growth)" /> {m.chart.growth}
        </span>
        {investment.volatility > 0 ? (
          <span>
            <Swatch color="var(--foreground)" dashed /> {m.chart.lines(simulationsText(investment, i18n))}{" "}
            <Help what={m.chart.lines(simulationsText(investment, i18n))} text={m.help.lines} align="end" />
          </span>
        ) : (
          <span>{m.chart.noUps}</span>
        )}
      </figcaption>
      {band ? <Plot points={points} band={band} startYear={startYear} swings={investment.volatility > 0} /> : <div style={{ height: HEIGHT }} aria-hidden="true" />}
      <YearTable points={points} band={band} startYear={startYear} swings={investment.volatility > 0} />
    </figure>
  );
}
