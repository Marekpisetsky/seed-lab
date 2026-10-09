"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { RadioGroup } from "@/components/ui/radio-group";
import type { CalculationBundle } from "@/hooks/use-calculation";
import { useWidth } from "@/hooks/use-width";
import { assumptionsNote } from "@/lib/assumptions";
import { yearlyPath, type YearPoint } from "@/lib/calculator";
import { formatMultiple, multipleOf, timesPutInText, yearTooltip } from "@/lib/growth";
import { bandsFor } from "@/lib/projections";
import { ticks } from "@/lib/ticks";

/** "Where do these futures come from?": its code loads when it is opened. */
const FuturesView = dynamic(() => import("./futures-view").then((module) => module.FuturesView));

/** The chart is the result's main picture: 260 px tall on a computer (1.7 times what it was), 210 on a phone. */
export const CHART_HEIGHT = { narrow: 210, wide: 260 } as const;
/** From this chart width (a tablet, the result's column on a computer) the taller chart and the longer labels. */
const WIDE_FROM = 420;
const PAD = { left: 2, right: 58, top: 12, bottom: 24 };
const FONT = 12;

function Swatch({ color }: { color: string }) {
  return <span aria-hidden="true" className="inline-block size-2.5 rounded-sm" style={{ background: color }} />;
}

function Plot({ points, startYear }: { points: YearPoint[]; startYear: number }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const [hover, setHover] = useState<number | null>(null);
  const [frame, width] = useWidth<HTMLDivElement>(320);
  const height = width >= WIDE_FROM ? CHART_HEIGHT.wide : CHART_HEIGHT.narrow;
  const years = points.length - 1;
  const end = points[years];
  const projected = Math.max(...points.map((point) => point.total), ...points.map((point) => point.putIn));
  const top = projected * 1.04 || 1;
  // Never narrower than a readable plot, even while the frame is being measured.
  // Room at the right for the end labels, which are longer in some languages ("Lo que pones").
  const padRight = Math.max(PAD.right, Math.ceil(Math.max(m.chart.putIn.length, m.chart.growth.length) * FONT * 0.6) + 10);
  const plotRight = Math.max(PAD.left + 40, width - padRight);
  const x = (year: number) => PAD.left + (years === 0 ? 0 : (year / years) * (plotRight - PAD.left));
  const y = (value: number) => PAD.top + (1 - Math.max(0, value) / top) * (height - PAD.top - PAD.bottom);
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
  // What the money became, at the end of the curve: "×2.3 what you put in", just above it, inside the plot.
  const multiple = multipleOf(end);
  const gained = multiple === null ? null : width >= WIDE_FROM ? timesPutInText(end, i18n) : formatMultiple(multiple, i18n);
  const gainedY = Math.max(PAD.top + FONT, y(end.total) - 7);

  return (
    <div ref={frame} className="relative">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block touch-pan-y select-none"
        role="img"
        aria-label={m.chart.aria(startYear + years, f.cur(end.putIn), f.cur(growthEnd))}
        onPointerDown={showYearAt}
        onPointerMove={showYearAt}
        // A finger lifted leaves the year shown; a mouse that leaves hides it.
        onPointerLeave={(event) => event.pointerType === "mouse" && setHover(null)}
      >
        {ticks(top / 1.04).map((value) => (
          <g key={value}>
            <line x1={PAD.left} x2={plotRight} y1={y(value)} y2={y(value)} stroke="var(--border)" strokeWidth={1} />
            {value > 0 && (
              <text x={PAD.left + 2} y={y(value) - 3} fontSize={FONT} fill="var(--muted)">
                {f.curCompact(value)}
              </text>
            )}
          </g>
        ))}
        <path d={putInArea} fill="var(--chart-put-in)" />
        <path d={growthArea} fill="var(--chart-growth)" />
        {/* A 2px gap in the surface colour between the two areas. */}
        <path d={line(putInTop)} fill="none" stroke="var(--card)" strokeWidth={2} strokeLinejoin="round" />
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
          <text key={year} x={x(year)} y={height - 6} fontSize={FONT} fill="var(--muted)" textAnchor={year === 0 ? "start" : year === years ? "end" : "middle"}>
            {startYear + year}
          </text>
        ))}
        {shown && (
          <g>
            <line x1={x(shown.year)} x2={x(shown.year)} y1={PAD.top} y2={height - PAD.bottom} stroke="var(--muted)" strokeWidth={1} />
            <circle cx={x(shown.year)} cy={y(shown.total)} r={4} fill="var(--foreground)" stroke="var(--card)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {shown && (
        <div ref={tip} className="pointer-events-none absolute top-0 left-0 z-10 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-sm shadow-sm tabular-nums">
          <p className="font-medium">{yearTooltip(shown, startYear, i18n)}</p>
          <p>
            <Swatch color="var(--chart-put-in)" /> {m.chart.putIn} {f.cur(shown.putIn)}
          </p>
          <p>
            <Swatch color="var(--chart-growth)" /> {m.chart.growth} {f.cur(shown.total - Math.min(shown.putIn, shown.total))}
          </p>
        </div>
      )}
    </div>
  );
}

function YearTable({ points, startYear }: { points: YearPoint[]; startYear: number }) {
  const { m, f } = useI18n();
  const columns = m.chart.columns;
  const [open, setOpen] = useState(false);
  return (
    <details className="text-sm" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="flex min-h-11 cursor-pointer items-center text-muted hover:text-foreground">{m.chart.table}</summary>
      {open && (
        // Focusable, so a keyboard can scroll it.
        <div tabIndex={0} className="mt-2 max-h-72 overflow-auto">
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
              </tr>
            </thead>
            <tbody>
              {points.slice(1).map((point) => (
                <tr key={point.year} className="border-t border-border">
                  <th scope="row" className="py-1 text-left font-normal">
                    {startYear + point.year}
                  </th>
                  <td>{f.cur(point.putIn)}</td>
                  <td>{f.cur(point.total - Math.min(point.putIn, point.total))}</td>
                  <td>{f.cur(point.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}

/** The chart's tabs: "Show: 5 years · 10 years · 20 years · All". */
export const PERIODS = [5, 10, 20, "all"] as const;
export type Period = (typeof PERIODS)[number];

/** How many years a tab shows: never more than the plan has. */
export function shownYears(period: Period, years: number): number {
  return period === "all" ? years : Math.min(period, years);
}

/** The tabs a plan of `years` gets: those shorter than it, and All; none when All would be alone. */
export function periodsFor(years: number): Period[] {
  const shorter = PERIODS.filter((period): period is Exclude<Period, "all"> => period !== "all" && period < years);
  return shorter.length > 0 ? [...shorter, "all"] : [];
}

/**
 * Level 2, the result's main picture: the years to the result, what was
 * put in and what growth added, stacked, with "×2.3 what you put in" at
 * the end of the curve. Tabs above it ("Show: 5 years · 10 years · 20
 * years · All") change only what the chart shows, never the figures; a tab
 * as long as the plan or longer is not offered. Under it, together and
 * small: where 1 in 10 possible futures end, the way to see where they come
 * from, what the figures assume and the years as a table.
 */
export function GrowthChart({ bundle }: { bundle: CalculationBundle }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const { calc, today } = bundle;
  const { scenario, investment, result } = calc;
  const points = useMemo(() => yearlyPath(scenario, result.years), [scenario, result.years]);
  const [period, setPeriod] = useState<Period>("all");
  const [futures, setFutures] = useState(false);
  const tabs = periodsFor(result.years);
  // A tab the plan has become too short for falls back to all of it.
  const picked = tabs.includes(period) ? period : "all";
  const view = useMemo(() => points.slice(0, shownYears(picked, result.years) + 1), [points, picked, result.years]);
  const startYear = today.getUTCFullYear();
  const amounts = { start: scenario.capital, monthly: scenario.monthly, years: result.years };
  const bands = investment.volatility > 0 ? bandsFor(investment, amounts) : null;
  return (
    <figure className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span>
            <Swatch color="var(--chart-put-in)" /> {m.chart.putIn}
          </span>
          <span>
            <Swatch color="var(--chart-growth)" /> {m.chart.growth}
          </span>
        </figcaption>
        {tabs.length > 0 && (
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-sm font-medium text-muted">
              {m.chart.periods}
            </span>
            <RadioGroup
              label={m.chart.periods}
              options={tabs.map((value) => ({ value, label: value === "all" ? m.chart.all : m.units.years(value) }))}
              value={picked}
              onChange={setPeriod}
              className="inline-flex flex-wrap rounded-md border border-border p-0.5 text-sm"
              optionClassName={(checked) => `min-h-11 rounded px-2.5 py-1 font-medium tabular-nums ${checked ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
            />
          </div>
        )}
      </div>
      <Plot points={view} startYear={startYear} />
      <div className="space-y-1 border-t border-border pt-3 text-sm text-muted">
        {bands && (
          <p className="tabular-nums">
            {m.facts.badFrom(f.cur(bands.p10[result.years]))} {m.facts.aboveToo(f.cur(bands.p90[result.years]))}
          </p>
        )}
        {bands && (
          <button type="button" onClick={() => setFutures(true)} className="-ml-2 inline-flex min-h-11 items-center rounded-md px-2 font-medium text-accent hover:bg-accent/10">
            {m.futures.link}
          </button>
        )}
        <p>{assumptionsNote(investment, i18n)}</p>
        <YearTable points={points} startYear={startYear} />
      </div>
      {futures && bands && <FuturesView bundle={bundle} onClose={() => setFutures(false)} />}
    </figure>
  );
}
